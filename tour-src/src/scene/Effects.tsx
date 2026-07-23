import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'
import { useVenueStore } from '../state/store'

/**
 * Post-processing that carries the venue's glow: bloom picks up the emissive
 * LEDs, sign and candle flames (all authored above luminance 1.0). Tiered so
 * weak devices can drop the whole composer and fall back to native MSAA.
 */
export function Effects() {
  const quality = useVenueStore((s) => s.quality)

  // low tier: no composer at all (native MSAA returns via the canvas)
  if (quality === 'low') return null

  const high = quality === 'high'
  return (
    <EffectComposer multisampling={high ? 4 : 0}>
      <Bloom
        mipmapBlur
        luminanceThreshold={1.0}
        luminanceSmoothing={0.15}
        intensity={high ? 0.72 : 0.55}
        radius={0.6}
      />
      <Vignette offset={0.32} darkness={0.55} eskil={false} />
    </EffectComposer>
  )
}
