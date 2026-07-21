import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { QuizQuestion } from '../content/types'
import {
  completeReview,
  clearReadingPosition,
  createEmptyLearningState,
  loadLearningState,
  recordQuestionAnswer,
  saveLearningState,
  toggleFavoriteTerm,
  updateReadingPosition,
  type LearningState,
  type ReadingPosition,
} from './learningStore'

interface LearningActions {
  recordAnswer: (question: QuizQuestion, selected: number) => void
  toggleFavorite: (termKey: string) => void
  markReview: (key: string, remembered: boolean) => void
  saveReadingPosition: (position: ReadingPosition) => void
  resetReadingPosition: () => void
  resetLearning: () => void
}

const fallbackActions: LearningActions = {
  recordAnswer: () => undefined,
  toggleFavorite: () => undefined,
  markReview: () => undefined,
  saveReadingPosition: () => undefined,
  resetReadingPosition: () => undefined,
  resetLearning: () => undefined,
}

const LearningStateContext = createContext<LearningState>(createEmptyLearningState())
const LearningActionsContext = createContext<LearningActions>(fallbackActions)
const FavoriteTermsContext = createContext<string[]>([])
const currentTime = () => new Date()

interface LearningProviderProps {
  children: ReactNode
  storage?: Storage
  initialState?: LearningState
  now?: () => Date
}

export function LearningProvider({ children, storage, initialState, now = currentTime }: LearningProviderProps) {
  const resolvedStorage = storage ?? (typeof window === 'undefined' ? undefined : window.localStorage)
  const [state, setState] = useState<LearningState>(() => initialState ?? loadLearningState(resolvedStorage))

  useEffect(() => saveLearningState(resolvedStorage, state), [resolvedStorage, state])

  const actions = useMemo<LearningActions>(() => ({
    recordAnswer: (question, selected) => setState((current) => recordQuestionAnswer(current, question, selected, now())),
    toggleFavorite: (termKey) => setState((current) => toggleFavoriteTerm(current, termKey, now())),
    markReview: (key, remembered) => setState((current) => completeReview(current, key, remembered, now())),
    saveReadingPosition: (position) => setState((current) => updateReadingPosition(current, position)),
    resetReadingPosition: () => setState((current) => clearReadingPosition(current)),
    resetLearning: () => setState(createEmptyLearningState()),
  }), [now])

  return (
    <LearningActionsContext.Provider value={actions}>
      <FavoriteTermsContext.Provider value={state.favoriteTerms}>
        <LearningStateContext.Provider value={state}>{children}</LearningStateContext.Provider>
      </FavoriteTermsContext.Provider>
    </LearningActionsContext.Provider>
  )
}

export const useLearningState = () => useContext(LearningStateContext)
export const useLearningActions = () => useContext(LearningActionsContext)
export const useFavoriteTerms = () => useContext(FavoriteTermsContext)
