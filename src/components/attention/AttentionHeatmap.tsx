import { useMemo } from 'react'
import { heatmapCellColor } from '../../lib/attention'
import { useAttentionStore } from '../../store/useAttentionStore'
import { cn } from '../../lib/utils'

export function AttentionHeatmap() {
  const tokens = useAttentionStore((s) => s.tokens)
  const weights = useAttentionStore((s) => s.weights)
  const selectedQuery = useAttentionStore((s) => s.selectedQuery)
  const hoverCell = useAttentionStore((s) => s.hoverCell)
  const setSelectedQuery = useAttentionStore((s) => s.setSelectedQuery)
  const setHoverCell = useAttentionStore((s) => s.setHoverCell)

  const n = tokens.length
  const cellSize = useMemo(() => {
    if (n <= 6) return 44
    if (n <= 10) return 36
    if (n <= 14) return 28
    return 22
  }, [n])

  const maxW = useMemo(() => {
    let m = 0
    for (const row of weights) for (const v of row) if (v > m) m = v
    return m || 1
  }, [weights])

  return (
    <div className="flex flex-col items-center">
      <div className="mb-3 text-center">
        <h3 className="text-sm font-semibold text-white">Attention heatmap</h3>
        <p className="mt-0.5 text-[11px] text-zinc-500">
          Rows = query · Columns = key · Click a cell or row label
        </p>
      </div>

      <div
        className="overflow-auto rounded-2xl bg-surface-900/60 p-3 ring-1 ring-white/5"
        style={{ maxWidth: '100%' }}
      >
        <div
          className="grid"
          style={{
            gridTemplateColumns: `${cellSize + 8}px repeat(${n}, ${cellSize}px)`,
            gridTemplateRows: `${cellSize}px repeat(${n}, ${cellSize}px)`,
            gap: 2,
          }}
        >
          {/* corner */}
          <div />

          {/* column headers (keys) */}
          {tokens.map((tok, j) => (
            <div
              key={`col-${j}`}
              className="flex items-end justify-center pb-1"
              title={tok}
            >
              <span
                className="max-w-full truncate font-mono text-[10px] text-zinc-500"
                style={{
                  writingMode: n > 8 ? 'vertical-rl' : 'horizontal-tb',
                  transform: n > 8 ? 'rotate(180deg)' : undefined,
                  maxHeight: cellSize - 4,
                }}
              >
                {tok}
              </span>
            </div>
          ))}

          {/* rows */}
          {tokens.map((tok, i) => (
            <div key={`row-${i}`} className="contents">
              <button
                type="button"
                onClick={() =>
                  setSelectedQuery(selectedQuery === i ? null : i)
                }
                className={cn(
                  'flex items-center justify-end pr-1 font-mono text-[10px] transition',
                  selectedQuery === i
                    ? 'text-cyan-300'
                    : 'text-zinc-500 hover:text-zinc-300',
                )}
                title={`Select query: ${tok}`}
              >
                <span className="max-w-full truncate">{tok}</span>
              </button>

              {tokens.map((_, j) => {
                const w = weights[i]?.[j] ?? 0
                const norm = w / maxW
                const isSelRow = selectedQuery === i
                const isHover =
                  hoverCell?.q === i && hoverCell?.k === j
                const isDiag = i === j

                return (
                  <button
                    key={`${i}-${j}`}
                    type="button"
                    onMouseEnter={() => setHoverCell({ q: i, k: j })}
                    onMouseLeave={() => setHoverCell(null)}
                    onClick={() =>
                      setSelectedQuery(selectedQuery === i ? null : i)
                    }
                    className={cn(
                      'relative rounded-sm transition-all duration-150',
                      isHover && 'ring-2 ring-white/40 z-10',
                      isSelRow && 'ring-1 ring-cyan-400/40',
                      !isSelRow && selectedQuery !== null && 'opacity-35',
                    )}
                    style={{
                      width: cellSize,
                      height: cellSize,
                      background: heatmapCellColor(norm),
                      boxShadow: isDiag
                        ? 'inset 0 0 0 1px rgba(255,255,255,0.08)'
                        : undefined,
                    }}
                    title={`${tokens[i]} → ${tokens[j]}: ${(w * 100).toFixed(1)}%`}
                  >
                    {cellSize >= 32 && w > 0.08 && (
                      <span className="pointer-events-none absolute inset-0 flex items-center justify-center font-mono text-[9px] font-medium text-white/90 drop-shadow">
                        {(w * 100).toFixed(0)}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* legend */}
      <div className="mt-3 flex items-center gap-2 text-[10px] text-zinc-500">
        <span>low</span>
        <div
          className="h-2 w-28 rounded-full"
          style={{
            background:
              'linear-gradient(90deg, rgba(255,255,255,0.06), #4338ca, #22d3ee, #fbbf24)',
          }}
        />
        <span>high</span>
      </div>
    </div>
  )
}
