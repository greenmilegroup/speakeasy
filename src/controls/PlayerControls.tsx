import { PointerLockControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { Euler } from 'three'
import { EYE_HEIGHT, PLAYER_RADIUS, ROOM, STATIC_COLLIDERS } from '../data/floorplan'
import { LAYOUTS, deriveColliders } from '../data/layouts'
import { URL_PARAMS } from '../debug/urlParams'
import { useVenueStore } from '../state/store'
import { stepMove } from './collision'
import { consumeLook, inputState } from './inputState'
import { useKeyboard } from './useKeyboard'

const WALK_SPEED = 2.8
const SPRINT_SPEED = 4.2
const MAX_DT = 0.05
const LOOK_SENSITIVITY = 0.0045
const MAX_PITCH = (75 * Math.PI) / 180
const BOUNDS = { halfW: ROOM.width / 2, halfL: ROOM.length / 2 }

const tmpEuler = new Euler(0, 0, 0, 'YXZ')

/**
 * First-person walking. Look control is either the browser pointer lock
 * (desktop default) or accumulated drag/touch deltas — both funnel into the
 * same movement + collision path here. Disabled entirely when a fixed
 * screenshot cam (?cam=) or the ?debug orbit camera is active.
 */
export function PlayerControls() {
  const camera = useThree((s) => s.camera)
  const gl = useThree((s) => s.gl)
  const controlMode = useVenueStore((s) => s.controlMode)
  const setControlMode = useVenueStore((s) => s.setControlMode)
  const layoutId = useVenueStore((s) => s.layoutId)
  const active = !URL_PARAMS.cam && !URL_PARAMS.debug

  useKeyboard()

  const colliders = useMemo(
    () => [...STATIC_COLLIDERS, ...deriveColliders(LAYOUTS[layoutId].items)],
    [layoutId],
  )
  const collidersRef = useRef(colliders)
  collidersRef.current = colliders

  // One movement step against the current camera yaw + active colliders.
  const advanceMove = (moveX: number, moveZ: number, sprint: boolean, dt: number) => {
    tmpEuler.setFromQuaternion(camera.quaternion)
    const speed = sprint ? SPRINT_SPEED : WALK_SPEED
    const next = stepMove(
      camera.position.x,
      camera.position.z,
      tmpEuler.y,
      moveX,
      moveZ,
      speed,
      dt,
      PLAYER_RADIUS,
      collidersRef.current,
      BOUNDS,
    )
    camera.position.set(next.x, EYE_HEIGHT, next.z)
  }

  // Expose teleport/position/simulate for the Playwright harness. simulate
  // advances the real movement code at a fixed dt, so collision is testable
  // deterministically regardless of the headless renderer's frame rate.
  useEffect(() => {
    const api = (window.__venue ??= {})
    api.teleport = (x, z, yaw) => {
      camera.position.set(x, EYE_HEIGHT, z)
      if (yaw !== undefined) camera.rotation.set(0, yaw, 0, 'YXZ')
    }
    api.getPosition = () => {
      tmpEuler.setFromQuaternion(camera.quaternion)
      return { x: camera.position.x, y: camera.position.y, z: camera.position.z, yaw: tmpEuler.y }
    }
    api.simulate = (seconds, input) => {
      const dt = 1 / 60
      const steps = Math.round(seconds / dt)
      for (let i = 0; i < steps; i++) {
        advanceMove(input.strafe ?? 0, input.forward ?? 0, input.sprint ?? false, dt)
      }
      return api.getPosition!()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera])

  // If the browser refuses pointer lock (common inside iframes without the
  // allow attribute), fall back to click-drag look so the tour still works.
  useEffect(() => {
    const onError = () => setControlMode('drag')
    document.addEventListener('pointerlockerror', onError)
    return () => document.removeEventListener('pointerlockerror', onError)
  }, [setControlMode])

  // Drag-look fallback: accumulate pointer deltas while the primary button
  // is held. (Touch look lives in TouchControls with its own zones.)
  useEffect(() => {
    if (controlMode !== 'drag') return
    const el = gl.domElement
    let dragging = false
    let lastX = 0
    let lastY = 0
    const down = (e: PointerEvent) => {
      if (e.pointerType === 'touch' || e.button !== 0) return
      dragging = true
      lastX = e.clientX
      lastY = e.clientY
      el.setPointerCapture(e.pointerId)
    }
    const move = (e: PointerEvent) => {
      if (!dragging) return
      inputState.lookDX += e.clientX - lastX
      inputState.lookDY += e.clientY - lastY
      lastX = e.clientX
      lastY = e.clientY
    }
    const up = () => {
      dragging = false
    }
    el.addEventListener('pointerdown', down)
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointercancel', up)
    return () => {
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointercancel', up)
    }
  }, [controlMode, gl])

  useFrame((_, delta) => {
    if (!active) return
    const dt = Math.min(delta, MAX_DT)

    // look (drag/touch modes only — pointer lock rotates the camera itself)
    if (controlMode !== 'pointer') {
      const { dx, dy } = consumeLook()
      if (dx !== 0 || dy !== 0) {
        tmpEuler.setFromQuaternion(camera.quaternion)
        tmpEuler.y -= dx * LOOK_SENSITIVITY
        tmpEuler.x -= dy * LOOK_SENSITIVITY
        tmpEuler.x = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, tmpEuler.x))
        tmpEuler.z = 0
        camera.quaternion.setFromEuler(tmpEuler)
      }
    }

    // movement
    const { moveX, moveZ } = inputState
    if (moveX === 0 && moveZ === 0) return
    advanceMove(moveX, moveZ, inputState.sprint, dt)
  })

  if (!active || controlMode !== 'pointer') return null
  return <PointerLockControls />
}
