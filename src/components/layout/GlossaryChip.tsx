import { GLOSSARY } from '../../lib/learning'
import { useUiStore } from '../../store/useUiStore'
import { cn } from '../../lib/utils'

export function GlossaryChip({
  termId,
  compact,
}: {
  termId: string
  compact?: boolean
}) {
  const term = GLOSSARY[termId]
  const open = useUiStore((s) => s.openGlossary)
  const active = useUiStore((s) => s.glossaryTermId === termId)
  if (!term) return null

  return (
    <button
      type="button"
      onClick={() => open(termId)}
      className={cn(
        'rounded-lg font-medium ring-1 transition',
        compact
          ? 'px-1.5 py-0.5 text-[9px]'
          : 'px-2 py-1 text-[10px]',
        active
          ? 'bg-cyan-500/20 text-cyan-200 ring-cyan-500/40'
          : 'bg-white/5 text-zinc-400 ring-white/10 hover:bg-white/10 hover:text-zinc-200',
      )}
      title={term.short}
    >
      {term.term}
    </button>
  )
}
