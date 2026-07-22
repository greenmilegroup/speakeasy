import { Canvas } from '@react-three/fiber'
import { TouchControls } from './controls/TouchControls'
import { isLayoutId } from './data/layouts'
import { URL_PARAMS } from './debug/urlParams'
import { Experience } from './scene/Experience'
import { HotspotCard } from './ui/HotspotCard'
import { Hud } from './ui/Hud'
import { InteractPrompt } from './ui/InteractPrompt'
import { IntroOverlay } from './ui/IntroOverlay'
import { useVenueStore } from './state/store'

// apply deep-link layout (e.g. ?layout=cocktail) before first render
if (isLayoutId(URL_PARAMS.layout)) {
  useVenueStore.setState({ layoutId: URL_PARAMS.layout })
}

// touch-first devices skip pointer lock entirely
if (window.matchMedia('(pointer: coarse)').matches) {
  useVenueStore.setState({ controlMode: 'touch' })
}

// screenshot / deep-link entry skips the intro overlay
if (URL_PARAMS.autoenter) {
  useVenueStore.setState({ phase: 'exploring' })
}

export default function App() {
  const phase = useVenueStore((s) => s.phase)
  const controlMode = useVenueStore((s) => s.controlMode)

  return (
    <div className="app-root">
      <Canvas
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.toneMappingExposure = 1.1
        }}
        camera={{ fov: 70, near: 0.05, far: 60, position: [0, 1.6, 8.6] }}
      >
        <Experience />
      </Canvas>

      {controlMode === 'touch' && phase === 'exploring' && <TouchControls />}

      {URL_PARAMS.ui && (
        <div className="overlay-root">
          {phase === 'intro' ? (
            <IntroOverlay />
          ) : (
            <>
              <Hud />
              <InteractPrompt />
              <HotspotCard />
            </>
          )}
        </div>
      )}
    </div>
  )
}
