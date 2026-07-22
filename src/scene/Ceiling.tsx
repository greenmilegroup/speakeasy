import { useMemo } from 'react'
import { ROOM } from '../data/floorplan'
import { noiseTexture, tinBumpTexture, tinTexture, woodTexture } from '../textures/proceduralTextures'

const H = ROOM.height

/** z positions of the exposed cross beams. */
export const BEAM_ZS = [-7, -2.33, 2.33, 7]

export function Ceiling() {
  const maps = useMemo(() => {
    const cell = 0.68
    const tin = tinTexture().clone()
    tin.repeat.set(ROOM.width / cell, ROOM.length / cell)
    tin.needsUpdate = true
    const tinBump = tinBumpTexture().clone()
    tinBump.repeat.copy(tin.repeat)
    tinBump.needsUpdate = true
    const wood = woodTexture().clone()
    wood.repeat.set(6, 0.3)
    wood.needsUpdate = true
    const rough = noiseTexture().clone()
    rough.repeat.set(8, 18)
    rough.needsUpdate = true
    return { tin, tinBump, wood, rough }
  }, [])

  return (
    <group>
      {/* pressed-tin coffered ceiling */}
      <mesh position={[0, H, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[ROOM.width, ROOM.length]} />
        <meshStandardMaterial
          map={maps.tin}
          bumpMap={maps.tinBump}
          bumpScale={0.5}
          roughnessMap={maps.rough}
          roughness={0.5}
          metalness={0.35}
        />
      </mesh>

      {/* dark exposed cross beams */}
      {BEAM_ZS.map((z) => (
        <mesh key={z} position={[0, H - 0.11, z]}>
          <boxGeometry args={[ROOM.width, 0.22, 0.18]} />
          <meshStandardMaterial map={maps.wood} color="#4a3526" roughness={0.85} />
        </mesh>
      ))}

      {/* two longitudinal beams */}
      {[-3.0, 3.0].map((x) => (
        <mesh key={x} position={[x, H - 0.09, 0]}>
          <boxGeometry args={[0.16, 0.18, ROOM.length]} />
          <meshStandardMaterial map={maps.wood} color="#443122" roughness={0.85} />
        </mesh>
      ))}

      {/* recessed colored cove strips glowing between the beams */}
      {COVES.map((c, i) => (
        <mesh key={i} position={[c.x, H - 0.05, 0]}>
          <boxGeometry args={[0.06, 0.04, ROOM.length - 1]} />
          <meshStandardMaterial
            color={c.color}
            emissive={c.color}
            emissiveIntensity={1.8}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* wall speaker boxes */}
      {[-ROOM.width / 2 + 0.15, ROOM.width / 2 - 0.15].map((x, i) =>
        [-6, 0, 6].map((z) => (
          <mesh key={`${i}-${z}`} position={[x, H - 0.5, z]}>
            <boxGeometry args={[0.18, 0.34, 0.22]} />
            <meshStandardMaterial color="#0c0a09" roughness={0.6} />
          </mesh>
        )),
      )}
    </group>
  )
}

const COVES = [
  { x: -1.5, color: '#c81e6a' },
  { x: 1.5, color: '#2a4bd0' },
]
