import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  CLASS_COLORS,
  FEATURE_NAMES,
  layoutTree,
  type DecisionTree,
} from '../../lib/randomForest'
import { cn } from '../../lib/utils'

interface TreeCanvasProps {
  tree: DecisionTree
  visibleIds: Set<string>
  title?: string
}

export function TreeCanvas({ tree, visibleIds, title }: TreeCanvasProps) {
  const layout = useMemo(
    () => layoutTree(tree, visibleIds),
    [tree, visibleIds],
  )

  const pos = useMemo(() => {
    const m = new Map<string, { x: number; y: number }>()
    for (const n of layout.nodes) m.set(n.id, { x: n.x, y: n.y })
    return m
  }, [layout])

  if (layout.nodes.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl bg-surface-900/50 ring-1 ring-white/5">
        <p className="text-xs text-zinc-500">
          Press Play — nodes will branch in here
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-auto rounded-2xl bg-surface-900/50 p-3 ring-1 ring-white/5">
      {title && (
        <div className="mb-2 flex items-center justify-between px-1">
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <span className="font-mono text-[10px] text-zinc-500">
            {visibleIds.size}/{tree.growthOrder.length} nodes
          </span>
        </div>
      )}
      <svg
        width={layout.width}
        height={layout.height}
        className="mx-auto max-w-full"
        style={{ minHeight: 180 }}
      >
        {/* Edges */}
        {layout.edges.map(({ from, to }) => {
          const a = pos.get(from)
          const b = pos.get(to)
          if (!a || !b) return null
          const midY = (a.y + b.y) / 2
          return (
            <motion.path
              key={`${from}-${to}`}
              d={`M ${a.x} ${a.y + 18} C ${a.x} ${midY}, ${b.x} ${midY}, ${b.x} ${b.y - 18}`}
              fill="none"
              stroke="rgba(52,211,153,0.35)"
              strokeWidth={1.5}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.35 }}
            />
          )
        })}

        {/* Nodes */}
        {layout.nodes.map(({ id, x, y, node }) => {
          const color = CLASS_COLORS[node.prediction]
          const isLeaf = node.isLeaf
          const total = node.classCounts.reduce((a, b) => a + b, 0) || 1

          return (
            <motion.g
              key={id}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 380, damping: 22 }}
              transform={`translate(${x}, ${y})`}
            >
              {/* Card background */}
              <rect
                x={-34}
                y={-20}
                width={68}
                height={40}
                rx={10}
                fill={isLeaf ? color.soft : 'rgba(22,22,31,0.95)'}
                stroke={isLeaf ? color.fill : 'rgba(52,211,153,0.45)'}
                strokeWidth={isLeaf ? 1.5 : 1.2}
              />

              {isLeaf ? (
                <>
                  <circle cx={0} cy={-4} r={6} fill={color.fill} />
                  <text
                    y={14}
                    textAnchor="middle"
                    fill="#a1a1aa"
                    style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }}
                  >
                    n={node.nSamples}
                  </text>
                </>
              ) : (
                <>
                  <text
                    y={-4}
                    textAnchor="middle"
                    fill="#e4e4ef"
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      fontFamily: 'JetBrains Mono, monospace',
                    }}
                  >
                    {FEATURE_NAMES[node.feature!]}≤{node.threshold!.toFixed(2)}
                  </text>
                  <text
                    y={12}
                    textAnchor="middle"
                    fill="#71717a"
                    style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }}
                  >
                    gini {node.gini.toFixed(2)} · n={node.nSamples}
                  </text>
                </>
              )}

              {/* Mini class histogram under node */}
              <g transform="translate(-28, 24)">
                {node.classCounts.map((c, i) => {
                  if (c === 0 && i >= 2) return null
                  const w = (c / total) * 56
                  const prev = node.classCounts
                    .slice(0, i)
                    .reduce((a, b) => a + b, 0)
                  const x0 = (prev / total) * 56
                  return (
                    <rect
                      key={i}
                      x={x0}
                      y={0}
                      width={Math.max(0, w)}
                      height={4}
                      rx={1}
                      fill={CLASS_COLORS[i].fill}
                      opacity={0.85}
                    />
                  )
                })}
              </g>
            </motion.g>
          )
        })}
      </svg>
    </div>
  )
}

/** Tiny schematic of all trees' growth progress */
export function ForestOverview({
  trees,
  visibleForTree,
  focusTree,
  onSelect,
}: {
  trees: DecisionTree[]
  visibleForTree: (i: number) => Set<string>
  focusTree: number
  onSelect: (i: number) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {trees.map((tree) => {
        const vis = visibleForTree(tree.id)
        const pct = vis.size / Math.max(1, tree.growthOrder.length)
        const active = focusTree === tree.id
        return (
          <button
            key={tree.id}
            type="button"
            onClick={() => onSelect(tree.id)}
            className={cn(
              'w-[72px] rounded-xl px-2 py-2 text-left transition ring-1',
              active
                ? 'bg-emerald-500/15 ring-emerald-500/40'
                : 'bg-surface-800/60 ring-white/5 hover:bg-surface-700',
            )}
          >
            <div className="text-[10px] font-medium text-zinc-300">
              Tree {tree.id}
            </div>
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-surface-700">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-300"
                style={{ width: `${pct * 100}%` }}
              />
            </div>
            <div className="mt-1 font-mono text-[9px] text-zinc-600">
              {vis.size}/{tree.growthOrder.length}
            </div>
          </button>
        )
      })}
    </div>
  )
}
