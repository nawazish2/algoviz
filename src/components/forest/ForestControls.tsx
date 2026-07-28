import type { ReactNode } from 'react'
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Shuffle,
  Trees,
} from 'lucide-react'
import type { DatasetKind } from '../../lib/randomForest'
import { useForestStore } from '../../store/useForestStore'
import { cn } from '../../lib/utils'

const DATASETS: { id: DatasetKind; label: string; hint: string }[] = [
  { id: 'blobs', label: 'Gaussian blobs', hint: 'Linear-ish clusters' },
  { id: 'moons', label: 'Two moons', hint: 'Non-linear boundary' },
  { id: 'xor', label: 'XOR checker', hint: 'Axis-aligned challenge' },
]

export function ForestControls() {
  const config = useForestStore((s) => s.config)
  const timeline = useForestStore((s) => s.timeline)
  const growthStep = useForestStore((s) => s.growthStep)
  const isPlaying = useForestStore((s) => s.isPlaying)
  const speed = useForestStore((s) => s.speed)
  const forest = useForestStore((s) => s.forest)
  const completedTrees = useForestStore((s) => s.completedTrees)

  const togglePlay = useForestStore((s) => s.togglePlay)
  const resetGrowth = useForestStore((s) => s.resetGrowth)
  const stepOnce = useForestStore((s) => s.stepOnce)
  const setGrowthStep = useForestStore((s) => s.setGrowthStep)
  const setSpeed = useForestStore((s) => s.setSpeed)
  const setDataset = useForestStore((s) => s.setDataset)
  const setNTrees = useForestStore((s) => s.setNTrees)
  const setMaxDepth = useForestStore((s) => s.setMaxDepth)
  const setMinSamples = useForestStore((s) => s.setMinSamples)
  const setMaxFeatures = useForestStore((s) => s.setMaxFeatures)
  const setNClasses = useForestStore((s) => s.setNClasses)
  const reshuffle = useForestStore((s) => s.reshuffle)

  const done = completedTrees()
  const totalNodes = timeline.length

  return (
    <div className="flex h-full flex-col gap-5 overflow-y-auto p-4">
      {/* Playback */}
      <section>
        <SectionLabel>Growth playback</SectionLabel>
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={togglePlay}
            className={cn(
              'flex h-10 flex-1 items-center justify-center gap-2 rounded-xl font-medium transition-all',
              isPlaying
                ? 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/40'
                : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 hover:bg-emerald-400',
            )}
          >
            {isPlaying ? (
              <>
                <Pause className="h-4 w-4" /> Pause
              </>
            ) : (
              <>
                <Play className="h-4 w-4" /> Grow forest
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
            onClick={resetGrowth}
            title="Reset growth"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-700 text-zinc-300 ring-1 ring-white/5 hover:bg-surface-600"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-3">
          <div className="mb-1 flex justify-between text-xs text-zinc-500">
            <span>Nodes grown</span>
            <span className="font-mono text-zinc-300">
              {growthStep} / {totalNodes}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={Math.max(0, totalNodes)}
            value={growthStep}
            onChange={(e) => setGrowthStep(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <Slider
          label="Speed"
          value={speed}
          min={2}
          max={40}
          step={1}
          display={`${speed} nodes/s`}
          onChange={setSpeed}
        />

        <div className="mt-3 grid grid-cols-2 gap-2">
          <Metric label="Trees ready" value={`${done}/${forest.trees.length}`} />
          <Metric
            label="Train points"
            value={String(forest.data.length)}
          />
        </div>
      </section>

      {/* Dataset */}
      <section>
        <SectionLabel>Dataset</SectionLabel>
        <div className="mt-2 flex flex-col gap-1.5">
          {DATASETS.map((d) => {
            const active = config.dataset === d.id
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => setDataset(d.id)}
                className={cn(
                  'rounded-xl px-3 py-2.5 text-left transition ring-1',
                  active
                    ? 'bg-emerald-500/15 ring-emerald-500/40'
                    : 'bg-surface-800/50 ring-white/5 hover:bg-surface-700',
                )}
              >
                <div className="text-sm font-medium text-zinc-100">{d.label}</div>
                <div className="mt-0.5 text-[11px] text-zinc-500">{d.hint}</div>
              </button>
            )
          })}
        </div>

        <div className="mt-3">
          <p className="mb-1.5 text-xs text-zinc-400">Classes</p>
          <div className="grid grid-cols-2 gap-1.5">
            {([2, 3] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setNClasses(c)}
                disabled={config.dataset === 'moons' && c === 3}
                className={cn(
                  'rounded-xl py-2 text-xs font-medium ring-1 transition',
                  config.nClasses === c
                    ? 'bg-cyan-500/15 text-cyan-300 ring-cyan-500/40'
                    : 'bg-surface-800 text-zinc-400 ring-white/5 hover:bg-surface-700',
                  config.dataset === 'moons' && c === 3 && 'opacity-40',
                )}
              >
                {c} classes
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Hyperparameters */}
      <section>
        <SectionLabel>
          <span className="inline-flex items-center gap-1.5">
            <Trees className="h-3 w-3" /> Forest hyperparams
          </span>
        </SectionLabel>

        <Slider
          label="Number of trees"
          value={config.nTrees}
          min={1}
          max={12}
          step={1}
          display={String(config.nTrees)}
          onChange={setNTrees}
        />
        <Slider
          label="Max depth"
          value={config.maxDepth}
          min={1}
          max={7}
          step={1}
          display={String(config.maxDepth)}
          onChange={setMaxDepth}
        />
        <Slider
          label="Min samples to split"
          value={config.minSamplesSplit}
          min={2}
          max={16}
          step={1}
          display={String(config.minSamplesSplit)}
          onChange={setMinSamples}
        />

        <div className="mt-4">
          <p className="mb-1.5 text-xs text-zinc-400">Features per split</p>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => setMaxFeatures(1)}
              className={cn(
                'rounded-xl py-2 text-xs font-medium ring-1 transition',
                config.maxFeatures === 1
                  ? 'bg-amber-500/15 text-amber-300 ring-amber-500/40'
                  : 'bg-surface-800 text-zinc-400 ring-white/5 hover:bg-surface-700',
              )}
            >
              1 (random)
            </button>
            <button
              type="button"
              onClick={() => setMaxFeatures(2)}
              className={cn(
                'rounded-xl py-2 text-xs font-medium ring-1 transition',
                config.maxFeatures === 2
                  ? 'bg-amber-500/15 text-amber-300 ring-amber-500/40'
                  : 'bg-surface-800 text-zinc-400 ring-white/5 hover:bg-surface-700',
              )}
            >
              2 (both)
            </button>
          </div>
          <p className="mt-1.5 text-[10px] leading-snug text-zinc-600">
            Classic RF samples a feature subset at each split — here x and/or y.
          </p>
        </div>

        <button
          type="button"
          onClick={reshuffle}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-surface-700 py-2.5 text-xs font-medium text-zinc-200 ring-1 ring-white/5 hover:bg-surface-600"
        >
          <Shuffle className="h-3.5 w-3.5" />
          New data + bootstrap
        </button>
      </section>

      {/* Explain */}
      <section className="rounded-xl bg-surface-800/50 p-3 ring-1 ring-white/5">
        <SectionLabel>How it works</SectionLabel>
        <ol className="mt-2 space-y-2 text-[11px] leading-relaxed text-zinc-500">
          <li>
            <span className="text-emerald-400">1.</span> Bootstrap sample the
            training set for each tree.
          </li>
          <li>
            <span className="text-emerald-400">2.</span> Grow a Gini decision
            tree; optional random feature subset per split.
          </li>
          <li>
            <span className="text-emerald-400">3.</span> Ensemble votes — majority
            class across trees wins.
          </li>
        </ol>
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
      <div className="mt-0.5 font-mono text-sm font-semibold text-emerald-300">
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
