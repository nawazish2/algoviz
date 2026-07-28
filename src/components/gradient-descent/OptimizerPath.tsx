import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import * as THREE from 'three'
import {
  SURFACES,
  lossToHeight,
  type PathPoint,
  type SurfaceKind,
} from '../../lib/gradientDescent'

interface OptimizerPathProps {
  path: PathPoint[]
  currentStep: number
  surfaceId: SurfaceKind
}

export function OptimizerPath({
  path,
  currentStep,
  surfaceId,
}: OptimizerPathProps) {
  const surface = SURFACES[surfaceId]
  const ballRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const targetPos = useRef(new THREE.Vector3())

  const active = path[Math.min(currentStep, path.length - 1)] ?? path[0]

  const trailPoints = useMemo(() => {
    return path.slice(0, Math.max(1, currentStep + 1)).map((p) => {
      const h = lossToHeight(p.z, surface)
      return [p.x, h + 0.04, p.y] as [number, number, number]
    })
  }, [path, currentStep, surface])

  // Subsample dots for performance
  const dots = useMemo(() => {
    const end = Math.min(currentStep, path.length - 1)
    const result: { pos: [number, number, number]; isEnd: boolean; i: number }[] =
      []
    for (let i = 0; i <= end; i++) {
      if (i % 4 !== 0 && i !== end) continue
      const p = path[i]
      const h = lossToHeight(p.z, surface)
      result.push({
        pos: [p.x, h + 0.05, p.y],
        isEnd: i === end,
        i,
      })
    }
    return result
  }, [path, currentStep, surface])

  useEffect(() => {
    if (!active) return
    const h = lossToHeight(active.z, surface)
    targetPos.current.set(active.x, h + 0.08, active.y)
  }, [active, surface])

  useFrame(({ clock }) => {
    if (ballRef.current) {
      ballRef.current.position.lerp(targetPos.current, 0.35)
      const pulse = 1 + Math.sin(clock.elapsedTime * 4) * 0.06
      ballRef.current.scale.setScalar(pulse)
    }
    if (glowRef.current) {
      glowRef.current.position.lerp(targetPos.current, 0.35)
      const g = 1.4 + Math.sin(clock.elapsedTime * 3) * 0.15
      glowRef.current.scale.setScalar(g)
    }
  })

  if (!path.length || !active) return null

  const h0 = lossToHeight(active.z, surface)
  const initial: [number, number, number] = [active.x, h0 + 0.08, active.y]

  return (
    <group>
      {trailPoints.length >= 2 && (
        <>
          <Line
            points={trailPoints}
            color="#fbbf24"
            lineWidth={2}
            transparent
            opacity={0.95}
          />
          <Line
            points={trailPoints}
            color="#f59e0b"
            lineWidth={5}
            transparent
            opacity={0.2}
          />
        </>
      )}

      {dots.map(({ pos, isEnd, i }) => (
        <mesh key={i} position={pos}>
          <sphereGeometry args={[isEnd ? 0.04 : 0.025, 12, 12]} />
          <meshStandardMaterial
            color={isEnd ? '#fbbf24' : '#f59e0b'}
            emissive={isEnd ? '#fbbf24' : '#b45309'}
            emissiveIntensity={isEnd ? 1.2 : 0.4}
            transparent
            opacity={isEnd ? 1 : 0.55}
          />
        </mesh>
      ))}

      <mesh ref={ballRef} position={initial} castShadow>
        <sphereGeometry args={[0.1, 24, 24]} />
        <meshStandardMaterial
          color="#fbbf24"
          emissive="#f59e0b"
          emissiveIntensity={1.5}
          metalness={0.3}
          roughness={0.2}
        />
      </mesh>

      <mesh ref={glowRef} position={initial}>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshBasicMaterial
          color="#fbbf24"
          transparent
          opacity={0.18}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}
