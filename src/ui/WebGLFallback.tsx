const BOOKING_URL = 'https://speakeasyottawa.com/host-your-event'

/**
 * Shown when the browser can't create a WebGL context. The page should still
 * sell the venue, so it presents the key facts and the booking CTA.
 */
export function WebGLFallback() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'grid',
        placeItems: 'center',
        padding: '24px',
        textAlign: 'center',
      }}
    >
      <div style={{ maxWidth: 560 }}>
        <h1 style={{ fontFamily: 'var(--deco)', color: 'var(--gold)', fontWeight: 400 }}>
          Speakeasy Tapas Lounge
        </h1>
        <p style={{ color: 'var(--cream-dim)', lineHeight: 1.6 }}>
          Your browser can&apos;t display the interactive 3D tour, but the room is real: a
          candlelit lounge in Ottawa&apos;s ByWard Market with a glowing bar, live-jazz stage and
          seating for 60 (or 100 standing) — yours for private events.
        </p>
        <p style={{ color: 'var(--cream-dim)' }}>55 York St, Ottawa · +1 613-241-6221</p>
        <a
          href={BOOKING_URL}
          target="_blank"
          rel="noopener"
          style={{
            display: 'inline-block',
            marginTop: 16,
            padding: '12px 28px',
            border: '1px solid var(--gold)',
            color: 'var(--gold-bright)',
            textDecoration: 'none',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            fontSize: 14,
          }}
        >
          Book this venue
        </a>
      </div>
    </div>
  )
}
