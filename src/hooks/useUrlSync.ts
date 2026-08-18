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
import { useMlpStore } from '../store/useMlpStore'
import { useUiStore } from '../store/useUiStore'

function snapshotSearch(forceEmbed?: boolean) {
  const gd = useVisualizerStore.getState()
  const attn = useAttentionStore.getState()
  const rf = useForestStore.getState()
  const km = useKMeansStore.getState()
  const mlp = useMlpStore.getState()
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
      compare: gd.compare,
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
    mlp: {
      dataset: mlp.config.dataset,
      hidden: mlp.config.hidden,
      lr: mlp.config.lr,
      epochs: mlp.config.epochs,
      nSamples: mlp.config.nSamples,
      seed: mlp.config.seed,
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
        compare: shared.gd.compare,
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
    if (shared.mlp) {
      useMlpStore.getState().hydrate({
        dataset: shared.mlp.dataset,
        hidden: shared.mlp.hidden,
        lr: shared.mlp.lr,
        epochs: shared.mlp.epochs,
        nSamples: shared.mlp.nSamples,
        seed: shared.mlp.seed,
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
      useMlpStore.subscribe(schedule),
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
