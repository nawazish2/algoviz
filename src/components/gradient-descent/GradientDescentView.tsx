import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import {
  OrbitControls,
  PerspectiveCamera,
  Environment,
  Grid,
} from '@react-three/drei'
import {
  DEFAULT_STEP,
  SURFACES,
  runPath,
  type PathPoint,
} from '../../lib/gradientDescent'
import { useVisualizerStore } from '../../store/useVisualizerStore'
import { useUiStore } from '../../store/useUiStore'
import { LossSurface } from './LossSurface'
import { OptimizerPath } from './OptimizerPath'
import { Controls } from './Controls'
import { GlossaryChip } from '../layout/GlossaryChip'

export function GradientDescentView() {
  const surfaceId = useVisualizerStore((s) => s.surface)
  const optimizer = useVisualizerStore((s) => s.optimizer)
  const learningRate = useVisualizerStore((s) => s.learningRate)
  const momentum = useVisualizerStore((s) => s.momentum)
  const startPos = useVisualizerStore((s) => s.startPos)
  const maxSteps = useVisualizerStore((s) => s.maxSteps)
  const currentStep = useVisualizerStore((s) => s.currentStep)
  const isPlaying = useVisualizerStore((s) => s.isPlaying)
  const speed = useVisualizerStore((s) => s.speed)
  const pathVersion = useVisualizerStore((s) => s.pathVersion)
  const setCurrentStep = useVisualizerStore((s) => s.setCurrentStep)
  const setIsPlaying = useVisualizerStore((s) => s.setIsPlaying)
  const autoOrbit = useUiStore((s) => s.autoOrbit)
  const toggleAutoOrbit = useUiStore((s) => s.toggleAutoOrbit)
  const difficulty = useUiStore((s) => s.difficulty)
  const embed = useUiStore((s) => s.embed)

  const path: PathPoint[] = useMemo(() => {
    const surface = SURFACES[surfaceId]
    return runPath(
      startPos,
      surface,
      optimizer,
      {
        ...DEFAULT_STEP,
        lr: learningRate,
        beta: momentum,
      },
      maxSteps,
    )
  }, [
    surfaceId,
    optimizer,
    learningRate,
    momentum,
    startPos,
    maxSteps,
    pathVersion,
  ])

  const accum = useRef(0)
  const stepRef = useRef(currentStep)
  stepRef.current = currentStep

  useEffect(() => {
    if (!isPlaying) {
      accum.current = 0
      return
    }
    let raf = 0
    let last = performance.now()
    const lastIndex = path.length - 1

    const tick = (now: number) => {
      const dt = (now - last) / 1000
      last = now
      accum.current += dt * speed

      if (accum.current >= 1) {
        const advance = Math.floor(accum.current)
        accum.current -= advance
        const next = Math.min(lastIndex, stepRef.current + advance)
        setCurrentStep(next)
        if (next >= lastIndex) {
          setIsPlaying(false)
        }
      }
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [isPlaying, speed, path.length, setCurrentStep, setIsPlaying])

  const point = path[Math.min(currentStep, path.length - 1)]
  const loss = point?.z ?? 0
  const pos = point ? { x: point.x, y: point.y } : startPos

  return (
    <div className="flex h-full min-h-0 flex-1">
      <div className="relative min-w-0 flex-1">
        <Canvas
          shadows
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
          className="!absolute inset-0"
        >
          <color attach="background" args={['#07070b']} />
          <fog attach="fog" args={['#07070b', 18, 45]} />
          <PerspectiveCamera makeDefault position={[7, 6, 7]} fov={45} />
          <ambientLight intensity={0.35} />
          <directionalLight
            castShadow
            position={[8, 14, 6]}
            intensity={1.2}
            shadow-mapSize={[1024, 1024]}
          />
          <pointLight position={[-6, 4, -4]} intensity={0.4} color="#818cf8" />
          <pointLight position={[4, 2, 6]} intensity={0.3} color="#22d3ee" />

          <Suspense fallback={null}>
            <LossSurface surfaceId={surfaceId} />
            <OptimizerPath
              path={path}
              currentStep={currentStep}
              surfaceId={surfaceId}
            />
            <Environment preset="night" />
          </Suspense>

          <Grid
            args={[20, 20]}
            position={[0, -0.15, 0]}
            cellSize={0.5}
            cellThickness={0.5}
            cellColor="#1e1e2a"
            sectionSize={2}
            sectionThickness={1}
            sectionColor="#2a2a3a"
            fadeDistance={30}
            infiniteGrid
          />

          <OrbitControls
            makeDefault
            enableDamping
            dampingFactor={0.08}
            autoRotate={autoOrbit && isPlaying}
            autoRotateSpeed={0.6}
            minDistance={3}
            maxDistance={25}
            maxPolarAngle={Math.PI / 2.05}
            target={[0, 1, 0]}
          />
        </Canvas>

        <div className="pointer-events-none absolute left-4 top-4 max-w-sm">
          <div className="rounded-2xl bg-surface-900/75 px-4 py-3 backdrop-blur-md ring-1 ring-white/10">
            <div className="text-xs font-medium uppercase tracking-wider text-indigo-300">
              Gradient Descent
            </div>
            <h2 className="mt-0.5 text-lg font-semibold text-white">
              {SURFACES[surfaceId].name}
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-zinc-400">
              Drag to orbit · scroll to zoom · amber ball follows the optimizer
              downhill on the loss surface.
            </p>
            {difficulty === 'beginner' && (
              <div className="pointer-events-auto mt-2 flex flex-wrap gap-1">
                <GlossaryChip termId="gradient" compact />
                <GlossaryChip termId="learning-rate" compact />
                <GlossaryChip termId="adam" compact />
              </div>
            )}
          </div>
        </div>

        <div className="absolute bottom-4 left-4 flex flex-col gap-2">
          <div className="rounded-xl bg-surface-900/75 px-3 py-2 backdrop-blur-md ring-1 ring-white/10">
            <div className="mb-1.5 text-[10px] uppercase tracking-wide text-zinc-500">
              Loss height
            </div>
            <div
              className="h-2 w-36 rounded-full"
              style={{
                background:
                  'linear-gradient(90deg, #0f172a, #4338ca, #22d3ee, #fbbf24, #fb7185)',
              }}
            />
            <div className="mt-1 flex justify-between text-[10px] text-zinc-500">
              <span>low</span>
              <span>high</span>
            </div>
          </div>
          {!embed && (
            <button
              data-export-ignore
              type="button"
              onClick={toggleAutoOrbit}
              className={`w-fit rounded-lg px-2.5 py-1.5 text-[10px] font-medium ring-1 backdrop-blur-md transition ${
                autoOrbit
                  ? 'bg-cyan-500/15 text-cyan-300 ring-cyan-500/40'
                  : 'bg-surface-900/75 text-zinc-400 ring-white/10 hover:text-zinc-200'
              }`}
            >
              {autoOrbit ? '🎬 Auto-orbit on' : '🎬 Auto-orbit off'}
              <kbd className="ml-1.5 font-mono text-[9px] opacity-60">O</kbd>
            </button>
          )}
        </div>
      </div>

      {!embed && (
        <aside
          data-export-ignore
          className="w-[320px] shrink-0 border-l border-white/5 bg-surface-900/60 backdrop-blur-sm"
        >
          <Controls
            loss={loss}
            step={currentStep}
            totalSteps={path.length}
            pos={pos}
          />
        </aside>
      )}
    </div>
  )
}
