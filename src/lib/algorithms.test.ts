import { describe, expect, it } from 'vitest'
import {
  ALGORITHMS,
  ALGO_KEYS,
  ALGO_TO_PARAM,
  PARAM_TO_ALGO,
  isAlgorithmId,
} from './algorithms'

describe('algorithm registry', () => {
  it('maps every algorithm both ways', () => {
    for (const algo of ALGORITHMS) {
      expect(ALGO_TO_PARAM[algo.id]).toBe(algo.param)
      expect(PARAM_TO_ALGO[algo.param]).toBe(algo.id)
      expect(ALGO_KEYS[algo.key]).toBe(algo.id)
    }
  })

  it('accepts aliases used in old share links', () => {
    expect(PARAM_TO_ALGO.forest).toBe('random-forest')
    expect(PARAM_TO_ALGO['gradient-descent']).toBe('gradient-descent')
    expect(PARAM_TO_ALGO.backprop).toBe('mlp')
  })

  it('narrows unknown strings', () => {
    expect(isAlgorithmId('mlp')).toBe(true)
    expect(isAlgorithmId('svm')).toBe(false)
  })
})
