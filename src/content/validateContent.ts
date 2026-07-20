import type { CoverageUnit, SourceSegment } from './types'

interface CoverageResult {
  unmapped: string[]
  ambiguous: string[]
}

export function validateCoverage(
  segments: Pick<SourceSegment, 'id' | 'start'>[],
  units: CoverageUnit[],
): CoverageResult {
  const result: CoverageResult = { unmapped: [], ambiguous: [] }

  for (const segment of segments) {
    const matches = units.filter(
      (unit) => segment.start >= unit.source.start && segment.start < unit.source.end,
    )
    if (matches.length === 0) result.unmapped.push(segment.id)
    if (matches.length > 1) result.ambiguous.push(segment.id)
  }

  return result
}

function collectStrings(value: unknown, path = ''): Array<{ path: string; value: string }> {
  if (typeof value === 'string') return [{ path, value }]
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => collectStrings(item, `${path}[${index}]`))
  }
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, item]) =>
      collectStrings(item, path ? `${path}.${key}` : key),
    )
  }
  return []
}

export function validateEnglishAnnotations(content: unknown): string[] {
  const issues: string[] = []
  const english = /[A-Za-z][A-Za-z0-9+./-]*(?:[ -][A-Za-z][A-Za-z0-9+./-]*)*/g

  for (const item of collectStrings(content)) {
    for (const match of item.value.matchAll(english)) {
      const end = (match.index ?? 0) + match[0].length
      if (item.value[end] !== '（') issues.push(`${item.path}: ${match[0]}`)
    }
  }

  return issues
}
