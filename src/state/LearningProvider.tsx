import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { QuizQuestion } from '../content/types'
import {
  completeReview,
  createEmptyLearningState,
  loadLearningState,
  recordQuestionAnswer,
  saveLearningState,
  toggleFavoriteTerm,
  type LearningState,
} from './learningStore'

interface LearningContextValue {
  state: LearningState
  recordAnswer: (question: QuizQuestion, selected: number) => void
  toggleFavorite: (termKey: string) => void
  markReview: (key: string, remembered: boolean) => void
  resetLearning: () => void
}

const fallbackValue: LearningContextValue = {
  state: createEmptyLearningState(),
  recordAnswer: () => undefined,
  toggleFavorite: () => undefined,
  markReview: () => undefined,
  resetLearning: () => undefined,
}

const LearningContext = createContext<LearningContextValue>(fallbackValue)

interface LearningProviderProps {
  children: ReactNode
  storage?: Storage
  initialState?: LearningState
  now?: () => Date
}

export function LearningProvider({ children, storage, initialState, now = () => new Date() }: LearningProviderProps) {
  const resolvedStorage = storage ?? (typeof window === 'undefined' ? undefined : window.localStorage)
  const [state, setState] = useState<LearningState>(() => initialState ?? loadLearningState(resolvedStorage))

  useEffect(() => saveLearningState(resolvedStorage, state), [resolvedStorage, state])

  const value = useMemo<LearningContextValue>(() => ({
    state,
    recordAnswer: (question, selected) => setState((current) => recordQuestionAnswer(current, question, selected, now())),
    toggleFavorite: (termKey) => setState((current) => toggleFavoriteTerm(current, termKey, now())),
    markReview: (key, remembered) => setState((current) => completeReview(current, key, remembered, now())),
    resetLearning: () => setState(createEmptyLearningState()),
  }), [now, state])

  return <LearningContext.Provider value={value}>{children}</LearningContext.Provider>
}

export function useLearning() {
  return useContext(LearningContext)
}
