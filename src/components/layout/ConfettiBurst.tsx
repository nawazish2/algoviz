import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useUiStore } from '../../store/useUiStore'

interface Piece {
  id: number
  x: number
  color: string
  rot: number
  delay: number
  size: number
}

const COLORS = [
  '#818cf8',
  '#22d3ee',
  '#fbbf24',
  '#34d399',
  '#fb7185',
  '#a78bfa',
  '#f472b6',
]

/** Full-screen confetti burst when `confetti` counter increments. */
export function ConfettiBurst() {
  const confetti = useUiStore((s) => s.confetti)
  const reduced = useUiStore((s) => s.reducedMotion)
  const [pieces, setPieces] = useState<Piece[]>([])
  const [key, setKey] = useState(0)

  useEffect(() => {
    if (!confetti || reduced) return
    const next: Piece[] = Array.from({ length: 48 }, (_, i) => ({
      id: i,
      x: 8 + Math.random() * 84,
      color: COLORS[i % COLORS.length],
      rot: Math.random() * 360,
      delay: Math.random() * 0.15,
      size: 6 + Math.random() * 8,
    }))
    setPieces(next)
    setKey(confetti)
    const t = setTimeout(() => setPieces([]), 2200)
    return () => clearTimeout(t)
  }, [confetti, reduced])

  return (
    <div
      data-export-ignore
      className="pointer-events-none fixed inset-0 z-[70] overflow-hidden"
      aria-hidden
    >
      <AnimatePresence>
        {pieces.length > 0 &&
          pieces.map((p) => (
            <motion.span
              key={`${key}-${p.id}`}
              className="absolute top-0 rounded-sm"
              style={{
                left: `${p.x}%`,
                width: p.size,
                height: p.size * 0.6,
                background: p.color,
                boxShadow: `0 0 8px ${p.color}88`,
              }}
              initial={{ y: -20, opacity: 1, rotate: p.rot }}
              animate={{
                y: '110vh',
                opacity: [1, 1, 0],
                rotate: p.rot + 400 + Math.random() * 200,
                x: (Math.random() - 0.5) * 120,
              }}
              transition={{
                duration: 1.6 + Math.random() * 0.6,
                delay: p.delay,
                ease: [0.22, 0.8, 0.3, 1],
              }}
            />
          ))}
      </AnimatePresence>
    </div>
  )
}
