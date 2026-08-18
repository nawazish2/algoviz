import { describe, expect, it } from 'vitest'
import { softmax } from './attention'

describe('softmax', () => {
  it('returns a probability simplex', () => {
    const p = softmax([1, 2, 3], 1)
    const sum = p.reduce((a, b) => a + b, 0)
    expect(sum).toBeCloseTo(1, 8)
    expect(p.every((x) => x > 0 && x < 1)).toBe(true)
    expect(p[2]).toBeGreaterThan(p[1])
    expect(p[1]).toBeGreaterThan(p[0])
  })

  it('sharpens as temperature drops', () => {
    const logits = [0, 1, 4]
    const peaky = softmax(logits, 0.2)
    const flat = softmax(logits, 4)
    expect(Math.max(...peaky)).toBeGreaterThan(Math.max(...flat))
  })
})
