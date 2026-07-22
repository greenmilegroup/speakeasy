import { Html } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { controlsApi } from '../controls/PlayerControls'
import { consumeInteract } from '../controls/inputState'
import { HOTSPOTS } from '../data/hotspots'
import { useVenueStore } from '../state/store'

const INTERACT_RANGE = 3.2

/**
 * Floating gold markers at points of interest. In drag/touch modes a marker
 * is tapped directly; in pointer-lock mode (cursor hidden) the nearest marker
 * within range shows a "Press E" prompt and E opens its card + frees the lock.
 */
export function Hotspots() {
  const camera = useThree((s) => s.camera)
  const visible = useVenueStore((s) => s.hotspotsVisible)
  const phase = useVenueStore((s) => s.phase)
  const controlMode = useVenueStore((s) => s.controlMode)
  const activeId = useVenueStore((s) => s.activeHotspotId)

  const open = (id: string) => {
    controlsApi.unlock()
    useVenueStore.getState().setActiveHotspot(id)
  }

  useFrame(() => {
    if (phase !== 'exploring') return
    // nearest hotspot to the camera, for the proximity prompt + E interact
    let nearId: string | null = null
    let best = INTERACT_RANGE
    for (const h of HOTSPOTS) {
      const dx = camera.position.x - h.position[0]
      const dz = camera.position.z - h.position[2]
      const d = Math.hypot(dx, dz)
      if (d < best) {
        best = d
        nearId = h.id
      }
    }
    const store = useVenueStore.getState()
    if (store.nearHotspotId !== nearId) store.setNearHotspot(nearId)
    if (consumeInteract() && nearId && !store.activeHotspotId) open(nearId)
  })

  if (!visible || phase !== 'exploring' || activeId) return null

  return (
    <>
      {HOTSPOTS.map((h) => (
        <Html
          key={h.id}
          position={h.position}
          center
          zIndexRange={[30, 0]}
          style={{ pointerEvents: controlMode === 'pointer' ? 'none' : 'auto' }}
        >
          <button
            className="hotspot-marker"
            aria-label={h.title}
            onClick={() => open(h.id)}
            onPointerDown={(e) => e.stopPropagation()}
          >
            ⓘ
          </button>
        </Html>
      ))}
    </>
  )
}
