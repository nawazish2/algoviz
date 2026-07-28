import { useEffect, useRef } from 'react'
import {
  buildShareUrl,
  parseUrlState,
  serializeUrlState,
  writeUrlSearch,
  buildEmbedSnippet,
} from '../lib/urlState'
import { useVisualizerStore } from '../store/useVisualizerStore'
import { useAttentionStore } from '../store/useAttentionStore'
import { useForestStore } from '../store/useForestStore'
import { useKMeansStore } from '../store/useKMeansStore'
import { useUiStore } from '../store/useUiStore'

function snapshotSearch(forceEmbed?: boolean) {
  const gd = useVisualizerStore.getState()
  const attn = useAttentionStore.getState()
  const rf = useForestStore.getState()
  const km = useKMeansStore.getState()
  const ui = useUiStore.getState()
  return serializeUrlState({
    algorithm: gd.algorithm,
    gd: {
      surface: gd.surface,
      optimizer: gd.optimizer,
      learningRate: gd.learningRate,
      momentum: gd.momentum,
      startPos: gd.startPos,
      maxSteps: gd.maxSteps,
      speed: gd.speed,
    },
    attn: {
      exampleId: attn.exampleId,
      customText: attn.customText,
      numHeads: attn.numHeads,
      temperature: attn.temperature,
      mask: attn.mask,
      activeHead: attn.activeHead,
      seed: attn.seed,
    },
    rf: {
      dataset: rf.config.dataset,
      nTrees: rf.config.nTrees,
      maxDepth: rf.config.maxDepth,
      minSamplesSplit: rf.config.minSamplesSplit,
      maxFeatures: rf.config.maxFeatures,
      nClasses: rf.config.nClasses,
      seed: rf.config.seed,
      growthStep: rf.growthStep,
    },
    km: {
      dataset: km.config.dataset,
      k: km.config.k,
      seed: km.config.seed,
      nSamples: km.config.nSamples,
      maxIter: km.config.maxIter,
    },
    ui: {
      embed: forceEmbed ?? ui.embed,
      theme: ui.theme,
      difficulty: ui.difficulty,
    },
  })
}

/**
 * Hydrate stores from `?…` on first load, then keep the address bar in sync.
 */
export function useUrlSync() {
  const hydrated = useRef(false)

  useEffect(() => {
    if (hydrated.current) return
    hydrated.current = true

    const shared = parseUrlState()
    if (shared.algorithm) {
      useVisualizerStore.getState().setAlgorithm(shared.algorithm)
    }
    if (shared.gd) {
      useVisualizerStore.getState().hydrateGd({
        surface: shared.gd.surface,
        optimizer: shared.gd.optimizer,
        learningRate: shared.gd.learningRate,
        momentum: shared.gd.momentum,
        startPos:
          shared.gd.startX !== undefined && shared.gd.startY !== undefined
            ? { x: shared.gd.startX, y: shared.gd.startY }
            : undefined,
        maxSteps: shared.gd.maxSteps,
        speed: shared.gd.speed,
      })
    }
    if (shared.attn) {
      useAttentionStore.getState().hydrate({
        exampleId: shared.attn.exampleId,
        text: shared.attn.text,
        numHeads: shared.attn.numHeads,
        temperature: shared.attn.temperature,
        mask: shared.attn.mask,
        activeHead: shared.attn.activeHead,
        seed: shared.attn.seed,
      })
    }
    if (shared.rf) {
      useForestStore.getState().hydrate({
        dataset: shared.rf.dataset,
        nTrees: shared.rf.nTrees,
        maxDepth: shared.rf.maxDepth,
        minSamplesSplit: shared.rf.minSamplesSplit,
        maxFeatures: shared.rf.maxFeatures,
        nClasses: shared.rf.nClasses,
        seed: shared.rf.seed,
        growthStep: shared.rf.growthStep,
      })
    }
    if (shared.km) {
      useKMeansStore.getState().hydrate({
        dataset: shared.km.dataset,
        k: shared.km.k,
        seed: shared.km.seed,
        nSamples: shared.km.nSamples,
        maxIter: shared.km.maxIter,
      })
    }
    if (shared.ui) {
      if (shared.ui.embed) useUiStore.getState().setEmbed(true)
      if (shared.ui.theme) useUiStore.getState().setTheme(shared.ui.theme)
      if (shared.ui.difficulty) {
        useUiStore.getState().setDifficulty(shared.ui.difficulty)
      }
      // Hide learning chrome in embed by default
      if (shared.ui.embed) useUiStore.getState().setShowLearning(false)
    }
  }, [])

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null

    const push = () => {
      if (!hydrated.current) return
      writeUrlSearch(snapshotSearch())
    }

    const schedule = () => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(push, 200)
    }

    const unsubs = [
      useVisualizerStore.subscribe(schedule),
      useAttentionStore.subscribe(schedule),
      useForestStore.subscribe(schedule),
      useKMeansStore.subscribe(schedule),
      useUiStore.subscribe(schedule),
    ]

    schedule()

    return () => {
      if (timer) clearTimeout(timer)
      unsubs.forEach((u) => u())
    }
  }, [])
}

export function getShareUrl(opts?: { embed?: boolean }): string {
  return buildShareUrl(snapshotSearch(opts?.embed))
}

export function getEmbedSnippet(): string {
  return buildEmbedSnippet(getShareUrl({ embed: true }))
}
