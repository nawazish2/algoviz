import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useUiStore } from '../../store/useUiStore'
import { cn } from '../../lib/utils'

export function ToastStack() {
  const toasts = useUiStore((s) => s.toasts)
  const dismiss = useUiStore((s) => s.dismissToast)

  return (
    <div
      data-export-ignore
      className="pointer-events-none fixed bottom-5 right-5 z-50 flex w-72 flex-col gap-2"
    >
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            className={cn(
              'pointer-events-auto rounded-2xl px-3.5 py-3 shadow-2xl ring-1 backdrop-blur-xl',
              t.tone === 'success' &&
                'bg-emerald-950/90 ring-emerald-500/30',
              t.tone === 'fun' && 'bg-surface-900/95 ring-amber-500/25',
              t.tone === 'info' && 'bg-surface-900/95 ring-white/10',
            )}
          >
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white">{t.title}</p>
                {t.body && (
                  <p className="mt-0.5 text-[11px] leading-snug text-zinc-400">
                    {t.body}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="rounded-md p-0.5 text-zinc-500 hover:text-zinc-300"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
