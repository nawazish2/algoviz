import type { AlgorithmId } from './algorithms'
import { useVisualizerStore } from '../store/useVisualizerStore'
import { useAttentionStore } from '../store/useAttentionStore'
import { useForestStore } from '../store/useForestStore'
import { useKMeansStore } from '../store/useKMeansStore'
import { useMlpStore } from '../store/useMlpStore'

/** Space — play/pause, or cycle the attention query token. */
export function togglePlayFor(id: AlgorithmId) {
  switch (id) {
    case 'gradient-descent':
      useVisualizerStore.getState().togglePlay()
      return
    case 'random-forest':
      useForestStore.getState().togglePlay()
      return
    case 'kmeans':
      useKMeansStore.getState().togglePlay()
      return
    case 'mlp':
      useMlpStore.getState().togglePlay()
      return
    case 'attention': {
      const { tokens, selectedQuery, setSelectedQuery } =
        useAttentionStore.getState()
      if (!tokens.length) return
      const next =
        selectedQuery === null ? 0 : (selectedQuery + 1) % tokens.length
      setSelectedQuery(next)
      return
    }
    default: {
      const _exhaustive: never = id
      return _exhaustive
    }
  }
}

export function resetFor(id: AlgorithmId) {
  switch (id) {
    case 'gradient-descent':
      useVisualizerStore.getState().reset()
      return
    case 'random-forest':
      useForestStore.getState().resetGrowth()
      return
    case 'kmeans':
      useKMeansStore.getState().reset()
      return
    case 'mlp':
      useMlpStore.getState().reset()
      return
    case 'attention':
      useAttentionStore.getState().setSelectedQuery(null)
      return
    default: {
      const _exhaustive: never = id
      return _exhaustive
    }
  }
}
