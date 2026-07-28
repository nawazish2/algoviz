import { create } from 'zustand'
import {
  DEFAULT_FOREST_CONFIG,
  buildForest,
  forestGrowthTimeline,
  type DatasetKind,
  type Forest,
  type ForestConfig,
  type Sample,
} from '../lib/randomForest'

interface ForestState {
  config: ForestConfig
  forest: Forest
  timeline: { treeIndex: number; nodeId: string }[]
  /** How many growth events have been revealed */
  growthStep: number
  isPlaying: boolean
  speed: number // events per second
  /** Which tree is focused in the big SVG (auto-follows during play) */
  focusTree: number
  /** Hover / pick a sample for votes */
  selectedSample: number | null
  probe: Sample | null

  setDataset: (d: DatasetKind) => void
  setNTrees: (n: number) => void
  setMaxDepth: (d: number) => void
  setMinSamples: (m: number) => void
  setMaxFeatures: (f: 1 | 2) => void
  setNClasses: (c: 2 | 3) => void
  setNSamples: (n: number) => void
  reshuffle: () => void
  rebuild: (partial?: Partial<ForestConfig>) => void

  setGrowthStep: (s: number) => void
  setIsPlaying: (p: boolean) => void
  togglePlay: () => void
  setSpeed: (s: number) => void
  setFocusTree: (t: number) => void
  setSelectedSample: (i: number | null) => void
  setProbe: (s: Sample | null) => void
  resetGrowth: () => void
  stepOnce: () => void

  /** Visible node ids for a tree given current growthStep */
  visibleForTree: (treeIndex: number) => Set<string>
  /** How many trees are fully grown */
  completedTrees: () => number
  hydrate: (partial: {
    dataset?: DatasetKind
    nTrees?: number
    maxDepth?: number
    minSamplesSplit?: number
    maxFeatures?: 1 | 2
    nClasses?: 2 | 3
    seed?: number
    growthStep?: number
  }) => void
}

function createForest(cfg: ForestConfig) {
  const forest = buildForest(cfg)
  const timeline = forestGrowthTimeline(forest)
  return { forest, timeline, growthStep: 0, focusTree: 0, isPlaying: false }
}

export const useForestStore = create<ForestState>((set, get) => {
  const initialCfg = { ...DEFAULT_FOREST_CONFIG }
  const boot = createForest(initialCfg)

  return {
    config: initialCfg,
    ...boot,
    speed: 14,
    selectedSample: null,
    probe: null,

    rebuild: (partial) => {
      const config = { ...get().config, ...partial }
      const next = createForest(config)
      set({
        config,
        ...next,
        selectedSample: null,
        probe: null,
      })
    },

    setDataset: (dataset) => get().rebuild({ dataset }),
    setNTrees: (nTrees) =>
      get().rebuild({ nTrees: Math.min(12, Math.max(1, Math.round(nTrees))) }),
    setMaxDepth: (maxDepth) =>
      get().rebuild({ maxDepth: Math.min(8, Math.max(1, Math.round(maxDepth))) }),
    setMinSamples: (minSamplesSplit) =>
      get().rebuild({
        minSamplesSplit: Math.min(20, Math.max(2, Math.round(minSamplesSplit))),
      }),
    setMaxFeatures: (maxFeatures) => get().rebuild({ maxFeatures }),
    setNClasses: (nClasses) => get().rebuild({ nClasses }),
    setNSamples: (nSamples) =>
      get().rebuild({ nSamples: Math.min(300, Math.max(40, Math.round(nSamples))) }),
    reshuffle: () => get().rebuild({ seed: (get().config.seed + 13) % 100000 }),

    setGrowthStep: (s) => {
      const max = get().timeline.length
      const growthStep = Math.max(0, Math.min(max, s))
      // Auto-focus the tree being grown
      const event = get().timeline[Math.max(0, growthStep - 1)]
      set({
        growthStep,
        focusTree: event ? event.treeIndex : get().focusTree,
        isPlaying:
          growthStep >= max ? false : get().isPlaying,
      })
    },

    setIsPlaying: (p) => set({ isPlaying: p }),
    togglePlay: () => {
      const { growthStep, timeline, isPlaying } = get()
      if (growthStep >= timeline.length) {
        set({ growthStep: 0, isPlaying: true, focusTree: 0 })
      } else {
        set({ isPlaying: !isPlaying })
      }
    },
    setSpeed: (speed) => set({ speed }),
    setFocusTree: (focusTree) => set({ focusTree }),
    setSelectedSample: (selectedSample) => set({ selectedSample, probe: null }),
    setProbe: (probe) => set({ probe, selectedSample: null }),
    resetGrowth: () => set({ growthStep: 0, isPlaying: false, focusTree: 0 }),
    stepOnce: () => {
      const { growthStep, timeline } = get()
      if (growthStep < timeline.length) get().setGrowthStep(growthStep + 1)
    },

    visibleForTree: (treeIndex) => {
      const { timeline, growthStep } = get()
      const setIds = new Set<string>()
      for (let i = 0; i < growthStep; i++) {
        const e = timeline[i]
        if (e.treeIndex === treeIndex) setIds.add(e.nodeId)
      }
      return setIds
    },

    completedTrees: () => {
      const { forest, timeline, growthStep } = get()
      let done = 0
      for (const tree of forest.trees) {
        let count = 0
        for (let i = 0; i < growthStep; i++) {
          if (timeline[i].treeIndex === tree.id) count++
        }
        if (count >= tree.growthOrder.length) done++
      }
      return done
    },

    hydrate: (partial) => {
      const config = {
        ...get().config,
        ...(partial.dataset !== undefined ? { dataset: partial.dataset } : {}),
        ...(partial.nTrees !== undefined ? { nTrees: partial.nTrees } : {}),
        ...(partial.maxDepth !== undefined
          ? { maxDepth: partial.maxDepth }
          : {}),
        ...(partial.minSamplesSplit !== undefined
          ? { minSamplesSplit: partial.minSamplesSplit }
          : {}),
        ...(partial.maxFeatures !== undefined
          ? { maxFeatures: partial.maxFeatures }
          : {}),
        ...(partial.nClasses !== undefined
          ? { nClasses: partial.nClasses }
          : {}),
        ...(partial.seed !== undefined ? { seed: partial.seed } : {}),
      }
      const next = createForest(config)
      const growthStep = Math.min(
        partial.growthStep ?? 0,
        next.timeline.length,
      )
      const event = next.timeline[Math.max(0, growthStep - 1)]
      set({
        config,
        ...next,
        growthStep,
        focusTree: event?.treeIndex ?? 0,
        selectedSample: null,
        probe: null,
      })
    },
  }
})
