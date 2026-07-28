import { useEffect, useRef } from 'react'
import { useVisualizerStore } from '../store/useVisualizerStore'
import { useKMeansStore } from '../store/useKMeansStore'
import { useForestStore } from '../store/useForestStore'
import { useUiStore } from '../store/useUiStore'
import { SURFACES, runPath, DEFAULT_STEP } from '../lib/gradientDescent'

/** Fire fun toasts when demos reach satisfying states. */
export function useCelebration() {
  const gdCelebrated = useRef(false)
  const kmCelebrated = useRef(false)
  const rfCelebrated = useRef(false)

  const algorithm = useVisualizerStore((s) => s.algorithm)
  const gdStep = useVisualizerStore((s) => s.currentStep)
  const gdPlaying = useVisualizerStore((s) => s.isPlaying)
  const surface = useVisualizerStore((s) => s.surface)
  const optimizer = useVisualizerStore((s) => s.optimizer)
  const lr = useVisualizerStore((s) => s.learningRate)
  const mom = useVisualizerStore((s) => s.momentum)
  const startPos = useVisualizerStore((s) => s.startPos)
  const maxSteps = useVisualizerStore((s) => s.maxSteps)
  const pathVersion = useVisualizerStore((s) => s.pathVersion)

  const kmStep = useKMeansStore((s) => s.step)
  const kmPlaying = useKMeansStore((s) => s.isPlaying)
  const kmRun = useKMeansStore((s) => s.run)

  const rfStep = useForestStore((s) => s.growthStep)
  const rfTimeline = useForestStore((s) => s.timeline)
  const rfPlaying = useForestStore((s) => s.isPlaying)

  // Reset flags when config changes
  useEffect(() => {
    gdCelebrated.current = false
  }, [pathVersion, algorithm])
  useEffect(() => {
    kmCelebrated.current = false
  }, [kmRun.seed, kmRun.k, algorithm])
  useEffect(() => {
    rfCelebrated.current = false
  }, [rfTimeline.length, algorithm])

  // GD convergence
  useEffect(() => {
    if (algorithm !== 'gradient-descent' || gdCelebrated.current) return
    if (gdPlaying) return
    if (gdStep <= 0) return

    const path = runPath(
      startPos,
      SURFACES[surface],
      optimizer,
      { ...DEFAULT_STEP, lr, beta: mom },
      maxSteps,
    )
    const end = path[Math.min(gdStep, path.length - 1)]
    const startLoss = path[0]?.z ?? 1
    if (!end) return
    const improved = end.z < startLoss * 0.15 || end.z < 0.5
    const atEnd = gdStep >= path.length - 1
    if (improved && atEnd) {
      gdCelebrated.current = true
      useUiStore.getState().fireConfetti()
      useUiStore.getState().pushToast({
        tone: 'success',
        title: '✨ Converged!',
        body: `Loss ${end.z.toPrecision(3)} · ${optimizer.toUpperCase()} on ${SURFACES[surface].name}`,
      })
    }
  }, [
    algorithm,
    gdStep,
    gdPlaying,
    surface,
    optimizer,
    lr,
    mom,
    startPos,
    maxSteps,
  ])

  // K-Means settled
  useEffect(() => {
    if (algorithm !== 'kmeans' || kmCelebrated.current) return
    if (kmPlaying) return
    const last = kmRun.steps[kmStep]
    if (!last || kmStep === 0) return
    if (kmStep >= kmRun.steps.length - 1 || last.movement < 1e-3) {
      kmCelebrated.current = true
      useUiStore.getState().fireConfetti()
      useUiStore.getState().pushToast({
        tone: 'success',
        title: '🎯 Clusters settled',
        body: `Inertia ${last.inertia.toFixed(1)} after ${kmStep} iteration${kmStep === 1 ? '' : 's'}`,
      })
    }
  }, [algorithm, kmStep, kmPlaying, kmRun])

  // Forest fully grown
  useEffect(() => {
    if (algorithm !== 'random-forest' || rfCelebrated.current) return
    if (rfPlaying) return
    if (rfTimeline.length > 0 && rfStep >= rfTimeline.length) {
      rfCelebrated.current = true
      useUiStore.getState().fireConfetti()
      useUiStore.getState().pushToast({
        tone: 'success',
        title: '🌲 Forest complete',
        body: 'Click the scatter plot to probe ensemble votes.',
      })
    }
  }, [algorithm, rfStep, rfPlaying, rfTimeline.length])
}
