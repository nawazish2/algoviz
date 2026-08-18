import { describe, expect, it } from 'vitest'
import {
  SURFACES,
  compareOptimizer,
  runPath,
  DEFAULT_STEP,
} from './gradientDescent'

describe('gradient descent', () => {
  it('descends the bowl from a far start', () => {
    const path = runPath(
      { x: 2.4, y: 1.8 },
      SURFACES.bowl,
      'gd',
      { ...DEFAULT_STEP, lr: 0.1 },
      80,
    )
    const start = path[0].z
    const end = path[path.length - 1].z
    expect(end).toBeLessThan(start * 0.05)
    expect(end).toBeLessThan(0.05)
  })

  it('Adam is the compare partner unless Adam is already selected', () => {
    expect(compareOptimizer('gd')).toBe('adam')
    expect(compareOptimizer('momentum')).toBe('adam')
    expect(compareOptimizer('adam')).toBe('gd')
  })
})
