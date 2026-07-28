import { lazy, Suspense, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Sidebar } from './components/layout/Sidebar'
import { Toolbar } from './components/layout/Toolbar'
import { AmbientBackground } from './components/layout/AmbientBackground'
import { ToastStack } from './components/layout/ToastStack'
import { ShortcutsModal } from './components/layout/ShortcutsModal'
import { ConfettiBurst } from './components/layout/ConfettiBurst'
import {
  LearningPanel,
  LearningFab,
} from './components/layout/LearningPanel'
import { useVisualizerStore } from './store/useVisualizerStore'
import { useUiStore } from './store/useUiStore'
import { useUrlSync } from './hooks/useUrlSync'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useCelebration } from './hooks/useCelebration'

const GradientDescentView = lazy(() =>
  import('./components/gradient-descent/GradientDescentView').then((m) => ({
    default: m.GradientDescentView,
  })),
)
const AttentionView = lazy(() =>
  import('./components/attention/AttentionView').then((m) => ({
    default: m.AttentionView,
  })),
)
const ForestView = lazy(() =>
  import('./components/forest/ForestView').then((m) => ({
    default: m.ForestView,
  })),
)
const KMeansView = lazy(() =>
  import('./components/kmeans/KMeansView').then((m) => ({
    default: m.KMeansView,
  })),
)

function AlgoFallback() {
  return (
    <div className="flex h-full w-full flex-1 items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-400/30 border-t-indigo-400" />
        <p className="text-xs text-zinc-500">Loading visualizer…</p>
      </div>
    </div>
  )
}

export default function App() {
  useUrlSync()
  useCelebration()
  const active = useVisualizerStore((s) => s.algorithm)
  const embed = useUiStore((s) => s.embed)
  const exportRootRef = useRef<HTMLElement | null>(null)
  useKeyboardShortcuts(exportRootRef)

  return (
    <div className="flex h-full w-full bg-surface-950 text-zinc-200">
      {!embed && <Sidebar />}

      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <AmbientBackground />

        {/* Sit over the canvas, not the right controls rail (~320px) */}
        <div
          className={
            embed
              ? 'pointer-events-none absolute right-3 top-3 z-30'
              : 'pointer-events-none absolute right-[336px] top-3 z-30 max-[900px]:right-3'
          }
        >
          <div className="pointer-events-auto">
            <Toolbar exportRootRef={exportRootRef} />
          </div>
        </div>

        <main
          ref={exportRootRef}
          className="relative z-10 flex min-h-0 min-w-0 flex-1"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              className="flex h-full min-h-0 w-full min-w-0 flex-1"
              initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <Suspense fallback={<AlgoFallback />}>
                {active === 'gradient-descent' && <GradientDescentView />}
                {active === 'attention' && <AttentionView />}
                {active === 'random-forest' && <ForestView />}
                {active === 'kmeans' && <KMeansView />}
              </Suspense>
            </motion.div>
          </AnimatePresence>

          <LearningPanel />
          <LearningFab />
        </main>
      </div>

      <ToastStack />
      <ShortcutsModal />
      <ConfettiBurst />
    </div>
  )
}
