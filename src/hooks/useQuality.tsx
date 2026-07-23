import { PerformanceMonitor } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { URL_PARAMS } from '../debug/urlParams'
import { useVenueStore, type Quality } from '../state/store'

/** DPR ceiling per tier — caps device pixel ratio so phones don't overdraw. */
export const QUALITY_DPR: Record<Quality, [number, number]> = {
  high: [1, 2],
  med: [1, 1.5],
  low: [1, 1],
}

const ORDER: Quality[] = ['high', 'med', 'low']

/** Initial tier: explicit ?quality=, else coarse-pointer → med, else high. */
export function pickInitialQuality(): Quality {
  if (URL_PARAMS.quality) return URL_PARAMS.quality
  if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) {
    return 'med'
  }
  return 'high'
}

/**
 * Watches frame rate and steps the quality tier down once if the device can't
 * keep up (so it doesn't oscillate). Skipped when a tier is forced via
 * ?quality=.
 */
export function QualityManager() {
  const setDpr = useThree((s) => s.setDpr)

  if (URL_PARAMS.quality) return null

  return (
    <PerformanceMonitor
      onDecline={() => {
        const q = useVenueStore.getState().quality
        const next = ORDER[Math.min(ORDER.indexOf(q) + 1, ORDER.length - 1)]
        if (next !== q) {
          useVenueStore.getState().setQuality(next)
          setDpr(QUALITY_DPR[next][1])
        }
      }}
    />
  )
}
