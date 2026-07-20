import { describe, expect, it } from 'vitest'
import { validateEnglishAnnotations } from '../validateContent'
import { chapter5 } from './chapter5'

describe('chapter 5 content', () => {
  it('contains 15 complete and continuous learning units', () => {
    expect(chapter5.units).toHaveLength(15)
    expect(chapter5.units[0].source.start).toBe(2343.21)
    expect(chapter5.units.at(-1)?.source.end).toBe(2867.96)
    expect(chapter5.units.every((unit, index) => index === 0 || unit.source.start === chapter5.units[index - 1].source.end)).toBe(true)
    expect(chapter5.units.every((unit) => [unit.takeaway, unit.beginner, unit.example, unit.principle, unit.misconception, unit.extension].every((value) => value.length >= 20))).toBe(true)
  })

  it('annotates all learner-facing English with adjacent Chinese', () => {
    expect(validateEnglishAnnotations(chapter5)).toEqual([])
  })
})
