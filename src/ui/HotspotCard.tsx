import { BOOKING_URL, HOTSPOTS } from '../data/hotspots'
import { LAYOUTS } from '../data/layouts'
import { useVenueStore } from '../state/store'

/** Slide-in detail card for the active hotspot (right sheet / mobile bottom). */
export function HotspotCard() {
  const activeId = useVenueStore((s) => s.activeHotspotId)
  const setActive = useVenueStore((s) => s.setActiveHotspot)
  const setLayout = useVenueStore((s) => s.setLayout)

  const spot = HOTSPOTS.find((h) => h.id === activeId)
  if (!spot) return null

  const close = () => setActive(null)

  return (
    <>
      <div className="card-scrim" onClick={close} />
      <div className="hotspot-card" role="dialog" aria-label={spot.title}>
        <button className="card-close" onClick={close} aria-label="Close">
          ✕
        </button>
        <p className="card-eyebrow">The Venue</p>
        <h2 className="card-title">{spot.title}</h2>
        {spot.paragraphs.map((p, i) => (
          <p className="card-p" key={i}>
            {p}
          </p>
        ))}
        {spot.facts && spot.facts.length > 0 && (
          <div className="card-facts">
            {spot.facts.map((f, i) => (
              <div className="card-fact" key={i}>
                <span className="cf-label">{f.label}</span>
                <span className="cf-value">{f.value}</span>
              </div>
            ))}
          </div>
        )}
        <div className="card-actions">
          {spot.linkLayout && (
            <button
              className="btn-ghost"
              onClick={() => {
                setLayout(spot.linkLayout!)
                close()
              }}
            >
              View in {LAYOUTS[spot.linkLayout].label} layout
            </button>
          )}
          <a className="cta" href={BOOKING_URL} target="_blank" rel="noopener">
            Book this venue ↗
          </a>
        </div>
      </div>
    </>
  )
}
