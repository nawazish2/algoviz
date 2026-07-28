import { create } from 'zustand'
import {
  EXAMPLES,
  computeAttention,
  selectWeights,
  tokenize,
  type AttentionResult,
  type MaskMode,
} from '../lib/attention'

interface AttentionState {
  exampleId: string
  customText: string
  tokens: string[]
  numHeads: number
  modelDim: number
  temperature: number
  mask: MaskMode
  seed: number
  /** -1 = average all heads */
  activeHead: number
  /** Selected query token index (row). null = none */
  selectedQuery: number | null
  /** Hovered cell [query, key] */
  hoverCell: { q: number; k: number } | null
  result: AttentionResult
  weights: number[][]

  setExample: (id: string) => void
  setCustomText: (text: string) => void
  applyCustomText: () => void
  setNumHeads: (n: number) => void
  setTemperature: (t: number) => void
  setMask: (m: MaskMode) => void
  setActiveHead: (h: number) => void
  setSelectedQuery: (q: number | null) => void
  setHoverCell: (c: { q: number; k: number } | null) => void
  reshuffle: () => void
  recompute: () => void
  hydrate: (partial: {
    exampleId?: string
    text?: string
    numHeads?: number
    temperature?: number
    mask?: MaskMode
    activeHead?: number
    seed?: number
  }) => void
}

function build(
  tokens: string[],
  numHeads: number,
  modelDim: number,
  temperature: number,
  mask: MaskMode,
  seed: number,
  activeHead: number,
) {
  const safeTokens = tokens.length ? tokens : ['∅']
  const result = computeAttention({
    tokens: safeTokens,
    numHeads,
    modelDim,
    temperature,
    mask,
    seed,
  })
  const weights = selectWeights(result, activeHead)
  return { result, weights, tokens: safeTokens }
}

const defaultExample = EXAMPLES[0]
const defaultTokens = tokenize(defaultExample.text)

export const useAttentionStore = create<AttentionState>((set, get) => {
  const initial = build(defaultTokens, 4, 32, 1, 'none', 42, -1)

  return {
    exampleId: defaultExample.id,
    customText: defaultExample.text,
    tokens: initial.tokens,
    numHeads: 4,
    modelDim: 32,
    temperature: 1,
    mask: 'none',
    seed: 42,
    activeHead: -1,
    selectedQuery: null,
    hoverCell: null,
    result: initial.result,
    weights: initial.weights,

    setExample: (id) => {
      const ex = EXAMPLES.find((e) => e.id === id) ?? EXAMPLES[0]
      const tokens = tokenize(ex.text)
      const { numHeads, modelDim, temperature, mask, seed, activeHead } = get()
      const built = build(
        tokens,
        numHeads,
        modelDim,
        temperature,
        mask,
        seed,
        activeHead,
      )
      set({
        exampleId: id,
        customText: ex.text,
        selectedQuery: null,
        hoverCell: null,
        ...built,
      })
    },

    setCustomText: (text) => set({ customText: text }),

    applyCustomText: () => {
      const {
        customText,
        numHeads,
        modelDim,
        temperature,
        mask,
        seed,
        activeHead,
      } = get()
      const tokens = tokenize(customText)
      const built = build(
        tokens,
        numHeads,
        modelDim,
        temperature,
        mask,
        seed,
        activeHead,
      )
      set({
        exampleId: 'custom',
        selectedQuery: null,
        hoverCell: null,
        ...built,
      })
    },

    setNumHeads: (n) => {
      const heads = Math.min(8, Math.max(1, Math.round(n)))
      const { tokens, modelDim, temperature, mask, seed, activeHead } = get()
      const head = activeHead >= heads ? -1 : activeHead
      const built = build(
        tokens,
        heads,
        modelDim,
        temperature,
        mask,
        seed,
        head,
      )
      set({ numHeads: heads, activeHead: head, ...built })
    },

    setTemperature: (t) => {
      const temperature = Math.min(5, Math.max(0.1, t))
      const { tokens, numHeads, modelDim, mask, seed, activeHead } = get()
      const built = build(
        tokens,
        numHeads,
        modelDim,
        temperature,
        mask,
        seed,
        activeHead,
      )
      set({ temperature, ...built })
    },

    setMask: (mask) => {
      const { tokens, numHeads, modelDim, temperature, seed, activeHead } =
        get()
      const built = build(
        tokens,
        numHeads,
        modelDim,
        temperature,
        mask,
        seed,
        activeHead,
      )
      set({ mask, ...built })
    },

    setActiveHead: (h) => {
      const { result } = get()
      const weights = selectWeights(result, h)
      set({ activeHead: h, weights })
    },

    setSelectedQuery: (q) => set({ selectedQuery: q }),
    setHoverCell: (c) => set({ hoverCell: c }),

    reshuffle: () => {
      const seed = (get().seed + 17) % 100000
      const { tokens, numHeads, modelDim, temperature, mask, activeHead } =
        get()
      const built = build(
        tokens,
        numHeads,
        modelDim,
        temperature,
        mask,
        seed,
        activeHead,
      )
      set({ seed, selectedQuery: null, hoverCell: null, ...built })
    },

    recompute: () => {
      const {
        tokens,
        numHeads,
        modelDim,
        temperature,
        mask,
        seed,
        activeHead,
      } = get()
      const built = build(
        tokens,
        numHeads,
        modelDim,
        temperature,
        mask,
        seed,
        activeHead,
      )
      set(built)
    },

    hydrate: (partial) => {
      const cur = get()
      let exampleId = partial.exampleId ?? cur.exampleId
      let customText = partial.text ?? cur.customText
      if (partial.exampleId && partial.exampleId !== 'custom' && !partial.text) {
        const ex = EXAMPLES.find((e) => e.id === partial.exampleId)
        if (ex) customText = ex.text
      }
      if (partial.text) {
        exampleId = partial.exampleId ?? 'custom'
        customText = partial.text
      }
      const numHeads = partial.numHeads ?? cur.numHeads
      const temperature = partial.temperature ?? cur.temperature
      const mask = partial.mask ?? cur.mask
      const seed = partial.seed ?? cur.seed
      let activeHead = partial.activeHead ?? cur.activeHead
      if (activeHead >= numHeads) activeHead = -1
      const tokens = tokenize(customText)
      const built = build(
        tokens,
        numHeads,
        cur.modelDim,
        temperature,
        mask,
        seed,
        activeHead,
      )
      set({
        exampleId,
        customText,
        numHeads,
        temperature,
        mask,
        seed,
        activeHead,
        selectedQuery: null,
        hoverCell: null,
        ...built,
      })
    },
  }
})
