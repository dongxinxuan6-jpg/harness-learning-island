export const REVIEW_INTERVALS = [1, 3, 7, 14, 30] as const

export type ReviewBucket = 'today' | 'tomorrow' | 'week' | 'later'

export function nextReviewAt(from: Date, intervalIndex: number): string {
  const index = Math.min(Math.max(intervalIndex, 0), REVIEW_INTERVALS.length - 1)
  return new Date(from.getTime() + REVIEW_INTERVALS[index] * 24 * 60 * 60 * 1000).toISOString()
}

function utcDayNumber(date: Date) {
  return Math.floor(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / (24 * 60 * 60 * 1000))
}

export function getReviewBucket(dueAt: string, now = new Date()): ReviewBucket {
  const difference = utcDayNumber(new Date(dueAt)) - utcDayNumber(now)
  if (difference <= 0) return 'today'
  if (difference === 1) return 'tomorrow'
  if (difference <= 7) return 'week'
  return 'later'
}
