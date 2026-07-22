import { useMemo } from 'react'
import type { Texture } from 'three'
import { BANQUETTE, COLUMNS, ROOM } from '../data/floorplan'
import { woodTexture } from '../textures/proceduralTextures'

const halfW = ROOM.width / 2
const wallX = halfW
const benchX = halfW - BANQUETTE.depth / 2
const midZ = (BANQUETTE.zFrom + BANQUETTE.zTo) / 2
const benchLen = BANQUETTE.zTo - BANQUETTE.zFrom

export function Banquette() {
  const wood = useMemo<Texture>(() => {
    const t = woodTexture().clone()
    t.repeat.set(1, 3)
    t.needsUpdate = true
    return t
  }, [])

  return (
    <group>
      {/* bench seat */}
      <mesh position={[benchX, 0.26, midZ]}>
        <boxGeometry args={[BANQUETTE.depth, 0.5, benchLen]} />
        <meshStandardMaterial color="#15100e" roughness={0.85} />
      </mesh>
      {/* padded back cushion against the wall */}
      <mesh position={[wallX - 0.12, 0.85, midZ]}>
        <boxGeometry args={[0.16, 0.9, benchLen]} />
        <meshStandardMaterial color="#1c1512" roughness={0.8} />
      </mesh>
      {/* tufting seam highlights along the cushion */}
      {Array.from({ length: 7 }, (_, i) => {
        const z = BANQUETTE.zFrom + 0.9 + i * ((benchLen - 1.8) / 6)
        return (
          <mesh key={i} position={[wallX - 0.19, 0.85, z]}>
            <boxGeometry args={[0.02, 0.8, 0.03]} />
            <meshStandardMaterial color="#0a0706" roughness={0.9} />
          </mesh>
        )
      })}

      {/* rustic wood-slat columns / partitions */}
      {COLUMNS.map((c, i) => (
        <group key={i} position={[c.center[0], 0, c.center[1]]}>
          <mesh position={[0, ROOM.height / 2, 0]}>
            <boxGeometry args={[c.size, ROOM.height, c.size]} />
            <meshStandardMaterial map={wood} color="#6a4a2e" roughness={0.75} />
          </mesh>
          {/* thin vertical slat grooves on the aisle-facing side */}
          {[-0.12, 0, 0.12].map((off) => (
            <mesh key={off} position={[-c.size / 2 - 0.005, ROOM.height / 2, off]}>
              <boxGeometry args={[0.02, ROOM.height - 0.3, 0.03]} />
              <meshStandardMaterial color="#3a2616" roughness={0.85} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}
