import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { useForestStore } from '../../store/useForestStore'
import { useUiStore } from '../../store/useUiStore'
import { TreeCanvas, ForestOverview } from './TreeCanvas'
import { DataScatter, VotePanel } from './DataScatter'
import { ForestControls } from './ForestControls'

export function ForestView() {
  const forest = useForestStore((s) => s.forest)
  const config = useForestStore((s) => s.config)
  const growthStep = useForestStore((s) => s.growthStep)
  const timeline = useForestStore((s) => s.timeline)
  const isPlaying = useForestStore((s) => s.isPlaying)
  const speed = useForestStore((s) => s.speed)
  const focusTree = useForestStore((s) => s.focusTree)
  const selectedSample = useForestStore((s) => s.selectedSample)
  const probe = useForestStore((s) => s.probe)

  const setGrowthStep = useForestStore((s) => s.setGrowthStep)
  const setIsPlaying = useForestStore((s) => s.setIsPlaying)
  const setFocusTree = useForestStore((s) => s.setFocusTree)
  const setSelectedSample = useForestStore((s) => s.setSelectedSample)
  const setProbe = useForestStore((s) => s.setProbe)
  const visibleForTree = useForestStore((s) => s.visibleForTree)
  const completedTrees = useForestStore((s) => s.completedTrees)
  const embed = useUiStore((s) => s.embed)

  // Playback loop
  const accum = useRef(0)
  const stepRef = useRef(growthStep)
  stepRef.current = growthStep

  useEffect(() => {
    if (!isPlaying) {
      accum.current = 0
      return
    }
    let raf = 0
    let last = performance.now()
    const max = timeline.length

    const tick = (now: number) => {
      const dt = (now - last) / 1000
      last = now
      accum.current += dt * speed
      if (accum.current >= 1) {
        const advance = Math.floor(accum.current)
        accum.current -= advance
        const next = Math.min(max, stepRef.current + advance)
        setGrowthStep(next)
        if (next >= max) setIsPlaying(false)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [isPlaying, speed, timeline.length, setGrowthStep, setIsPlaying])

  const tree = forest.trees[focusTree] ?? forest.trees[0]
  const visible = useMemo(
    () => visibleForTree(focusTree),
    // growthStep changes visibility
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [focusTree, growthStep, forest, visibleForTree],
  )

  const treesReady = completedTrees()

  const voteSample = useMemo(() => {
    if (probe) return probe
    if (selectedSample !== null) return forest.data[selectedSample] ?? null
    return null
  }, [probe, selectedSample, forest.data])

  const voteLabel =
    selectedSample !== null
      ? `sample #${selectedSample}`
      : probe
        ? 'probe'
        : undefined

  return (
    <div className="flex h-full min-h-0 flex-1">
      <div className="relative flex min-w-0 flex-1 flex-col overflow-y-auto">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-16 top-16 h-72 w-72 rounded-full bg-emerald-600/10 blur-3xl" />
          <div className="absolute bottom-10 right-20 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col gap-5 p-5 pb-8">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap items-start justify-between gap-3"
          >
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-emerald-300">
                Random forest
              </div>
              <h2 className="mt-0.5 text-xl font-semibold text-white">
                Trees growing in real time
              </h2>
              <p className="mt-1 max-w-xl text-xs leading-relaxed text-zinc-400">
                Bootstrap samples · Gini splits · majority vote. Watch nodes
                branch, leaves color by class, and the ensemble boundary fill
                in as trees complete.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge>{config.dataset}</Badge>
              <Badge>
                {config.nTrees} trees · depth ≤ {config.maxDepth}
              </Badge>
              <Badge tone="emerald">
                {treesReady}/{forest.trees.length} ready
              </Badge>
            </div>
          </motion.div>

          {/* Forest overview chips */}
          <section>
            <ForestOverview
              trees={forest.trees}
              visibleForTree={visibleForTree}
              focusTree={focusTree}
              onSelect={setFocusTree}
            />
          </section>

          <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
            {/* Growing tree */}
            <TreeCanvas
              tree={tree}
              visibleIds={visible}
              title={`Tree ${tree.id} · bootstrap n=${tree.bootstrapIndices.length}`}
            />

            {/* Scatter + votes */}
            <div className="flex flex-col gap-3">
              <DataScatter
                forest={forest}
                treesReady={Math.max(treesReady, 0)}
                selectedSample={selectedSample}
                probe={probe}
                onSelectSample={setSelectedSample}
                onProbe={setProbe}
              />
              <VotePanel
                forest={forest}
                treesReady={treesReady}
                sample={voteSample}
                label={voteLabel}
              />
            </div>
          </div>

          {/* Legend cards */}
          <div className="grid gap-3 sm:grid-cols-3">
            <InfoCard
              step="1"
              title="Bootstrap"
              body="Each tree draws samples with replacement — different bags, different trees."
            />
            <InfoCard
              step="2"
              title="Gini split"
              body="Internal nodes pick feature ≤ threshold that most reduces impurity."
            />
            <InfoCard
              step="3"
              title="Majority vote"
              body="At query time every finished tree votes; the class with most votes wins."
            />
          </div>
        </div>
      </div>

      {!embed && (
        <aside
          data-export-ignore
          className="w-[320px] shrink-0 border-l border-white/5 bg-surface-900/60 backdrop-blur-sm"
        >
          <ForestControls />
        </aside>
      )}
    </div>
  )
}

function Badge({
  children,
  tone = 'zinc',
}: {
  children: ReactNode
  tone?: 'zinc' | 'emerald'
}) {
  const styles =
    tone === 'emerald'
      ? 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/25'
      : 'bg-white/5 text-zinc-400 ring-white/10'
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[10px] font-medium ring-1 ${styles}`}
    >
      {children}
    </span>
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
        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-500/20 font-mono text-[10px] text-emerald-300">
          {step}
        </span>
        <h4 className="text-xs font-semibold text-zinc-200">{title}</h4>
      </div>
      <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-500">{body}</p>
    </div>
  )
}
