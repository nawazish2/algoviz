/**
 * K-Means clustering for 2D educational visualization.
 */

export type DatasetKind = 'blobs' | 'moons' | 'xor'

export interface Point {
  x: number
  y: number
}

export interface KMeansConfig {
  k: number
  nSamples: number
  dataset: DatasetKind
  seed: number
  maxIter: number
}

export const DEFAULT_KMEANS: KMeansConfig = {
  k: 3,
  nSamples: 140,
  dataset: 'blobs',
  seed: 42,
  maxIter: 15,
}

export interface KMeansStep {
  /** Centroids after this iteration's update */
  centroids: Point[]
  /** Assignment of each point to a cluster */
  assignments: number[]
  /** Inertia (sum of squared distances to assigned centroid) */
  inertia: number
  /** Max centroid movement this iteration */
  movement: number
}

export interface KMeansRun {
  points: Point[]
  /** steps[0] = initial centroids + first assignment; then each iter */
  steps: KMeansStep[]
  k: number
  seed: number
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
  const u = Math.max(1e-12, rng())
  const v = rng()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

// ── Data ────────────────────────────────────────────────────────

export function generatePoints(
  kind: DatasetKind,
  n: number,
  seed: number,
  kHint = 3,
): Point[] {
  const rng = mulberry32(seed)
  const points: Point[] = []

  if (kind === 'blobs') {
    const centers: Point[] = []
    for (let i = 0; i < kHint; i++) {
      const angle = (i / kHint) * Math.PI * 2 + 0.3
      centers.push({
        x: Math.cos(angle) * 1.1,
        y: Math.sin(angle) * 1.1,
      })
    }
    for (let i = 0; i < n; i++) {
      const c = centers[i % centers.length]
      points.push({
        x: c.x + randn(rng) * 0.38,
        y: c.y + randn(rng) * 0.38,
      })
    }
  } else if (kind === 'moons') {
    const half = Math.floor(n / 2)
    for (let i = 0; i < half; i++) {
      const t = (Math.PI * i) / Math.max(1, half - 1)
      points.push({
        x: Math.cos(t) + randn(rng) * 0.1,
        y: Math.sin(t) + randn(rng) * 0.1,
      })
    }
    for (let i = 0; i < n - half; i++) {
      const t = (Math.PI * i) / Math.max(1, n - half - 1)
      points.push({
        x: 1 - Math.cos(t) + randn(rng) * 0.1,
        y: 0.5 - Math.sin(t) + randn(rng) * 0.1 - 0.35,
      })
    }
  } else {
    for (let i = 0; i < n; i++) {
      const x = (rng() * 2 - 1) * 1.5
      const y = (rng() * 2 - 1) * 1.5
      points.push({ x: x + randn(rng) * 0.06, y: y + randn(rng) * 0.06 })
    }
  }

  for (let i = points.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[points[i], points[j]] = [points[j], points[i]]
  }
  return points
}

// ── K-Means ─────────────────────────────────────────────────────

function dist2(a: Point, b: Point): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return dx * dx + dy * dy
}

function assign(points: Point[], centroids: Point[]): number[] {
  return points.map((p) => {
    let best = 0
    let bestD = Infinity
    for (let c = 0; c < centroids.length; c++) {
      const d = dist2(p, centroids[c])
      if (d < bestD) {
        bestD = d
        best = c
      }
    }
    return best
  })
}

function updateCentroids(
  points: Point[],
  assignments: number[],
  k: number,
  prev: Point[],
): Point[] {
  const sums = Array.from({ length: k }, () => ({ x: 0, y: 0, n: 0 }))
  for (let i = 0; i < points.length; i++) {
    const c = assignments[i]
    sums[c].x += points[i].x
    sums[c].y += points[i].y
    sums[c].n++
  }
  return sums.map((s, i) => {
    if (s.n === 0) return { ...prev[i] } // keep empty cluster centroid
    return { x: s.x / s.n, y: s.y / s.n }
  })
}

function inertia(points: Point[], assignments: number[], centroids: Point[]): number {
  let sum = 0
  for (let i = 0; i < points.length; i++) {
    sum += dist2(points[i], centroids[assignments[i]])
  }
  return sum
}

function maxMove(a: Point[], b: Point[]): number {
  let m = 0
  for (let i = 0; i < a.length; i++) {
    m = Math.max(m, Math.sqrt(dist2(a[i], b[i])))
  }
  return m
}

/** k-means++ style init for nicer demos */
function initCentroids(points: Point[], k: number, rng: () => number): Point[] {
  const centroids: Point[] = []
  const first = points[Math.floor(rng() * points.length)]
  centroids.push({ ...first })

  while (centroids.length < k) {
    const dists = points.map((p) => {
      let minD = Infinity
      for (const c of centroids) minD = Math.min(minD, dist2(p, c))
      return minD
    })
    const total = dists.reduce((a, b) => a + b, 0) || 1
    let r = rng() * total
    let idx = 0
    for (let i = 0; i < dists.length; i++) {
      r -= dists[i]
      if (r <= 0) {
        idx = i
        break
      }
      idx = i
    }
    centroids.push({ ...points[idx] })
  }
  return centroids
}

export function runKMeans(cfg: KMeansConfig): KMeansRun {
  const rng = mulberry32(cfg.seed)
  const points = generatePoints(cfg.dataset, cfg.nSamples, cfg.seed, cfg.k)
  let centroids = initCentroids(points, cfg.k, rng)
  const steps: KMeansStep[] = []

  // Initial assignment (iteration 0)
  let assignments = assign(points, centroids)
  steps.push({
    centroids: centroids.map((c) => ({ ...c })),
    assignments: [...assignments],
    inertia: inertia(points, assignments, centroids),
    movement: 0,
  })

  for (let iter = 0; iter < cfg.maxIter; iter++) {
    const next = updateCentroids(points, assignments, cfg.k, centroids)
    const movement = maxMove(centroids, next)
    centroids = next
    assignments = assign(points, centroids)
    steps.push({
      centroids: centroids.map((c) => ({ ...c })),
      assignments: [...assignments],
      inertia: inertia(points, assignments, centroids),
      movement,
    })
    if (movement < 1e-4) break
  }

  return { points, steps, k: cfg.k, seed: cfg.seed }
}

export const CLUSTER_COLORS = [
  '#22d3ee',
  '#fbbf24',
  '#a78bfa',
  '#34d399',
  '#fb7185',
  '#60a5fa',
  '#f472b6',
  '#facc15',
] as const

/** Soft fill for Voronoi-ish background cells */
export function clusterColor(i: number, alpha = 1): string {
  const hex = CLUSTER_COLORS[i % CLUSTER_COLORS.length]
  if (alpha >= 1) return hex
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}
