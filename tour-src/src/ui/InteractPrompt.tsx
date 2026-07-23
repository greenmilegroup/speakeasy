import { HOTSPOTS } from '../data/hotspots'
import { useVenueStore } from '../state/store'

/**
 * Pointer-lock helper UI: a subtle centre crosshair while exploring, and a
 * "Press E" prompt when the player is near a hotspot (since the hidden cursor
 * can't click the floating marker directly in locked mode).
 */
export function InteractPrompt() {
  const phase = useVenueStore((s) => s.phase)
  const controlMode = useVenueStore((s) => s.controlMode)
  const nearId = useVenueStore((s) => s.nearHotspotId)
  const activeId = useVenueStore((s) => s.activeHotspotId)

  if (phase !== 'exploring' || controlMode !== 'pointer' || activeId) return null
  const near = HOTSPOTS.find((h) => h.id === nearId)

  return (
    <>
      <div
        style={{
          position: 'fixed',
          left: '50%',
          top: '50%',
          width: 6,
          height: 6,
          marginLeft: -3,
          marginTop: -3,
          borderRadius: '50%',
          background: 'rgba(243,233,214,0.5)',
          boxShadow: '0 0 4px rgba(0,0,0,0.6)',
          pointerEvents: 'none',
        }}
      />
      {near && (
        <div
          style={{
            position: 'fixed',
            left: '50%',
            top: 'calc(50% + 30px)',
            transform: 'translateX(-50%)',
            background: 'rgba(11,8,6,0.85)',
            border: '1px solid var(--gold)',
            borderRadius: 8,
            padding: '8px 16px',
            color: 'var(--cream)',
            fontFamily: 'Georgia, serif',
            fontSize: 14,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}
        >
          <b style={{ color: 'var(--gold-bright)' }}>Press E</b> · {near.title}
        </div>
      )}
    </>
  )
}
