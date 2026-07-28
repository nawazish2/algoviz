import { useMemo } from 'react'
import * as THREE from 'three'
import {
  SURFACES,
  lossToHeight,
  type SurfaceKind,
} from '../../lib/gradientDescent'

interface LossSurfaceProps {
  surfaceId: SurfaceKind
  resolution?: number
}

/** Build a colored mesh of the loss landscape. */
export function LossSurface({ surfaceId, resolution = 80 }: LossSurfaceProps) {
  const surface = SURFACES[surfaceId]

  const { geometry, minZ, maxZ } = useMemo(() => {
    const { min, max } = surface.domain
    const size = resolution
    const positions = new Float32Array(size * size * 3)
    const colors = new Float32Array(size * size * 3)
    const indices: number[] = []
    const heights: number[] = []

    let minH = Infinity
    let maxH = -Infinity

    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        const u = i / (size - 1)
        const v = j / (size - 1)
        const x = min + u * (max - min)
        const y = min + v * (max - min)
        const loss = surface.f(x, y)
        const h = lossToHeight(loss, surface)

        const idx = (i * size + j) * 3
        // Three.js: X horizontal, Y up, Z depth — map param y → Z
        positions[idx] = x
        positions[idx + 1] = h
        positions[idx + 2] = y

        heights.push(h)
        if (h < minH) minH = h
        if (h > maxH) maxH = h
      }
    }

    // Color by height: deep indigo → cyan → amber
    const range = maxH - minH || 1
    for (let i = 0; i < size * size; i++) {
      const t = (heights[i] - minH) / range
      const c = heightColor(t)
      colors[i * 3] = c.r
      colors[i * 3 + 1] = c.g
      colors[i * 3 + 2] = c.b
    }

    for (let i = 0; i < size - 1; i++) {
      for (let j = 0; j < size - 1; j++) {
        const a = i * size + j
        const b = a + 1
        const c = (i + 1) * size + j
        const d = c + 1
        indices.push(a, c, b, b, c, d)
      }
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geo.setIndex(indices)
    geo.computeVertexNormals()

    return { geometry: geo, minZ: minH, maxZ: maxH }
  }, [surface, resolution])

  return (
    <group>
      <mesh geometry={geometry} receiveShadow castShadow>
        <meshStandardMaterial
          vertexColors
          side={THREE.DoubleSide}
          metalness={0.15}
          roughness={0.55}
          flatShading={false}
        />
      </mesh>
      {/* Soft wireframe overlay for structure */}
      <mesh geometry={geometry}>
        <meshBasicMaterial
          color="#818cf8"
          wireframe
          transparent
          opacity={0.06}
          depthWrite={false}
        />
      </mesh>
      {/* Invisible plane reference so we know extents */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, minZ - 0.02, 0]}>
        <planeGeometry
          args={[
            surface.domain.max - surface.domain.min,
            surface.domain.max - surface.domain.min,
          ]}
        />
        <meshBasicMaterial
          color="#111118"
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Keep maxZ referenced to avoid unused lint */}
      <group userData={{ maxZ }} />
    </group>
  )
}

function heightColor(t: number): THREE.Color {
  // t: 0 (low loss / valley) → 1 (high / ridges)
  const stops = [
    { t: 0.0, c: new THREE.Color('#0f172a') },
    { t: 0.15, c: new THREE.Color('#1e1b4b') },
    { t: 0.35, c: new THREE.Color('#4338ca') },
    { t: 0.55, c: new THREE.Color('#6366f1') },
    { t: 0.75, c: new THREE.Color('#22d3ee') },
    { t: 0.9, c: new THREE.Color('#fbbf24') },
    { t: 1.0, c: new THREE.Color('#fb7185') },
  ]

  let i = 0
  while (i < stops.length - 1 && t > stops[i + 1].t) i++
  const a = stops[i]
  const b = stops[Math.min(i + 1, stops.length - 1)]
  const local = (t - a.t) / (b.t - a.t || 1)
  return a.c.clone().lerp(b.c, local)
}
