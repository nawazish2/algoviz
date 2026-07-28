import { create } from 'zustand'
import {
  DEFAULT_KMEANS,
  runKMeans,
  type DatasetKind,
  type KMeansConfig,
  type KMeansRun,
} from '../lib/kmeans'

interface KMeansState {
  config: KMeansConfig
  run: KMeansRun
  /** Index into run.steps */
  step: number
  isPlaying: boolean
  speed: number // steps per second

  setK: (k: number) => void
  setDataset: (d: DatasetKind) => void
  setNSamples: (n: number) => void
  setMaxIter: (n: number) => void
  reshuffle: () => void
  rebuild: (partial?: Partial<KMeansConfig>) => void
  hydrate: (partial: {
    dataset?: DatasetKind
    k?: number
    seed?: number
    nSamples?: number
    maxIter?: number
    step?: number
  }) => void

  setStep: (s: number) => void
  setIsPlaying: (p: boolean) => void
  togglePlay: () => void
  setSpeed: (s: number) => void
  reset: () => void
  stepOnce: () => void
}

function boot(cfg: KMeansConfig) {
  const run = runKMeans(cfg)
  return { run, step: 0, isPlaying: false }
}

export const useKMeansStore = create<KMeansState>((set, get) => {
  const config = { ...DEFAULT_KMEANS }
  const initial = boot(config)

  return {
    config,
    ...initial,
    speed: 2,

    rebuild: (partial) => {
      const config = { ...get().config, ...partial }
      set({ config, ...boot(config) })
    },

    setK: (k) =>
      get().rebuild({ k: Math.min(8, Math.max(2, Math.round(k))) }),
    setDataset: (dataset) => get().rebuild({ dataset }),
    setNSamples: (nSamples) =>
      get().rebuild({
        nSamples: Math.min(300, Math.max(40, Math.round(nSamples))),
      }),
    setMaxIter: (maxIter) =>
      get().rebuild({
        maxIter: Math.min(40, Math.max(5, Math.round(maxIter))),
      }),
    reshuffle: () =>
      get().rebuild({ seed: (get().config.seed + 11) % 100000 }),

    hydrate: (partial) => {
      const config = {
        ...get().config,
        ...(partial.dataset !== undefined ? { dataset: partial.dataset } : {}),
        ...(partial.k !== undefined ? { k: partial.k } : {}),
        ...(partial.seed !== undefined ? { seed: partial.seed } : {}),
        ...(partial.nSamples !== undefined
          ? { nSamples: partial.nSamples }
          : {}),
        ...(partial.maxIter !== undefined
          ? { maxIter: partial.maxIter }
          : {}),
      }
      const next = boot(config)
      const step = Math.min(
        partial.step ?? 0,
        Math.max(0, next.run.steps.length - 1),
      )
      set({ config, ...next, step })
    },

    setStep: (s) => {
      const max = get().run.steps.length - 1
      const step = Math.max(0, Math.min(max, s))
      set({
        step,
        isPlaying: step >= max ? false : get().isPlaying,
      })
    },
    setIsPlaying: (p) => set({ isPlaying: p }),
    togglePlay: () => {
      const { step, run, isPlaying } = get()
      if (step >= run.steps.length - 1) {
        set({ step: 0, isPlaying: true })
      } else {
        set({ isPlaying: !isPlaying })
      }
    },
    setSpeed: (speed) => set({ speed }),
    reset: () => set({ step: 0, isPlaying: false }),
    stepOnce: () => {
      const { step, run } = get()
      if (step < run.steps.length - 1) get().setStep(step + 1)
    },
  }
})
