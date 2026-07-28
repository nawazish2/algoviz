import { Sparkles } from 'lucide-react'
import { PLAYGROUND, PRESET_TONES } from '../../lib/playground'
import { useUiStore } from '../../store/useUiStore'
import { useVisualizerStore } from '../../store/useVisualizerStore'
import { cn } from '../../lib/utils'

export function PlaygroundPanel() {
  const algorithm = useVisualizerStore((s) => s.algorithm)
  const lastPresetId = useUiStore((s) => s.lastPresetId)
  const setLastPresetId = useUiStore((s) => s.setLastPresetId)
  const pushToast = useUiStore((s) => s.pushToast)

  // Show presets for current algo first, then a couple from others
  const forAlgo = PLAYGROUND.filter((p) => p.algorithm === algorithm)
  const others = PLAYGROUND.filter((p) => p.algorithm !== algorithm).slice(0, 2)
  const shown = [...forAlgo, ...others]

  return (
    <div className="border-t border-white/[0.06] p-3">
      <div className="mb-2 flex items-center gap-1.5 px-1">
        <Sparkles className="h-3 w-3 text-amber-400" />
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Playground
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        {shown.map((p) => {
          const active = lastPresetId === p.id
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                p.apply()
                setLastPresetId(p.id)
                pushToast({
                  tone: 'fun',
                  title: `${p.emoji} ${p.title}`,
                  body: p.blurb,
                })
              }}
              className={cn(
                'rounded-xl px-2.5 py-2 text-left ring-1 transition',
                active
                  ? PRESET_TONES[p.tone]
                  : 'bg-white/[0.02] text-zinc-300 ring-white/5 hover:bg-white/[0.05]',
              )}
            >
              <div className="flex items-center gap-1.5 text-[12px] font-medium">
                <span>{p.emoji}</span>
                <span className="truncate">{p.title}</span>
              </div>
              <p className="mt-0.5 pl-5 text-[10px] leading-snug text-zinc-500">
                {p.blurb}
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
