import { Keyboard } from 'lucide-react'
import { cn } from '../../lib/utils'
import {
  useVisualizerStore,
  type AlgorithmId,
} from '../../store/useVisualizerStore'
import { useUiStore } from '../../store/useUiStore'
import { PlaygroundPanel } from './PlaygroundPanel'

const ALGORITHMS: {
  id: AlgorithmId
  name: string
  tag: string
  key: string
  accent: string
  glow: string
}[] = [
  {
    id: 'gradient-descent',
    name: 'Gradient Descent',
    tag: '3D Loss Surface',
    key: '1',
    accent: 'from-indigo-500/25 to-cyan-500/10',
    glow: 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]',
  },
  {
    id: 'attention',
    name: 'Attention',
    tag: 'Transformer Heatmap',
    key: '2',
    accent: 'from-violet-500/20 to-pink-500/10',
    glow: 'bg-violet-400 shadow-[0_0_8px_#a78bfa]',
  },
  {
    id: 'random-forest',
    name: 'Random Forest',
    tag: 'Tree Growth',
    key: '3',
    accent: 'from-emerald-500/20 to-cyan-500/10',
    glow: 'bg-emerald-400 shadow-[0_0_8px_#34d399]',
  },
  {
    id: 'kmeans',
    name: 'K-Means',
    tag: 'Clustering',
    key: '4',
    accent: 'from-rose-500/20 to-amber-500/10',
    glow: 'bg-rose-400 shadow-[0_0_8px_#fb7185]',
  },
]

export function Sidebar() {
  const active = useVisualizerStore((s) => s.algorithm)
  const setActive = useVisualizerStore((s) => s.setAlgorithm)
  const toggleShortcuts = useUiStore((s) => s.toggleShortcuts)

  return (
    <aside
      data-export-ignore
      className="flex w-60 shrink-0 flex-col border-r border-white/[0.06] bg-surface-900/90 backdrop-blur-xl"
    >
      <div className="border-b border-white/[0.06] px-5 py-5">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 shadow-[0_0_24px_rgba(99,102,241,0.45)]">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 17 L8 7 L12 13 L16 4 L21 17" />
            </svg>
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 animate-pulse rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]" />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight text-white">
              AlgoViz
            </p>
            <p className="text-[10px] text-zinc-500">Play · learn · share</p>
          </div>
        </div>
      </div>

      <nav className="flex flex-col gap-1.5 p-3">
        <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
          Algorithms
        </p>
        {ALGORITHMS.map((algo) => {
          const isActive = active === algo.id
          return (
            <button
              key={algo.id}
              type="button"
              onClick={() => setActive(algo.id)}
              className={cn(
                'group relative overflow-hidden rounded-xl px-3 py-3 text-left transition duration-200',
                isActive
                  ? 'bg-white/[0.06] ring-1 ring-white/10'
                  : 'hover:bg-white/[0.04] hover:translate-x-0.5',
              )}
            >
              {isActive && (
                <div
                  className={cn(
                    'pointer-events-none absolute inset-0 bg-gradient-to-r',
                    algo.accent,
                  )}
                />
              )}
              <div className="relative">
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      'text-sm font-medium',
                      isActive ? 'text-white' : 'text-zinc-300',
                    )}
                  >
                    {algo.name}
                  </span>
                  <span className="flex items-center gap-1.5">
                    {isActive && (
                      <span className={cn('h-1.5 w-1.5 rounded-full', algo.glow)} />
                    )}
                    <kbd className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[9px] text-zinc-600 ring-1 ring-white/5">
                      {algo.key}
                    </kbd>
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] text-zinc-500">{algo.tag}</p>
              </div>
            </button>
          )
        })}
      </nav>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <PlaygroundPanel />
      </div>

      <div className="border-t border-white/[0.06] p-3">
        <button
          type="button"
          onClick={toggleShortcuts}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/[0.03] py-2 text-[11px] font-medium text-zinc-400 ring-1 ring-white/5 transition hover:bg-white/[0.06] hover:text-zinc-200"
        >
          <Keyboard className="h-3.5 w-3.5" />
          Shortcuts
          <kbd className="rounded bg-surface-800 px-1.5 py-0.5 font-mono text-[9px] text-zinc-500">
            ?
          </kbd>
        </button>
      </div>
    </aside>
  )
}
