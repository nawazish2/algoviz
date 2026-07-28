import { create } from 'zustand'
import {
  SURFACES,
  type OptimizerKind,
  type SurfaceKind,
  type Vec2,
} from '../lib/gradientDescent'

export type AlgorithmId =
  | 'gradient-descent'
  | 'attention'
  | 'random-forest'
  | 'kmeans'

interface VisualizerState {
  algorithm: AlgorithmId
  setAlgorithm: (id: AlgorithmId) => void

  surface: SurfaceKind
  optimizer: OptimizerKind
  learningRate: number
  momentum: number
  startPos: Vec2
  isPlaying: boolean
  speed: number
  maxSteps: number
  currentStep: number
  pathVersion: number

  setSurface: (s: SurfaceKind) => void
  setOptimizer: (o: OptimizerKind) => void
  setLearningRate: (lr: number) => void
  setMomentum: (m: number) => void
  setStartPos: (p: Vec2) => void
  setIsPlaying: (p: boolean) => void
  togglePlay: () => void
  setSpeed: (s: number) => void
  setMaxSteps: (n: number) => void
  setCurrentStep: (n: number) => void
  reset: () => void
  randomizeStart: () => void
  /** Apply shareable URL params without cascading resets incorrectly */
  hydrateGd: ( partial: {
    surface?: SurfaceKind
    optimizer?: OptimizerKind
    learningRate?: number
    momentum?: number
    startPos?: Vec2
    maxSteps?: number
    speed?: number
  }) => void
}

function defaultLr(s: SurfaceKind): number {
  if (s === 'rosenbrock') return 0.001
  if (s === 'himmelblau') return 0.01
  return 0.05
}

export const useVisualizerStore = create<VisualizerState>((set, get) => ({
  algorithm: 'gradient-descent',
  setAlgorithm: (id) => set({ algorithm: id }),

  surface: 'himmelblau',
  optimizer: 'adam',
  learningRate: 0.01,
  momentum: 0.9,
  startPos: { ...SURFACES.himmelblau.defaultStart },
  isPlaying: false,
  speed: 12,
  maxSteps: 200,
  currentStep: 0,
  pathVersion: 0,

  setSurface: (s) =>
    set({
      surface: s,
      startPos: { ...SURFACES[s].defaultStart },
      learningRate: defaultLr(s),
      currentStep: 0,
      isPlaying: false,
      pathVersion: get().pathVersion + 1,
    }),

  setOptimizer: (o) =>
    set({
      optimizer: o,
      currentStep: 0,
      isPlaying: false,
      pathVersion: get().pathVersion + 1,
    }),

  setLearningRate: (lr) =>
    set({
      learningRate: lr,
      currentStep: 0,
      isPlaying: false,
      pathVersion: get().pathVersion + 1,
    }),

  setMomentum: (m) =>
    set({
      momentum: m,
      currentStep: 0,
      isPlaying: false,
      pathVersion: get().pathVersion + 1,
    }),

  setStartPos: (p) =>
    set({
      startPos: p,
      currentStep: 0,
      isPlaying: false,
      pathVersion: get().pathVersion + 1,
    }),

  setIsPlaying: (p) => set({ isPlaying: p }),
  togglePlay: () => set({ isPlaying: !get().isPlaying }),
  setSpeed: (s) => set({ speed: s }),

  setMaxSteps: (n) =>
    set({
      maxSteps: n,
      currentStep: 0,
      isPlaying: false,
      pathVersion: get().pathVersion + 1,
    }),

  setCurrentStep: (n) => set({ currentStep: n }),

  reset: () =>
    set({
      currentStep: 0,
      isPlaying: false,
      pathVersion: get().pathVersion + 1,
    }),

  randomizeStart: () => {
    const { surface } = get()
    const d = SURFACES[surface].domain
    const range = d.max - d.min
    set({
      startPos: {
        x: d.min + Math.random() * range * 0.85 + range * 0.075,
        y: d.min + Math.random() * range * 0.85 + range * 0.075,
      },
      currentStep: 0,
      isPlaying: false,
      pathVersion: get().pathVersion + 1,
    })
  },

  hydrateGd: (partial) => {
    const cur = get()
    const surface = partial.surface ?? cur.surface
    const startPos =
      partial.startPos ??
      (partial.surface && partial.surface !== cur.surface
        ? { ...SURFACES[surface].defaultStart }
        : cur.startPos)
    set({
      surface,
      optimizer: partial.optimizer ?? cur.optimizer,
      learningRate: partial.learningRate ?? cur.learningRate,
      momentum: partial.momentum ?? cur.momentum,
      startPos,
      maxSteps: partial.maxSteps ?? cur.maxSteps,
      speed: partial.speed ?? cur.speed,
      currentStep: 0,
      isPlaying: false,
      pathVersion: cur.pathVersion + 1,
    })
  },
}))
