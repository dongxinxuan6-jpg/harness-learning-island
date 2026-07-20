import { describe, expect, it } from 'vitest'
import { validateEnglishAnnotations } from '../validateContent'
import { chapter7 } from './chapter7'

describe('chapter 7 content', () => {
  it('contains 16 complete and continuous learning units', () => {
    expect(chapter7.units).toHaveLength(16)
    expect(chapter7.units[0].source.start).toBe(3201.18)
    expect(chapter7.units.at(-1)?.source.end).toBe(3668.03)
    expect(chapter7.units.every((unit, index) => index === 0 || unit.source.start === chapter7.units[index - 1].source.end)).toBe(true)
    expect(chapter7.units.every((unit) => [unit.takeaway, unit.beginner, unit.example, unit.principle, unit.misconception, unit.extension].every((value) => value.length >= 20))).toBe(true)
  })

  it('annotates all learner-facing English with adjacent Chinese', () => {
    expect(validateEnglishAnnotations(chapter7)).toEqual([])
  })
})
