import { describe, expect, it } from 'vitest'
import { giniFromCounts } from './randomForest'

describe('gini', () => {
  it('is 0 for a pure node', () => {
    expect(giniFromCounts([10, 0, 0])).toBe(0)
  })

  it('is 0.5 for an even two-class split', () => {
    expect(giniFromCounts([5, 5])).toBeCloseTo(0.5, 8)
  })

  it('is 0 for an empty node', () => {
    expect(giniFromCounts([0, 0, 0])).toBe(0)
  })
})
