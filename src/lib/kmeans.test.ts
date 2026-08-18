import { describe, expect, it } from 'vitest'
import { runKMeans } from './kmeans'

describe('k-means', () => {
  it('does not increase inertia on well-separated blobs', () => {
    const run = runKMeans({
      k: 3,
      nSamples: 90,
      dataset: 'blobs',
      seed: 7,
      maxIter: 20,
    })
    const first = run.steps[0].inertia
    const last = run.steps[run.steps.length - 1].inertia
    expect(last).toBeLessThanOrEqual(first + 1e-6)
    expect(run.steps.length).toBeGreaterThan(1)
  })

  it('keeps assignment length aligned with points', () => {
    const run = runKMeans({
      k: 2,
      nSamples: 40,
      dataset: 'xor',
      seed: 1,
      maxIter: 8,
    })
    for (const step of run.steps) {
      expect(step.assignments).toHaveLength(run.points.length)
      expect(step.centroids).toHaveLength(2)
    }
  })
})
