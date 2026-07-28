/**
 * Serialize / parse shareable query-string state for AlgoViz.
 *
 * Example:
 *   ?algo=gd&surface=himmelblau&opt=adam&lr=0.01
 *   ?algo=attn&ex=cat&heads=4&temp=0.5&mask=causal
 *   ?algo=rf&ds=moons&trees=6&depth=5
 *   ?algo=km&k=3&ds=blobs
 */

import {
  SURFACES,
  type OptimizerKind,
  type SurfaceKind,
} from './gradientDescent'
import type { MaskMode } from './attention'
import type { DatasetKind } from './randomForest'
import type { AlgorithmId } from '../store/useVisualizerStore'

export const ALGO_TO_PARAM: Record<AlgorithmId, string> = {
  'gradient-descent': 'gd',
  attention: 'attn',
  'random-forest': 'rf',
  kmeans: 'km',
}

export const PARAM_TO_ALGO: Record<string, AlgorithmId> = {
  gd: 'gradient-descent',
  'gradient-descent': 'gradient-descent',
  attn: 'attention',
  attention: 'attention',
  rf: 'random-forest',
  'random-forest': 'random-forest',
  forest: 'random-forest',
  km: 'kmeans',
  kmeans: 'kmeans',
}

const SURFACES_SET = new Set<string>(Object.keys(SURFACES))
const OPTS = new Set<OptimizerKind>(['gd', 'momentum', 'adam'])
const DATASETS = new Set<DatasetKind>(['blobs', 'moons', 'xor'])
const MASKS = new Set<MaskMode>(['none', 'causal'])

export interface SharedGdState {
  surface?: SurfaceKind
  optimizer?: OptimizerKind
  learningRate?: number
  momentum?: number
  startX?: number
  startY?: number
  maxSteps?: number
  speed?: number
}

export interface SharedAttnState {
  exampleId?: string
  text?: string
  numHeads?: number
  temperature?: number
  mask?: MaskMode
  activeHead?: number
  seed?: number
}

export interface SharedRfState {
  dataset?: DatasetKind
  nTrees?: number
  maxDepth?: number
  minSamplesSplit?: number
  maxFeatures?: 1 | 2
  nClasses?: 2 | 3
  seed?: number
  growthStep?: number
}

export interface SharedKmState {
  dataset?: DatasetKind
  k?: number
  seed?: number
  nSamples?: number
  maxIter?: number
}

export interface SharedUiState {
  embed?: boolean
  theme?: 'midnight' | 'neon' | 'aurora'
  difficulty?: 'beginner' | 'curious' | 'nerd'
}

export interface SharedState {
  algorithm?: AlgorithmId
  gd?: SharedGdState
  attn?: SharedAttnState
  rf?: SharedRfState
  km?: SharedKmState
  ui?: SharedUiState
}

function num(v: string | null, min?: number, max?: number): number | undefined {
  if (v === null || v === '') return undefined
  const n = Number(v)
  if (!Number.isFinite(n)) return undefined
  let x = n
  if (min !== undefined) x = Math.max(min, x)
  if (max !== undefined) x = Math.min(max, x)
  return x
}

function int(v: string | null, min?: number, max?: number): number | undefined {
  const n = num(v, min, max)
  return n === undefined ? undefined : Math.round(n)
}

/** Read current location search into structured state. */
export function parseUrlState(search = window.location.search): SharedState {
  const p = new URLSearchParams(search)
  const out: SharedState = {}

  const algoRaw = p.get('algo')
  if (algoRaw && PARAM_TO_ALGO[algoRaw]) {
    out.algorithm = PARAM_TO_ALGO[algoRaw]
  }

  // Gradient descent
  const gd: SharedGdState = {}
  const surface = p.get('surface')
  if (surface && SURFACES_SET.has(surface)) gd.surface = surface as SurfaceKind
  const opt = p.get('opt')
  if (opt && OPTS.has(opt as OptimizerKind)) gd.optimizer = opt as OptimizerKind
  const lr = num(p.get('lr'), 0.0001, 1)
  if (lr !== undefined) gd.learningRate = lr
  const mom = num(p.get('mom'), 0, 0.99)
  if (mom !== undefined) gd.momentum = mom
  const sx = num(p.get('sx'))
  const sy = num(p.get('sy'))
  if (sx !== undefined) gd.startX = sx
  if (sy !== undefined) gd.startY = sy
  const steps = int(p.get('steps'), 20, 500)
  if (steps !== undefined) gd.maxSteps = steps
  const spd = num(p.get('speed'), 1, 60)
  if (spd !== undefined) gd.speed = spd
  if (Object.keys(gd).length) out.gd = gd

  // Attention
  const attn: SharedAttnState = {}
  const ex = p.get('ex')
  if (ex) attn.exampleId = ex
  const text = p.get('text')
  if (text) attn.text = text
  const heads = int(p.get('heads'), 1, 8)
  if (heads !== undefined) attn.numHeads = heads
  const temp = num(p.get('temp'), 0.1, 5)
  if (temp !== undefined) attn.temperature = temp
  const mask = p.get('mask')
  if (mask && MASKS.has(mask as MaskMode)) attn.mask = mask as MaskMode
  const head = int(p.get('head'), -1, 8)
  if (head !== undefined) attn.activeHead = head
  const aseed = int(p.get('aseed'), 0, 1e9)
  if (aseed !== undefined) attn.seed = aseed
  if (Object.keys(attn).length) out.attn = attn

  // Random forest
  const rf: SharedRfState = {}
  const ds = p.get('ds')
  if (ds && DATASETS.has(ds as DatasetKind)) rf.dataset = ds as DatasetKind
  const trees = int(p.get('trees'), 1, 12)
  if (trees !== undefined) rf.nTrees = trees
  const depth = int(p.get('depth'), 1, 8)
  if (depth !== undefined) rf.maxDepth = depth
  const minS = int(p.get('min'), 2, 20)
  if (minS !== undefined) rf.minSamplesSplit = minS
  const mf = int(p.get('mf'), 1, 2)
  if (mf === 1 || mf === 2) rf.maxFeatures = mf
  const nc = int(p.get('nc'), 2, 3)
  if (nc === 2 || nc === 3) rf.nClasses = nc
  const fseed = int(p.get('fseed'), 0, 1e9)
  if (fseed !== undefined) rf.seed = fseed
  const gstep = int(p.get('gstep'), 0, 1e6)
  if (gstep !== undefined) rf.growthStep = gstep
  if (Object.keys(rf).length) out.rf = rf

  // K-Means
  const km: SharedKmState = {}
  const kds = p.get('kds') ?? (out.algorithm === 'kmeans' ? p.get('ds') : null)
  if (kds && DATASETS.has(kds as DatasetKind)) km.dataset = kds as DatasetKind
  const k = int(p.get('k'), 2, 8)
  if (k !== undefined) km.k = k
  const kseed = int(p.get('kseed'), 0, 1e9)
  if (kseed !== undefined) km.seed = kseed
  const kn = int(p.get('kn'), 40, 300)
  if (kn !== undefined) km.nSamples = kn
  const maxIt = int(p.get('maxit'), 5, 50)
  if (maxIt !== undefined) km.maxIter = maxIt
  if (Object.keys(km).length) out.km = km

  // UI chrome
  const ui: SharedUiState = {}
  if (p.get('embed') === '1' || p.get('embed') === 'true') ui.embed = true
  const theme = p.get('theme')
  if (theme === 'midnight' || theme === 'neon' || theme === 'aurora') {
    ui.theme = theme
  }
  const diff = p.get('diff')
  if (diff === 'beginner' || diff === 'curious' || diff === 'nerd') {
    ui.difficulty = diff
  }
  if (Object.keys(ui).length) out.ui = ui

  return out
}

export interface SerializeInput {
  algorithm: AlgorithmId
  gd: {
    surface: SurfaceKind
    optimizer: OptimizerKind
    learningRate: number
    momentum: number
    startPos: { x: number; y: number }
    maxSteps: number
    speed: number
  }
  attn: {
    exampleId: string
    customText: string
    numHeads: number
    temperature: number
    mask: MaskMode
    activeHead: number
    seed: number
  }
  rf: {
    dataset: DatasetKind
    nTrees: number
    maxDepth: number
    minSamplesSplit: number
    maxFeatures: 1 | 2
    nClasses: 2 | 3
    seed: number
    growthStep: number
  }
  km?: {
    dataset: DatasetKind
    k: number
    seed: number
    nSamples: number
    maxIter: number
  }
  ui?: SharedUiState
}

/** Build query string (without `?`) from live store snapshot. */
export function serializeUrlState(s: SerializeInput): string {
  const p = new URLSearchParams()
  p.set('algo', ALGO_TO_PARAM[s.algorithm] ?? s.algorithm)

  if (s.algorithm === 'gradient-descent') {
    p.set('surface', s.gd.surface)
    p.set('opt', s.gd.optimizer)
    p.set('lr', trimNum(s.gd.learningRate))
    p.set('mom', trimNum(s.gd.momentum))
    p.set('sx', trimNum(s.gd.startPos.x))
    p.set('sy', trimNum(s.gd.startPos.y))
    p.set('steps', String(s.gd.maxSteps))
    p.set('speed', trimNum(s.gd.speed))
  }

  if (s.algorithm === 'attention') {
    p.set('ex', s.attn.exampleId)
    if (s.attn.exampleId === 'custom' || s.attn.customText) {
      p.set('text', s.attn.customText)
    }
    p.set('heads', String(s.attn.numHeads))
    p.set('temp', trimNum(s.attn.temperature))
    p.set('mask', s.attn.mask)
    p.set('head', String(s.attn.activeHead))
    p.set('aseed', String(s.attn.seed))
  }

  if (s.algorithm === 'random-forest') {
    p.set('ds', s.rf.dataset)
    p.set('trees', String(s.rf.nTrees))
    p.set('depth', String(s.rf.maxDepth))
    p.set('min', String(s.rf.minSamplesSplit))
    p.set('mf', String(s.rf.maxFeatures))
    p.set('nc', String(s.rf.nClasses))
    p.set('fseed', String(s.rf.seed))
    if (s.rf.growthStep > 0) p.set('gstep', String(s.rf.growthStep))
  }

  if (s.algorithm === 'kmeans' && s.km) {
    p.set('ds', s.km.dataset)
    p.set('k', String(s.km.k))
    p.set('kseed', String(s.km.seed))
    p.set('kn', String(s.km.nSamples))
    p.set('maxit', String(s.km.maxIter))
  }

  if (s.ui?.embed) p.set('embed', '1')
  if (s.ui?.theme && s.ui.theme !== 'midnight') p.set('theme', s.ui.theme)
  if (s.ui?.difficulty && s.ui.difficulty !== 'curious') {
    p.set('diff', s.ui.difficulty)
  }

  return p.toString()
}

/** Embeddable iframe snippet for blogs / Notion. */
export function buildEmbedSnippet(shareUrl: string, height = 640): string {
  const url = shareUrl.includes('embed=1')
    ? shareUrl
    : `${shareUrl}${shareUrl.includes('?') ? '&' : '?'}embed=1`
  return `<iframe src="${url}" width="100%" height="${height}" style="border:0;border-radius:12px;overflow:hidden" allow="fullscreen" loading="lazy" title="AlgoViz"></iframe>`
}

function trimNum(n: number): string {
  if (Number.isInteger(n)) return String(n)
  // keep compact but precise enough
  return String(Number(n.toPrecision(5)))
}

export function buildShareUrl(search: string): string {
  const base = `${window.location.origin}${window.location.pathname}`
  return search ? `${base}?${search}` : base
}

/** Write search into the address bar without a navigation. */
export function writeUrlSearch(search: string) {
  const url = search
    ? `${window.location.pathname}?${search}${window.location.hash}`
    : `${window.location.pathname}${window.location.hash}`
  window.history.replaceState(null, '', url)
}
