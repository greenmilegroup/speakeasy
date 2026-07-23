import { OrbitControls, Stats } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import { isLayoutId } from '../data/layouts'
import { useVenueStore } from '../state/store'
import { URL_PARAMS } from './urlParams'

/**
 * Always mounted: exposes window.__venue for the screenshot harness and
 * Playwright tests (renderer stats, layout switching; player teleport is
 * registered by PlayerControls).
 */
export function VenueApi() {
  const gl = useThree((s) => s.gl)
  useEffect(() => {
    const api = (window.__venue ??= {})
    api.info = () => ({
      calls: gl.info.render.calls,
      triangles: gl.info.render.triangles,
      geometries: gl.info.memory.geometries,
      textures: gl.info.memory.textures,
    })
    api.setLayout = (id) => {
      if (isLayoutId(id)) useVenueStore.getState().setLayout(id)
    }
  }, [gl])
  return null
}

/** Orbit fly-camera + FPS meter, only with ?debug. */
export function DebugTools() {
  if (!URL_PARAMS.debug) return null
  return (
    <>
      <Stats />
      <OrbitControls makeDefault target={[0, 1.2, 0]} />
    </>
  )
}
