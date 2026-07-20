import { describe, expect, it } from 'vitest'
import { validateEnglishAnnotations } from '../validateContent'
import { chapter4 } from './chapter4'

describe('chapter 4 content', () => {
  it('contains 10 complete and continuous learning units', () => {
    expect(chapter4.units).toHaveLength(10)
    expect(chapter4.units[0].source.start).toBe(1866.98)
    expect(chapter4.units.at(-1)?.source.end).toBe(2343.21)
    expect(chapter4.units.every((unit, index) => index === 0 || unit.source.start === chapter4.units[index - 1].source.end)).toBe(true)
    expect(chapter4.units.every((unit) => [unit.takeaway, unit.beginner, unit.example, unit.principle, unit.misconception, unit.extension].every((value) => value.length >= 20))).toBe(true)
  })

  it('annotates all learner-facing English with adjacent Chinese', () => {
    expect(validateEnglishAnnotations(chapter4)).toEqual([])
  })
})
