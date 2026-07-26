import { useState } from 'react'
import { controlsApi } from '../controls/PlayerControls'
import { VENUE } from '../data/hotspots'
import { useVenueStore } from '../state/store'

/** Branded entry screen. Enter starts the walk and grabs pointer lock. */
export function IntroOverlay() {
  const setPhase = useVenueStore((s) => s.setPhase)
  const controlMode = useVenueStore((s) => s.controlMode)
  const [leaving, setLeaving] = useState(false)
  const touch = controlMode === 'touch'

  const enter = () => {
    setLeaving(true)
    controlsApi.lock()
    setTimeout(() => setPhase('exploring'), 450)
  }

  return (
    <div className={`intro${leaving ? ' leaving' : ''}`}>
      <div className="intro-card">
        <p className="intro-eyebrow">ByWard Market · Ottawa</p>
        <h1 className="intro-title">
          Speakeasy <span className="amp">·</span> Tapas Lounge
        </h1>
        <p className="intro-sub">
          Step inside and walk the room — the glowing bar, the candlelit tables and the live-jazz
          stage. Picture your private event in the space before you book it.
        </p>
        <p className="intro-cap">Seats 60 · Stands 100 · Fully customizable</p>
        <button className="btn-primary" onClick={enter}>
          Enter the Lounge
        </button>
        <p className="intro-hints">
          {touch ? (
            <>
              <b>Left thumb</b> to walk · <b>drag right</b> to look
            </>
          ) : (
            <>
              <b>W A S D</b> to walk · <b>mouse</b> to look · <b>Shift</b> to hurry
            </>
          )}
        </p>
        <p className="intro-hints" style={{ marginTop: 6, fontSize: 12, opacity: 0.7 }}>
          {VENUE.address}
        </p>
      </div>
    </div>
  )
}
