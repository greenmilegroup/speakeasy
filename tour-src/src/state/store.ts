import { create } from 'zustand'

export type Phase = 'intro' | 'exploring'
export type LayoutId = 'dinner' | 'cocktail' | 'showcase'
export type Quality = 'high' | 'med' | 'low'
export type ControlMode = 'pointer' | 'drag' | 'touch'

interface VenueState {
  /** intro = overlay shown, frameloop paused; exploring = walking around */
  phase: Phase
  layoutId: LayoutId
  activeHotspotId: string | null
  /** nearest hotspot within interact range (drives the "Press E" prompt) */
  nearHotspotId: string | null
  hotspotsVisible: boolean
  quality: Quality
  controlMode: ControlMode
  setPhase: (phase: Phase) => void
  setLayout: (layoutId: LayoutId) => void
  setActiveHotspot: (id: string | null) => void
  setNearHotspot: (id: string | null) => void
  setHotspotsVisible: (visible: boolean) => void
  setQuality: (quality: Quality) => void
  setControlMode: (mode: ControlMode) => void
}

export const useVenueStore = create<VenueState>()((set) => ({
  phase: 'intro',
  layoutId: 'dinner',
  activeHotspotId: null,
  nearHotspotId: null,
  hotspotsVisible: true,
  quality: 'high',
  controlMode: 'pointer',
  setPhase: (phase) => set({ phase }),
  setLayout: (layoutId) => set({ layoutId }),
  setActiveHotspot: (activeHotspotId) => set({ activeHotspotId }),
  setNearHotspot: (nearHotspotId) => set({ nearHotspotId }),
  setHotspotsVisible: (hotspotsVisible) => set({ hotspotsVisible }),
  setQuality: (quality) => set({ quality }),
  setControlMode: (controlMode) => set({ controlMode }),
}))
