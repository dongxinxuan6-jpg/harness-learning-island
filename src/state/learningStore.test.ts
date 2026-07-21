import { describe, expect, it } from 'vitest'
import type { QuizQuestion } from '../content/types'
import {
  STORAGE_KEY,
  clearReadingPosition,
  createEmptyLearningState,
  loadLearningState,
  recordQuestionAnswer,
  saveLearningState,
  updateReadingPosition,
} from './learningStore'

const question: QuizQuestion = {
  id: 'q-1', unitId: 'unit-1', prompt: '测试题', options: ['错误', '正确'], answer: 1, explanation: '解释',
}

describe('learning store', () => {
  it('hydrates valid versioned state and falls back from malformed data', () => {
    localStorage.clear()
    localStorage.setItem(STORAGE_KEY, '{not-json')
    expect(loadLearningState(localStorage)).toEqual(createEmptyLearningState())

    const state = recordQuestionAnswer(createEmptyLearningState(), question, 1, new Date('2026-07-20T08:00:00.000Z'))
    saveLearningState(localStorage, state)
    expect(loadLearningState(localStorage)).toEqual(state)

    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, version: 999 }))
    expect(loadLearningState(localStorage)).toEqual(createEmptyLearningState())
  })

  it('stores answer history and schedules correct answers for the next day', () => {
    const state = recordQuestionAnswer(createEmptyLearningState(), question, 1, new Date('2026-07-20T08:00:00.000Z'))

    expect(state.answers['q-1']).toMatchObject({ correct: true, selected: 1, attempts: 1 })
    expect(state.reviews['question:q-1']).toMatchObject({ intervalIndex: 0, dueAt: '2026-07-21T08:00:00.000Z' })
  })

  it('migrates version 1 data without losing learning records', () => {
    localStorage.clear()
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: 1,
      answers: {
        'q-1': {
          questionId: 'q-1',
          unitId: 'unit-1',
          selected: 1,
          correct: true,
          attempts: 1,
          answeredAt: '2026-07-20T08:00:00.000Z',
        },
      },
      favoriteTerms: ['harness'],
      reviews: {},
    }))

    expect(loadLearningState(localStorage)).toMatchObject({
      version: 2,
      answers: { 'q-1': { correct: true } },
      favoriteTerms: ['harness'],
      readingPosition: null,
    })
  })

  it('updates and clears only the reading position', () => {
    const answered = recordQuestionAnswer(createEmptyLearningState(), question, 1)
    const positioned = updateReadingPosition(answered, {
      chapter: 3,
      unitId: 'c3-autofix',
      unitProgress: 1.4,
      updatedAt: '2026-07-21T10:00:00.000Z',
    })

    expect(positioned.readingPosition).toMatchObject({ unitId: 'c3-autofix', unitProgress: 1 })

    const restarted = clearReadingPosition(positioned)
    expect(restarted.readingPosition).toBeNull()
    expect(restarted.answers['q-1']).toEqual(positioned.answers['q-1'])
  })
})
