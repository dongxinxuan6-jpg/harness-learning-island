import { describe, expect, it } from 'vitest'
import { validateEnglishAnnotations } from '../validateContent'
import { chapter1 } from './chapter1'

describe('chapter 1 content', () => {
  it('contains 13 complete and continuous learning units', () => {
    expect(chapter1.units).toHaveLength(13)
    expect(chapter1.units[0].source.start).toBe(0)
    expect(chapter1.units.at(-1)?.source.end).toBe(661.44)
    expect(
      chapter1.units.every((unit, index) =>
        index === 0 || unit.source.start === chapter1.units[index - 1].source.end,
      ),
    ).toBe(true)
    expect(
      chapter1.units.every((unit) =>
        [unit.takeaway, unit.beginner, unit.example, unit.principle, unit.misconception, unit.extension]
          .every((value) => value.length >= 20),
      ),
    ).toBe(true)
  })

  it('annotates all learner-facing English with adjacent Chinese', () => {
    expect(validateEnglishAnnotations(chapter1)).toEqual([])
  })
})
