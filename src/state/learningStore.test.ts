import { describe, expect, it } from 'vitest'
import type { QuizQuestion } from '../content/types'
import { STORAGE_KEY, createEmptyLearningState, loadLearningState, recordQuestionAnswer, saveLearningState } from './learningStore'

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
})
