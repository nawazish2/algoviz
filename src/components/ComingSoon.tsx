import { motion } from 'framer-motion'

interface ComingSoonProps {
  title: string
  description: string
  phase: string
  bullets: string[]
}

export function ComingSoon({
  title,
  description,
  phase,
  bullets,
}: ComingSoonProps) {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-surface-950">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-1/3 h-64 w-64 rounded-full bg-violet-600/10 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 max-w-md px-6 text-center"
      >
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-zinc-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
          {phase}
        </span>
        <h2 className="mt-4 text-2xl font-semibold tracking-tight text-white">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          {description}
        </p>
        <ul className="mt-6 space-y-2 text-left">
          {bullets.map((b) => (
            <li
              key={b}
              className="flex items-start gap-2 rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2 text-xs text-zinc-300"
            >
              <span className="mt-0.5 text-cyan-400">▸</span>
              {b}
            </li>
          ))}
        </ul>
      </motion.div>
    </div>
  )
}
