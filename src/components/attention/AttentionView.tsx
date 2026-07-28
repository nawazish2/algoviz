import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { EXAMPLES } from '../../lib/attention'
import { useAttentionStore } from '../../store/useAttentionStore'
import { useUiStore } from '../../store/useUiStore'
import { AttentionHeatmap } from './AttentionHeatmap'
import { TokenArcGraph } from './TokenArcGraph'
import { AttentionControls } from './AttentionControls'

export function AttentionView() {
  const exampleId = useAttentionStore((s) => s.exampleId)
  const mask = useAttentionStore((s) => s.mask)
  const activeHead = useAttentionStore((s) => s.activeHead)
  const numHeads = useAttentionStore((s) => s.numHeads)
  const tokens = useAttentionStore((s) => s.tokens)
  const embed = useUiStore((s) => s.embed)

  const example = EXAMPLES.find((e) => e.id === exampleId)

  return (
    <div className="flex h-full min-h-0 flex-1">
      {/* Main canvas */}
      <div className="relative flex min-w-0 flex-1 flex-col overflow-y-auto">
        {/* Ambient */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-violet-600/10 blur-3xl" />
          <div className="absolute bottom-20 right-10 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col gap-6 p-5 pb-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap items-start justify-between gap-3"
          >
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-violet-300">
                Attention mechanism
              </div>
              <h2 className="mt-0.5 text-xl font-semibold text-white">
                Scaled multi-head attention
              </h2>
              <p className="mt-1 max-w-xl text-xs leading-relaxed text-zinc-400">
                {example?.note ??
                  'Explore how query tokens distribute attention over keys.'}{' '}
                Click a token to lock a query row.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge>
                {tokens.length} token{tokens.length === 1 ? '' : 's'}
              </Badge>
              <Badge>
                {activeHead < 0 ? `Avg · ${numHeads} heads` : `Head ${activeHead}`}
              </Badge>
              <Badge tone={mask === 'causal' ? 'amber' : 'cyan'}>
                {mask === 'causal' ? 'Causal mask' : 'Bidirectional'}
              </Badge>
            </div>
          </motion.div>

          {/* Arc graph */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-2xl bg-surface-900/50 p-4 ring-1 ring-white/5 backdrop-blur-sm"
          >
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">
                Token → token arcs
              </h3>
              <span className="text-[10px] text-zinc-500">
                Arc thickness ∝ attention weight
              </span>
            </div>
            <TokenArcGraph />
          </motion.section>

          {/* Heatmap */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl bg-surface-900/50 p-4 ring-1 ring-white/5 backdrop-blur-sm"
          >
            <AttentionHeatmap />
          </motion.section>

          {/* Mini explainer */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="grid gap-3 sm:grid-cols-3"
          >
            <ExplainCard
              step="1"
              title="Project Q, K, V"
              body="Each token embedding is linearly projected into queries, keys, and values per head."
            />
            <ExplainCard
              step="2"
              title="Score & scale"
              body="Scores = QKᵀ / √dₖ. Optional causal mask sets future keys to −∞."
            />
            <ExplainCard
              step="3"
              title="Softmax → mix V"
              body="Softmax turns scores into weights that sum to 1, then mixes value vectors."
            />
          </motion.section>
        </div>
      </div>

      {!embed && (
        <aside
          data-export-ignore
          className="w-[320px] shrink-0 border-l border-white/5 bg-surface-900/60 backdrop-blur-sm"
        >
          <AttentionControls />
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
  tone?: 'zinc' | 'cyan' | 'amber'
}) {
  const styles =
    tone === 'cyan'
      ? 'bg-cyan-500/10 text-cyan-300 ring-cyan-500/25'
      : tone === 'amber'
        ? 'bg-amber-500/10 text-amber-300 ring-amber-500/25'
        : 'bg-white/5 text-zinc-400 ring-white/10'
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[10px] font-medium ring-1 ${styles}`}
    >
      {children}
    </span>
  )
}

function ExplainCard({
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
        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-violet-500/20 font-mono text-[10px] text-violet-300">
          {step}
        </span>
        <h4 className="text-xs font-semibold text-zinc-200">{title}</h4>
      </div>
      <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-500">{body}</p>
    </div>
  )
}
