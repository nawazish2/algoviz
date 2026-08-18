import type { ReactNode } from 'react'
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Shuffle,
} from 'lucide-react'
import { type DatasetKind } from '../../lib/kmeans'
import { useKMeansStore } from '../../store/useKMeansStore'
import { cn } from '../../lib/utils'

const DATASETS: { id: DatasetKind; label: string; hint: string }[] = [
  { id: 'blobs', label: 'Gaussian blobs', hint: 'Natural clusters' },
  { id: 'moons', label: 'Two moons', hint: 'Non-convex shapes' },
  { id: 'xor', label: 'Uniform cloud', hint: 'No clear structure' },
]

export function KMeansControls() {
  const config = useKMeansStore((s) => s.config)
  const run = useKMeansStore((s) => s.run)
  const step = useKMeansStore((s) => s.step)
  const isPlaying = useKMeansStore((s) => s.isPlaying)
  const speed = useKMeansStore((s) => s.speed)
  const setStep = useKMeansStore((s) => s.setStep)
  const togglePlay = useKMeansStore((s) => s.togglePlay)
  const setSpeed = useKMeansStore((s) => s.setSpeed)
  const reset = useKMeansStore((s) => s.reset)
  const stepOnce = useKMeansStore((s) => s.stepOnce)
  const setK = useKMeansStore((s) => s.setK)
  const setDataset = useKMeansStore((s) => s.setDataset)
  const setMaxIter = useKMeansStore((s) => s.setMaxIter)
  const reshuffle = useKMeansStore((s) => s.reshuffle)

  return (
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
              <div className="text-sm font-medium text-zinc-100">{d.label}</div>
              <div className="mt-0.5 text-[11px] text-zinc-500">{d.hint}</div>
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
  )
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
      {children}
    </h3>
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
