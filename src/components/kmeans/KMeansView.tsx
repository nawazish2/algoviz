import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Shuffle,
} from 'lucide-react'
import {
  CLUSTER_COLORS,
  clusterColor,
  type DatasetKind,
} from '../../lib/kmeans'
import { useKMeansStore } from '../../store/useKMeansStore'
import { useUiStore } from '../../store/useUiStore'
import { cn } from '../../lib/utils'

const SIZE = 420
const PAD = 28
const DOMAIN = { min: -2.4, max: 2.4 }

function toPx(v: number, axis: 'x' | 'y') {
  const t = (v - DOMAIN.min) / (DOMAIN.max - DOMAIN.min)
  if (axis === 'x') return PAD + t * (SIZE - PAD * 2)
  return PAD + (1 - t) * (SIZE - PAD * 2)
}

const DATASETS: { id: DatasetKind; label: string; hint: string }[] = [
  { id: 'blobs', label: 'Gaussian blobs', hint: 'Natural clusters' },
  { id: 'moons', label: 'Two moons', hint: 'Non-convex shapes' },
  { id: 'xor', label: 'Uniform cloud', hint: 'No clear structure' },
]

export function KMeansView() {
  const config = useKMeansStore((s) => s.config)
  const run = useKMeansStore((s) => s.run)
  const step = useKMeansStore((s) => s.step)
  const isPlaying = useKMeansStore((s) => s.isPlaying)
  const speed = useKMeansStore((s) => s.speed)

  const setStep = useKMeansStore((s) => s.setStep)
  const setIsPlaying = useKMeansStore((s) => s.setIsPlaying)
  const togglePlay = useKMeansStore((s) => s.togglePlay)
  const setSpeed = useKMeansStore((s) => s.setSpeed)
  const reset = useKMeansStore((s) => s.reset)
  const stepOnce = useKMeansStore((s) => s.stepOnce)
  const setK = useKMeansStore((s) => s.setK)
  const setDataset = useKMeansStore((s) => s.setDataset)
  const setMaxIter = useKMeansStore((s) => s.setMaxIter)
  const reshuffle = useKMeansStore((s) => s.reshuffle)
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

  const current = run.steps[step] ?? run.steps[0]

  // Soft region grid by nearest centroid
  const regions = useMemo(() => {
    if (!current) return []
    const res = 36
    const cells: { x: number; y: number; c: number }[] = []
    const cell = (SIZE - PAD * 2) / res
    for (let j = 0; j < res; j++) {
      for (let i = 0; i < res; i++) {
        const x =
          DOMAIN.min + ((i + 0.5) / res) * (DOMAIN.max - DOMAIN.min)
        const y =
          DOMAIN.max - ((j + 0.5) / res) * (DOMAIN.max - DOMAIN.min)
        let best = 0
        let bestD = Infinity
        current.centroids.forEach((cent, ci) => {
          const d = (x - cent.x) ** 2 + (y - cent.y) ** 2
          if (d < bestD) {
            bestD = d
            best = ci
          }
        })
        cells.push({
          x: PAD + i * cell,
          y: PAD + j * cell,
          c: best,
        })
      }
    }
    return { cells, cell }
  }, [current])

  // Cluster sizes
  const sizes = useMemo(() => {
    const s = new Array(config.k).fill(0)
    current?.assignments.forEach((a) => {
      s[a]++
    })
    return s
  }, [current, config.k])

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
              <Badge>k = {config.k}</Badge>
              <Badge>{config.dataset}</Badge>
              <Badge tone="rose">
                iter {step}/{run.steps.length - 1}
              </Badge>
            </div>
          </motion.div>

          <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
            {/* Canvas */}
            <div className="rounded-2xl bg-surface-900/50 p-3 ring-1 ring-white/5">
              <svg
                width={SIZE}
                height={SIZE}
                className="mx-auto max-w-full"
                viewBox={`0 0 ${SIZE} ${SIZE}`}
              >
                {/* Regions */}
                {regions &&
                  'cells' in regions &&
                  regions.cells.map((cell, idx) => (
                    <rect
                      key={idx}
                      x={cell.x}
                      y={cell.y}
                      width={regions.cell + 0.5}
                      height={regions.cell + 0.5}
                      fill={clusterColor(cell.c, 0.12)}
                    />
                  ))}

                <rect
                  x={PAD}
                  y={PAD}
                  width={SIZE - PAD * 2}
                  height={SIZE - PAD * 2}
                  fill="none"
                  stroke="rgba(255,255,255,0.06)"
                  rx={8}
                />

                {/* Points */}
                {run.points.map((p, i) => {
                  const c = current.assignments[i] ?? 0
                  return (
                    <circle
                      key={i}
                      cx={toPx(p.x, 'x')}
                      cy={toPx(p.y, 'y')}
                      r={3.2}
                      fill={CLUSTER_COLORS[c % CLUSTER_COLORS.length]}
                      opacity={0.85}
                      stroke="rgba(0,0,0,0.35)"
                      strokeWidth={0.5}
                    />
                  )
                })}

                {/* Lines point → centroid (sample for clarity) */}
                {step > 0 &&
                  run.points.map((p, i) => {
                    if (i % 4 !== 0) return null
                    const c = current.assignments[i]
                    const cent = current.centroids[c]
                    if (!cent) return null
                    return (
                      <line
                        key={`l-${i}`}
                        x1={toPx(p.x, 'x')}
                        y1={toPx(p.y, 'y')}
                        x2={toPx(cent.x, 'x')}
                        y2={toPx(cent.y, 'y')}
                        stroke={clusterColor(c, 0.12)}
                        strokeWidth={0.8}
                      />
                    )
                  })}

                {/* Centroids */}
                {current.centroids.map((cent, i) => {
                  const cx = toPx(cent.x, 'x')
                  const cy = toPx(cent.y, 'y')
                  return (
                    <motion.g
                      key={`c-${i}`}
                      initial={false}
                      animate={{ x: cx, y: cy }}
                      transition={{ type: 'spring', stiffness: 120, damping: 18 }}
                    >
                      <circle
                        r={11}
                        fill={clusterColor(i, 0.2)}
                        stroke={CLUSTER_COLORS[i % CLUSTER_COLORS.length]}
                        strokeWidth={2.5}
                      />
                      <text
                        y={4}
                        textAnchor="middle"
                        fill="#fff"
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          fontFamily: 'JetBrains Mono, monospace',
                        }}
                      >
                        {i}
                      </text>
                    </motion.g>
                  )
                })}
              </svg>
            </div>

            {/* Metrics */}
            <div className="flex flex-col gap-3">
              <div className="rounded-xl bg-surface-800/80 p-3 ring-1 ring-white/5">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  Metrics
                </h3>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Metric
                    label="Inertia"
                    value={current.inertia.toFixed(1)}
                  />
                  <Metric
                    label="Δ centroid"
                    value={
                      step === 0 ? '—' : current.movement.toExponential(1)
                    }
                  />
                </div>
                <p className="mt-2 text-[10px] leading-snug text-zinc-600">
                  Inertia = Σ ‖x − μ<sub>c(x)</sub>‖². Lower is tighter
                  clusters.
                </p>
              </div>

              <div className="rounded-xl bg-surface-800/80 p-3 ring-1 ring-white/5">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  Cluster sizes
                </h3>
                <ul className="mt-2 space-y-1.5">
                  {sizes.map((n, i) => (
                    <li key={i} className="flex items-center gap-2 text-[11px]">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{
                          background:
                            CLUSTER_COLORS[i % CLUSTER_COLORS.length],
                        }}
                      />
                      <span className="w-10 font-mono text-zinc-400">C{i}</span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-700">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${(n / run.points.length) * 100}%`,
                            background:
                              CLUSTER_COLORS[i % CLUSTER_COLORS.length],
                          }}
                        />
                      </div>
                      <span className="w-8 text-right font-mono text-zinc-500">
                        {n}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-[10px] text-zinc-500">
                <div className="rounded-lg bg-surface-900/60 p-2 ring-1 ring-white/5">
                  <div className="text-zinc-600">1</div>
                  Assign
                </div>
                <div className="rounded-lg bg-surface-900/60 p-2 ring-1 ring-white/5">
                  <div className="text-zinc-600">2</div>
                  Update μ
                </div>
                <div className="rounded-lg bg-surface-900/60 p-2 ring-1 ring-white/5">
                  <div className="text-zinc-600">3</div>
                  Repeat
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      {!embed && (
      <aside
        data-export-ignore
        className="w-[300px] shrink-0 border-l border-white/5 bg-surface-900/60 backdrop-blur-sm"
      >
        <div className="flex h-full flex-col gap-5 overflow-y-auto p-4">
          <section>
            <SectionLabel>Playback</SectionLabel>
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={togglePlay}
                className={cn(
                  'flex h-10 flex-1 items-center justify-center gap-2 rounded-xl font-medium transition-all',
                  isPlaying
                    ? 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/40'
                    : 'bg-rose-500 text-white shadow-lg shadow-rose-500/25 hover:bg-rose-400',
                )}
              >
                {isPlaying ? (
                  <>
                    <Pause className="h-4 w-4" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" /> Run
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={stepOnce}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-700 text-zinc-300 ring-1 ring-white/5 hover:bg-surface-600"
              >
                <SkipForward className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={reset}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-700 text-zinc-300 ring-1 ring-white/5 hover:bg-surface-600"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3">
              <div className="mb-1 flex justify-between text-xs text-zinc-500">
                <span>Iteration</span>
                <span className="font-mono text-zinc-300">
                  {step} / {run.steps.length - 1}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={run.steps.length - 1}
                value={step}
                onChange={(e) => setStep(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <Slider
              label="Speed"
              value={speed}
              min={0.5}
              max={8}
              step={0.5}
              display={`${speed} iter/s`}
              onChange={setSpeed}
            />
          </section>

          <section>
            <SectionLabel>Dataset</SectionLabel>
            <div className="mt-2 flex flex-col gap-1.5">
              {DATASETS.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDataset(d.id)}
                  className={cn(
                    'rounded-xl px-3 py-2.5 text-left transition ring-1',
                    config.dataset === d.id
                      ? 'bg-rose-500/15 ring-rose-500/40'
                      : 'bg-surface-800/50 ring-white/5 hover:bg-surface-700',
                  )}
                >
                  <div className="text-sm font-medium text-zinc-100">
                    {d.label}
                  </div>
                  <div className="mt-0.5 text-[11px] text-zinc-500">
                    {d.hint}
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section>
            <SectionLabel>Hyperparameters</SectionLabel>
            <Slider
              label="k (clusters)"
              value={config.k}
              min={2}
              max={8}
              step={1}
              display={String(config.k)}
              onChange={setK}
            />
            <Slider
              label="Max iterations"
              value={config.maxIter}
              min={5}
              max={30}
              step={1}
              display={String(config.maxIter)}
              onChange={setMaxIter}
            />
            <button
              type="button"
              onClick={reshuffle}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-surface-700 py-2.5 text-xs font-medium text-zinc-200 ring-1 ring-white/5 hover:bg-surface-600"
            >
              <Shuffle className="h-3.5 w-3.5" />
              New init (k-means++)
            </button>
          </section>

          <section className="rounded-xl bg-surface-800/50 p-3 ring-1 ring-white/5">
            <SectionLabel>Math</SectionLabel>
            <pre className="mt-2 overflow-x-auto font-mono text-[10px] leading-relaxed text-zinc-400">
{`assign:  c(x) = argmin_j ‖x−μⱼ‖²
update:  μⱼ = mean{ x : c(x)=j }
init:    k-means++`}
            </pre>
          </section>
        </div>
      </aside>
      )}
    </div>
  )
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
      {children}
    </h3>
  )
}

function Badge({
  children,
  tone = 'zinc',
}: {
  children: ReactNode
  tone?: 'zinc' | 'rose'
}) {
  const styles =
    tone === 'rose'
      ? 'bg-rose-500/10 text-rose-300 ring-rose-500/25'
      : 'bg-white/5 text-zinc-400 ring-white/10'
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[10px] font-medium ring-1 ${styles}`}
    >
      {children}
    </span>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface-900/80 px-2.5 py-2 ring-1 ring-white/5">
      <div className="text-[10px] uppercase tracking-wide text-zinc-500">
        {label}
      </div>
      <div className="mt-0.5 font-mono text-sm font-semibold text-rose-300">
        {value}
      </div>
    </div>
  )
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  display: string
  onChange: (v: number) => void
}) {
  return (
    <div className="mt-3">
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-zinc-400">{label}</span>
        <span className="font-mono text-zinc-300">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
    </div>
  )
}
