import { describe, expect, it } from 'vitest'
import { validateEnglishAnnotations } from '../validateContent'
import { chapter8 } from './chapter8'

describe('chapter 8 content', () => {
  it('contains 11 complete and continuous learning units through the episode end', () => {
    expect(chapter8.units).toHaveLength(11)
    expect(chapter8.units[0].source.start).toBe(3668.03)
    expect(chapter8.units.at(-1)?.source.end).toBe(3920.575)
    expect(chapter8.units.every((unit, index) => index === 0 || unit.source.start === chapter8.units[index - 1].source.end)).toBe(true)
    expect(chapter8.units.every((unit) => [unit.takeaway, unit.beginner, unit.example, unit.principle, unit.misconception, unit.extension].every((value) => value.length >= 20))).toBe(true)
  })

  it('annotates all learner-facing English with adjacent Chinese', () => {
    expect(validateEnglishAnnotations(chapter8)).toEqual([])
  })
})
