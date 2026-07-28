/**
 * One-click playground scenarios — the fun entry points.
 */
import type { AlgorithmId } from '../store/useVisualizerStore'
import type { OptimizerKind, SurfaceKind } from './gradientDescent'
import type { MaskMode } from './attention'
import type { DatasetKind } from './randomForest'

export interface PlaygroundPreset {
  id: string
  emoji: string
  title: string
  blurb: string
  algorithm: AlgorithmId
  /** Accent for chip UI */
  tone: 'indigo' | 'violet' | 'emerald' | 'rose' | 'amber'
  apply: () => void
}

import { useVisualizerStore } from '../store/useVisualizerStore'
import { useAttentionStore } from '../store/useAttentionStore'
import { useForestStore } from '../store/useForestStore'
import { useKMeansStore } from '../store/useKMeansStore'

function go(algo: AlgorithmId) {
  useVisualizerStore.getState().setAlgorithm(algo)
}

function gd(opts: {
  surface: SurfaceKind
  optimizer: OptimizerKind
  lr: number
  mom?: number
  sx?: number
  sy?: number
  steps?: number
  speed?: number
}) {
  go('gradient-descent')
  useVisualizerStore.getState().hydrateGd({
    surface: opts.surface,
    optimizer: opts.optimizer,
    learningRate: opts.lr,
    momentum: opts.mom ?? 0.9,
    startPos:
      opts.sx !== undefined && opts.sy !== undefined
        ? { x: opts.sx, y: opts.sy }
        : undefined,
    maxSteps: opts.steps ?? 200,
    speed: opts.speed ?? 18,
  })
  // Auto-play after a tick so path is ready
  setTimeout(() => useVisualizerStore.getState().setIsPlaying(true), 80)
}

function attn(opts: {
  ex?: string
  text?: string
  heads?: number
  temp?: number
  mask?: MaskMode
  head?: number
}) {
  go('attention')
  useAttentionStore.getState().hydrate({
    exampleId: opts.ex,
    text: opts.text,
    numHeads: opts.heads ?? 4,
    temperature: opts.temp ?? 1,
    mask: opts.mask ?? 'none',
    activeHead: opts.head ?? -1,
  })
}

function rf(opts: {
  dataset: DatasetKind
  trees?: number
  depth?: number
  mf?: 1 | 2
  nc?: 2 | 3
  autoPlay?: boolean
}) {
  go('random-forest')
  useForestStore.getState().hydrate({
    dataset: opts.dataset,
    nTrees: opts.trees ?? 5,
    maxDepth: opts.depth ?? 4,
    maxFeatures: opts.mf ?? 2,
    nClasses: opts.nc ?? 2,
    growthStep: 0,
  })
  if (opts.autoPlay !== false) {
    setTimeout(() => useForestStore.getState().setIsPlaying(true), 80)
  }
}

function km(opts: {
  dataset: DatasetKind
  k: number
  autoPlay?: boolean
}) {
  go('kmeans')
  useKMeansStore.getState().hydrate({
    dataset: opts.dataset,
    k: opts.k,
    step: 0,
  })
  if (opts.autoPlay !== false) {
    setTimeout(() => useKMeansStore.getState().setIsPlaying(true), 80)
  }
}

export const PLAYGROUND: PlaygroundPreset[] = [
  {
    id: 'gd-himmelblau-race',
    emoji: '🎢',
    title: 'Himmelblau free-fall',
    blurb: 'Adam races into one of four valleys',
    algorithm: 'gradient-descent',
    tone: 'amber',
    apply: () =>
      gd({
        surface: 'himmelblau',
        optimizer: 'adam',
        lr: 0.05,
        sx: -3.8,
        sy: 3.5,
        speed: 22,
      }),
  },
  {
    id: 'gd-rosenbrock',
    emoji: '🐌',
    title: 'Rosenbrock crawl',
    blurb: 'Tiny η through the banana valley',
    algorithm: 'gradient-descent',
    tone: 'indigo',
    apply: () =>
      gd({
        surface: 'rosenbrock',
        optimizer: 'momentum',
        lr: 0.0008,
        mom: 0.92,
        sx: -1.4,
        sy: 1.1,
        steps: 350,
        speed: 30,
      }),
  },
  {
    id: 'gd-saddle',
    emoji: '⚖️',
    title: 'Escape the saddle',
    blurb: 'Vanilla GD vs the ridge',
    algorithm: 'gradient-descent',
    tone: 'amber',
    apply: () =>
      gd({
        surface: 'saddle',
        optimizer: 'gd',
        lr: 0.04,
        sx: 0.02,
        sy: 1.6,
        speed: 16,
      }),
  },
  {
    id: 'attn-causal',
    emoji: '🔮',
    title: 'GPT-style mask',
    blurb: 'Causal attention — no peeking ahead',
    algorithm: 'attention',
    tone: 'violet',
    apply: () =>
      attn({
        ex: 'quote',
        mask: 'causal',
        temp: 0.7,
        heads: 4,
      }),
  },
  {
    id: 'attn-spiky',
    emoji: '🎯',
    title: 'Peaky attention',
    blurb: 'Low temperature → laser focus',
    algorithm: 'attention',
    tone: 'violet',
    apply: () =>
      attn({
        ex: 'cat',
        temp: 0.25,
        heads: 6,
        head: 0,
      }),
  },
  {
    id: 'attn-need',
    emoji: '📜',
    title: '“Attention is all…”',
    blurb: 'The paper title as tokens',
    algorithm: 'attention',
    tone: 'violet',
    apply: () =>
      attn({
        ex: 'custom',
        text: 'Attention is all you need',
        temp: 1,
        heads: 4,
      }),
  },
  {
    id: 'rf-moons',
    emoji: '🌙',
    title: 'Forest on moons',
    blurb: 'Watch trees carve a crescent boundary',
    algorithm: 'random-forest',
    tone: 'emerald',
    apply: () =>
      rf({ dataset: 'moons', trees: 7, depth: 5, mf: 2, autoPlay: true }),
  },
  {
    id: 'rf-xor',
    emoji: '🪓',
    title: 'XOR axe-cuts',
    blurb: 'Axis-aligned splits vs checker pattern',
    algorithm: 'random-forest',
    tone: 'emerald',
    apply: () =>
      rf({ dataset: 'xor', trees: 8, depth: 6, mf: 1, nc: 2, autoPlay: true }),
  },
  {
    id: 'km-party',
    emoji: '🎉',
    title: 'k=5 color party',
    blurb: 'Centroids stampede into blobs',
    algorithm: 'kmeans',
    tone: 'rose',
    apply: () => km({ dataset: 'blobs', k: 5, autoPlay: true }),
  },
  {
    id: 'km-moons',
    emoji: '💀',
    title: 'K-Means vs moons',
    blurb: 'See why linear clusters fail',
    algorithm: 'kmeans',
    tone: 'rose',
    apply: () => km({ dataset: 'moons', k: 2, autoPlay: true }),
  },
]

export const PRESET_TONES: Record<
  PlaygroundPreset['tone'],
  string
> = {
  indigo: 'bg-indigo-500/15 text-indigo-200 ring-indigo-500/30 hover:bg-indigo-500/25',
  violet: 'bg-violet-500/15 text-violet-200 ring-violet-500/30 hover:bg-violet-500/25',
  emerald:
    'bg-emerald-500/15 text-emerald-200 ring-emerald-500/30 hover:bg-emerald-500/25',
  rose: 'bg-rose-500/15 text-rose-200 ring-rose-500/30 hover:bg-rose-500/25',
  amber: 'bg-amber-500/15 text-amber-200 ring-amber-500/30 hover:bg-amber-500/25',
}
