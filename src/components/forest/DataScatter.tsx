import { useMemo } from 'react'
import {
  CLASS_COLORS,
  decisionGrid,
  predictForest,
  type Forest,
  type Sample,
} from '../../lib/randomForest'
import { cn } from '../../lib/utils'

const SIZE = 320
const PAD = 16
const DOMAIN = { min: -2.2, max: 2.2 }

function toPx(v: number, axis: 'x' | 'y') {
  const t = (v - DOMAIN.min) / (DOMAIN.max - DOMAIN.min)
  if (axis === 'x') return PAD + t * (SIZE - PAD * 2)
  return PAD + (1 - t) * (SIZE - PAD * 2)
}

interface DataScatterProps {
  forest: Forest
  /** Number of fully-available trees for ensemble boundary */
  treesReady: number
  selectedSample: number | null
  probe: Sample | null
  onSelectSample: (i: number | null) => void
  onProbe: (s: Sample | null) => void
}

export function DataScatter({
  forest,
  treesReady,
  selectedSample,
  probe,
  onSelectSample,
  onProbe,
}: DataScatterProps) {
  const grid = useMemo(() => {
    if (treesReady <= 0) return null
    return decisionGrid(forest, treesReady, 40, DOMAIN)
  }, [forest, treesReady])

  const cell = (SIZE - PAD * 2) / (grid?.resolution ?? 40)

  return (
    <div className="rounded-2xl bg-surface-900/50 p-3 ring-1 ring-white/5">
      <div className="mb-2 flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold text-white">Feature space</h3>
        <span className="text-[10px] text-zinc-500">
          {treesReady > 0
            ? `Boundary · ${treesReady} tree${treesReady === 1 ? '' : 's'}`
            : 'Grow trees to paint regions'}
        </span>
      </div>

      <svg
        width={SIZE}
        height={SIZE}
        className="mx-auto max-w-full touch-none"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          const px = e.clientX - rect.left
          const py = e.clientY - rect.top
          const scaleX = SIZE / rect.width
          const scaleY = SIZE / rect.height
          const sx = px * scaleX
          const sy = py * scaleY
          if (
            sx < PAD ||
            sy < PAD ||
            sx > SIZE - PAD ||
            sy > SIZE - PAD
          ) {
            return
          }
          const x =
            DOMAIN.min +
            ((sx - PAD) / (SIZE - PAD * 2)) * (DOMAIN.max - DOMAIN.min)
          const y =
            DOMAIN.max -
            ((sy - PAD) / (SIZE - PAD * 2)) * (DOMAIN.max - DOMAIN.min)
          onProbe({ x, y, label: 0 })
          onSelectSample(null)
        }}
      >
        {/* Decision regions */}
        {grid &&
          grid.labels.map((label, idx) => {
            const res = grid.resolution
            const i = idx % res
            const j = Math.floor(idx / res)
            const x = PAD + i * cell
            const y = PAD + j * cell
            return (
              <rect
                key={idx}
                x={x}
                y={y}
                width={cell + 0.5}
                height={cell + 0.5}
                fill={CLASS_COLORS[label].fill}
                opacity={0.14}
              />
            )
          })}

        {/* Axes frame */}
        <rect
          x={PAD}
          y={PAD}
          width={SIZE - PAD * 2}
          height={SIZE - PAD * 2}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          rx={8}
        />

        {/* Data points */}
        {forest.data.map((s, i) => {
          const active = selectedSample === i
          const c = CLASS_COLORS[s.label]
          return (
            <circle
              key={i}
              cx={toPx(s.x, 'x')}
              cy={toPx(s.y, 'y')}
              r={active ? 6 : 3.5}
              fill={c.fill}
              stroke={active ? '#fff' : 'rgba(0,0,0,0.35)'}
              strokeWidth={active ? 1.5 : 0.5}
              opacity={active ? 1 : 0.85}
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation()
                onSelectSample(selectedSample === i ? null : i)
              }}
            />
          )
        })}

        {/* Probe marker */}
        {probe && (
          <g>
            <circle
              cx={toPx(probe.x, 'x')}
              cy={toPx(probe.y, 'y')}
              r={8}
              fill="none"
              stroke="#fff"
              strokeWidth={1.5}
              strokeDasharray="3 2"
            />
            <circle
              cx={toPx(probe.x, 'x')}
              cy={toPx(probe.y, 'y')}
              r={3}
              fill="#fff"
            />
          </g>
        )}
      </svg>

      <div className="mt-2 flex flex-wrap items-center justify-center gap-3 text-[10px] text-zinc-500">
        {CLASS_COLORS.slice(0, forest.nClasses).map((c, i) => (
          <span key={i} className="inline-flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: c.fill }}
            />
            {c.name}
          </span>
        ))}
        <span className="text-zinc-600">· click point or empty space</span>
      </div>
    </div>
  )
}

export function VotePanel({
  forest,
  treesReady,
  sample,
  label,
}: {
  forest: Forest
  treesReady: number
  sample: Sample | null
  label?: string
}) {
  if (!sample || treesReady <= 0) {
    return (
      <div className="rounded-xl bg-surface-800/50 p-3 ring-1 ring-white/5">
        <p className="text-[11px] leading-relaxed text-zinc-500">
          Select a training point or click the feature space to probe ensemble
          votes.
        </p>
      </div>
    )
  }

  const { votes, prediction } = predictForest(forest, sample, treesReady)
  const total = votes.reduce((a, b) => a + b, 0) || 1

  return (
    <div className="rounded-xl bg-surface-800/80 p-3 ring-1 ring-white/5">
      <div className="flex items-center justify-between">
        <h4 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
          Ensemble votes
        </h4>
        {label && (
          <span className="font-mono text-[10px] text-zinc-500">{label}</span>
        )}
      </div>
      <p className="mt-1 font-mono text-[11px] text-zinc-400">
        ({sample.x.toFixed(2)}, {sample.y.toFixed(2)})
      </p>
      <ul className="mt-3 space-y-2">
        {votes.map((v, i) => {
          if (i >= forest.nClasses) return null
          const pct = v / total
          const win = i === prediction
          return (
            <li key={i} className="flex items-center gap-2 text-[11px]">
              <span
                className={cn(
                  'w-14 font-mono',
                  win ? 'text-white' : 'text-zinc-400',
                )}
              >
                C{i}
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-700">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${pct * 100}%`,
                    background: CLASS_COLORS[i].fill,
                  }}
                />
              </div>
              <span className="w-10 text-right font-mono text-zinc-500">
                {v}/{total}
              </span>
            </li>
          )
        })}
      </ul>
      <p className="mt-3 text-[11px] text-zinc-400">
        Prediction:{' '}
        <span
          className="font-semibold"
          style={{ color: CLASS_COLORS[prediction].fill }}
        >
          Class {prediction}
        </span>
        {sample.label !== undefined && (
          <span className="text-zinc-600">
            {' '}
            · true label {sample.label}
          </span>
        )}
      </p>
    </div>
  )
}
