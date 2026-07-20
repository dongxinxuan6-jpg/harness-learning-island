import { describe, expect, it } from 'vitest'
import { validateEnglishAnnotations } from '../validateContent'
import { chapter6 } from './chapter6'

describe('chapter 6 content', () => {
  it('contains 12 complete and continuous learning units', () => {
    expect(chapter6.units).toHaveLength(12)
    expect(chapter6.units[0].source.start).toBe(2867.96)
    expect(chapter6.units.at(-1)?.source.end).toBe(3201.18)
    expect(chapter6.units.every((unit, index) => index === 0 || unit.source.start === chapter6.units[index - 1].source.end)).toBe(true)
    expect(chapter6.units.every((unit) => [unit.takeaway, unit.beginner, unit.example, unit.principle, unit.misconception, unit.extension].every((value) => value.length >= 20))).toBe(true)
  })

  it('annotates all learner-facing English with adjacent Chinese', () => {
    expect(validateEnglishAnnotations(chapter6)).toEqual([])
  })
})
