import { describe, expect, it } from 'vitest'

import { packSectionsByHeight } from '@/lib/worksheet-print'

describe('packSectionsByHeight', () => {
  it('packs sections that fit within the body budget', () => {
    const buckets = packSectionsByHeight([100, 120, 80], 250, 10)
    expect(buckets).toEqual([[0, 1], [2]])
  })

  it('isolates oversized sections in their own bucket', () => {
    const buckets = packSectionsByHeight([100, 500, 80], 250, 10)
    expect(buckets).toEqual([[0], [1], [2]])
  })

  it('returns empty array when there are no sections', () => {
    expect(packSectionsByHeight([], 250, 10)).toEqual([])
  })
})
