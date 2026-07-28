/**
 * Educational Random Forest for 2D classification.
 * Trees grow with Gini splits; forest uses bootstrap + feature subsets.
 */

export type ClassLabel = 0 | 1 | 2

export interface Sample {
  x: number
  y: number
  label: ClassLabel
}

export type Feature = 0 | 1 // 0 = x, 1 = y

export interface TreeNode {
  id: string
  depth: number
  nSamples: number
  classCounts: [number, number, number]
  gini: number
  isLeaf: boolean
  /** Majority class */
  prediction: ClassLabel
  feature?: Feature
  threshold?: number
  leftId?: string
  rightId?: string
  parentId: string | null
  side: 'root' | 'left' | 'right'
}

export interface DecisionTree {
  id: number
  nodes: Map<string, TreeNode>
  rootId: string
  /** Node ids in creation order (for growth animation) */
  growthOrder: string[]
  /** Bootstrap indices into full dataset */
  bootstrapIndices: number[]
  oobIndices: number[]
}

export interface Forest {
  trees: DecisionTree[]
  data: Sample[]
  nClasses: number
  seed: number
}

export interface ForestConfig {
  nTrees: number
  maxDepth: number
  minSamplesSplit: number
  maxFeatures: 1 | 2 // random subspace size
  seed: number
  nSamples: number
  nClasses: 2 | 3
  dataset: DatasetKind
}

export type DatasetKind = 'blobs' | 'moons' | 'xor'

export const DEFAULT_FOREST_CONFIG: ForestConfig = {
  nTrees: 5,
  maxDepth: 4,
  minSamplesSplit: 4,
  maxFeatures: 2,
  seed: 42,
  nSamples: 120,
  nClasses: 2,
  dataset: 'blobs',
}

// ── RNG ─────────────────────────────────────────────────────────

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function randn(rng: () => number): number {
  // Box-Muller
  const u = Math.max(1e-12, rng())
  const v = rng()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

// ── Dataset generation ──────────────────────────────────────────

export function generateDataset(
  kind: DatasetKind,
  n: number,
  nClasses: 2 | 3,
  seed: number,
): Sample[] {
  const rng = mulberry32(seed)
  const samples: Sample[] = []

  if (kind === 'blobs') {
    const centers: [number, number][] =
      nClasses === 2
        ? [
            [-0.9, -0.5],
            [0.9, 0.6],
          ]
        : [
            [-1.0, -0.7],
            [1.0, -0.5],
            [0.0, 1.0],
          ]
    for (let i = 0; i < n; i++) {
      const label = (i % nClasses) as ClassLabel
      const [cx, cy] = centers[label]
      samples.push({
        x: cx + randn(rng) * 0.45,
        y: cy + randn(rng) * 0.45,
        label,
      })
    }
  } else if (kind === 'moons') {
    // Two interleaving half-moons (binary); third class ignored
    const half = Math.floor(n / 2)
    for (let i = 0; i < half; i++) {
      const t = (Math.PI * i) / Math.max(1, half - 1)
      samples.push({
        x: Math.cos(t) + randn(rng) * 0.12,
        y: Math.sin(t) + randn(rng) * 0.12,
        label: 0,
      })
    }
    for (let i = 0; i < n - half; i++) {
      const t = (Math.PI * i) / Math.max(1, n - half - 1)
      samples.push({
        x: 1 - Math.cos(t) + randn(rng) * 0.12,
        y: 0.5 - Math.sin(t) + randn(rng) * 0.12 - 0.35,
        label: 1,
      })
    }
  } else {
    // XOR-like checker pattern
    for (let i = 0; i < n; i++) {
      const x = (rng() * 2 - 1) * 1.6
      const y = (rng() * 2 - 1) * 1.6
      let label: ClassLabel = (x * y > 0 ? 0 : 1) as ClassLabel
      if (nClasses === 3 && Math.abs(x) + Math.abs(y) < 0.7) label = 2
      samples.push({
        x: x + randn(rng) * 0.08,
        y: y + randn(rng) * 0.08,
        label,
      })
    }
  }

  // Shuffle
  for (let i = samples.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[samples[i], samples[j]] = [samples[j], samples[i]]
  }
  return samples
}

// ── Impurity & counts ───────────────────────────────────────────

export function classCounts(
  samples: Sample[],
  nClasses: number,
): [number, number, number] {
  const c: [number, number, number] = [0, 0, 0]
  for (const s of samples) c[s.label]++
  // zero unused classes
  for (let i = nClasses; i < 3; i++) c[i] = 0
  return c
}

export function giniFromCounts(counts: number[]): number {
  const n = counts.reduce((a, b) => a + b, 0)
  if (n === 0) return 0
  let sumSq = 0
  for (const c of counts) {
    const p = c / n
    sumSq += p * p
  }
  return 1 - sumSq
}

export function majorityClass(counts: [number, number, number]): ClassLabel {
  let best: ClassLabel = 0
  let bestN = -1
  for (let i = 0; i < 3; i++) {
    if (counts[i] > bestN) {
      bestN = counts[i]
      best = i as ClassLabel
    }
  }
  return best
}

function featureValue(s: Sample, f: Feature): number {
  return f === 0 ? s.x : s.y
}

// ── Split search ────────────────────────────────────────────────

interface Split {
  feature: Feature
  threshold: number
  left: Sample[]
  right: Sample[]
  impurity: number
}

function bestSplit(
  samples: Sample[],
  features: Feature[],
  nClasses: number,
  rng: () => number,
): Split | null {
  if (samples.length < 2) return null

  let best: Split | null = null
  let bestGain = -Infinity
  const parentGini = giniFromCounts(classCounts(samples, nClasses))

  for (const feature of features) {
    // Candidate thresholds: midpoints of unique sorted values (cap)
    const vals = samples.map((s) => featureValue(s, feature)).sort((a, b) => a - b)
    const thresholds: number[] = []
    for (let i = 0; i < vals.length - 1; i++) {
      if (vals[i] !== vals[i + 1]) {
        thresholds.push((vals[i] + vals[i + 1]) / 2)
      }
    }
    // Subsample thresholds if too many
    let cands = thresholds
    if (cands.length > 24) {
      const step = cands.length / 24
      cands = []
      for (let i = 0; i < 24; i++) {
        cands.push(thresholds[Math.floor(i * step)])
      }
    }
    // Tiny jitter preference via rng to break ties diversely
    void rng

    for (const thr of cands) {
      const left: Sample[] = []
      const right: Sample[] = []
      for (const s of samples) {
        if (featureValue(s, feature) <= thr) left.push(s)
        else right.push(s)
      }
      if (left.length === 0 || right.length === 0) continue

      const gL = giniFromCounts(classCounts(left, nClasses))
      const gR = giniFromCounts(classCounts(right, nClasses))
      const n = samples.length
      const impurity = (left.length / n) * gL + (right.length / n) * gR
      const gain = parentGini - impurity

      if (gain > bestGain) {
        bestGain = gain
        best = { feature, threshold: thr, left, right, impurity }
      }
    }
  }

  return bestGain > 1e-12 ? best : null
}

// ── Build one tree ──────────────────────────────────────────────

function pickFeatures(maxFeatures: 1 | 2, rng: () => number): Feature[] {
  if (maxFeatures >= 2) return [0, 1]
  return rng() < 0.5 ? [0] : [1]
}

function buildTree(
  treeId: number,
  data: Sample[],
  bootstrapIdx: number[],
  cfg: Pick<ForestConfig, 'maxDepth' | 'minSamplesSplit' | 'maxFeatures'>,
  nClasses: number,
  rng: () => number,
): DecisionTree {
  const bag = bootstrapIdx.map((i) => data[i])
  const nodes = new Map<string, TreeNode>()
  const growthOrder: string[] = []
  let idCounter = 0
  const nextId = () => `t${treeId}-n${idCounter++}`

  function grow(
    samples: Sample[],
    depth: number,
    parentId: string | null,
    side: 'root' | 'left' | 'right',
  ): string {
    const id = nextId()
    const counts = classCounts(samples, nClasses)
    const gini = giniFromCounts(counts)
    const pure = gini < 1e-9
    const tooSmall = samples.length < cfg.minSamplesSplit
    const tooDeep = depth >= cfg.maxDepth

    if (pure || tooSmall || tooDeep) {
      const node: TreeNode = {
        id,
        depth,
        nSamples: samples.length,
        classCounts: counts,
        gini,
        isLeaf: true,
        prediction: majorityClass(counts),
        parentId,
        side,
      }
      nodes.set(id, node)
      growthOrder.push(id)
      return id
    }

    const features = pickFeatures(cfg.maxFeatures, rng)
    const split = bestSplit(samples, features, nClasses, rng)

    if (!split) {
      const node: TreeNode = {
        id,
        depth,
        nSamples: samples.length,
        classCounts: counts,
        gini,
        isLeaf: true,
        prediction: majorityClass(counts),
        parentId,
        side,
      }
      nodes.set(id, node)
      growthOrder.push(id)
      return id
    }

    // Create internal node first (appears before children in growth)
    const node: TreeNode = {
      id,
      depth,
      nSamples: samples.length,
      classCounts: counts,
      gini,
      isLeaf: false,
      prediction: majorityClass(counts),
      feature: split.feature,
      threshold: split.threshold,
      parentId,
      side,
    }
    nodes.set(id, node)
    growthOrder.push(id)

    const leftId = grow(split.left, depth + 1, id, 'left')
    const rightId = grow(split.right, depth + 1, id, 'right')
    node.leftId = leftId
    node.rightId = rightId

    return id
  }

  const rootId = grow(bag, 0, null, 'root')

  // OOB indices
  const inBag = new Set(bootstrapIdx)
  const oobIndices: number[] = []
  for (let i = 0; i < data.length; i++) {
    if (!inBag.has(i)) oobIndices.push(i)
  }

  return {
    id: treeId,
    nodes,
    rootId,
    growthOrder,
    bootstrapIndices: bootstrapIdx,
    oobIndices,
  }
}

// ── Forest ──────────────────────────────────────────────────────

export function buildForest(cfg: ForestConfig): Forest {
  const data = generateDataset(cfg.dataset, cfg.nSamples, cfg.nClasses, cfg.seed)
  const rng = mulberry32(cfg.seed + 99)
  const trees: DecisionTree[] = []

  for (let t = 0; t < cfg.nTrees; t++) {
    const treeRng = mulberry32(cfg.seed + 1000 + t * 17)
    // Bootstrap sample
    const bootstrapIndices: number[] = []
    for (let i = 0; i < data.length; i++) {
      bootstrapIndices.push(Math.floor(treeRng() * data.length))
    }
    trees.push(
      buildTree(
        t,
        data,
        bootstrapIndices,
        {
          maxDepth: cfg.maxDepth,
          minSamplesSplit: cfg.minSamplesSplit,
          maxFeatures: cfg.maxFeatures,
        },
        cfg.nClasses,
        treeRng,
      ),
    )
    void rng
  }

  return { trees, data, nClasses: cfg.nClasses, seed: cfg.seed }
}

// ── Inference ───────────────────────────────────────────────────

function traverseTree(tree: DecisionTree, sample: Sample): ClassLabel {
  let id = tree.rootId
  for (;;) {
    const node = tree.nodes.get(id)
    if (!node) return 0
    if (node.isLeaf || node.leftId === undefined || node.rightId === undefined) {
      return node.prediction
    }
    const v = featureValue(sample, node.feature!)
    id = v <= node.threshold! ? node.leftId : node.rightId
  }
}

/** Predict with a subset of trees (for progressive forest animation). */
export function predictForest(
  forest: Forest,
  sample: Sample,
  treeCount?: number,
): { votes: [number, number, number]; prediction: ClassLabel } {
  const votes: [number, number, number] = [0, 0, 0]
  const limit = Math.min(treeCount ?? forest.trees.length, forest.trees.length)
  for (let i = 0; i < limit; i++) {
    const pred = traverseTree(forest.trees[i], sample)
    votes[pred]++
  }
  return { votes, prediction: majorityClass(votes) }
}

export function predictTree(tree: DecisionTree, sample: Sample): ClassLabel {
  return traverseTree(tree, sample)
}

/** Grid of predictions for decision region visualization. */
export function decisionGrid(
  forest: Forest,
  treeCount: number,
  resolution = 48,
  domain = { min: -2.2, max: 2.2 },
): { labels: ClassLabel[]; resolution: number; domain: typeof domain } {
  const labels: ClassLabel[] = []
  const { min, max } = domain
  for (let j = 0; j < resolution; j++) {
    for (let i = 0; i < resolution; i++) {
      const x = min + ((i + 0.5) / resolution) * (max - min)
      const y = max - ((j + 0.5) / resolution) * (max - min) // top→bottom for canvas
      const { prediction } = predictForest(
        forest,
        { x, y, label: 0 },
        treeCount,
      )
      labels.push(prediction)
    }
  }
  return { labels, resolution, domain }
}

// ── Layout for SVG tree ─────────────────────────────────────────

export interface LayoutNode {
  id: string
  x: number
  y: number
  node: TreeNode
}

export interface TreeLayout {
  nodes: LayoutNode[]
  edges: { from: string; to: string }[]
  width: number
  height: number
}

/** Simple tidy-ish layout: leaves spaced evenly, parents centered. */
export function layoutTree(
  tree: DecisionTree,
  /** Only include nodes that have "grown" so far */
  visibleIds: Set<string>,
  opts?: { xGap?: number; yGap?: number },
): TreeLayout {
  const xGap = opts?.xGap ?? 72
  const yGap = opts?.yGap ?? 78

  // Collect visible nodes that are in the tree
  const visible: TreeNode[] = []
  for (const id of tree.growthOrder) {
    if (!visibleIds.has(id)) continue
    const n = tree.nodes.get(id)
    if (n) visible.push(n)
  }

  if (visible.length === 0) {
    return { nodes: [], edges: [], width: 200, height: 120 }
  }

  // Assign leaf order among visible leaves (or nodes with missing children)
  const leafOrder: string[] = []
  function walkLeaves(id: string) {
    const n = tree.nodes.get(id)
    if (!n || !visibleIds.has(id)) return
    const leftVis = n.leftId && visibleIds.has(n.leftId)
    const rightVis = n.rightId && visibleIds.has(n.rightId)
    if (n.isLeaf || (!leftVis && !rightVis)) {
      leafOrder.push(id)
      return
    }
    if (leftVis) walkLeaves(n.leftId!)
    if (rightVis) walkLeaves(n.rightId!)
    // If only one side missing, still treat as extending
    if (!leftVis && rightVis) {
      /* right already walked */
    }
    if (leftVis && !rightVis) {
      /* left already walked */
    }
  }
  if (visibleIds.has(tree.rootId)) walkLeaves(tree.rootId)
  else {
    for (const n of visible) leafOrder.push(n.id)
  }

  const leafIndex = new Map(leafOrder.map((id, i) => [id, i]))
  const xOf = new Map<string, number>()

  function assignX(id: string): number {
    if (xOf.has(id)) return xOf.get(id)!
    const n = tree.nodes.get(id)!
    const leftVis = n.leftId && visibleIds.has(n.leftId)
    const rightVis = n.rightId && visibleIds.has(n.rightId)
    let x: number
    if (n.isLeaf || (!leftVis && !rightVis)) {
      x = (leafIndex.get(id) ?? 0) * xGap
    } else if (leftVis && rightVis) {
      x = (assignX(n.leftId!) + assignX(n.rightId!)) / 2
    } else if (leftVis) {
      x = assignX(n.leftId!)
    } else {
      x = assignX(n.rightId!)
    }
    xOf.set(id, x)
    return x
  }

  for (const n of visible) assignX(n.id)

  // Normalize x to padding
  let minX = Infinity
  let maxX = -Infinity
  for (const n of visible) {
    const x = xOf.get(n.id)!
    if (x < minX) minX = x
    if (x > maxX) maxX = x
  }
  const pad = 48
  const nodes: LayoutNode[] = visible.map((n) => ({
    id: n.id,
    x: pad + (xOf.get(n.id)! - minX),
    y: pad + n.depth * yGap,
    node: n,
  }))

  const edges: { from: string; to: string }[] = []
  for (const n of visible) {
    if (n.leftId && visibleIds.has(n.leftId)) {
      edges.push({ from: n.id, to: n.leftId })
    }
    if (n.rightId && visibleIds.has(n.rightId)) {
      edges.push({ from: n.id, to: n.rightId })
    }
  }

  const width = Math.max(280, maxX - minX + pad * 2)
  const maxDepth = Math.max(...visible.map((n) => n.depth))
  const height = pad * 2 + maxDepth * yGap + 24

  return { nodes, edges, width, height }
}

/** Flatten growth across forest: tree0 all nodes, then tree1, ... */
export function forestGrowthTimeline(forest: Forest): {
  treeIndex: number
  nodeId: string
}[] {
  const events: { treeIndex: number; nodeId: string }[] = []
  for (const tree of forest.trees) {
    for (const nodeId of tree.growthOrder) {
      events.push({ treeIndex: tree.id, nodeId })
    }
  }
  return events
}

export const CLASS_COLORS = [
  { fill: '#22d3ee', soft: 'rgba(34,211,238,0.25)', name: 'Class 0' },
  { fill: '#fbbf24', soft: 'rgba(251,191,36,0.25)', name: 'Class 1' },
  { fill: '#a78bfa', soft: 'rgba(167,139,250,0.25)', name: 'Class 2' },
] as const

export const FEATURE_NAMES = ['x', 'y'] as const
