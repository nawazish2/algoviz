import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react'
import {
  Check,
  Camera,
  Link2,
  Loader2,
  Code2,
  BookOpen,
  Maximize2,
  Minimize2,
  MoreHorizontal,
  Keyboard,
  Palette,
} from 'lucide-react'
import { getShareUrl, getEmbedSnippet } from '../../hooks/useUrlSync'
import {
  exportMainScreenshot,
  makeExportFilename,
} from '../../lib/exportScreenshot'
import { useVisualizerStore } from '../../store/useVisualizerStore'
import { useUiStore, type ThemeId } from '../../store/useUiStore'
import { ALGO_TO_PARAM } from '../../lib/urlState'
import { cn } from '../../lib/utils'

const THEME_META: Record<
  ThemeId,
  { label: string; swatch: string }
> = {
  midnight: { label: 'Midnight', swatch: '#6366f1' },
  neon: { label: 'Neon', swatch: '#e879f9' },
  aurora: { label: 'Aurora', swatch: '#34d399' },
}

export function Toolbar({
  exportRootRef,
}: {
  exportRootRef: RefObject<HTMLElement | null>
}) {
  const algorithm = useVisualizerStore((s) => s.algorithm)
  const theme = useUiStore((s) => s.theme)
  const cycleTheme = useUiStore((s) => s.cycleTheme)
  const showLearning = useUiStore((s) => s.showLearning)
  const toggleLearning = useUiStore((s) => s.toggleLearning)
  const embed = useUiStore((s) => s.embed)
  const setEmbed = useUiStore((s) => s.setEmbed)
  const pushToast = useUiStore((s) => s.pushToast)
  const setShowShortcuts = useUiStore((s) => s.setShowShortcuts)

  const [copied, setCopied] = useState<'link' | 'embed' | null>(null)
  const [exporting, setExporting] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  // Close overflow on outside click / Escape
  useEffect(() => {
    if (!menuOpen) return
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  const share = async () => {
    const url = getShareUrl()
    try {
      await navigator.clipboard.writeText(url)
      setCopied('link')
      setTimeout(() => setCopied(null), 1600)
      pushToast({
        tone: 'success',
        title: 'Link copied',
        body: 'Anyone opening it gets this exact setup.',
      })
    } catch {
      window.prompt('Copy this link:', url)
    }
  }

  const copyEmbed = async () => {
    const snippet = getEmbedSnippet()
    try {
      await navigator.clipboard.writeText(snippet)
      setCopied('embed')
      setTimeout(() => setCopied(null), 1600)
      setMenuOpen(false)
      pushToast({
        tone: 'fun',
        title: 'Embed code copied',
        body: 'Paste into Notion, docs, or a blog iframe.',
      })
    } catch {
      window.prompt('Copy embed HTML:', snippet)
    }
  }

  const shot = async () => {
    const el = exportRootRef.current
    if (!el || exporting) return
    setExporting(true)
    try {
      const name = makeExportFilename(ALGO_TO_PARAM[algorithm] ?? algorithm)
      await exportMainScreenshot(el, name)
      pushToast({
        tone: 'success',
        title: 'PNG exported',
        body: 'Saved to downloads.',
      })
    } catch (e) {
      console.error(e)
      pushToast({
        tone: 'info',
        title: 'Export failed',
        body: 'Try again in a moment.',
      })
    } finally {
      setExporting(false)
    }
  }

  const toggleEmbed = () => {
    setEmbed(!embed)
    setMenuOpen(false)
    pushToast({
      tone: 'info',
      title: embed ? 'Full UI restored' : 'Embed preview',
      body: embed
        ? 'Sidebar and controls are back.'
        : 'Minimal chrome — like an embedded widget.',
    })
  }

  return (
    <div ref={rootRef} data-export-ignore className="relative">
      {/* Compact icon bar */}
      <div
        className={cn(
          'flex items-center gap-0.5 rounded-full p-1',
          'border border-white/[0.08] bg-black/45 shadow-lg shadow-black/30',
          'backdrop-blur-xl',
        )}
      >
        <IconBtn
          label="Copy share link (S)"
          onClick={share}
          active={copied === 'link'}
          success={copied === 'link'}
        >
          {copied === 'link' ? (
            <Check className="h-4 w-4" strokeWidth={2.25} />
          ) : (
            <Link2 className="h-4 w-4" strokeWidth={2} />
          )}
        </IconBtn>

        <IconBtn
          label="Export PNG (E)"
          onClick={shot}
          disabled={exporting}
        >
          {exporting ? (
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
          ) : (
            <Camera className="h-4 w-4" strokeWidth={2} />
          )}
        </IconBtn>

        {!embed && (
          <>
            <Divider />
            <IconBtn
              label="Toggle learn panel (L)"
              onClick={toggleLearning}
              active={showLearning}
            >
              <BookOpen className="h-4 w-4" strokeWidth={2} />
            </IconBtn>
          </>
        )}

        <Divider />

        <IconBtn
          label="More options"
          onClick={() => setMenuOpen((o) => !o)}
          active={menuOpen}
        >
          <MoreHorizontal className="h-4 w-4" strokeWidth={2} />
        </IconBtn>
      </div>

      {/* Overflow menu */}
      {menuOpen && (
        <div
          role="menu"
          className={cn(
            'absolute right-0 top-[calc(100%+8px)] z-50 w-56 overflow-hidden',
            'rounded-2xl border border-white/[0.08] bg-[#0c0c12]/95',
            'shadow-2xl shadow-black/50 backdrop-blur-xl',
            'animate-in fade-in zoom-in-95',
          )}
          style={{ animationDuration: '120ms' }}
        >
          <div className="p-1.5">
            <MenuItem
              icon={<Code2 className="h-3.5 w-3.5" />}
              label="Copy embed HTML"
              hint="I"
              onClick={copyEmbed}
              trailing={
                copied === 'embed' ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : undefined
              }
            />
            <MenuItem
              icon={
                embed ? (
                  <Minimize2 className="h-3.5 w-3.5" />
                ) : (
                  <Maximize2 className="h-3.5 w-3.5" />
                )
              }
              label={embed ? 'Exit embed view' : 'Embed / cinematic view'}
              onClick={toggleEmbed}
            />
          </div>

          <div className="mx-2 h-px bg-white/[0.06]" />

          <div className="p-1.5">
            <MenuItem
              icon={<Palette className="h-3.5 w-3.5" />}
              label="Theme"
              hint="T"
              onClick={() => {
                cycleTheme()
                const next = useUiStore.getState().theme
                pushToast({
                  tone: 'fun',
                  title: `Theme · ${THEME_META[next].label}`,
                  body: 'Midnight · Neon · Aurora',
                })
              }}
              trailing={
                <span className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                  <span
                    className="h-2 w-2 rounded-full ring-1 ring-white/20"
                    style={{ background: THEME_META[theme].swatch }}
                  />
                  {THEME_META[theme].label}
                </span>
              }
            />
            <MenuItem
              icon={<Keyboard className="h-3.5 w-3.5" />}
              label="Keyboard shortcuts"
              hint="?"
              onClick={() => {
                setMenuOpen(false)
                setShowShortcuts(true)
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function Divider() {
  return <span className="mx-0.5 h-4 w-px shrink-0 bg-white/10" aria-hidden />
}

function IconBtn({
  children,
  onClick,
  label,
  active,
  success,
  disabled,
}: {
  children: ReactNode
  onClick: () => void
  label: string
  active?: boolean
  success?: boolean
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        'relative flex h-8 w-8 items-center justify-center rounded-full transition',
        'text-zinc-400 hover:bg-white/[0.08] hover:text-white',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/50',
        active && !success && 'bg-white/[0.1] text-white',
        success && 'bg-emerald-500/15 text-emerald-300',
        disabled && 'cursor-not-allowed opacity-40',
      )}
    >
      {children}
    </button>
  )
}

function MenuItem({
  icon,
  label,
  hint,
  onClick,
  trailing,
}: {
  icon: ReactNode
  label: string
  hint?: string
  onClick: () => void
  trailing?: ReactNode
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition',
        'text-zinc-300 hover:bg-white/[0.06] hover:text-white',
      )}
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-zinc-400">
        {icon}
      </span>
      <span className="min-w-0 flex-1 text-[12px] font-medium">{label}</span>
      {trailing}
      {hint && !trailing && (
        <kbd className="rounded-md bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px] text-zinc-600 ring-1 ring-white/[0.06]">
          {hint}
        </kbd>
      )}
    </button>
  )
}
