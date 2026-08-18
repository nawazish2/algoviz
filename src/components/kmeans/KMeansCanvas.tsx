import { useMemo, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { CLUSTER_COLORS, clusterColor } from '../../lib/kmeans'
import { useKMeansStore } from '../../store/useKMeansStore'

const SIZE = 420
const PAD = 28
const DOMAIN = { min: -2.4, max: 2.4 }

function toPx(v: number, axis: 'x' | 'y') {
  const t = (v - DOMAIN.min) / (DOMAIN.max - DOMAIN.min)
  if (axis === 'x') return PAD + t * (SIZE - PAD * 2)
  return PAD + (1 - t) * (SIZE - PAD * 2)
}

export function KMeansCanvas() {
  const config = useKMeansStore((s) => s.config)
  const run = useKMeansStore((s) => s.run)
  const step = useKMeansStore((s) => s.step)
  const current = run.steps[step] ?? run.steps[0]

  const regions = useMemo(() => {
    if (!current) return null
    const res = 36
    const cells: { x: number; y: number; c: number }[] = []
    const cell = (SIZE - PAD * 2) / res
    for (let j = 0; j < res; j++) {
      for (let i = 0; i < res; i++) {
        const x = DOMAIN.min + ((i + 0.5) / res) * (DOMAIN.max - DOMAIN.min)
        const y = DOMAIN.max - ((j + 0.5) / res) * (DOMAIN.max - DOMAIN.min)
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

  const sizes = useMemo(() => {
    const s = new Array(config.k).fill(0)
    current?.assignments.forEach((a) => {
      s[a]++
    })
    return s
  }, [current, config.k])

  if (!current) return null

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
      <div className="rounded-2xl bg-surface-900/50 p-3 ring-1 ring-white/5">
        <svg
          width={SIZE}
          height={SIZE}
          className="mx-auto max-w-full"
          viewBox={`0 0 ${SIZE} ${SIZE}`}
        >
          {regions?.cells.map((cell, idx) => (
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

      <div className="flex flex-col gap-3">
        <div className="rounded-xl bg-surface-800/80 p-3 ring-1 ring-white/5">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Metrics
          </h3>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Metric label="Inertia" value={current.inertia.toFixed(1)} />
            <Metric
              label="Δ centroid"
              value={step === 0 ? '—' : current.movement.toExponential(1)}
            />
          </div>
          <p className="mt-2 text-[10px] leading-snug text-zinc-600">
            Inertia = Σ ‖x − μ<sub>c(x)</sub>‖². Lower is tighter clusters.
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
                    background: CLUSTER_COLORS[i % CLUSTER_COLORS.length],
                  }}
                />
                <span className="w-10 font-mono text-zinc-400">C{i}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-700">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(n / run.points.length) * 100}%`,
                      background: CLUSTER_COLORS[i % CLUSTER_COLORS.length],
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

export function KMeansBadge({
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
