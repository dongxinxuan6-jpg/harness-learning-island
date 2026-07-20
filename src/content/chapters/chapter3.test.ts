import { describe, expect, it } from 'vitest'
import { validateEnglishAnnotations } from '../validateContent'
import { chapter3 } from './chapter3'

describe('chapter 3 content', () => {
  it('contains 19 complete and continuous learning units', () => {
    expect(chapter3.units).toHaveLength(19)
    expect(chapter3.units[0].source.start).toBe(1151.08)
    expect(chapter3.units.at(-1)?.source.end).toBe(1866.98)
    expect(chapter3.units.every((unit, index) => index === 0 || unit.source.start === chapter3.units[index - 1].source.end)).toBe(true)
    expect(chapter3.units.every((unit) => [unit.takeaway, unit.beginner, unit.example, unit.principle, unit.misconception, unit.extension].every((value) => value.length >= 20))).toBe(true)
  })

  it('annotates all learner-facing English with adjacent Chinese', () => {
    expect(validateEnglishAnnotations(chapter3)).toEqual([])
  })
})
