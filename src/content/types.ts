export interface SourceSegment {
  id: string
  speaker: number
  start: number
  startText: string
}

export interface SourceRange {
  start: number
  end: number
  speakers?: number[]
}

export interface QuizQuestion {
  id: string
  prompt: string
  options: string[]
  answer: number
  explanation: string
  unitId: string
}

export interface LearningUnit {
  id: string
  source: SourceRange
  title: string
  takeaway: string
  beginner: string
  example: string
  principle: string
  misconception: string
  extension: string
  terms: string[]
  check: QuizQuestion
}

export interface InteractionSpec {
  id: string
  kind: 'scope' | 'iteration' | 'triage' | 'plan' | 'agent' | 'organization' | 'talent' | 'ethics'
  title: string
  description: string
}

export interface Chapter {
  id: string
  number: number
  title: string
  source: SourceRange
  objectives: string[]
  units: LearningUnit[]
  interaction: InteractionSpec
  quiz: QuizQuestion[]
}

export interface CoverageUnit {
  id: string
  source: SourceRange
}

export interface GlossaryEntry {
  key: string
  english: string
  chinese: string
  beginner: string
}
