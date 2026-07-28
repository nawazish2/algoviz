import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { attentionColor } from '../../lib/attention'
import { useAttentionStore } from '../../store/useAttentionStore'
import { cn } from '../../lib/utils'

const WIDTH = 720
const HEIGHT = 220
const PAD_X = 48
const TOKEN_Y = 160

export function TokenArcGraph() {
  const tokens = useAttentionStore((s) => s.tokens)
  const weights = useAttentionStore((s) => s.weights)
  const selectedQuery = useAttentionStore((s) => s.selectedQuery)
  const hoverCell = useAttentionStore((s) => s.hoverCell)
  const setSelectedQuery = useAttentionStore((s) => s.setSelectedQuery)
  const setHoverCell = useAttentionStore((s) => s.setHoverCell)

  const n = tokens.length
  const positions = useMemo(() => {
    if (n <= 1) return [WIDTH / 2]
    const span = WIDTH - PAD_X * 2
    return tokens.map((_, i) => PAD_X + (span * i) / (n - 1))
  }, [tokens, n])

  const arcs = useMemo(() => {
    const out: {
      i: number
      j: number
      w: number
      path: string
      opacity: number
      width: number
    }[] = []

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) continue
        const w = weights[i]?.[j] ?? 0
        if (w < 0.04) continue

        // When a query is selected, only show that row's arcs
        if (selectedQuery !== null && i !== selectedQuery) continue

        const x1 = positions[i]
        const x2 = positions[j]
        const y = TOKEN_Y
        const dist = Math.abs(x2 - x1)
        const lift = Math.min(120, 28 + dist * 0.35 + w * 40)
        const path = `M ${x1} ${y} Q ${(x1 + x2) / 2} ${y - lift} ${x2} ${y}`

        out.push({
          i,
          j,
          w,
          path,
          opacity: 0.2 + w * 0.75,
          width: 1 + w * 5,
        })
      }
    }

    // Draw weak arcs under strong ones
    return out.sort((a, b) => a.w - b.w)
  }, [weights, positions, n, selectedQuery])

  return (
    <div className="w-full overflow-x-auto">
      <div className="mx-auto" style={{ minWidth: Math.min(WIDTH, 320), maxWidth: WIDTH }}>
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="h-auto w-full"
          role="img"
          aria-label="Token attention arcs"
        >
          <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Arcs */}
          {arcs.map((arc) => {
            const isHover =
              hoverCell?.q === arc.i && hoverCell?.k === arc.j
            const isRelated = selectedQuery === arc.i || isHover
            const dimmed =
              selectedQuery !== null && selectedQuery !== arc.i

            return (
              <path
                key={`${arc.i}-${arc.j}`}
                d={arc.path}
                fill="none"
                stroke={attentionColor(
                  arc.w,
                  isHover || isRelated ? 1 : arc.opacity,
                )}
                strokeWidth={isHover ? arc.width + 1.5 : arc.width}
                strokeLinecap="round"
                filter={arc.w > 0.25 ? 'url(#glow)' : undefined}
                opacity={dimmed ? 0.15 : 1}
                className="transition-opacity duration-200"
                style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
                onMouseEnter={() => setHoverCell({ q: arc.i, k: arc.j })}
                onMouseLeave={() => setHoverCell(null)}
                onClick={() =>
                  setSelectedQuery(selectedQuery === arc.i ? null : arc.i)
                }
              />
            )
          })}

          {/* Self-attention dots under tokens when weight is high */}
          {tokens.map((_, i) => {
            const self = weights[i]?.[i] ?? 0
            if (self < 0.1) return null
            return (
              <circle
                key={`self-${i}`}
                cx={positions[i]}
                cy={TOKEN_Y + 18}
                r={3 + self * 6}
                fill={attentionColor(self, 0.7)}
              />
            )
          })}

          {/* Token nodes */}
          {tokens.map((tok, i) => {
            const active = selectedQuery === i
            const related =
              hoverCell?.q === i ||
              hoverCell?.k === i ||
              (selectedQuery !== null &&
                (weights[selectedQuery]?.[i] ?? 0) > 0.1)

            return (
              <g
                key={`tok-${i}`}
                transform={`translate(${positions[i]}, ${TOKEN_Y})`}
                className="cursor-pointer"
                onClick={() =>
                  setSelectedQuery(selectedQuery === i ? null : i)
                }
                onMouseEnter={() => {
                  if (selectedQuery === null) setHoverCell({ q: i, k: i })
                }}
                onMouseLeave={() => setHoverCell(null)}
              >
                <motion.circle
                  r={active ? 16 : 13}
                  fill={
                    active
                      ? 'rgba(34,211,238,0.25)'
                      : related
                        ? 'rgba(99,102,241,0.2)'
                        : 'rgba(30,30,42,0.95)'
                  }
                  stroke={
                    active
                      ? '#22d3ee'
                      : related
                        ? '#818cf8'
                        : 'rgba(255,255,255,0.12)'
                  }
                  strokeWidth={active ? 2 : 1.2}
                  animate={{ r: active ? 16 : 13 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                />
                <text
                  y={40}
                  textAnchor="middle"
                  className="select-none"
                  fill={active ? '#67e8f9' : '#a1a1aa'}
                  style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
                >
                  {tok.length > 10 ? tok.slice(0, 9) + '…' : tok}
                </text>
                <text
                  y={4}
                  textAnchor="middle"
                  fill={active ? '#ecfeff' : '#e4e4ef'}
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  {i}
                </text>
              </g>
            )
          })}
        </svg>

        {/* Token chips for easier clicking on small screens */}
        <div className="mt-1 flex flex-wrap justify-center gap-1.5 px-2">
          {tokens.map((tok, i) => (
            <button
              key={`chip-${i}`}
              type="button"
              onClick={() =>
                setSelectedQuery(selectedQuery === i ? null : i)
              }
              className={cn(
                'rounded-lg px-2.5 py-1 font-mono text-[11px] transition ring-1',
                selectedQuery === i
                  ? 'bg-cyan-500/15 text-cyan-300 ring-cyan-500/40'
                  : 'bg-surface-800 text-zinc-400 ring-white/5 hover:bg-surface-700 hover:text-zinc-200',
              )}
            >
              {tok}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
