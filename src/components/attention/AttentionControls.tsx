import type { ReactNode } from 'react'
import {
  Shuffle,
  Eye,
  EyeOff,
  Thermometer,
  Layers,
  Type,
} from 'lucide-react'
import { EXAMPLES } from '../../lib/attention'
import { useAttentionStore } from '../../store/useAttentionStore'
import { cn } from '../../lib/utils'

export function AttentionControls() {
  const exampleId = useAttentionStore((s) => s.exampleId)
  const customText = useAttentionStore((s) => s.customText)
  const numHeads = useAttentionStore((s) => s.numHeads)
  const temperature = useAttentionStore((s) => s.temperature)
  const mask = useAttentionStore((s) => s.mask)
  const activeHead = useAttentionStore((s) => s.activeHead)
  const selectedQuery = useAttentionStore((s) => s.selectedQuery)
  const hoverCell = useAttentionStore((s) => s.hoverCell)
  const tokens = useAttentionStore((s) => s.tokens)
  const weights = useAttentionStore((s) => s.weights)
  const result = useAttentionStore((s) => s.result)

  const setExample = useAttentionStore((s) => s.setExample)
  const setCustomText = useAttentionStore((s) => s.setCustomText)
  const applyCustomText = useAttentionStore((s) => s.applyCustomText)
  const setNumHeads = useAttentionStore((s) => s.setNumHeads)
  const setTemperature = useAttentionStore((s) => s.setTemperature)
  const setMask = useAttentionStore((s) => s.setMask)
  const setActiveHead = useAttentionStore((s) => s.setActiveHead)
  const setSelectedQuery = useAttentionStore((s) => s.setSelectedQuery)
  const reshuffle = useAttentionStore((s) => s.reshuffle)

  const focusQ = hoverCell?.q ?? selectedQuery
  const focusK = hoverCell?.k
  const focusWeight =
    focusQ !== null && focusQ !== undefined && focusK !== null && focusK !== undefined
      ? weights[focusQ]?.[focusK]
      : focusQ !== null && focusQ !== undefined
        ? null
        : null

  const topKeys =
    selectedQuery !== null
      ? weights[selectedQuery]
          .map((w, k) => ({ k, w, tok: tokens[k] }))
          .sort((a, b) => b.w - a.w)
          .slice(0, 4)
      : []

  return (
    <div className="flex h-full flex-col gap-5 overflow-y-auto p-4">
      {/* Live readout */}
      <section className="rounded-xl bg-surface-800/80 p-3 ring-1 ring-white/5">
        <SectionLabel>Focus</SectionLabel>
        {focusQ === null || focusQ === undefined ? (
          <p className="mt-2 text-xs leading-relaxed text-zinc-500">
            Click a token or heatmap row to inspect its attention distribution.
          </p>
        ) : (
          <div className="mt-2 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500">Query</span>
              <span className="font-mono text-cyan-300">{tokens[focusQ]}</span>
            </div>
            {focusK !== null && focusK !== undefined && (
              <>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500">Key</span>
                  <span className="font-mono text-amber-300">
                    {tokens[focusK]}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500">Weight</span>
                  <span className="font-mono text-white">
                    {((focusWeight ?? 0) * 100).toFixed(1)}%
                  </span>
                </div>
              </>
            )}
            {selectedQuery !== null && topKeys.length > 0 && (
              <div className="mt-2 border-t border-white/5 pt-2">
                <p className="mb-1.5 text-[10px] uppercase tracking-wide text-zinc-600">
                  Top keys for this query
                </p>
                <ul className="space-y-1">
                  {topKeys.map(({ k, w, tok }) => (
                    <li
                      key={k}
                      className="flex items-center gap-2 text-[11px]"
                    >
                      <span className="w-16 truncate font-mono text-zinc-300">
                        {tok}
                      </span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-700">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400"
                          style={{ width: `${w * 100}%` }}
                        />
                      </div>
                      <span className="w-10 text-right font-mono text-zinc-500">
                        {(w * 100).toFixed(0)}%
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {selectedQuery !== null && (
              <button
                type="button"
                onClick={() => setSelectedQuery(null)}
                className="mt-1 text-[11px] text-zinc-500 underline-offset-2 hover:text-zinc-300 hover:underline"
              >
                Clear selection
              </button>
            )}
          </div>
        )}
      </section>

      {/* Examples */}
      <section>
        <SectionLabel>Example sequence</SectionLabel>
        <div className="mt-2 flex flex-col gap-1.5">
          {EXAMPLES.map((ex) => {
            const active = exampleId === ex.id
            return (
              <button
                key={ex.id}
                type="button"
                onClick={() => setExample(ex.id)}
                className={cn(
                  'rounded-xl px-3 py-2.5 text-left transition ring-1',
                  active
                    ? 'bg-violet-500/15 ring-violet-500/40'
                    : 'bg-surface-800/50 ring-white/5 hover:bg-surface-700',
                )}
              >
                <div className="text-sm font-medium text-zinc-100">
                  {ex.label}
                </div>
                <div className="mt-0.5 font-mono text-[11px] text-zinc-500">
                  {ex.text}
                </div>
              </button>
            )
          })}
        </div>
      </section>

      {/* Custom text */}
      <section>
        <SectionLabel>
          <span className="inline-flex items-center gap-1.5">
            <Type className="h-3 w-3" /> Custom tokens
          </span>
        </SectionLabel>
        <textarea
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
          rows={2}
          className="mt-2 w-full resize-none rounded-xl border-0 bg-surface-800 px-3 py-2 font-mono text-xs text-zinc-200 ring-1 ring-white/5 outline-none focus:ring-violet-500/50"
          placeholder="Type a sentence…"
        />
        <button
          type="button"
          onClick={applyCustomText}
          className="mt-2 w-full rounded-xl bg-violet-500/90 py-2 text-xs font-medium text-white shadow-lg shadow-violet-500/20 hover:bg-violet-400"
        >
          Recompute attention
        </button>
      </section>

      {/* Head selector */}
      <section>
        <SectionLabel>
          <span className="inline-flex items-center gap-1.5">
            <Layers className="h-3 w-3" /> Attention head
          </span>
        </SectionLabel>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <HeadChip
            label="Avg"
            active={activeHead === -1}
            onClick={() => setActiveHead(-1)}
          />
          {Array.from({ length: numHeads }, (_, h) => (
            <HeadChip
              key={h}
              label={`H${h}`}
              active={activeHead === h}
              onClick={() => setActiveHead(h)}
            />
          ))}
        </div>
        <p className="mt-2 text-[11px] leading-snug text-zinc-500">
          Each head has different Q/K projections — patterns diverge. Avg
          blends all {result.headCount} heads.
        </p>
      </section>

      {/* Hyperparams */}
      <section>
        <SectionLabel>Controls</SectionLabel>

        <div className="mt-3">
          <div className="mb-1 flex justify-between text-xs">
            <span className="inline-flex items-center gap-1 text-zinc-400">
              <Thermometer className="h-3 w-3" /> Softmax temperature
            </span>
            <span className="font-mono text-zinc-300">
              {temperature.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min={0.15}
            max={3}
            step={0.05}
            value={temperature}
            onChange={(e) => setTemperature(Number(e.target.value))}
            className="w-full"
          />
          <p className="mt-1 text-[10px] text-zinc-600">
            Low = peaky / decisive · High = diffuse / uniform
          </p>
        </div>

        <div className="mt-4">
          <div className="mb-1 flex justify-between text-xs">
            <span className="text-zinc-400">Number of heads</span>
            <span className="font-mono text-zinc-300">{numHeads}</span>
          </div>
          <input
            type="range"
            min={1}
            max={8}
            step={1}
            value={numHeads}
            onChange={(e) => setNumHeads(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="mt-4">
          <p className="mb-1.5 text-xs text-zinc-400">Attention mask</p>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => setMask('none')}
              className={cn(
                'flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-medium ring-1 transition',
                mask === 'none'
                  ? 'bg-cyan-500/15 text-cyan-300 ring-cyan-500/40'
                  : 'bg-surface-800 text-zinc-400 ring-white/5 hover:bg-surface-700',
              )}
            >
              <Eye className="h-3.5 w-3.5" /> Bidirectional
            </button>
            <button
              type="button"
              onClick={() => setMask('causal')}
              className={cn(
                'flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-medium ring-1 transition',
                mask === 'causal'
                  ? 'bg-amber-500/15 text-amber-300 ring-amber-500/40'
                  : 'bg-surface-800 text-zinc-400 ring-white/5 hover:bg-surface-700',
              )}
            >
              <EyeOff className="h-3.5 w-3.5" /> Causal
            </button>
          </div>
          <p className="mt-1.5 text-[10px] leading-snug text-zinc-600">
            Causal (GPT-style) blocks attending to future tokens — heatmap
            becomes lower-triangular.
          </p>
        </div>

        <button
          type="button"
          onClick={reshuffle}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-surface-700 py-2.5 text-xs font-medium text-zinc-200 ring-1 ring-white/5 hover:bg-surface-600"
        >
          <Shuffle className="h-3.5 w-3.5" />
          Reshuffle projections
        </button>
      </section>

      {/* Formula card */}
      <section className="rounded-xl bg-surface-800/50 p-3 ring-1 ring-white/5">
        <SectionLabel>Math</SectionLabel>
        <pre className="mt-2 overflow-x-auto font-mono text-[10px] leading-relaxed text-zinc-400">
{`Attention(Q,K,V) =
  softmax( QKᵀ / √dₖ ) V

d_model = ${result.dim}
d_head  = ${result.headDim}
heads   = ${result.headCount}`}
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

function HeadChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-lg px-2.5 py-1.5 font-mono text-[11px] font-medium ring-1 transition',
        active
          ? 'bg-indigo-500/20 text-indigo-200 ring-indigo-500/40'
          : 'bg-surface-800 text-zinc-500 ring-white/5 hover:text-zinc-300',
      )}
    >
      {label}
    </button>
  )
}
