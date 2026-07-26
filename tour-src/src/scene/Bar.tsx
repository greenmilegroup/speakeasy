import { Instance, Instances } from '@react-three/drei'
import { useMemo } from 'react'
import { BackSide, CylinderGeometry, type Texture } from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { BAR, PLANT_WALL, ROOM } from '../data/floorplan'
import {
  glowTexture,
  plantWallTexture,
  skylineTexture,
  woodTexture,
} from '../textures/proceduralTextures'

const halfW = ROOM.width / 2
const wallX = -halfW
const counterX = BAR.counterFrontX
const barMidZ = (BAR.zFrom + BAR.zTo) / 2
const barLen = BAR.zTo - BAR.zFrom
// back-bar shelving sits just off the brick wall
const shelfX = wallX + 0.12

function tex(t: Texture, rx: number, ry: number): Texture {
  const c = t.clone()
  c.repeat.set(rx, ry)
  c.needsUpdate = true
  return c
}

/** Body + neck merged into one geometry so every bottle is a single instance. */
const bottleGeometry = (() => {
  const body = new CylinderGeometry(0.035, 0.04, 0.22, 8)
  body.translate(0, 0.11, 0)
  const neck = new CylinderGeometry(0.012, 0.02, 0.09, 6)
  neck.translate(0, 0.26, 0)
  return mergeGeometries([body, neck])!
})()

export function Bar() {
  const wood = useMemo(() => tex(woodTexture(), 3, 1), [])
  const woodV = useMemo(() => tex(woodTexture(), 1, 4), [])
  const skyline = useMemo(() => skylineTexture(), [])
  const plant = useMemo(() => tex(plantWallTexture(), 1, 2), [])
  const ledGlow = useMemo(() => glowTexture('bar-led', 'rgba(220,20,30,0.6)'), [])

  // procedurally scatter bottles along the two shelf tiers
  const bottles = useMemo(() => {
    const colors = ['#6b3410', '#2f5d34', '#8a1f1f', '#caa24a', '#3a2a5a', '#7a4b12']
    const out: { x: number; y: number; z: number; color: string }[] = []
    let seed = 12345
    const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff)
    for (const shelfY of [1.55, 2.05]) {
      for (let z = BAR.zFrom + 0.3; z < BAR.zTo - 0.3; z += 0.16 + rnd() * 0.05) {
        out.push({
          x: shelfX + 0.12 + rnd() * 0.06,
          y: shelfY,
          z,
          color: colors[(rnd() * colors.length) | 0],
        })
      }
    }
    return out
  }, [])

  return (
    <group>
      {/* main counter body */}
      <mesh position={[(wallX + counterX) / 2, BAR.counterHeight / 2, barMidZ]}>
        <boxGeometry args={[counterX - wallX, BAR.counterHeight, barLen]} />
        <meshStandardMaterial color="#1a1210" roughness={0.7} />
      </mesh>
      {/* dark wood counter top */}
      <mesh position={[(wallX + counterX) / 2, BAR.counterHeight + 0.02, barMidZ]}>
        <boxGeometry args={[counterX - wallX + 0.08, 0.06, barLen + 0.06]} />
        <meshStandardMaterial map={woodV} color="#3a2418" roughness={0.35} metalness={0.1} />
      </mesh>

      {/* GLOWING RED LED FRONT PANEL — the signature of the room */}
      <mesh position={[counterX + 0.005, 0.5, barMidZ]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[barLen, 0.92]} />
        <meshStandardMaterial
          color="#ff2530"
          emissive="#ff1622"
          emissiveIntensity={3}
          toneMapped={false}
        />
      </mesh>
      {/* soft red light pool the LED casts on the floor */}
      <mesh
        position={[counterX + 0.9, 0.02, barMidZ]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[2.4, barLen + 1]} />
        <meshBasicMaterial
          map={ledGlow}
          transparent
          opacity={0.5}
          depthWrite={false}
          color="#ff2a30"
        />
      </mesh>

      {/* back-bar shelving unit against the brick */}
      <mesh position={[shelfX, 1.9, barMidZ]}>
        <boxGeometry args={[0.24, 2.6, barLen]} />
        <meshStandardMaterial map={wood} color="#4a3120" roughness={0.7} />
      </mesh>
      {[1.45, 1.95, 2.45].map((y) => (
        <mesh key={y} position={[shelfX + 0.16, y, barMidZ]}>
          <boxGeometry args={[0.3, 0.04, barLen]} />
          <meshStandardMaterial map={wood} color="#5a3d26" roughness={0.6} />
        </mesh>
      ))}
      {/* warm backlight behind the shelves */}
      <mesh position={[shelfX + 0.02, 1.9, barMidZ]}>
        <boxGeometry args={[0.02, 2.2, barLen - 0.4]} />
        <meshStandardMaterial color="#3a1a0a" emissive="#e08a2a" emissiveIntensity={0.9} toneMapped={false} />
      </mesh>

      {/* all bottles in one instanced draw call */}
      <Instances geometry={bottleGeometry} limit={bottles.length} frustumCulled={false}>
        <meshStandardMaterial roughness={0.25} metalness={0.1} />
        {bottles.map((b, i) => (
          <Instance key={i} position={[b.x, b.y, b.z]} color={b.color} />
        ))}
      </Instances>

      {/* POS screen at the near end of the bar */}
      <group position={[counterX - 0.25, 1.35, BAR.zTo - 1.2]} rotation={[0, -Math.PI / 2 + 0.3, 0]}>
        <mesh>
          <boxGeometry args={[0.34, 0.24, 0.03]} />
          <meshStandardMaterial color="#111" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0, 0.02]}>
          <planeGeometry args={[0.3, 0.2]} />
          <meshStandardMaterial color="#0a2a3a" emissive="#1a6a8a" emissiveIntensity={0.7} toneMapped={false} />
        </mesh>
      </group>

      {/* NYC skyline painting on the brick above the back bar */}
      <mesh position={[wallX + 0.06, 2.5, barMidZ + 1.5]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[2.6, 1.95]} />
        <meshStandardMaterial map={skyline} roughness={0.6} emissive="#3a2a4a" emissiveIntensity={0.25} />
      </mesh>

      {/* living plant wall panel further along the left wall */}
      <mesh
        position={[wallX + PLANT_WALL.depth, PLANT_WALL.height / 2 + 0.1, (PLANT_WALL.zFrom + PLANT_WALL.zTo) / 2]}
        rotation={[0, Math.PI / 2, 0]}
      >
        <planeGeometry args={[PLANT_WALL.zTo - PLANT_WALL.zFrom, PLANT_WALL.height]} />
        <meshStandardMaterial map={plant} roughness={0.9} />
      </mesh>

      {/* caged industrial pendant lights over the counter */}
      {[BAR.zFrom + 2, barMidZ, BAR.zTo - 2].map((z) => (
        <group key={z} position={[counterX - 0.4, 0, z]}>
          <mesh position={[0, 2.6, 0]}>
            <cylinderGeometry args={[0.006, 0.006, 0.7, 4]} />
            <meshStandardMaterial color="#222" />
          </mesh>
          <mesh position={[0, 2.24, 0]}>
            <sphereGeometry args={[0.07, 10, 10]} />
            <meshStandardMaterial color="#ffc18a" emissive="#ffb347" emissiveIntensity={2} toneMapped={false} />
          </mesh>
          <mesh position={[0, 2.24, 0]}>
            <cylinderGeometry args={[0.11, 0.13, 0.24, 8, 1, true]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.6} metalness={0.5} side={BackSide} />
          </mesh>
        </group>
      ))}
    </group>
  )
}
