/** Loss surface definitions and optimizer math for the 3D visualizer. */

export type Vec2 = { x: number; y: number }
export type OptimizerKind = 'gd' | 'momentum' | 'adam'
export type SurfaceKind = 'bowl' | 'himmelblau' | 'saddle' | 'rosenbrock'

export interface SurfaceDef {
  id: SurfaceKind
  name: string
  description: string
  f: (x: number, y: number) => number
  grad: (x: number, y: number) => Vec2
  domain: { min: number; max: number }
  /** Suggested starting point */
  defaultStart: Vec2
  /** Height scale for rendering (visual only) */
  heightScale: number
}

export const SURFACES: Record<SurfaceKind, SurfaceDef> = {
  bowl: {
    id: 'bowl',
    name: 'Smooth Bowl',
    description: 'f(x,y) = x² + y² — convex, single minimum at origin',
    f: (x, y) => x * x + y * y,
    grad: (x, y) => ({ x: 2 * x, y: 2 * y }),
    domain: { min: -3, max: 3 },
    defaultStart: { x: 2.4, y: 1.8 },
    heightScale: 0.35,
  },
  himmelblau: {
    id: 'himmelblau',
    name: "Himmelblau's",
    description: 'Four local minima — classic multi-modal test function',
    f: (x, y) => {
      const a = x * x + y - 11
      const b = x + y * y - 7
      return a * a + b * b
    },
    grad: (x, y) => {
      const a = x * x + y - 11
      const b = x + y * y - 7
      return {
        x: 4 * x * a + 2 * b,
        y: 2 * a + 4 * y * b,
      }
    },
    domain: { min: -5, max: 5 },
    defaultStart: { x: -3.5, y: 3.2 },
    heightScale: 0.02,
  },
  saddle: {
    id: 'saddle',
    name: 'Saddle + Noise',
    description: 'f(x,y) = x² − y² + ripples — tests escape from saddle regions',
    f: (x, y) => {
      const base = x * x - y * y
      const ripple = 0.4 * Math.sin(2.5 * x) * Math.cos(2.5 * y)
      return base + ripple + 0.15 * (x * x + y * y)
    },
    grad: (x, y) => {
      const dx =
        2 * x +
        0.4 * 2.5 * Math.cos(2.5 * x) * Math.cos(2.5 * y) +
        0.3 * x
      const dy =
        -2 * y +
        0.4 * Math.sin(2.5 * x) * (-2.5 * Math.sin(2.5 * y)) +
        0.3 * y
      return { x: dx, y: dy }
    },
    domain: { min: -2.5, max: 2.5 },
    defaultStart: { x: 1.8, y: 0.15 },
    heightScale: 0.4,
  },
  rosenbrock: {
    id: 'rosenbrock',
    name: 'Rosenbrock',
    description: 'Narrow curved valley — hard for vanilla GD',
    f: (x, y) => {
      const a = 1 - x
      const b = y - x * x
      return a * a + 100 * b * b
    },
    grad: (x, y) => {
      const b = y - x * x
      return {
        x: -2 * (1 - x) - 400 * x * b,
        y: 200 * b,
      }
    },
    domain: { min: -2, max: 2 },
    defaultStart: { x: -1.2, y: 1.0 },
    heightScale: 0.004,
  },
}

export interface OptimizerState {
  pos: Vec2
  /** Momentum velocity */
  v: Vec2
  /** Adam first moment */
  m: Vec2
  /** Adam second moment */
  s: Vec2
  t: number
}

export function createOptimizerState(start: Vec2): OptimizerState {
  return {
    pos: { ...start },
    v: { x: 0, y: 0 },
    m: { x: 0, y: 0 },
    s: { x: 0, y: 0 },
    t: 0,
  }
}

export interface StepConfig {
  lr: number
  beta: number // momentum / adam beta1
  beta2: number // adam beta2
  epsilon: number
}

export const DEFAULT_STEP: StepConfig = {
  lr: 0.05,
  beta: 0.9,
  beta2: 0.999,
  epsilon: 1e-8,
}

/** One optimizer step. Mutates and returns state. */
export function stepOptimizer(
  state: OptimizerState,
  surface: SurfaceDef,
  kind: OptimizerKind,
  cfg: StepConfig,
): OptimizerState {
  const g = surface.grad(state.pos.x, state.pos.y)
  const next = { ...state, pos: { ...state.pos }, v: { ...state.v }, m: { ...state.m }, s: { ...state.s } }
  next.t += 1

  if (kind === 'gd') {
    next.pos.x -= cfg.lr * g.x
    next.pos.y -= cfg.lr * g.y
  } else if (kind === 'momentum') {
    next.v.x = cfg.beta * next.v.x + g.x
    next.v.y = cfg.beta * next.v.y + g.y
    next.pos.x -= cfg.lr * next.v.x
    next.pos.y -= cfg.lr * next.v.y
  } else {
    // Adam
    next.m.x = cfg.beta * next.m.x + (1 - cfg.beta) * g.x
    next.m.y = cfg.beta * next.m.y + (1 - cfg.beta) * g.y
    next.s.x = cfg.beta2 * next.s.x + (1 - cfg.beta2) * g.x * g.x
    next.s.y = cfg.beta2 * next.s.y + (1 - cfg.beta2) * g.y * g.y

    const mHatX = next.m.x / (1 - Math.pow(cfg.beta, next.t))
    const mHatY = next.m.y / (1 - Math.pow(cfg.beta, next.t))
    const sHatX = next.s.x / (1 - Math.pow(cfg.beta2, next.t))
    const sHatY = next.s.y / (1 - Math.pow(cfg.beta2, next.t))

    next.pos.x -= (cfg.lr * mHatX) / (Math.sqrt(sHatX) + cfg.epsilon)
    next.pos.y -= (cfg.lr * mHatY) / (Math.sqrt(sHatY) + cfg.epsilon)
  }

  // Soft clamp to domain so the ball doesn't fly off forever
  const pad = 0.5
  const { min, max } = surface.domain
  next.pos.x = Math.min(max + pad, Math.max(min - pad, next.pos.x))
  next.pos.y = Math.min(max + pad, Math.max(min - pad, next.pos.y))

  return next
}

export interface PathPoint {
  x: number
  y: number
  z: number // loss value (unscaled)
  step: number
}

/** Run N steps offline (for instant path preview / scrubbing). */
export function runPath(
  start: Vec2,
  surface: SurfaceDef,
  kind: OptimizerKind,
  cfg: StepConfig,
  steps: number,
): PathPoint[] {
  let state = createOptimizerState(start)
  const path: PathPoint[] = [
    {
      x: state.pos.x,
      y: state.pos.y,
      z: surface.f(state.pos.x, state.pos.y),
      step: 0,
    },
  ]

  for (let i = 0; i < steps; i++) {
    state = stepOptimizer(state, surface, kind, cfg)
    path.push({
      x: state.pos.x,
      y: state.pos.y,
      z: surface.f(state.pos.x, state.pos.y),
      step: i + 1,
    })
  }
  return path
}

/** Map function value → height for mesh rendering. */
export function lossToHeight(loss: number, surface: SurfaceDef): number {
  return loss * surface.heightScale
}
