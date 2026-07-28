import { BookOpen, ChevronRight, X, GraduationCap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GLOSSARY,
  LESSONS,
  difficultyLabel,
  glossaryBlurb,
  type Difficulty,
} from '../../lib/learning'
import { useVisualizerStore } from '../../store/useVisualizerStore'
import { useUiStore } from '../../store/useUiStore'
import { cn } from '../../lib/utils'
import { GlossaryChip } from './GlossaryChip'

export function LearningPanel() {
  const algorithm = useVisualizerStore((s) => s.algorithm)
  const show = useUiStore((s) => s.showLearning)
  const setShow = useUiStore((s) => s.setShowLearning)
  const difficulty = useUiStore((s) => s.difficulty)
  const setDifficulty = useUiStore((s) => s.setDifficulty)
  const glossaryTermId = useUiStore((s) => s.glossaryTermId)
  const closeGlossary = useUiStore((s) => s.closeGlossary)
  const embed = useUiStore((s) => s.embed)

  if (embed) return null

  const lesson = LESSONS[algorithm]
  const term = glossaryTermId ? GLOSSARY[glossaryTermId] : null

  return (
    <AnimatePresence>
      {show && (
        <motion.aside
          data-export-ignore
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 24 }}
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          className="absolute bottom-4 right-4 z-20 flex max-h-[min(70vh,560px)] w-[min(100%-2rem,340px)] flex-col overflow-hidden rounded-2xl border border-white/10 bg-surface-900/92 shadow-2xl shadow-black/40 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between border-b border-white/5 px-3.5 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-300">
                <BookOpen className="h-3.5 w-3.5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Learn</p>
                <p className="text-[10px] text-zinc-500">{lesson.title}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShow(false)}
              className="rounded-lg p-1 text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
              title="Hide learning panel (L)"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Difficulty */}
          <div className="flex items-center gap-1 border-b border-white/5 px-3 py-2">
            <GraduationCap className="mr-1 h-3.5 w-3.5 text-zinc-500" />
            {(['beginner', 'curious', 'nerd'] as Difficulty[]).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDifficulty(d)}
                className={cn(
                  'rounded-lg px-2 py-1 text-[10px] font-medium transition',
                  difficulty === d
                    ? 'bg-indigo-500/20 text-indigo-200 ring-1 ring-indigo-500/40'
                    : 'text-zinc-500 hover:text-zinc-300',
                )}
              >
                {difficultyLabel(d)}
              </button>
            ))}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-3.5">
            <p className="text-sm font-medium leading-snug text-zinc-100">
              {lesson.oneLiner}
            </p>
            <p className="mt-2 text-[11px] leading-relaxed text-zinc-400">
              {lesson.intuition}
            </p>

            {/* Why / watch for */}
            <div className="mt-3 rounded-xl bg-amber-500/5 p-2.5 ring-1 ring-amber-500/15">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-400/90">
                Watch for
              </p>
              <ul className="mt-1.5 space-y-1">
                {lesson.watchFor.map((w) => (
                  <li
                    key={w}
                    className="flex gap-1.5 text-[11px] leading-snug text-zinc-400"
                  >
                    <ChevronRight className="mt-0.5 h-3 w-3 shrink-0 text-amber-500/70" />
                    {w}
                  </li>
                ))}
              </ul>
            </div>

            {/* Steps */}
            <ol className="mt-4 space-y-2.5">
              {lesson.steps.map((step, i) => (
                <li
                  key={step.title}
                  className="rounded-xl bg-white/[0.03] p-2.5 ring-1 ring-white/5"
                >
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-indigo-500/20 font-mono text-[10px] text-indigo-300">
                      {i + 1}
                    </span>
                    <span className="text-xs font-semibold text-zinc-200">
                      {step.title}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-500">
                    {step.body}
                  </p>
                  {step.formula && (
                    <pre className="mt-1.5 overflow-x-auto rounded-lg bg-black/30 px-2 py-1.5 font-mono text-[10px] text-cyan-300/90">
                      {step.formula}
                    </pre>
                  )}
                  {step.tip && difficulty !== 'nerd' && (
                    <p className="mt-1.5 text-[10px] text-emerald-400/80">
                      💡 {step.tip}
                    </p>
                  )}
                </li>
              ))}
            </ol>

            {/* Glossary chips */}
            <div className="mt-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                Glossary
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {lesson.terms.map((id) => (
                  <GlossaryChip key={id} termId={id} />
                ))}
              </div>
            </div>

            <p className="mt-4 text-[11px] leading-relaxed text-zinc-500">
              <span className="text-zinc-400">Try next: </span>
              {lesson.tryNext}
            </p>
          </div>

          {/* Glossary popover */}
          <AnimatePresence>
            {term && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="border-t border-white/10 bg-surface-950/95 p-3.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold text-white">
                      {term.term}
                    </p>
                    <p className="text-[10px] text-zinc-500">{term.short}</p>
                  </div>
                  <button
                    type="button"
                    onClick={closeGlossary}
                    className="rounded p-0.5 text-zinc-500 hover:text-zinc-300"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-zinc-400">
                  {glossaryBlurb(term, difficulty)}
                </p>
                {term.related && term.related.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {term.related.map((id) => (
                      <GlossaryChip key={id} termId={id} compact />
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}

/** Floating reopen button when panel is closed */
export function LearningFab() {
  const show = useUiStore((s) => s.showLearning)
  const setShow = useUiStore((s) => s.setShowLearning)
  const embed = useUiStore((s) => s.embed)
  if (show || embed) return null
  return (
    <button
      data-export-ignore
      type="button"
      onClick={() => setShow(true)}
      className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 rounded-full bg-indigo-500/90 px-3 py-2 text-[11px] font-medium text-white shadow-lg shadow-indigo-500/30 ring-1 ring-white/10 hover:bg-indigo-400"
    >
      <BookOpen className="h-3.5 w-3.5" />
      Learn
      <kbd className="rounded bg-black/20 px-1 font-mono text-[9px]">L</kbd>
    </button>
  )
}
