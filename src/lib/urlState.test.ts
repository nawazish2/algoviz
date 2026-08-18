import { describe, expect, it } from 'vitest'
import { parseUrlState, serializeUrlState } from './urlState'

const base = {
  gd: {
    surface: 'himmelblau' as const,
    optimizer: 'adam' as const,
    learningRate: 0.01,
    momentum: 0.9,
    startPos: { x: -3.5, y: 3.2 },
    maxSteps: 200,
    speed: 12,
    compare: false,
  },
  attn: {
    exampleId: 'cat',
    customText: 'The cat sat on the mat',
    numHeads: 4,
    temperature: 1,
    mask: 'none' as const,
    activeHead: -1,
    seed: 42,
  },
  rf: {
    dataset: 'moons' as const,
    nTrees: 5,
    maxDepth: 4,
    minSamplesSplit: 2,
    maxFeatures: 2 as const,
    nClasses: 2 as const,
    seed: 42,
    growthStep: 0,
  },
  km: {
    dataset: 'blobs' as const,
    k: 3,
    seed: 42,
    nSamples: 140,
    maxIter: 15,
  },
  mlp: {
    dataset: 'xor' as const,
    hidden: 6,
    lr: 0.7,
    epochs: 220,
    nSamples: 80,
    seed: 42,
  },
}

describe('url state', () => {
  it('round-trips a gradient-descent share link', () => {
    const search = serializeUrlState({
      ...base,
      algorithm: 'gradient-descent',
      gd: { ...base.gd, compare: true },
    })
    const parsed = parseUrlState(`?${search}`)
    expect(parsed.algorithm).toBe('gradient-descent')
    expect(parsed.gd?.surface).toBe('himmelblau')
    expect(parsed.gd?.optimizer).toBe('adam')
    expect(parsed.gd?.learningRate).toBe(0.01)
    expect(parsed.gd?.compare).toBe(true)
  })

  it('parses the README golden query strings', () => {
    const gd = parseUrlState('?algo=gd&surface=himmelblau&opt=adam&lr=0.01')
    expect(gd.algorithm).toBe('gradient-descent')
    expect(gd.gd?.surface).toBe('himmelblau')

    const attn = parseUrlState('?algo=attn&ex=cat&mask=causal&theme=neon')
    expect(attn.algorithm).toBe('attention')
    expect(attn.attn?.mask).toBe('causal')
    expect(attn.ui?.theme).toBe('neon')

    const km = parseUrlState('?algo=km&k=5&embed=1&diff=beginner')
    expect(km.algorithm).toBe('kmeans')
    expect(km.km?.k).toBe(5)
    expect(km.ui?.embed).toBe(true)
    expect(km.ui?.difficulty).toBe('beginner')
  })

  it('round-trips mlp params', () => {
    const search = serializeUrlState({ ...base, algorithm: 'mlp' })
    const parsed = parseUrlState(`?${search}`)
    expect(parsed.algorithm).toBe('mlp')
    expect(parsed.mlp?.dataset).toBe('xor')
    expect(parsed.mlp?.hidden).toBe(6)
    expect(parsed.mlp?.lr).toBe(0.7)
  })
})
