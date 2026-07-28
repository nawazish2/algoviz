import {
  SURFACES,
  type OptimizerKind,
  type SurfaceKind,
  type Vec2,
} from '../../lib/gradientDescent'
import { useVisualizerStore } from '../../store/useVisualizerStore'
import { cn } from '../../lib/utils'

const SURFACE_OPTIONS = Object.values(SURFACES)

const OPTIMIZERS: {
  id: OptimizerKind
  name: string
  formula: string
}[] = [
  { id: 'gd', name: 'Vanilla GD', formula: 'θ ← θ − η ∇f' },
  { id: 'momentum', name: 'Momentum', formula: 'v ← βv + ∇f ; θ ← θ − ηv' },
  { id: 'adam', name: 'Adam', formula: 'Adaptive moments' },
]

interface ControlsProps {
  loss: number
  step: number
  totalSteps: number
  pos: Vec2
}

export function Controls({ loss, step, totalSteps, pos }: ControlsProps) {
  const surface = useVisualizerStore((s) => s.surface)
  const optimizer = useVisualizerStore((s) => s.optimizer)
  const learningRate = useVisualizerStore((s) => s.learningRate)
  const momentum = useVisualizerStore((s) => s.momentum)
  const speed = useVisualizerStore((s) => s.speed)
  const maxSteps = useVisualizerStore((s) => s.maxSteps)
  const startPos = useVisualizerStore((s) => s.startPos)
  const isPlaying = useVisualizerStore((s) => s.isPlaying)

  const setSurface = useVisualizerStore((s) => s.setSurface)
  const setOptimizer = useVisualizerStore((s) => s.setOptimizer)
  const setLearningRate = useVisualizerStore((s) => s.setLearningRate)
  const setMomentum = useVisualizerStore((s) => s.setMomentum)
  const setSpeed = useVisualizerStore((s) => s.setSpeed)
  const setMaxSteps = useVisualizerStore((s) => s.setMaxSteps)
  const setStartPos = useVisualizerStore((s) => s.setStartPos)
  const setCurrentStep = useVisualizerStore((s) => s.setCurrentStep)
  const togglePlay = useVisualizerStore((s) => s.togglePlay)
  const setIsPlaying = useVisualizerStore((s) => s.setIsPlaying)
  const reset = useVisualizerStore((s) => s.reset)
  const randomizeStart = useVisualizerStore((s) => s.randomizeStart)

  const surfaceDef = SURFACES[surface]
  const progress = totalSteps > 1 ? step / (totalSteps - 1) : 0

  return (
    <div className="flex h-full flex-col gap-5 overflow-y-auto p-5">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-indigo-400/90">
          Phase 1
        </p>
        <h2 className="mt-1 text-lg font-semibold text-white">
          Gradient Descent
        </h2>
        <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
          Watch optimizers navigate a 3D loss surface. Tweak η, switch
          algorithms, drop a new start — the path recomputes instantly.
        </p>
      </div>

      {/* Transport */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => togglePlay()}
          className={cn(
            'flex h-10 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition',
            isPlaying
              ? 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/30 hover:bg-amber-500/25'
              : 'bg-indigo-500/20 text-indigo-200 ring-1 ring-indigo-400/30 hover:bg-indigo-500/30',
          )}
        >
          {isPlaying ? (
            <>
              <PauseIcon /> Pause
            </>
          ) : (
            <>
              <PlayIcon /> Play
            </>
          )}
        </button>
        <button
          type="button"
          onClick={() => {
            setIsPlaying(false)
            setCurrentStep(Math.min(step + 1, totalSteps - 1))
          }}
          disabled={isPlaying || step >= totalSteps - 1}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-zinc-300 ring-1 ring-white/10 transition hover:bg-white/10 disabled:opacity-40"
          title="Single step"
        >
          <StepIcon />
        </button>
        <button
          type="button"
          onClick={() => reset()}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-zinc-300 ring-1 ring-white/10 transition hover:bg-white/10"
          title="Reset"
        >
          <ResetIcon />
        </button>
      </div>

      {/* Progress scrubber */}
      <div>
        <div className="mb-1.5 flex items-baseline justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Path
          </span>
          <span className="font-mono text-[11px] text-indigo-300">
            {step}/{totalSteps - 1}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={Math.max(0, totalSteps - 1)}
          step={1}
          value={step}
          onChange={(e) => {
            setIsPlaying(false)
            setCurrentStep(Number(e.target.value))
          }}
          className="w-full"
        />
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-700">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-[width] duration-100"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      {/* Live stats */}
      <div className="grid grid-cols-2 gap-2">
        <Stat label="Loss" value={formatLoss(loss)} mono accent="amber" />
        <Stat label="Step" value={String(step)} mono />
        <Stat label="θx" value={pos.x.toFixed(4)} mono accent="cyan" />
        <Stat label="θy" value={pos.y.toFixed(4)} mono accent="cyan" />
      </div>

      {/* Surface */}
      <Section title="Loss Surface">
        <div className="grid grid-cols-2 gap-1.5">
          {SURFACE_OPTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSurface(s.id as SurfaceKind)}
              className={cn(
                'rounded-lg px-2.5 py-2 text-left text-xs transition ring-1',
                surface === s.id
                  ? 'bg-indigo-500/20 text-indigo-100 ring-indigo-400/40'
                  : 'bg-white/[0.03] text-zinc-400 ring-white/5 hover:bg-white/[0.06] hover:text-zinc-200',
              )}
            >
              {s.name}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-zinc-500">
          {surfaceDef.description}
        </p>
      </Section>

      {/* Optimizer */}
      <Section title="Optimizer">
        <div className="flex flex-col gap-1.5">
          {OPTIMIZERS.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => setOptimizer(o.id)}
              className={cn(
                'rounded-lg px-3 py-2.5 text-left transition ring-1',
                optimizer === o.id
                  ? 'bg-cyan-500/10 ring-cyan-400/40'
                  : 'bg-white/[0.03] ring-white/5 hover:bg-white/[0.06]',
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    'text-xs font-medium',
                    optimizer === o.id ? 'text-cyan-200' : 'text-zinc-300',
                  )}
                >
                  {o.name}
                </span>
                {optimizer === o.id && (
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                )}
              </div>
              <p className="mt-0.5 font-mono text-[10px] text-zinc-500">
                {o.formula}
              </p>
            </button>
          ))}
        </div>
      </Section>

      {/* Learning rate */}
      <Section title="Learning Rate η" value={learningRate.toFixed(4)}>
        <input
          type="range"
          min={0.0005}
          max={0.3}
          step={0.0005}
          value={learningRate}
          onChange={(e) => setLearningRate(Number(e.target.value))}
          className="w-full"
        />
        <div className="mt-1 flex justify-between text-[10px] text-zinc-600">
          <span>0.0005</span>
          <span>0.3</span>
        </div>
      </Section>

      {/* Momentum / β1 */}
      {(optimizer === 'momentum' || optimizer === 'adam') && (
        <Section
          title={optimizer === 'adam' ? 'Adam β₁' : 'Momentum β'}
          value={momentum.toFixed(2)}
        >
          <input
            type="range"
            min={0}
            max={0.99}
            step={0.01}
            value={momentum}
            onChange={(e) => setMomentum(Number(e.target.value))}
            className="w-full"
          />
        </Section>
      )}

      {/* Speed */}
      <Section title="Animation Speed" value={`${speed} steps/s`}>
        <input
          type="range"
          min={1}
          max={60}
          step={1}
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
          className="w-full"
        />
      </Section>

      {/* Max steps */}
      <Section title="Max Steps" value={String(maxSteps)}>
        <input
          type="range"
          min={50}
          max={500}
          step={10}
          value={maxSteps}
          onChange={(e) => setMaxSteps(Number(e.target.value))}
          className="w-full"
        />
      </Section>

      {/* Start position */}
      <Section title="Start Position">
        <div className="grid grid-cols-2 gap-2">
          <NumberField
            label="x₀"
            value={startPos.x}
            min={surfaceDef.domain.min}
            max={surfaceDef.domain.max}
            onChange={(x) => setStartPos({ ...startPos, x })}
          />
          <NumberField
            label="y₀"
            value={startPos.y}
            min={surfaceDef.domain.min}
            max={surfaceDef.domain.max}
            onChange={(y) => setStartPos({ ...startPos, y })}
          />
        </div>
        <button
          type="button"
          onClick={() => randomizeStart()}
          className="mt-2 w-full rounded-lg bg-white/[0.04] py-2 text-xs font-medium text-zinc-300 ring-1 ring-white/10 transition hover:bg-white/[0.08]"
        >
          Randomize start
        </button>
      </Section>
    </div>
  )
}

function Section({
  title,
  value,
  children,
}: {
  title: string
  value?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
          {title}
        </h3>
        {value && (
          <span className="font-mono text-[11px] text-indigo-300/90">
            {value}
          </span>
        )}
      </div>
      {children}
    </div>
  )
}

function Stat({
  label,
  value,
  mono,
  accent,
  sub,
}: {
  label: string
  value: string
  mono?: boolean
  accent?: 'amber' | 'cyan'
  sub?: string
}) {
  return (
    <div className="rounded-xl bg-white/[0.03] px-3 py-2 ring-1 ring-white/5">
      <p className="text-[10px] uppercase tracking-wider text-zinc-500">
        {label}
      </p>
      <p
        className={cn(
          'mt-0.5 text-sm font-medium',
          mono && 'font-mono',
          accent === 'amber' && 'text-amber-300',
          accent === 'cyan' && 'text-cyan-300',
          !accent && 'text-zinc-200',
        )}
      >
        {value}
      </p>
      {sub && <p className="text-[10px] text-zinc-600">{sub}</p>}
    </div>
  )
}

function NumberField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (v: number) => void
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] text-zinc-500">{label}</span>
      <input
        type="number"
        value={Number(value.toFixed(3))}
        min={min}
        max={max}
        step={0.1}
        onChange={(e) => onChange(Number(e.target.value))}
        className="rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 font-mono text-xs text-zinc-200 outline-none focus:border-indigo-500/40"
      />
    </label>
  )
}

function formatLoss(n: number): string {
  if (!Number.isFinite(n)) return '∞'
  if (Math.abs(n) >= 1000) return n.toExponential(2)
  if (Math.abs(n) < 0.001 && n !== 0) return n.toExponential(2)
  return n.toFixed(4)
}

function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}
function PauseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 5h4v14H6zm8 0h4v14h-4z" />
    </svg>
  )
}
function StepIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 5v14l8-7-8-7zm10 0h2v14h-2z" />
    </svg>
  )
}
function ResetIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
    </svg>
  )
}
