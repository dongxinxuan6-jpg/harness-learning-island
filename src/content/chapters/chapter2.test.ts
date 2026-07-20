import { describe, expect, it } from 'vitest'
import { validateEnglishAnnotations } from '../validateContent'
import { chapter2 } from './chapter2'

describe('chapter 2 content', () => {
  it('contains 10 complete and continuous learning units', () => {
    expect(chapter2.units).toHaveLength(10)
    expect(chapter2.units[0].source.start).toBe(661.44)
    expect(chapter2.units.at(-1)?.source.end).toBe(1151.3)
    expect(chapter2.units.every((unit, index) => index === 0 || unit.source.start === chapter2.units[index - 1].source.end)).toBe(true)
    expect(chapter2.units.every((unit) => [unit.takeaway, unit.beginner, unit.example, unit.principle, unit.misconception, unit.extension].every((value) => value.length >= 20))).toBe(true)
  })

  it('annotates all learner-facing English with adjacent Chinese', () => {
    expect(validateEnglishAnnotations(chapter2)).toEqual([])
  })
})
