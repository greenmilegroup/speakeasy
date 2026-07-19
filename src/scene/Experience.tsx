import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { PlayerControls } from '../controls/PlayerControls'
import { DebugTools, VenueApi } from '../debug/DebugTools'
import { CameraRig } from './CameraRig'
import { Ceiling } from './Ceiling'
import { Lighting } from './Lighting'
import { Room } from './Room'

/**
 * Stamps data-ready="1" on <html> once the first frame has rendered, so the
 * Playwright screenshot harness knows the scene is actually on screen.
 */
function ReadyFlag() {
  const done = useRef(false)
  useFrame(() => {
    if (!done.current) {
      done.current = true
      document.documentElement.dataset.ready = '1'
    }
  })
  return null
}

/** Composition root for everything inside the canvas. */
export function Experience() {
  return (
    <>
      <color attach="background" args={['#070403']} />
      <fog attach="fog" args={['#070403', 14, 26]} />
      <ReadyFlag />
      <VenueApi />
      <CameraRig />
      <PlayerControls />
      <DebugTools />
      <Lighting />
      <Room />
      <Ceiling />
    </>
  )
}
