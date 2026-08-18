/**
 * Single source of truth for algorithm identity, chrome, and URL keys.
 * Adding a live algorithm: append a def here, then add lib/store/view +
 * register play/reset in algorithmActions.ts.
 */

export const ALGORITHM_IDS = [
  'gradient-descent',
  'attention',
  'random-forest',
  'kmeans',
  'mlp',
] as const

export type AlgorithmId = (typeof ALGORITHM_IDS)[number]
export type AlgorithmStatus = 'live' | 'soon'

export interface ComingSoonCopy {
  title: string
  description: string
  phase: string
  bullets: string[]
}

export interface AlgorithmPalette {
  a: string
  b: string
  particle: string
}

export interface AlgorithmDef {
  id: AlgorithmId
  name: string
  tag: string
  /** Short query-string token (`gd`, `attn`, …) */
  param: string
  aliases: readonly string[]
  key: string
  accent: string
  glow: string
  palette: AlgorithmPalette
  status: AlgorithmStatus
  comingSoon?: ComingSoonCopy
}

export const ALGORITHMS: readonly AlgorithmDef[] = [
  {
    id: 'gradient-descent',
    name: 'Gradient Descent',
    tag: '3D Loss Surface',
    param: 'gd',
    aliases: ['gradient-descent'],
    key: '1',
    accent: 'from-indigo-500/25 to-cyan-500/10',
    glow: 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]',
    palette: {
      a: 'rgba(99,102,241,0.14)',
      b: 'rgba(34,211,238,0.08)',
      particle: '99,102,241',
    },
    status: 'live',
  },
  {
    id: 'attention',
    name: 'Attention',
    tag: 'Transformer Heatmap',
    param: 'attn',
    aliases: ['attention'],
    key: '2',
    accent: 'from-violet-500/20 to-pink-500/10',
    glow: 'bg-violet-400 shadow-[0_0_8px_#a78bfa]',
    palette: {
      a: 'rgba(139,92,246,0.14)',
      b: 'rgba(244,114,182,0.08)',
      particle: '167,139,250',
    },
    status: 'live',
  },
  {
    id: 'random-forest',
    name: 'Random Forest',
    tag: 'Tree Growth',
    param: 'rf',
    aliases: ['random-forest', 'forest'],
    key: '3',
    accent: 'from-emerald-500/20 to-cyan-500/10',
    glow: 'bg-emerald-400 shadow-[0_0_8px_#34d399]',
    palette: {
      a: 'rgba(16,185,129,0.12)',
      b: 'rgba(34,211,238,0.08)',
      particle: '52,211,153',
    },
    status: 'live',
  },
  {
    id: 'kmeans',
    name: 'K-Means',
    tag: 'Clustering',
    param: 'km',
    aliases: ['kmeans'],
    key: '4',
    accent: 'from-rose-500/20 to-amber-500/10',
    glow: 'bg-rose-400 shadow-[0_0_8px_#fb7185]',
    palette: {
      a: 'rgba(244,63,94,0.12)',
      b: 'rgba(251,191,36,0.08)',
      particle: '251,113,133',
    },
    status: 'live',
  },
  {
    id: 'mlp',
    name: 'Tiny MLP',
    tag: 'Backprop',
    param: 'mlp',
    aliases: ['mlp', 'backprop'],
    key: '5',
    accent: 'from-sky-500/20 to-indigo-500/10',
    glow: 'bg-sky-400 shadow-[0_0_8px_#38bdf8]',
    palette: {
      a: 'rgba(14,165,233,0.14)',
      b: 'rgba(99,102,241,0.10)',
      particle: '56,189,248',
    },
    status: 'live',
  },
]

export const ALGORITHM_BY_ID: Record<AlgorithmId, AlgorithmDef> =
  Object.fromEntries(ALGORITHMS.map((a) => [a.id, a])) as Record<
    AlgorithmId,
    AlgorithmDef
  >

export const ALGO_TO_PARAM: Record<AlgorithmId, string> = Object.fromEntries(
  ALGORITHMS.map((a) => [a.id, a.param]),
) as Record<AlgorithmId, string>

export const PARAM_TO_ALGO: Record<string, AlgorithmId> = (() => {
  const out: Record<string, AlgorithmId> = {}
  for (const a of ALGORITHMS) {
    out[a.param] = a.id
    for (const alias of a.aliases) out[alias] = a.id
  }
  return out
})()

export const ALGO_KEYS: Record<string, AlgorithmId> = Object.fromEntries(
  ALGORITHMS.map((a) => [a.key, a.id]),
) as Record<string, AlgorithmId>

export function isAlgorithmId(v: string): v is AlgorithmId {
  return v in ALGORITHM_BY_ID
}
