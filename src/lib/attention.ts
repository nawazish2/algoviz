/**
 * Scaled multi-head attention for the interactive visualizer.
 * Embeddings are deterministic (seeded from tokens) so demos are stable
 * and educational without a trained model.
 */

export type MaskMode = 'none' | 'causal'

export interface ExampleSentence {
  id: string
  label: string
  text: string
  note: string
}

export const EXAMPLES: ExampleSentence[] = [
  {
    id: 'cat',
    label: 'Subject–object',
    text: 'The cat sat on the mat',
    note: 'Watch "sat" attend to "cat" and "mat".',
  },
  {
    id: 'bank',
    label: 'Ambiguity',
    text: 'I went to the bank by the river',
    note: 'Context disambiguates "bank" via nearby tokens.',
  },
  {
    id: 'code',
    label: 'Code tokens',
    text: 'const sum = a + b',
    note: 'Operators and identifiers form tight local patterns.',
  },
  {
    id: 'quote',
    label: 'Long-range',
    text: 'Alice told Bob that she loved him',
    note: 'Pronouns often attend back to their antecedents.',
  },
  {
    id: 'custom',
    label: 'Custom',
    text: 'Attention is all you need',
    note: 'Edit the tokens below and recompute.',
  },
]

// ── Deterministic RNG ───────────────────────────────────────────

function hashString(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
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

// ── Linear algebra helpers ──────────────────────────────────────

export function softmax(logits: number[], temperature = 1): number[] {
  const t = Math.max(temperature, 1e-6)
  const scaled = logits.map((x) => x / t)
  const max = Math.max(...scaled)
  const exps = scaled.map((x) => Math.exp(x - max))
  const sum = exps.reduce((a, b) => a + b, 0) || 1
  return exps.map((e) => e / sum)
}

function matVec(A: number[][], v: number[]): number[] {
  return A.map((row) => row.reduce((s, a, j) => s + a * v[j], 0))
}

function zeros(rows: number, cols: number): number[][] {
  return Array.from({ length: rows }, () => Array(cols).fill(0))
}

function randomMatrix(
  rows: number,
  cols: number,
  rng: () => number,
  scale = 0.5,
): number[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => (rng() * 2 - 1) * scale),
  )
}

// ── Tokenization & embeddings ───────────────────────────────────

/** Simple whitespace tokenizer; keeps punctuation attached. */
export function tokenize(text: string): string[] {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean)
}

/** Build token embedding: content hash + sinusoidal position. */
export function embedTokens(
  tokens: string[],
  dim: number,
  seed = 42,
): number[][] {
  const rngBase = mulberry32(seed)
  // Shared random projection basis for character features
  const charBasis: Record<string, number[]> = {}

  return tokens.map((tok, pos) => {
    const vec = new Array(dim).fill(0)

    // Character bag projected into dim
    for (let i = 0; i < tok.length; i++) {
      const ch = tok[i].toLowerCase()
      if (!charBasis[ch]) {
        charBasis[ch] = Array.from({ length: dim }, () => rngBase() * 2 - 1)
      }
      const b = charBasis[ch]
      const w = 1 / Math.sqrt(tok.length)
      for (let d = 0; d < dim; d++) vec[d] += b[d] * w
    }

    // Token-level hash noise for uniqueness
    const tr = mulberry32(hashString(tok) ^ seed)
    for (let d = 0; d < dim; d++) vec[d] += (tr() * 2 - 1) * 0.25

    // Sinusoidal positional encoding
    for (let d = 0; d < dim; d++) {
      const angle = pos / Math.pow(10000, (2 * Math.floor(d / 2)) / dim)
      vec[d] += d % 2 === 0 ? Math.sin(angle) : Math.cos(angle)
    }

    // L2 normalize
    const norm = Math.hypot(...vec) || 1
    return vec.map((v) => v / norm)
  })
}

// ── Multi-head attention ────────────────────────────────────────

export interface HeadResult {
  /** [query][key] attention weights (rows sum to 1) */
  weights: number[][]
  /** [query][key] pre-softmax scores */
  scores: number[][]
  /** [query][dim] output */
  output: number[][]
}

export interface AttentionResult {
  tokens: string[]
  heads: HeadResult[]
  /** Average across heads */
  avgWeights: number[][]
  headCount: number
  dim: number
  headDim: number
}

export interface AttentionConfig {
  tokens: string[]
  numHeads: number
  modelDim: number
  temperature: number
  mask: MaskMode
  seed: number
}

export function computeAttention(cfg: AttentionConfig): AttentionResult {
  const { tokens, numHeads, modelDim, temperature, mask, seed } = cfg
  const n = tokens.length
  const headDim = Math.max(2, Math.floor(modelDim / numHeads))
  const X = embedTokens(tokens, modelDim, seed)

  const heads: HeadResult[] = []

  for (let h = 0; h < numHeads; h++) {
    const rng = mulberry32(seed + h * 9973 + 13)
    // Projection matrices Wq, Wk, Wv : modelDim × headDim
    const Wq = randomMatrix(headDim, modelDim, rng, 0.8)
    const Wk = randomMatrix(headDim, modelDim, rng, 0.8)
    const Wv = randomMatrix(headDim, modelDim, rng, 0.8)

    const Q = X.map((x) => matVec(Wq, x))
    const K = X.map((x) => matVec(Wk, x))
    const V = X.map((x) => matVec(Wv, x))

    const scale = 1 / Math.sqrt(headDim)
    const scores = zeros(n, n)
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (mask === 'causal' && j > i) {
          scores[i][j] = -1e9
        } else {
          let dot = 0
          for (let d = 0; d < headDim; d++) dot += Q[i][d] * K[j][d]
          scores[i][j] = dot * scale
        }
      }
    }

    const weights = scores.map((row) => {
      if (mask === 'causal') {
        // softmax only over non-masked positions (already -1e9)
        return softmax(row, temperature)
      }
      return softmax(row, temperature)
    })

    const output = zeros(n, headDim)
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        for (let d = 0; d < headDim; d++) {
          output[i][d] += weights[i][j] * V[j][d]
        }
      }
    }

    heads.push({ weights, scores, output })
  }

  // Average attention across heads
  const avgWeights = zeros(n, n)
  for (const head of heads) {
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        avgWeights[i][j] += head.weights[i][j] / numHeads
      }
    }
  }

  return {
    tokens,
    heads,
    avgWeights,
    headCount: numHeads,
    dim: modelDim,
    headDim,
  }
}

/** Pick active weight matrix: head index or average (-1). */
export function selectWeights(
  result: AttentionResult,
  headIndex: number,
): number[][] {
  if (headIndex < 0 || headIndex >= result.heads.length) {
    return result.avgWeights
  }
  return result.heads[headIndex].weights
}

/** Color for attention weight 0→1 (indigo → cyan → amber). */
export function attentionColor(t: number, alpha = 1): string {
  const c = Math.min(1, Math.max(0, t))
  // interpolate deep indigo → cyan → amber
  let r: number, g: number, b: number
  if (c < 0.5) {
    const u = c / 0.5
    r = 30 + (34 - 30) * u
    g = 27 + (211 - 27) * u
    b = 75 + (238 - 75) * u
  } else {
    const u = (c - 0.5) / 0.5
    r = 34 + (251 - 34) * u
    g = 211 + (191 - 211) * u
    b = 238 + (36 - 238) * u
  }
  return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${alpha})`
}

/** Background cell color for heatmap (dark → bright). */
export function heatmapCellColor(t: number): string {
  const c = Math.min(1, Math.max(0, t))
  if (c < 0.02) return 'rgba(255,255,255,0.03)'
  // power curve so mid weights stay visible
  const p = Math.pow(c, 0.65)
  return attentionColor(p, 0.25 + p * 0.75)
}
