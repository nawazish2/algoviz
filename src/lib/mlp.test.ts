import { describe, expect, it } from 'vitest'
import { bce, sigmoid, trainMlp } from './mlp'

describe('mlp', () => {
  it('sigmoid stays in (0, 1) and is stable for large |x|', () => {
    expect(sigmoid(0)).toBeCloseTo(0.5, 8)
    expect(sigmoid(40)).toBeGreaterThan(0.99)
    expect(sigmoid(-40)).toBeLessThan(0.01)
    expect(Number.isFinite(sigmoid(80))).toBe(true)
  })

  it('bce is ~0 when the prediction is sure and correct', () => {
    expect(bce(0.999, 1)).toBeLessThan(0.01)
    expect(bce(0.001, 0)).toBeLessThan(0.01)
  })

  it('learns XOR with a small hidden layer', () => {
    const run = trainMlp({
      dataset: 'xor',
      hidden: 8,
      lr: 0.8,
      epochs: 260,
      nSamples: 80,
      seed: 7,
    })
    const last = run.epochs[run.epochs.length - 1]
    expect(last.accuracy).toBeGreaterThan(0.9)
    expect(last.loss).toBeLessThan(run.epochs[0].loss)
  })
})
