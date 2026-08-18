import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useKMeansStore } from '../../store/useKMeansStore'
import { useUiStore } from '../../store/useUiStore'
import { KMeansCanvas, KMeansBadge } from './KMeansCanvas'
import { KMeansControls } from './KMeansControls'

export function KMeansView() {
  const config = useKMeansStore((s) => s.config)
  const run = useKMeansStore((s) => s.run)
  const step = useKMeansStore((s) => s.step)
  const isPlaying = useKMeansStore((s) => s.isPlaying)
  const speed = useKMeansStore((s) => s.speed)
  const setStep = useKMeansStore((s) => s.setStep)
  const setIsPlaying = useKMeansStore((s) => s.setIsPlaying)
  const embed = useUiStore((s) => s.embed)

  const accum = useRef(0)
  const stepRef = useRef(step)
  stepRef.current = step

  useEffect(() => {
    if (!isPlaying) {
      accum.current = 0
      return
    }
    let raf = 0
    let last = performance.now()
    const max = run.steps.length - 1

    const tick = (now: number) => {
      const dt = (now - last) / 1000
      last = now
      accum.current += dt * speed
      if (accum.current >= 1) {
        const advance = Math.floor(accum.current)
        accum.current -= advance
        const next = Math.min(max, stepRef.current + advance)
        setStep(next)
        if (next >= max) setIsPlaying(false)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [isPlaying, speed, run.steps.length, setStep, setIsPlaying])

  return (
    <div className="flex h-full min-h-0 flex-1">
      <div className="relative flex min-w-0 flex-1 flex-col overflow-y-auto">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-16 top-20 h-72 w-72 rounded-full bg-rose-600/10 blur-3xl" />
          <div className="absolute bottom-10 right-16 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col gap-5 p-5 pb-8">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap items-start justify-between gap-3"
          >
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-rose-300">
                K-Means clustering
              </div>
              <h2 className="mt-0.5 text-xl font-semibold text-white">
                Centroids chasing the mean
              </h2>
              <p className="mt-1 max-w-xl text-xs leading-relaxed text-zinc-400">
                Assign points to the nearest centroid, then move each centroid
                to the mean of its cluster — repeat until they settle.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <KMeansBadge>k = {config.k}</KMeansBadge>
              <KMeansBadge>{config.dataset}</KMeansBadge>
              <KMeansBadge tone="rose">
                iter {step}/{run.steps.length - 1}
              </KMeansBadge>
            </div>
          </motion.div>

          <KMeansCanvas />
        </div>
      </div>

      {!embed && (
        <aside
          data-export-ignore
          className="w-[300px] shrink-0 border-l border-white/5 bg-surface-900/60 backdrop-blur-sm"
        >
          <KMeansControls />
        </aside>
      )}
    </div>
  )
}
