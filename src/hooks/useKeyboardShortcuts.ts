import { useEffect, type RefObject } from 'react'
import { useVisualizerStore, type AlgorithmId } from '../store/useVisualizerStore'
import { useForestStore } from '../store/useForestStore'
import { useKMeansStore } from '../store/useKMeansStore'
import { useUiStore } from '../store/useUiStore'
import { PLAYGROUND } from '../lib/playground'
import { getShareUrl, getEmbedSnippet } from './useUrlSync'
import {
  exportMainScreenshot,
  makeExportFilename,
} from '../lib/exportScreenshot'
import { ALGO_TO_PARAM } from '../lib/urlState'

const ALGO_KEYS: Record<string, AlgorithmId> = {
  '1': 'gradient-descent',
  '2': 'attention',
  '3': 'random-forest',
  '4': 'kmeans',
}

export function useKeyboardShortcuts(
  exportRootRef: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const tag = target?.tagName
      if (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        target?.isContentEditable
      ) {
        return
      }

      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault()
        useUiStore.getState().toggleShortcuts()
        return
      }
      if (e.key === 'Escape') {
        useUiStore.getState().setShowShortcuts(false)
        useUiStore.getState().closeGlossary()
        return
      }

      if (ALGO_KEYS[e.key]) {
        e.preventDefault()
        useVisualizerStore.getState().setAlgorithm(ALGO_KEYS[e.key])
        return
      }

      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault()
        const algo = useVisualizerStore.getState().algorithm
        if (algo === 'gradient-descent') {
          useVisualizerStore.getState().togglePlay()
        } else if (algo === 'random-forest') {
          useForestStore.getState().togglePlay()
        } else if (algo === 'kmeans') {
          useKMeansStore.getState().togglePlay()
        } else {
          useUiStore.getState().pushToast({
            tone: 'info',
            title: 'Click a token',
            body: 'Attention is interactive — pick a query row on the heatmap.',
          })
        }
        return
      }

      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault()
        const algo = useVisualizerStore.getState().algorithm
        if (algo === 'gradient-descent') useVisualizerStore.getState().reset()
        else if (algo === 'random-forest')
          useForestStore.getState().resetGrowth()
        else if (algo === 'kmeans') useKMeansStore.getState().reset()
        return
      }

      if (e.key === 's' || e.key === 'S') {
        e.preventDefault()
        const url = getShareUrl()
        navigator.clipboard?.writeText(url).then(() => {
          useUiStore.getState().pushToast({
            tone: 'success',
            title: 'Link copied',
            body: 'Share this exact demo setup.',
          })
        })
        return
      }

      if (e.key === 'e' || e.key === 'E') {
        e.preventDefault()
        const el = exportRootRef.current
        if (!el) return
        const algo = useVisualizerStore.getState().algorithm
        exportMainScreenshot(
          el,
          makeExportFilename(ALGO_TO_PARAM[algo] ?? algo),
        )
          .then(() =>
            useUiStore.getState().pushToast({
              tone: 'success',
              title: 'PNG exported',
              body: 'Screenshot saved to downloads.',
            }),
          )
          .catch(() =>
            useUiStore.getState().pushToast({
              tone: 'info',
              title: 'Export failed',
              body: 'Try again in a moment.',
            }),
          )
        return
      }

      if (e.key === 'p' || e.key === 'P') {
        e.preventDefault()
        const algo = useVisualizerStore.getState().algorithm
        const pool = PLAYGROUND.filter((p) => p.algorithm === algo)
        const pick =
          pool[Math.floor(Math.random() * pool.length)] ??
          PLAYGROUND[Math.floor(Math.random() * PLAYGROUND.length)]
        pick.apply()
        useUiStore.getState().setLastPresetId(pick.id)
        useUiStore.getState().pushToast({
          tone: 'fun',
          title: `${pick.emoji} ${pick.title}`,
          body: pick.blurb,
        })
        return
      }

      if (e.key === 'l' || e.key === 'L') {
        e.preventDefault()
        useUiStore.getState().toggleLearning()
        return
      }

      if (e.key === 't' || e.key === 'T') {
        e.preventDefault()
        useUiStore.getState().cycleTheme()
        useUiStore.getState().pushToast({
          tone: 'fun',
          title: `Theme · ${useUiStore.getState().theme}`,
          body: 'Midnight · Neon · Aurora',
        })
        return
      }

      if (e.key === 'o' || e.key === 'O') {
        e.preventDefault()
        useUiStore.getState().toggleAutoOrbit()
        return
      }

      if (e.key === 'd' || e.key === 'D') {
        e.preventDefault()
        useUiStore.getState().cycleDifficulty()
        useUiStore.getState().pushToast({
          tone: 'info',
          title: `Difficulty · ${useUiStore.getState().difficulty}`,
          body: 'Beginner tips · Curious balance · Nerd formulas',
        })
        return
      }

      if (e.key === 'i' || e.key === 'I') {
        e.preventDefault()
        const snippet = getEmbedSnippet()
        navigator.clipboard?.writeText(snippet).then(() => {
          useUiStore.getState().pushToast({
            tone: 'fun',
            title: 'Embed HTML copied',
            body: 'Drop into Notion or a blog post.',
          })
        })
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [exportRootRef])
}
