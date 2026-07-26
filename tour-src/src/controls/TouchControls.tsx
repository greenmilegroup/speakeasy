import { useEffect, useRef, useState } from 'react'
import { inputState } from './inputState'

/**
 * Mobile controls as a DOM layer over the canvas — no dependencies.
 *   left ~45% of the screen  = floating virtual joystick (movement)
 *   right side               = drag to look around
 * Both write into the shared `inputState` singleton, so movement and
 * collision run through the exact same path as desktop.
 */

const JOYSTICK_RADIUS = 48 // px, knob travel limit
const DEAD_ZONE = 0.12

interface Knob {
  pointerId: number
  baseX: number
  baseY: number
  knobX: number
  knobY: number
}

export function TouchControls() {
  const [knob, setKnob] = useState<Knob | null>(null)
  const lookId = useRef<number | null>(null)
  const lookLast = useRef({ x: 0, y: 0 })

  // reset movement when unmounted
  useEffect(() => {
    return () => {
      inputState.moveX = 0
      inputState.moveZ = 0
    }
  }, [])

  const isLeftZone = (clientX: number) => clientX < window.innerWidth * 0.45

  const onPointerDown = (e: React.PointerEvent) => {
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    if (isLeftZone(e.clientX) && knob === null) {
      setKnob({
        pointerId: e.pointerId,
        baseX: e.clientX,
        baseY: e.clientY,
        knobX: e.clientX,
        knobY: e.clientY,
      })
    } else if (lookId.current === null) {
      lookId.current = e.pointerId
      lookLast.current = { x: e.clientX, y: e.clientY }
    }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (knob && e.pointerId === knob.pointerId) {
      let dx = e.clientX - knob.baseX
      let dy = e.clientY - knob.baseY
      const len = Math.hypot(dx, dy)
      if (len > JOYSTICK_RADIUS) {
        dx = (dx / len) * JOYSTICK_RADIUS
        dy = (dy / len) * JOYSTICK_RADIUS
      }
      const nx = dx / JOYSTICK_RADIUS
      const nz = dy / JOYSTICK_RADIUS
      inputState.moveX = Math.abs(nx) > DEAD_ZONE ? nx : 0
      inputState.moveZ = Math.abs(nz) > DEAD_ZONE ? -nz : 0 // up = forward
      setKnob({ ...knob, knobX: knob.baseX + dx, knobY: knob.baseY + dy })
    } else if (e.pointerId === lookId.current) {
      inputState.lookDX += e.clientX - lookLast.current.x
      inputState.lookDY += e.clientY - lookLast.current.y
      lookLast.current = { x: e.clientX, y: e.clientY }
    }
  }

  const endPointer = (e: React.PointerEvent) => {
    if (knob && e.pointerId === knob.pointerId) {
      inputState.moveX = 0
      inputState.moveZ = 0
      setKnob(null)
    } else if (e.pointerId === lookId.current) {
      lookId.current = null
    }
  }

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endPointer}
      onPointerCancel={endPointer}
      style={{
        position: 'fixed',
        inset: 0,
        touchAction: 'none',
        zIndex: 20,
      }}
    >
      {knob && (
        <>
          <div
            style={{
              position: 'fixed',
              left: knob.baseX - JOYSTICK_RADIUS,
              top: knob.baseY - JOYSTICK_RADIUS,
              width: JOYSTICK_RADIUS * 2,
              height: JOYSTICK_RADIUS * 2,
              borderRadius: '50%',
              border: '2px solid rgba(201,164,92,0.5)',
              background: 'rgba(11,8,6,0.35)',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'fixed',
              left: knob.knobX - 22,
              top: knob.knobY - 22,
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'rgba(201,164,92,0.7)',
              pointerEvents: 'none',
            }}
          />
        </>
      )}
    </div>
  )
}
