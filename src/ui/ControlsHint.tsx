import { useEffect, useState } from 'react'
import { URL_PARAMS } from '../debug/urlParams'

/**
 * Lightweight, temporary control hints for the preview build. The full
 * branded intro overlay arrives in a later milestone; until then this tells
 * testers how to move and look on either platform. Hidden when ?ui=0.
 */
export function ControlsHint() {
  const [visible, setVisible] = useState(true)
  const touch =
    typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 6000)
    return () => clearTimeout(t)
  }, [])

  if (!URL_PARAMS.ui || !visible) return null

  return (
    <div
      onClick={() => setVisible(false)}
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 'max(24px, env(safe-area-inset-bottom))',
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
        zIndex: 30,
        padding: '0 16px',
      }}
    >
      <div
        style={{
          pointerEvents: 'auto',
          background: 'rgba(11,8,6,0.82)',
          border: '1px solid rgba(201,164,92,0.45)',
          borderRadius: 10,
          padding: '10px 18px',
          color: '#f3e9d6',
          fontFamily: 'Georgia, serif',
          fontSize: 14,
          textAlign: 'center',
          letterSpacing: '0.02em',
          maxWidth: 520,
        }}
      >
        <span style={{ color: '#c9a45c', fontWeight: 'bold' }}>Speakeasy — preview</span>{' '}
        {touch
          ? '· left thumb to walk · drag the right side to look'
          : '· click, then use W A S D to walk · drag / move mouse to look'}
      </div>
    </div>
  )
}
