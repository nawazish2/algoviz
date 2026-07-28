import { AnimatePresence, motion } from 'framer-motion'
import { Keyboard, X } from 'lucide-react'
import { useUiStore } from '../../store/useUiStore'

const ROWS: { keys: string; action: string }[] = [
  { keys: '1 – 4', action: 'Switch algorithm (GD · Attn · RF · K-Means)' },
  { keys: 'Space', action: 'Play / pause current demo' },
  { keys: 'R', action: 'Reset playback / growth' },
  { keys: 'S', action: 'Copy share link' },
  { keys: 'I', action: 'Copy iframe embed HTML' },
  { keys: 'E', action: 'Export PNG' },
  { keys: 'P', action: 'Random playground preset' },
  { keys: 'L', action: 'Toggle learning panel' },
  { keys: 'D', action: 'Cycle difficulty (Beginner → Nerd)' },
  { keys: 'T', action: 'Cycle theme (Midnight · Neon · Aurora)' },
  { keys: 'O', action: 'Toggle GD auto-orbit camera' },
  { keys: '?', action: 'Toggle this shortcuts panel' },
  { keys: 'Esc', action: 'Close panels' },
]

export function ShortcutsModal() {
  const open = useUiStore((s) => s.showShortcuts)
  const setOpen = useUiStore((s) => s.setShowShortcuts)

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          data-export-ignore
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            aria-label="Close"
            onClick={() => setOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            className="relative w-full max-w-md rounded-2xl border border-white/10 bg-surface-900/95 p-5 shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-300">
                  <Keyboard className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white">
                    Keyboard shortcuts
                  </h2>
                  <p className="text-[11px] text-zinc-500">
                    Visual · Share · Learn
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <ul className="max-h-[60vh] space-y-2 overflow-y-auto">
              {ROWS.map((row) => (
                <li
                  key={row.keys}
                  className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.03] px-3 py-2.5 ring-1 ring-white/5"
                >
                  <span className="text-xs text-zinc-400">{row.action}</span>
                  <kbd className="shrink-0 rounded-md bg-surface-800 px-2 py-1 font-mono text-[11px] text-zinc-200 ring-1 ring-white/10">
                    {row.keys}
                  </kbd>
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
