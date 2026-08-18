/**
 * Tiny 2-layer MLP for the backprop visualizer.
 * Full-batch GD, ReLU hidden, sigmoid output, binary cross-entropy.
 * Seeded so share links replay the same training run.
 */

export type MlpDataset = 'xor' | 'moons' | 'blobs'

export interface LabeledPoint {
  x: number
  y: number
  label: 0 | 1
}

export interface MlpWeights {
  /** hidden × 2 */
  W1: number[][]
  b1: number[]
  /** hidden → output */
  W2: number[]
  b2: number
}

export interface MlpConfig {
  dataset: MlpDataset
  hidden: number
  lr: number
  epochs: number
  nSamples: number
  seed: number
}

export const DEFAULT_MLP: MlpConfig = {
  dataset: 'xor',
  hidden: 6,
  lr: 0.7,
  epochs: 220,
  nSamples: 80,
  seed: 42,
}

export interface MlpEpoch {
  epoch: number
  loss: number
  accuracy: number
  weights: MlpWeights
  gradNorm: number
}

export interface MlpRun {
  points: LabeledPoint[]
  epochs: MlpEpoch[]
  hidden: number
  lr: number
  seed: number
}

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

export function generateLabeled(
  kind: MlpDataset,
  n: number,
  seed: number,
): LabeledPoint[] {
  const rng = mulberry32(seed)
  const points: LabeledPoint[] = []

  if (kind === 'xor') {
    const corners: LabeledPoint[] = [
      { x: -1, y: -1, label: 0 },
      { x: -1, y: 1, label: 1 },
      { x: 1, y: -1, label: 1 },
      { x: 1, y: 1, label: 0 },
    ]
    for (let i = 0; i < n; i++) {
      const c = corners[i % 4]
      points.push({
        x: c.x + randn(rng) * 0.22,
        y: c.y + randn(rng) * 0.22,
        label: c.label,
      })
    }
  } else if (kind === 'moons') {
    const half = Math.floor(n / 2)
    for (let i = 0; i < half; i++) {
      const t = (Math.PI * i) / Math.max(1, half - 1)
      points.push({
        x: Math.cos(t) + randn(rng) * 0.1,
        y: Math.sin(t) + randn(rng) * 0.1,
        label: 0,
      })
    }
    for (let i = 0; i < n - half; i++) {
      const t = (Math.PI * i) / Math.max(1, n - half - 1)
      points.push({
        x: 1 - Math.cos(t) + randn(rng) * 0.1,
        y: 0.5 - Math.sin(t) + randn(rng) * 0.1 - 0.35,
        label: 1,
      })
    }
  } else {
    const centers = [
      { x: -0.95, y: -0.7, label: 0 as const },
      { x: 0.95, y: 0.75, label: 1 as const },
    ]
    for (let i = 0; i < n; i++) {
      const c = centers[i % 2]
      points.push({
        x: c.x + randn(rng) * 0.38,
        y: c.y + randn(rng) * 0.38,
        label: c.label,
      })
    }
  }

  for (let i = points.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[points[i], points[j]] = [points[j], points[i]]
  }
  return points
}

function relu(x: number): number {
  return x > 0 ? x : 0
}

function drelu(z: number): number {
  return z > 0 ? 1 : 0
}

export function sigmoid(x: number): number {
  if (x >= 0) {
    const z = Math.exp(-x)
    return 1 / (1 + z)
  }
  const z = Math.exp(x)
  return z / (1 + z)
}

export function bce(p: number, y: number): number {
  const eps = 1e-7
  const pp = Math.min(1 - eps, Math.max(eps, p))
  return -(y * Math.log(pp) + (1 - y) * Math.log(1 - pp))
}

export function cloneWeights(w: MlpWeights): MlpWeights {
  return {
    W1: w.W1.map((row) => row.slice()),
    b1: w.b1.slice(),
    W2: w.W2.slice(),
    b2: w.b2,
  }
}

function initWeights(hidden: number, rng: () => number): MlpWeights {
  const W1: number[][] = []
  const b1: number[] = []
  const W2: number[] = []
  const s1 = Math.sqrt(2 / 2)
  const s2 = Math.sqrt(1 / hidden)
  for (let i = 0; i < hidden; i++) {
    W1.push([randn(rng) * s1, randn(rng) * s1])
    b1.push(0)
    W2.push(randn(rng) * s2)
  }
  return { W1, b1, W2, b2: 0 }
}

export interface ForwardCache {
  z1: number[]
  a1: number[]
  z2: number
  a2: number
}

export function forward(w: MlpWeights, x: number, y: number): ForwardCache {
  const hidden = w.W1.length
  const z1 = new Array<number>(hidden)
  const a1 = new Array<number>(hidden)
  for (let i = 0; i < hidden; i++) {
    const z = w.W1[i][0] * x + w.W1[i][1] * y + w.b1[i]
    z1[i] = z
    a1[i] = relu(z)
  }
  let z2 = w.b2
  for (let i = 0; i < hidden; i++) z2 += w.W2[i] * a1[i]
  return { z1, a1, z2, a2: sigmoid(z2) }
}

export function predictProba(w: MlpWeights, x: number, y: number): number {
  return forward(w, x, y).a2
}

export function evaluate(
  w: MlpWeights,
  points: LabeledPoint[],
): { loss: number; accuracy: number } {
  let loss = 0
  let correct = 0
  for (const p of points) {
    const pred = predictProba(w, p.x, p.y)
    loss += bce(pred, p.label)
    if ((pred >= 0.5 ? 1 : 0) === p.label) correct++
  }
  const n = points.length || 1
  return { loss: loss / n, accuracy: correct / n }
}

function zeroGrads(hidden: number): {
  dW1: number[][]
  db1: number[]
  dW2: number[]
  db2: number
} {
  return {
    dW1: Array.from({ length: hidden }, () => [0, 0]),
    db1: new Array<number>(hidden).fill(0),
    dW2: new Array<number>(hidden).fill(0),
    db2: 0,
  }
}

function stepBatch(
  w: MlpWeights,
  points: LabeledPoint[],
  lr: number,
): number {
  const hidden = w.W1.length
  const g = zeroGrads(hidden)
  const n = points.length || 1

  for (const p of points) {
    const { z1, a1, a2 } = forward(w, p.x, p.y)
    const dz2 = a2 - p.label
    g.db2 += dz2
    for (let i = 0; i < hidden; i++) {
      g.dW2[i] += dz2 * a1[i]
      const dz1 = dz2 * w.W2[i] * drelu(z1[i])
      g.dW1[i][0] += dz1 * p.x
      g.dW1[i][1] += dz1 * p.y
      g.db1[i] += dz1
    }
  }

  let norm2 = 0
  const scale = 1 / n
  g.db2 *= scale
  norm2 += g.db2 * g.db2
  w.b2 -= lr * g.db2
  for (let i = 0; i < hidden; i++) {
    g.dW2[i] *= scale
    g.db1[i] *= scale
    g.dW1[i][0] *= scale
    g.dW1[i][1] *= scale
    norm2 +=
      g.dW2[i] * g.dW2[i] +
      g.db1[i] * g.db1[i] +
      g.dW1[i][0] * g.dW1[i][0] +
      g.dW1[i][1] * g.dW1[i][1]
    w.W2[i] -= lr * g.dW2[i]
    w.b1[i] -= lr * g.db1[i]
    w.W1[i][0] -= lr * g.dW1[i][0]
    w.W1[i][1] -= lr * g.dW1[i][1]
  }
  return Math.sqrt(norm2)
}

export function trainMlp(cfg: MlpConfig): MlpRun {
  const hidden = Math.min(12, Math.max(2, Math.round(cfg.hidden)))
  const epochs = Math.min(400, Math.max(20, Math.round(cfg.epochs)))
  const lr = Math.min(3, Math.max(0.01, cfg.lr))
  const rng = mulberry32(cfg.seed)
  const points = generateLabeled(cfg.dataset, cfg.nSamples, cfg.seed)
  const w = initWeights(hidden, rng)
  const snaps: MlpEpoch[] = []

  const push = (epoch: number, gradNorm: number) => {
    const { loss, accuracy } = evaluate(w, points)
    snaps.push({
      epoch,
      loss,
      accuracy,
      weights: cloneWeights(w),
      gradNorm,
    })
  }

  push(0, 0)
  for (let e = 1; e <= epochs; e++) {
    const gradNorm = stepBatch(w, points, lr)
    push(e, gradNorm)
  }

  return { points, epochs: snaps, hidden, lr, seed: cfg.seed }
}

export const CLASS_COLORS = ['#38bdf8', '#f472b6'] as const

export function classColor(label: 0 | 1, alpha = 1): string {
  const hex = CLASS_COLORS[label]
  if (alpha >= 1) return hex
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}
