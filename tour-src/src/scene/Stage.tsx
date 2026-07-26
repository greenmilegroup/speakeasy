import { useMemo } from 'react'
import { DoubleSide, PlaneGeometry, type Texture } from 'three'
import { ROOM, STAGE } from '../data/floorplan'
import { curtainShadeTexture, signTexture, woodTexture } from '../textures/proceduralTextures'

const backZ = -ROOM.length / 2
const stageZ = STAGE.centerZ

/** Red velvet curtain: a wavy plane so it catches light as folds. */
function useCurtainGeometry(width: number, height: number) {
  return useMemo(() => {
    const g = new PlaneGeometry(width, height, 48, 2)
    const pos = g.attributes.position
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      // sine folds in Z, deeper toward the bottom
      const fold = Math.sin(x * 6) * 0.06
      pos.setZ(i, fold)
    }
    pos.needsUpdate = true
    g.computeVertexNormals()
    return g
  }, [width, height])
}

export function Stage() {
  const curtainGeom = useCurtainGeometry(STAGE.width + 1.2, 2.7)
  const shade = useMemo<Texture>(() => {
    const t = curtainShadeTexture().clone()
    t.repeat.set(10, 1)
    t.needsUpdate = true
    return t
  }, [])
  const woodTrim = useMemo(() => {
    const t = woodTexture().clone()
    t.repeat.set(6, 1)
    t.needsUpdate = true
    return t
  }, [])
  const sign = useMemo(() => signTexture(), [])

  return (
    <group>
      {/* platform */}
      <mesh position={[0, STAGE.height / 2, stageZ]}>
        <boxGeometry args={[STAGE.width, STAGE.height, STAGE.depth]} />
        <meshStandardMaterial color="#241a16" roughness={0.7} />
      </mesh>
      {/* wood front trim of the platform */}
      <mesh position={[0, STAGE.height / 2, stageZ + STAGE.depth / 2 + 0.01]}>
        <planeGeometry args={[STAGE.width, STAGE.height]} />
        <meshStandardMaterial map={woodTrim} color="#5a3d26" roughness={0.5} />
      </mesh>

      {/* red velvet curtain against the back wall */}
      <mesh geometry={curtainGeom} position={[0, 1.5, backZ + 0.2]}>
        <meshStandardMaterial
          map={shade}
          color="#8a1418"
          roughness={0.9}
          metalness={0}
          side={DoubleSide}
        />
      </mesh>

      {/* glowing SPEAKEASY sign above the stage */}
      <mesh position={[0, 2.75, backZ + 0.28]}>
        <planeGeometry args={[3.4, 0.85]} />
        <meshStandardMaterial
          map={sign}
          emissiveMap={sign}
          emissive="#ffffff"
          emissiveIntensity={2.4}
          transparent
          toneMapped={false}
        />
      </mesh>

      {/* vertical red/orange LED strip bars flanking the stage */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (STAGE.width / 2 + 0.35), 1.5, backZ + 0.3]}>
          <boxGeometry args={[0.09, 2.7, 0.09]} />
          <meshStandardMaterial
            color="#ff3a1e"
            emissive="#ff5410"
            emissiveIntensity={3}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* simple mic stand, center stage */}
      <group position={[0, STAGE.height, stageZ + 0.2]}>
        <mesh position={[0, 0.7, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 1.4, 8]} />
          <meshStandardMaterial color="#0a0a0a" roughness={0.4} metalness={0.6} />
        </mesh>
        <mesh position={[0, 1.42, 0.02]}>
          <sphereGeometry args={[0.05, 10, 10]} />
          <meshStandardMaterial color="#151515" roughness={0.5} metalness={0.4} />
        </mesh>
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.16, 16]} />
          <meshStandardMaterial color="#0a0a0a" side={DoubleSide} />
        </mesh>
      </group>
    </group>
  )
}
