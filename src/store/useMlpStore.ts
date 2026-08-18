import { create } from 'zustand'
import {
  DEFAULT_MLP,
  trainMlp,
  type MlpConfig,
  type MlpDataset,
  type MlpRun,
} from '../lib/mlp'

interface MlpState {
  config: MlpConfig
  run: MlpRun
  step: number
  isPlaying: boolean
  speed: number

  setDataset: (d: MlpDataset) => void
  setHidden: (n: number) => void
  setLr: (lr: number) => void
  setEpochs: (n: number) => void
  reshuffle: () => void
  rebuild: (partial?: Partial<MlpConfig>) => void
  hydrate: (partial: {
    dataset?: MlpDataset
    hidden?: number
    lr?: number
    epochs?: number
    nSamples?: number
    seed?: number
    step?: number
  }) => void

  setStep: (s: number) => void
  setIsPlaying: (p: boolean) => void
  togglePlay: () => void
  setSpeed: (s: number) => void
  reset: () => void
  stepOnce: () => void
}

function boot(cfg: MlpConfig) {
  const run = trainMlp(cfg)
  return { run, step: 0, isPlaying: false }
}

export const useMlpStore = create<MlpState>((set, get) => {
  const config = { ...DEFAULT_MLP }
  const initial = boot(config)

  return {
    config,
    ...initial,
    speed: 24,

    rebuild: (partial) => {
      const config = { ...get().config, ...partial }
      set({ config, ...boot(config) })
    },

    setDataset: (dataset) => get().rebuild({ dataset }),
    setHidden: (hidden) =>
      get().rebuild({ hidden: Math.min(12, Math.max(2, Math.round(hidden))) }),
    setLr: (lr) =>
      get().rebuild({ lr: Math.min(3, Math.max(0.01, lr)) }),
    setEpochs: (epochs) =>
      get().rebuild({
        epochs: Math.min(400, Math.max(20, Math.round(epochs))),
      }),
    reshuffle: () =>
      get().rebuild({ seed: (get().config.seed + 19) % 100000 }),

    hydrate: (partial) => {
      const config = {
        ...get().config,
        ...(partial.dataset !== undefined ? { dataset: partial.dataset } : {}),
        ...(partial.hidden !== undefined ? { hidden: partial.hidden } : {}),
        ...(partial.lr !== undefined ? { lr: partial.lr } : {}),
        ...(partial.epochs !== undefined ? { epochs: partial.epochs } : {}),
        ...(partial.nSamples !== undefined
          ? { nSamples: partial.nSamples }
          : {}),
        ...(partial.seed !== undefined ? { seed: partial.seed } : {}),
      }
      const next = boot(config)
      const step = Math.min(
        partial.step ?? 0,
        Math.max(0, next.run.epochs.length - 1),
      )
      set({ config, ...next, step })
    },

    setStep: (s) => {
      const max = get().run.epochs.length - 1
      const step = Math.max(0, Math.min(max, s))
      set({
        step,
        isPlaying: step >= max ? false : get().isPlaying,
      })
    },
    setIsPlaying: (p) => set({ isPlaying: p }),
    togglePlay: () => {
      const { step, run, isPlaying } = get()
      if (step >= run.epochs.length - 1) {
        set({ step: 0, isPlaying: true })
      } else {
        set({ isPlaying: !isPlaying })
      }
    },
    setSpeed: (speed) => set({ speed }),
    reset: () => set({ step: 0, isPlaying: false }),
    stepOnce: () => {
      const { step, run } = get()
      if (step < run.epochs.length - 1) get().setStep(step + 1)
    },
  }
})
