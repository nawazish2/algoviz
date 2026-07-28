import { useEffect, useRef } from 'react'
import type { AlgorithmId } from '../../store/useVisualizerStore'
import { useVisualizerStore } from '../../store/useVisualizerStore'
import { useUiStore } from '../../store/useUiStore'

const PALETTES: Record<
  AlgorithmId,
  { a: string; b: string; particle: string }
> = {
  'gradient-descent': {
    a: 'rgba(99,102,241,0.14)',
    b: 'rgba(34,211,238,0.08)',
    particle: '99,102,241',
  },
  attention: {
    a: 'rgba(139,92,246,0.14)',
    b: 'rgba(244,114,182,0.08)',
    particle: '167,139,250',
  },
  'random-forest': {
    a: 'rgba(16,185,129,0.12)',
    b: 'rgba(34,211,238,0.08)',
    particle: '52,211,153',
  },
  kmeans: {
    a: 'rgba(244,63,94,0.12)',
    b: 'rgba(251,191,36,0.08)',
    particle: '251,113,133',
  },
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  a: number
}

/** Soft gradient orbs + drifting particles behind the main stage. */
export function AmbientBackground() {
  const algorithm = useVisualizerStore((s) => s.algorithm)
  const reduced = useUiStore((s) => s.reducedMotion)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const algoRef = useRef(algorithm)
  algoRef.current = algorithm

  useEffect(() => {
    if (reduced) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let w = 0
    let h = 0
    const particles: Particle[] = []

    const resize = () => {
      const parent = canvas.parentElement
      w = parent?.clientWidth ?? window.innerWidth
      h = parent?.clientHeight ?? window.innerHeight
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const target = Math.floor((w * h) / 18000)
      while (particles.length < target) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25,
          r: 0.6 + Math.random() * 1.8,
          a: 0.15 + Math.random() * 0.35,
        })
      }
      while (particles.length > target) particles.pop()
    }

    resize()
    window.addEventListener('resize', resize)

    const tick = () => {
      const pal = PALETTES[algoRef.current]
      ctx.clearRect(0, 0, w, h)

      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        if (p.x < -10) p.x = w + 10
        if (p.x > w + 10) p.x = -10
        if (p.y < -10) p.y = h + 10
        if (p.y > h + 10) p.y = -10

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${pal.particle},${p.a})`
        ctx.fill()
      }

      // faint connecting lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i]
          const b = particles[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const d2 = dx * dx + dy * dy
          if (d2 < 90 * 90) {
            const alpha = 0.04 * (1 - Math.sqrt(d2) / 90)
            ctx.strokeStyle = `rgba(${pal.particle},${alpha})`
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        }
      }

      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [reduced])

  const pal = PALETTES[algorithm]

  return (
    <div
      data-export-ignore
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      <div
        className="absolute -left-24 -top-24 h-[420px] w-[420px] rounded-full blur-3xl transition-colors duration-700"
        style={{ background: pal.a }}
      />
      <div
        className="absolute -bottom-32 -right-16 h-[380px] w-[380px] rounded-full blur-3xl transition-colors duration-700"
        style={{ background: pal.b }}
      />
      <div
        className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full blur-3xl opacity-40 transition-colors duration-700"
        style={{ background: pal.a }}
      />
      {!reduced && (
        <canvas ref={canvasRef} className="absolute inset-0 opacity-70" />
      )}
      {/* Film grain */}
      <div
        className="absolute inset-0 opacity-[0.035] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  )
}
