import { Instance, Instances } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import type { MeshStandardMaterial } from 'three'
import type { FurnitureItem, LayoutId } from '../../data/layouts'
import { LAYOUTS } from '../../data/layouts'
import { blobShadowTexture } from '../../textures/proceduralTextures'
import { useVenueStore } from '../../state/store'
import {
  artPanelGeometry,
  blobGeometry,
  canvasGeometry,
  candleGeometry,
  chairGeometry,
  cocktailTableGeometry,
  diningTableGeometry,
  easelGeometry,
  flameGeometry,
  napkinGeometry,
  plateGeometry,
} from './geometries'

interface Xf {
  position: [number, number, number]
  rotationY: number
}
interface Blob {
  position: [number, number, number]
  scale: number
}
interface ArtXf extends Xf {
  color: string
}

const ART_COLORS = ['#b5423a', '#3a6ea5', '#c9a45c', '#4a7a52', '#8a5a9a', '#c96a3a']

/** Chair offsets + facings around a square dining table. */
const DINING_CHAIRS: Xf[] = [
  { position: [0, 0, -0.62], rotationY: 0 },
  { position: [0, 0, 0.62], rotationY: Math.PI },
  { position: [-0.62, 0, 0], rotationY: Math.PI / 2 },
  { position: [0.62, 0, 0], rotationY: -Math.PI / 2 },
]
/** Plate + napkin per seat, pulled toward the table edge. */
const DINING_SETTINGS = DINING_CHAIRS.map((c) => ({
  x: c.position[0] * 0.52,
  z: c.position[2] * 0.52,
}))

function buildLayout(items: FurnitureItem[]) {
  const chairs: Xf[] = []
  const plates: [number, number, number][] = []
  const napkins: [number, number, number][] = []
  const candles: [number, number, number][] = []
  const diningTables: Xf[] = []
  const cocktailTables: Xf[] = []
  const easels: ArtXf[] = []
  const artPanels: ArtXf[] = []
  const blobs: Blob[] = []
  let artIx = 0

  for (const item of items) {
    const [x, z] = item.position
    const ry = item.rotationY ?? 0

    if (item.kind === 'diningTable') {
      diningTables.push({ position: [x, 0, z], rotationY: ry })
      blobs.push({ position: [x, 0.02, z], scale: 1.5 })
      for (const c of DINING_CHAIRS) {
        chairs.push({ position: [x + c.position[0], 0, z + c.position[2]], rotationY: c.rotationY })
      }
      for (const s of DINING_SETTINGS) {
        plates.push([x + s.x, 0.79, z + s.z])
        napkins.push([x + s.x * 1.35, 0.79, z + s.z * 1.35])
      }
      candles.push([x, 0.79, z])
    } else if (item.kind === 'banquetteTable') {
      diningTables.push({ position: [x, 0, z], rotationY: ry })
      blobs.push({ position: [x, 0.02, z], scale: 1.4 })
      // two chairs on the aisle (−X) side; the bench serves the +X side
      chairs.push({ position: [x - 0.62, 0, z - 0.26], rotationY: Math.PI / 2 })
      chairs.push({ position: [x - 0.62, 0, z + 0.26], rotationY: Math.PI / 2 })
      plates.push([x - 0.3, 0.79, z])
      plates.push([x + 0.3, 0.79, z])
      candles.push([x, 0.79, z])
    } else if (item.kind === 'cocktailTable') {
      cocktailTables.push({ position: [x, 0, z], rotationY: ry })
      blobs.push({ position: [x, 0.02, z], scale: 0.9 })
      candles.push([x, 1.09, z])
    } else if (item.kind === 'easel') {
      easels.push({ position: [x, 0, z], rotationY: ry, color: ART_COLORS[artIx++ % ART_COLORS.length] })
      blobs.push({ position: [x, 0.02, z], scale: 1.0 })
    } else if (item.kind === 'artPanel') {
      artPanels.push({ position: [x, 0, z], rotationY: ry, color: ART_COLORS[artIx++ % ART_COLORS.length] })
      blobs.push({ position: [x, 0.02, z], scale: 1.6 })
    }
  }

  return { chairs, plates, napkins, candles, diningTables, cocktailTables, easels, artPanels, blobs }
}

/** Amber candle flames sharing one material whose glow flickers each frame. */
function Flames({ positions }: { positions: [number, number, number][] }) {
  const mat = useRef<MeshStandardMaterial>(null)
  useFrame((state) => {
    if (!mat.current) return
    const t = state.clock.elapsedTime
    mat.current.emissiveIntensity = 2.0 + Math.sin(t * 11) * 0.35 + Math.sin(t * 27) * 0.18
  })
  if (positions.length === 0) return null
  return (
    <Instances geometry={flameGeometry} limit={positions.length} frustumCulled={false}>
      <meshStandardMaterial
        ref={mat}
        color="#ffd27a"
        emissive="#ff9a2a"
        emissiveIntensity={2}
        toneMapped={false}
      />
      {positions.map((p, i) => (
        <Instance key={i} position={p} />
      ))}
    </Instances>
  )
}

export function Furniture() {
  const layoutId = useVenueStore((s) => s.layoutId) as LayoutId
  const L = useMemo(() => buildLayout(LAYOUTS[layoutId].items), [layoutId])
  const blob = useMemo(() => blobShadowTexture(), [])

  return (
    <group>
      {/* blob contact shadows */}
      {L.blobs.length > 0 && (
        <Instances geometry={blobGeometry} limit={L.blobs.length} frustumCulled={false}>
          <meshBasicMaterial map={blob} transparent opacity={0.55} depthWrite={false} color="#000" />
          {L.blobs.map((b, i) => (
            <Instance key={i} position={b.position} scale={b.scale} rotation={[-Math.PI / 2, 0, 0]} />
          ))}
        </Instances>
      )}

      {/* dining / banquette tables (black cloth) */}
      {L.diningTables.length > 0 && (
        <Instances geometry={diningTableGeometry} limit={L.diningTables.length} frustumCulled={false}>
          <meshStandardMaterial color="#0c0a09" roughness={0.92} />
          {L.diningTables.map((t, i) => (
            <Instance key={i} position={t.position} rotation={[0, t.rotationY, 0]} />
          ))}
        </Instances>
      )}

      {/* cocktail high-tops (black cloth) */}
      {L.cocktailTables.length > 0 && (
        <Instances geometry={cocktailTableGeometry} limit={L.cocktailTables.length} frustumCulled={false}>
          <meshStandardMaterial color="#100c0a" roughness={0.9} />
          {L.cocktailTables.map((t, i) => (
            <Instance key={i} position={t.position} rotation={[0, t.rotationY, 0]} />
          ))}
        </Instances>
      )}

      {/* chairs */}
      {L.chairs.length > 0 && (
        <Instances geometry={chairGeometry} limit={L.chairs.length} frustumCulled={false}>
          <meshStandardMaterial color="#131110" roughness={0.55} metalness={0.1} />
          {L.chairs.map((c, i) => (
            <Instance key={i} position={c.position} rotation={[0, c.rotationY, 0]} />
          ))}
        </Instances>
      )}

      {/* plates */}
      {L.plates.length > 0 && (
        <Instances geometry={plateGeometry} limit={L.plates.length} frustumCulled={false}>
          <meshStandardMaterial color="#f2efe9" roughness={0.4} />
          {L.plates.map((p, i) => (
            <Instance key={i} position={p} />
          ))}
        </Instances>
      )}

      {/* napkins */}
      {L.napkins.length > 0 && (
        <Instances geometry={napkinGeometry} limit={L.napkins.length} frustumCulled={false}>
          <meshStandardMaterial color="#e7e2d6" roughness={0.7} />
          {L.napkins.map((p, i) => (
            <Instance key={i} position={p} />
          ))}
        </Instances>
      )}

      {/* candle bodies */}
      {L.candles.length > 0 && (
        <Instances geometry={candleGeometry} limit={L.candles.length} frustumCulled={false}>
          <meshStandardMaterial color="#e8dcc0" roughness={0.5} emissive="#5a3a10" emissiveIntensity={0.4} />
          {L.candles.map((p, i) => (
            <Instance key={i} position={p} />
          ))}
        </Instances>
      )}
      <Flames positions={L.candles} />

      {/* easels + their canvases */}
      {L.easels.length > 0 && (
        <>
          <Instances geometry={easelGeometry} limit={L.easels.length} frustumCulled={false}>
            <meshStandardMaterial color="#5a3d26" roughness={0.7} />
            {L.easels.map((e, i) => (
              <Instance key={i} position={e.position} rotation={[0, e.rotationY, 0]} />
            ))}
          </Instances>
          <Instances geometry={canvasGeometry} limit={L.easels.length} frustumCulled={false}>
            <meshStandardMaterial roughness={0.6} emissiveIntensity={0.25} />
            {L.easels.map((e, i) => (
              <Instance key={i} position={e.position} rotation={[0, e.rotationY, 0]} color={e.color} />
            ))}
          </Instances>
        </>
      )}

      {/* freestanding art panels */}
      {L.artPanels.length > 0 && (
        <Instances geometry={artPanelGeometry} limit={L.artPanels.length} frustumCulled={false}>
          <meshStandardMaterial roughness={0.7} />
          {L.artPanels.map((a, i) => (
            <Instance key={i} position={a.position} rotation={[0, a.rotationY, 0]} color={a.color} />
          ))}
        </Instances>
      )}
    </group>
  )
}
