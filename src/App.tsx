import { Canvas, useFrame } from '@react-three/fiber'
import { useRef } from 'react'

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

export default function App() {
  return (
    <div className="app-root">
      <Canvas
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.toneMappingExposure = 1.1
        }}
        camera={{ fov: 70, near: 0.05, far: 60, position: [0, 1.6, 8.6] }}
      >
        <color attach="background" args={['#0b0806']} />
        <ReadyFlag />
        {/* M0 placeholder scene: a lit box standing in for the venue */}
        <hemisphereLight args={['#3a2f28', '#14100e', 0.6]} />
        <pointLight position={[2, 2.5, 5]} intensity={24} color="#ffb46b" />
        <mesh position={[0, 1, 4]} rotation={[0, Math.PI / 5, 0]}>
          <boxGeometry args={[1.2, 1.2, 1.2]} />
          <meshStandardMaterial color="#8a1f1f" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0, 4]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[12, 12]} />
          <meshStandardMaterial color="#26201c" roughness={0.9} />
        </mesh>
      </Canvas>
    </div>
  )
}
