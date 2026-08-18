import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import {
  CLASS_COLORS,
  classColor,
  predictProba,
  type MlpWeights,
} from '../../lib/mlp'
import { useMlpStore } from '../../store/useMlpStore'
import { useUiStore } from '../../store/useUiStore'
import { MlpControls } from './MlpControls'
import { GlossaryChip } from '../layout/GlossaryChip'

const SIZE = 420
const PAD = 28
const DOMAIN = { min: -2.2, max: 2.2 }
const GRID = 36

function toPx(v: number, axis: 'x' | 'y') {
  const t = (v - DOMAIN.min) / (DOMAIN.max - DOMAIN.min)
  if (axis === 'x') return PAD + t * (SIZE - PAD * 2)
  return PAD + (1 - t) * (SIZE - PAD * 2)
}

export function MlpView() {
  const config = useMlpStore((s) => s.config)
  const run = useMlpStore((s) => s.run)
  const step = useMlpStore((s) => s.step)
  const isPlaying = useMlpStore((s) => s.isPlaying)
  const speed = useMlpStore((s) => s.speed)
  const setStep = useMlpStore((s) => s.setStep)
  const setIsPlaying = useMlpStore((s) => s.setIsPlaying)
  const embed = useUiStore((s) => s.embed)
  const difficulty = useUiStore((s) => s.difficulty)

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
    const max = run.epochs.length - 1

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
  }, [isPlaying, speed, run.epochs.length, setStep, setIsPlaying])

  const snap = run.epochs[step] ?? run.epochs[0]

  const cells = useMemo(() => {
    if (!snap) return []
    const out: { x: number; y: number; p: number }[] = []
    const cell = (SIZE - PAD * 2) / GRID
    for (let j = 0; j < GRID; j++) {
      for (let i = 0; i < GRID; i++) {
        const x = DOMAIN.min + ((i + 0.5) / GRID) * (DOMAIN.max - DOMAIN.min)
        const y = DOMAIN.max - ((j + 0.5) / GRID) * (DOMAIN.max - DOMAIN.min)
        out.push({
          x: PAD + i * cell,
          y: PAD + j * cell,
          p: predictProba(snap.weights, x, y),
        })
      }
    }
    return { out, cell }
  }, [snap])

  const losses = useMemo(() => run.epochs.map((e) => e.loss), [run])

  return (
    <div className="flex h-full min-h-0 flex-1">
      <div className="relative flex min-w-0 flex-1 flex-col overflow-y-auto">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-16 top-16 h-72 w-72 rounded-full bg-sky-600/10 blur-3xl" />
          <div className="absolute bottom-10 right-16 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col gap-5 p-5 pb-8">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap items-start justify-between gap-3"
          >
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-sky-300">
                Tiny multilayer perceptron
              </div>
              <h2 className="mt-0.5 text-xl font-semibold text-white">
                Forward, loss, nudge the weights
              </h2>
              <p className="mt-1 max-w-xl text-xs leading-relaxed text-zinc-400">
                Guess with the current weights, measure error, walk downhill.
                Hidden units let the net fold XOR into something linearly
                separable.
              </p>
              {difficulty === 'beginner' && (
                <div className="mt-2 flex flex-wrap gap-1">
                  <GlossaryChip termId="backprop" compact />
                  <GlossaryChip termId="activation" compact />
                  <GlossaryChip termId="hidden-layer" compact />
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge>{config.dataset}</Badge>
              <Badge>
                2 → {config.hidden} → 1
              </Badge>
              <Badge tone="sky">
                {Math.round(snap.accuracy * 100)}% acc
              </Badge>
            </div>
          </motion.div>

          <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
            <div className="rounded-2xl bg-surface-900/50 p-3 ring-1 ring-white/5">
              <svg
                width={SIZE}
                height={SIZE}
                className="mx-auto max-w-full"
                viewBox={`0 0 ${SIZE} ${SIZE}`}
              >
                {cells &&
                  'out' in cells &&
                  cells.out.map((c, idx) => (
                    <rect
                      key={idx}
                      x={c.x}
                      y={c.y}
                      width={cells.cell + 0.5}
                      height={cells.cell + 0.5}
                      fill={classColor(c.p >= 0.5 ? 1 : 0, 0.08 + Math.abs(c.p - 0.5) * 0.35)}
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
                {run.points.map((p, i) => (
                  <circle
                    key={i}
                    cx={toPx(p.x, 'x')}
                    cy={toPx(p.y, 'y')}
                    r={4}
                    fill={CLASS_COLORS[p.label]}
                    opacity={0.9}
                    stroke="rgba(0,0,0,0.4)"
                    strokeWidth={0.6}
                  />
                ))}
              </svg>
              <div className="mt-2 flex justify-center gap-4 text-[10px] text-zinc-500">
                <span className="flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: CLASS_COLORS[0] }}
                  />
                  class 0
                </span>
                <span className="flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: CLASS_COLORS[1] }}
                  />
                  class 1
                </span>
                <span>field = P(class 1)</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="rounded-xl bg-surface-800/80 p-3 ring-1 ring-white/5">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  Metrics
                </h3>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Metric label="Loss" value={snap.loss.toFixed(3)} />
                  <Metric
                    label="‖∇‖"
                    value={step === 0 ? '—' : snap.gradNorm.toFixed(2)}
                  />
                </div>
                <LossSpark losses={losses} step={step} />
              </div>

              <NetworkGraph weights={snap.weights} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <InfoCard
              step="1"
              title="Forward"
              body="Each hidden unit is ReLU(w·x + b). The output is a sigmoid probability."
            />
            <InfoCard
              step="2"
              title="Loss"
              body="Binary cross-entropy: how surprised is the net by the true label?"
            />
            <InfoCard
              step="3"
              title="Backward"
              body="Chain rule sends the error to every weight. Subtract η times that gradient."
            />
          </div>
        </div>
      </div>

      {!embed && (
        <aside
          data-export-ignore
          className="w-[300px] shrink-0 border-l border-white/5 bg-surface-900/60 backdrop-blur-sm"
        >
          <MlpControls />
        </aside>
      )}
    </div>
  )
}

function NetworkGraph({ weights }: { weights: MlpWeights }) {
  const hidden = weights.W1.length
  const W = 248
  const H = Math.max(168, 28 + hidden * 22)
  const xIn = 28
  const xHid = 124
  const xOut = 220
  const yAt = (i: number, n: number) => 20 + ((H - 40) * (i + 0.5)) / n

  const maxAbs = Math.max(
    0.15,
    ...weights.W1.flatMap((row) => row.map((v) => Math.abs(v))),
    ...weights.W2.map((v) => Math.abs(v)),
  )

  const edge = (v: number) => {
    const t = Math.min(1, Math.abs(v) / maxAbs)
    return {
      stroke: v >= 0 ? '#38bdf8' : '#f472b6',
      strokeWidth: 0.8 + t * 3.2,
      opacity: 0.25 + t * 0.7,
    }
  }

  return (
    <div className="rounded-xl bg-surface-800/80 p-3 ring-1 ring-white/5">
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
        Weights
      </h3>
      <p className="mt-0.5 text-[10px] text-zinc-600">
        Thickness ∝ |w| · sky +, pink −
      </p>
      <svg width={W} height={H} className="mt-2 max-w-full">
        {weights.W1.map((row, i) =>
          row.map((v, j) => {
            const s = edge(v)
            return (
              <line
                key={`in-${j}-${i}`}
                x1={xIn}
                y1={yAt(j, 2)}
                x2={xHid}
                y2={yAt(i, hidden)}
                stroke={s.stroke}
                strokeWidth={s.strokeWidth}
                opacity={s.opacity}
              />
            )
          }),
        )}
        {weights.W2.map((v, i) => {
          const s = edge(v)
          return (
            <line
              key={`out-${i}`}
              x1={xHid}
              y1={yAt(i, hidden)}
              x2={xOut}
              y2={yAt(0, 1)}
              stroke={s.stroke}
              strokeWidth={s.strokeWidth}
              opacity={s.opacity}
            />
          )
        })}
        {['x', 'y'].map((label, i) => (
          <g key={label}>
            <circle
              cx={xIn}
              cy={yAt(i, 2)}
              r={9}
              fill="#0c0c12"
              stroke="#64748b"
              strokeWidth={1.4}
            />
            <text
              x={xIn}
              y={yAt(i, 2) + 3.5}
              textAnchor="middle"
              fill="#cbd5e1"
              style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }}
            >
              {label}
            </text>
          </g>
        ))}
        {weights.W1.map((_, i) => (
          <g key={`h-${i}`}>
            <circle
              cx={xHid}
              cy={yAt(i, hidden)}
              r={8}
              fill="#0c0c12"
              stroke="#38bdf8"
              strokeWidth={1.4}
            />
            <text
              x={xHid}
              y={yAt(i, hidden) + 3}
              textAnchor="middle"
              fill="#7dd3fc"
              style={{ fontSize: 8, fontFamily: 'JetBrains Mono, monospace' }}
            >
              h{i}
            </text>
          </g>
        ))}
        <circle
          cx={xOut}
          cy={yAt(0, 1)}
          r={10}
          fill="#0c0c12"
          stroke="#f472b6"
          strokeWidth={1.5}
        />
        <text
          x={xOut}
          y={yAt(0, 1) + 3.5}
          textAnchor="middle"
          fill="#f9a8d4"
          style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }}
        >
          ŷ
        </text>
      </svg>
    </div>
  )
}

function LossSpark({ losses, step }: { losses: number[]; step: number }) {
  const w = 220
  const h = 48
  const max = Math.max(...losses, 1e-6)
  const pts = losses
    .map((v, i) => {
      const x = (i / Math.max(1, losses.length - 1)) * w
      const y = h - 6 - (v / max) * (h - 12)
      return `${x},${y}`
    })
    .join(' ')
  const cx = (step / Math.max(1, losses.length - 1)) * w
  const cy =
    h - 6 - ((losses[step] ?? losses[0] ?? 0) / max) * (h - 12)

  return (
    <div className="mt-3">
      <div className="mb-1 text-[10px] uppercase tracking-wide text-zinc-500">
        Loss over epochs
      </div>
      <svg width={w} height={h} className="max-w-full">
        <polyline
          points={pts}
          fill="none"
          stroke="#38bdf8"
          strokeWidth={1.5}
          opacity={0.85}
        />
        <circle cx={cx} cy={cy} r={3} fill="#fbbf24" />
      </svg>
    </div>
  )
}

function Badge({
  children,
  tone = 'zinc',
}: {
  children: ReactNode
  tone?: 'zinc' | 'sky'
}) {
  const styles =
    tone === 'sky'
      ? 'bg-sky-500/10 text-sky-300 ring-sky-500/25'
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
      <div className="mt-0.5 font-mono text-sm font-semibold text-sky-300">
        {value}
      </div>
    </div>
  )
}

function InfoCard({
  step,
  title,
  body,
}: {
  step: string
  title: string
  body: string
}) {
  return (
    <div className="rounded-xl bg-surface-900/40 p-3 ring-1 ring-white/5">
      <div className="flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-sky-500/20 font-mono text-[10px] text-sky-300">
          {step}
        </span>
        <h4 className="text-xs font-semibold text-zinc-200">{title}</h4>
      </div>
      <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-500">{body}</p>
    </div>
  )
}
