import { describe, expect, it } from 'vitest'
import { REVIEW_INTERVALS, getReviewBucket, nextReviewAt } from './reviewScheduler'

describe('review scheduler', () => {
  const now = new Date('2026-07-20T08:00:00.000Z')

  it('uses deterministic 1, 3, 7, 14, and 30 day intervals', () => {
    expect(REVIEW_INTERVALS).toEqual([1, 3, 7, 14, 30])
    expect(REVIEW_INTERVALS.map((_, index) => nextReviewAt(now, index))).toEqual([
      '2026-07-21T08:00:00.000Z',
      '2026-07-23T08:00:00.000Z',
      '2026-07-27T08:00:00.000Z',
      '2026-08-03T08:00:00.000Z',
      '2026-08-19T08:00:00.000Z',
    ])
  })

  it('groups review dates into today, tomorrow, this week, and later', () => {
    expect(getReviewBucket('2026-07-20T20:00:00.000Z', now)).toBe('today')
    expect(getReviewBucket('2026-07-21T20:00:00.000Z', now)).toBe('tomorrow')
    expect(getReviewBucket('2026-07-25T20:00:00.000Z', now)).toBe('week')
    expect(getReviewBucket('2026-08-03T20:00:00.000Z', now)).toBe('later')
  })
})
