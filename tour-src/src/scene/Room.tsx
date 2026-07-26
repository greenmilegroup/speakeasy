import { useMemo } from 'react'
import { BufferAttribute, PlaneGeometry, type Texture } from 'three'
import { ROOM } from '../data/floorplan'
import {
  brickBumpTexture,
  brickTexture,
  damaskTexture,
  floorTileTexture,
  noiseTexture,
} from '../textures/proceduralTextures'

const halfW = ROOM.width / 2
const halfL = ROOM.length / 2
const H = ROOM.height

function repeated(tex: Texture, rx: number, ry: number): Texture {
  const t = tex.clone()
  t.repeat.set(rx, ry)
  t.needsUpdate = true
  return t
}

/**
 * Floor geometry with vertex colors that darken toward the walls — a free
 * ambient-occlusion vignette that grounds the room without any shadow maps.
 */
function useFloorGeometry() {
  return useMemo(() => {
    const geom = new PlaneGeometry(ROOM.width, ROOM.length, 18, 40)
    const pos = geom.attributes.position
    const colors = new Float32Array(pos.count * 3)
    for (let i = 0; i < pos.count; i++) {
      const nx = Math.abs(pos.getX(i)) / halfW
      const ny = Math.abs(pos.getY(i)) / halfL
      const edge = Math.max(nx, ny)
      const b = 1 - 0.55 * Math.pow(edge, 2.2)
      colors[i * 3] = b
      colors[i * 3 + 1] = b
      colors[i * 3 + 2] = b
    }
    geom.setAttribute('color', new BufferAttribute(colors, 3))
    return geom
  }, [])
}

export function Room() {
  const floorGeom = useFloorGeometry()
  const maps = useMemo(
    () => ({
      floor: repeated(floorTileTexture(), ROOM.width / 3.2, ROOM.length / 3.2),
      floorRough: repeated(noiseTexture(), 6, 13),
      brickSide: repeated(brickTexture(), ROOM.length / 4, H / 1.6),
      brickSideBump: repeated(brickBumpTexture(), ROOM.length / 4, H / 1.6),
      brickFront: repeated(brickTexture(), ROOM.width / 4, H / 1.6),
      brickFrontBump: repeated(brickBumpTexture(), ROOM.width / 4, H / 1.6),
      damask: repeated(damaskTexture(), ROOM.length / 1.2, H / 1.2),
      carpetRough: repeated(noiseTexture(), 2, 16),
    }),
    [],
  )

  return (
    <group>
      {/* floor */}
      <mesh geometry={floorGeom} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <meshStandardMaterial
          map={maps.floor}
          roughnessMap={maps.floorRough}
          roughness={0.55}
          metalness={0.05}
          vertexColors
        />
      </mesh>

      {/* red carpet runner to the stage */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.012, (ROOM.carpet.zFrom + ROOM.carpet.zTo) / 2]}
      >
        <planeGeometry args={[ROOM.carpet.width, ROOM.carpet.zTo - ROOM.carpet.zFrom]} />
        <meshStandardMaterial
          color="#5c0d10"
          roughnessMap={maps.carpetRough}
          roughness={0.95}
          metalness={0}
        />
      </mesh>

      {/* left wall — exposed brick (bar side) */}
      <mesh position={[-halfW, H / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[ROOM.length, H]} />
        <meshStandardMaterial
          map={maps.brickSide}
          bumpMap={maps.brickSideBump}
          bumpScale={0.6}
          roughness={0.92}
        />
      </mesh>

      {/* front wall (entrance) — brick */}
      <mesh position={[0, H / 2, halfL]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[ROOM.width, H]} />
        <meshStandardMaterial
          map={maps.brickFront}
          bumpMap={maps.brickFrontBump}
          bumpScale={0.6}
          roughness={0.92}
        />
      </mesh>

      {/* right wall — near-black damask (banquette side) */}
      <mesh position={[halfW, H / 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[ROOM.length, H]} />
        <meshStandardMaterial map={maps.damask} roughness={0.85} />
      </mesh>

      {/* back wall — dark plaster behind the stage curtain */}
      <mesh position={[0, H / 2, -halfL]}>
        <planeGeometry args={[ROOM.width, H]} />
        <meshStandardMaterial color="#191310" roughness={0.95} />
      </mesh>
    </group>
  )
}
