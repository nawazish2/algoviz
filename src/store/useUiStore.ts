import { create } from 'zustand'
import type { Difficulty } from '../lib/learning'

export type ThemeId = 'midnight' | 'neon' | 'aurora'

export interface Toast {
  id: string
  title: string
  body?: string
  tone: 'success' | 'info' | 'fun'
}

interface UiState {
  showShortcuts: boolean
  setShowShortcuts: (v: boolean) => void
  toggleShortcuts: () => void

  showLearning: boolean
  setShowLearning: (v: boolean) => void
  toggleLearning: () => void

  difficulty: Difficulty
  setDifficulty: (d: Difficulty) => void
  cycleDifficulty: () => void

  theme: ThemeId
  setTheme: (t: ThemeId) => void
  cycleTheme: () => void

  embed: boolean
  setEmbed: (v: boolean) => void

  autoOrbit: boolean
  setAutoOrbit: (v: boolean) => void
  toggleAutoOrbit: () => void

  confetti: number // bump to fire
  fireConfetti: () => void

  glossaryTermId: string | null
  openGlossary: (id: string) => void
  closeGlossary: () => void

  toasts: Toast[]
  pushToast: (t: Omit<Toast, 'id'>) => void
  dismissToast: (id: string) => void

  lastPresetId: string | null
  setLastPresetId: (id: string | null) => void

  reducedMotion: boolean
}

const THEMES: ThemeId[] = ['midnight', 'neon', 'aurora']
const DIFFS: Difficulty[] = ['beginner', 'curious', 'nerd']

function applyTheme(theme: ThemeId) {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.theme = theme
}

export const useUiStore = create<UiState>((set, get) => ({
  showShortcuts: false,
  setShowShortcuts: (v) => set({ showShortcuts: v }),
  toggleShortcuts: () => set({ showShortcuts: !get().showShortcuts }),

  showLearning: true,
  setShowLearning: (v) => set({ showLearning: v }),
  toggleLearning: () => set({ showLearning: !get().showLearning }),

  difficulty: 'curious',
  setDifficulty: (d) => set({ difficulty: d }),
  cycleDifficulty: () => {
    const i = DIFFS.indexOf(get().difficulty)
    set({ difficulty: DIFFS[(i + 1) % DIFFS.length] })
  },

  theme: 'midnight',
  setTheme: (t) => {
    applyTheme(t)
    set({ theme: t })
  },
  cycleTheme: () => {
    const i = THEMES.indexOf(get().theme)
    const next = THEMES[(i + 1) % THEMES.length]
    applyTheme(next)
    set({ theme: next })
  },

  embed: false,
  setEmbed: (v) => set({ embed: v }),

  autoOrbit: true,
  setAutoOrbit: (v) => set({ autoOrbit: v }),
  toggleAutoOrbit: () => set({ autoOrbit: !get().autoOrbit }),

  confetti: 0,
  fireConfetti: () => {
    if (get().reducedMotion) return
    set({ confetti: get().confetti + 1 })
  },

  glossaryTermId: null,
  openGlossary: (id) => set({ glossaryTermId: id, showLearning: true }),
  closeGlossary: () => set({ glossaryTermId: null }),

  toasts: [],
  pushToast: (t) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    set({ toasts: [...get().toasts.slice(-3), { ...t, id }] })
    setTimeout(() => get().dismissToast(id), 3200)
  },
  dismissToast: (id) =>
    set({ toasts: get().toasts.filter((x) => x.id !== id) }),

  lastPresetId: null,
  setLastPresetId: (id) => set({ lastPresetId: id }),

  reducedMotion:
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches,
}))

// Apply default theme ASAP
if (typeof document !== 'undefined') {
  applyTheme('midnight')
}
