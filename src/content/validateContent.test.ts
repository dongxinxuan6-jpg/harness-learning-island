import { describe, expect, it } from 'vitest'
import { glossary } from './glossary'
import { chapters } from './chapters'
import { sourceSegments } from './sourceSegments'
import { validateCoverage, validateEnglishAnnotations } from './validateContent'

describe('source transcript manifest', () => {
  it('contains all 179 ordered speaker segments without transcript text', () => {
    expect(sourceSegments).toHaveLength(179)
    expect(sourceSegments[0]).toMatchObject({ speaker: 1, start: 0.49 })
    expect(sourceSegments.at(-1)).toMatchObject({ speaker: 1, start: 3896.94 })
    expect(sourceSegments.every((segment, index) => index === 0 || segment.start > sourceSegments[index - 1].start)).toBe(true)
    expect(sourceSegments.some((segment) => 'text' in segment)).toBe(false)
  })
})

describe('coverage validation', () => {
  it('reports unmapped and ambiguously mapped source segments', () => {
    const segments = [
      { id: 's001', speaker: 1, start: 1 },
      { id: 's002', speaker: 2, start: 5 },
      { id: 's003', speaker: 1, start: 12 },
    ]
    const units = [
      { id: 'u1', source: { start: 0, end: 6 } },
      { id: 'u2', source: { start: 4, end: 10 } },
    ]

    expect(validateCoverage(segments, units)).toEqual({
      unmapped: ['s003'],
      ambiguous: ['s002'],
    })
  })
})

describe('English annotation validation', () => {
  it('accepts adjacent Chinese annotations and reports unannotated English', () => {
    expect(validateEnglishAnnotations({ title: 'AI（人工智能）系统' })).toEqual([])
    expect(validateEnglishAnnotations({ title: 'AI 系统' })).toEqual(['title: AI'])
  })
})

describe('canonical glossary', () => {
  it('provides bilingual beginner definitions for core terms', () => {
    expect(glossary.length).toBeGreaterThanOrEqual(20)
    expect(glossary.find((term) => term.key === 'harness-engineering')).toMatchObject({
      english: 'Harness Engineering',
      chinese: '驾驭系统工程',
    })
    expect(glossary.every((term) => term.english && term.chinese && term.beginner)).toBe(true)
  })
})

describe('completed course coverage', () => {
  const units = chapters.flatMap((chapter) => chapter.units)

  it('contains exactly eight chapters and 106 complete learning units', () => {
    expect(chapters).toHaveLength(8)
    expect(units).toHaveLength(106)
    expect(units.every((unit) => (
      unit.takeaway && unit.beginner && unit.example && unit.principle
      && unit.misconception && unit.extension && unit.terms.length > 0 && unit.check
    ))).toBe(true)
    expect(new Set(chapters.map((chapter) => chapter.interaction.id)).size).toBe(8)
  })

  it('maps every one of the 179 source segments to exactly one learning unit', () => {
    expect(validateCoverage(sourceSegments, units)).toEqual({ unmapped: [], ambiguous: [] })
  })

  it('keeps all learner-facing English adjacent to Chinese annotations', () => {
    expect(validateEnglishAnnotations(chapters)).toEqual([])
  })
})
