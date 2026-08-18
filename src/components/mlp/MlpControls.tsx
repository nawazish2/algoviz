import type { ReactNode } from 'react'
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Shuffle,
} from 'lucide-react'
import { useMlpStore } from '../../store/useMlpStore'
import { cn } from '../../lib/utils'
import type { MlpDataset } from '../../lib/mlp'

const DATASETS: { id: MlpDataset; label: string; hint: string }[] = [
  { id: 'xor', label: 'XOR corners', hint: 'Needs a hidden layer' },
  { id: 'moons', label: 'Two moons', hint: 'Curved decision boundary' },
  { id: 'blobs', label: 'Two blobs', hint: 'Almost linearly separable' },
]

export function MlpControls() {
  const config = useMlpStore((s) => s.config)
  const run = useMlpStore((s) => s.run)
  const step = useMlpStore((s) => s.step)
  const isPlaying = useMlpStore((s) => s.isPlaying)
  const speed = useMlpStore((s) => s.speed)
  const togglePlay = useMlpStore((s) => s.togglePlay)
  const stepOnce = useMlpStore((s) => s.stepOnce)
  const reset = useMlpStore((s) => s.reset)
  const setStep = useMlpStore((s) => s.setStep)
  const setSpeed = useMlpStore((s) => s.setSpeed)
  const setDataset = useMlpStore((s) => s.setDataset)
  const setHidden = useMlpStore((s) => s.setHidden)
  const setLr = useMlpStore((s) => s.setLr)
  const setEpochs = useMlpStore((s) => s.setEpochs)
  const reshuffle = useMlpStore((s) => s.reshuffle)

  const snap = run.epochs[step] ?? run.epochs[0]
  const last = run.epochs[run.epochs.length - 1]
  const max = run.epochs.length - 1

  return (
    <div className="flex h-full flex-col gap-5 overflow-y-auto p-4">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-sky-400/90">
          Backprop
        </p>
        <h2 className="mt-1 text-lg font-semibold text-white">Tiny MLP</h2>
        <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
          2 inputs → ReLU hidden → sigmoid. Full-batch GD. Watch the decision
          field and weights move as loss drops.
        </p>
      </div>

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
                : 'bg-sky-500 text-white shadow-lg shadow-sky-500/25 hover:bg-sky-400',
            )}
          >
            {isPlaying ? (
              <>
                <Pause className="h-4 w-4" /> Pause
              </>
            ) : (
              <>
                <Play className="h-4 w-4" /> Train
              </>
            )}
          </button>
          <button
            type="button"
            onClick={stepOnce}
            title="Step"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-700 text-zinc-300 ring-1 ring-white/5 hover:bg-surface-600"
          >
            <SkipForward className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={reset}
            title="Reset"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-700 text-zinc-300 ring-1 ring-white/5 hover:bg-surface-600"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-3">
          <div className="mb-1 flex justify-between text-xs text-zinc-500">
            <span>Epoch</span>
            <span className="font-mono text-zinc-300">
              {step} / {max}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={max}
            value={step}
            onChange={(e) => setStep(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <Slider
          label="Speed"
          value={speed}
          min={4}
          max={80}
          step={2}
          display={`${speed} ep/s`}
          onChange={setSpeed}
        />

        <div className="mt-3 grid grid-cols-2 gap-2">
          <Metric label="Loss" value={snap.loss.toFixed(3)} />
          <Metric
            label="Accuracy"
            value={`${Math.round(snap.accuracy * 100)}%`}
          />
        </div>
        {last && last.accuracy >= 0.9 && (
          <p className="mt-2 text-[10px] text-sky-400/80">
            Final run hits {Math.round(last.accuracy * 100)}% — XOR is solvable
            with a hidden layer.
          </p>
        )}
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
                  ? 'bg-sky-500/15 ring-sky-500/40'
                  : 'bg-surface-800/50 ring-white/5 hover:bg-surface-700',
              )}
            >
              <div className="text-sm font-medium text-zinc-100">{d.label}</div>
              <div className="mt-0.5 text-[11px] text-zinc-500">{d.hint}</div>
            </button>
          ))}
        </div>
      </section>

      <section>
        <SectionLabel>Hyperparameters</SectionLabel>
        <Slider
          label="Hidden units"
          value={config.hidden}
          min={2}
          max={12}
          step={1}
          display={String(config.hidden)}
          onChange={setHidden}
        />
        <Slider
          label="Learning rate η"
          value={config.lr}
          min={0.05}
          max={2}
          step={0.05}
          display={config.lr.toFixed(2)}
          onChange={setLr}
        />
        <Slider
          label="Epochs"
          value={config.epochs}
          min={40}
          max={360}
          step={10}
          display={String(config.epochs)}
          onChange={setEpochs}
        />
        <button
          type="button"
          onClick={reshuffle}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-surface-700 py-2.5 text-xs font-medium text-zinc-200 ring-1 ring-white/5 hover:bg-surface-600"
        >
          <Shuffle className="h-3.5 w-3.5" />
          New init + data
        </button>
      </section>

      <section className="rounded-xl bg-surface-800/50 p-3 ring-1 ring-white/5">
        <SectionLabel>Math</SectionLabel>
        <pre className="mt-2 overflow-x-auto font-mono text-[10px] leading-relaxed text-zinc-400">
{`h = ReLU(W₁x + b₁)
ŷ = σ(W₂h + b₂)
L = BCE(ŷ, y)
θ ← θ − η ∇θ L`}
        </pre>
      </section>
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
