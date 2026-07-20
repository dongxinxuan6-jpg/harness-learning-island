import type { QuizQuestion } from '../content/types'
import { nextReviewAt } from './reviewScheduler'

export const STORAGE_KEY = 'harness-learning-state-v1'
export const LEARNING_STATE_VERSION = 1

export interface AnswerRecord {
  questionId: string
  unitId: string
  selected: number
  correct: boolean
  attempts: number
  answeredAt: string
}

export interface ReviewRecord {
  key: string
  type: 'question' | 'term'
  refId: string
  unitId?: string
  intervalIndex: number
  dueAt: string
  lastReviewedAt: string
}

export interface LearningState {
  version: number
  answers: Record<string, AnswerRecord>
  favoriteTerms: string[]
  reviews: Record<string, ReviewRecord>
}

type ReadableStorage = Pick<Storage, 'getItem'>
type WritableStorage = Pick<Storage, 'setItem'>

export function createEmptyLearningState(): LearningState {
  return { version: LEARNING_STATE_VERSION, answers: {}, favoriteTerms: [], reviews: {} }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isLearningState(value: unknown): value is LearningState {
  if (!isRecord(value) || value.version !== LEARNING_STATE_VERSION) return false
  return isRecord(value.answers) && Array.isArray(value.favoriteTerms) && isRecord(value.reviews)
}

export function loadLearningState(storage?: ReadableStorage): LearningState {
  if (!storage) return createEmptyLearningState()
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return createEmptyLearningState()
    const parsed: unknown = JSON.parse(raw)
    return isLearningState(parsed) ? parsed : createEmptyLearningState()
  } catch {
    return createEmptyLearningState()
  }
}

export function saveLearningState(storage: WritableStorage | undefined, state: LearningState) {
  if (!storage) return
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Learning remains usable when private browsing or storage quotas block persistence.
  }
}

export function recordQuestionAnswer(state: LearningState, question: QuizQuestion, selected: number, now = new Date()): LearningState {
  const correct = selected === question.answer
  const previousAnswer = state.answers[question.id]
  const reviewKey = `question:${question.id}`
  const previousReview = state.reviews[reviewKey]
  const intervalIndex = correct
    ? Math.min((previousReview?.intervalIndex ?? -1) + 1, 4)
    : 0

  return {
    ...state,
    answers: {
      ...state.answers,
      [question.id]: {
        questionId: question.id,
        unitId: question.unitId,
        selected,
        correct,
        attempts: (previousAnswer?.attempts ?? 0) + 1,
        answeredAt: now.toISOString(),
      },
    },
    reviews: {
      ...state.reviews,
      [reviewKey]: {
        key: reviewKey,
        type: 'question',
        refId: question.id,
        unitId: question.unitId,
        intervalIndex,
        dueAt: correct ? nextReviewAt(now, intervalIndex) : now.toISOString(),
        lastReviewedAt: now.toISOString(),
      },
    },
  }
}

export function toggleFavoriteTerm(state: LearningState, termKey: string, now = new Date()): LearningState {
  const favorite = state.favoriteTerms.includes(termKey)
  const favoriteTerms = favorite
    ? state.favoriteTerms.filter((key) => key !== termKey)
    : [...state.favoriteTerms, termKey]
  const reviews = { ...state.reviews }
  const reviewKey = `term:${termKey}`

  if (favorite) {
    delete reviews[reviewKey]
  } else {
    reviews[reviewKey] = {
      key: reviewKey,
      type: 'term',
      refId: termKey,
      intervalIndex: 0,
      dueAt: now.toISOString(),
      lastReviewedAt: now.toISOString(),
    }
  }

  return { ...state, favoriteTerms, reviews }
}

export function completeReview(state: LearningState, key: string, remembered: boolean, now = new Date()): LearningState {
  const review = state.reviews[key]
  if (!review) return state
  const intervalIndex = remembered ? Math.min(review.intervalIndex + 1, 4) : 0
  return {
    ...state,
    reviews: {
      ...state.reviews,
      [key]: {
        ...review,
        intervalIndex,
        dueAt: remembered ? nextReviewAt(now, intervalIndex) : now.toISOString(),
        lastReviewedAt: now.toISOString(),
      },
    },
  }
}
