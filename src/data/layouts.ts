import type { ColliderSpec, Vec2 } from './floorplan'

/**
 * The three bookable configurations of the room. Each preset is pure data;
 * the Furniture renderer instances meshes from it and the collision system
 * derives blockers from it, so switching presets reconfigures both at once.
 */

export type LayoutId = 'dinner' | 'cocktail' | 'showcase'

export type FurnitureKind =
  | 'diningTable' // 0.9m square, black cloth, 4 chairs, plates, candle
  | 'banquetteTable' // table against the bench, 2 chairs street-side
  | 'cocktailTable' // 0.6m round high-top, candle
  | 'easel' // gallery easel with framed art
  | 'artPanel' // freestanding display panel

export interface FurnitureItem {
  kind: FurnitureKind
  position: Vec2
  rotationY?: number
}

export interface LayoutPreset {
  id: LayoutId
  label: string
  capacity: string
  blurb: string
  items: FurnitureItem[]
}

/** Guests seated per furniture piece (banquette bench seats ride along). */
export const SEATS: Record<FurnitureKind, number> = {
  diningTable: 4,
  banquetteTable: 2,
  cocktailTable: 0,
  easel: 0,
  artPanel: 0,
}

/** Collision radius per furniture piece — dining tables enclose their chairs. */
export const FURNITURE_RADIUS: Record<FurnitureKind, number> = {
  diningTable: 0.85,
  banquetteTable: 0.7,
  cocktailTable: 0.5,
  easel: 0.55,
  artPanel: 0.55,
}

function row(kind: FurnitureKind, x: number, zs: number[], rotationY?: number): FurnitureItem[] {
  return zs.map((z) => ({ kind, position: [x, z] as Vec2, rotationY }))
}

function zRange(from: number, count: number, step: number): number[] {
  return Array.from({ length: count }, (_, i) => from + i * step)
}

// --- Intimate Dining: two columns of four-tops + banquette tables ≈ 60 covers
const dinnerItems: FurnitureItem[] = [
  ...row('diningTable', -2.15, zRange(-5, 6, 2.2)),
  ...row('diningTable', 1.95, [-5.6, -3.4, -1.05, 1.2, 4.2, 6.4]),
  ...row('banquetteTable', 3.6, zRange(-5, 6, 2.2)),
]

// --- Cocktail Reception: high-tops hug the sides, wide-open floor
const cocktailItems: FurnitureItem[] = [
  ...row('cocktailTable', -2.4, zRange(-6, 7, 2.0)),
  ...row('cocktailTable', 2.3, [-6, -4, 0, 4, 6]),
]

// --- Artistic Showcase: gallery pieces + a few high-tops, stage kept clear
const showcaseItems: FurnitureItem[] = [
  ...row('easel', 3.2, [-6, -4, -1, 1, 4, 6], -Math.PI / 2),
  ...row('artPanel', -1.8, [-4.5, -1.5, 1.5, 4.5], Math.PI / 2),
  { kind: 'cocktailTable', position: [-2.15, 6.8] },
  { kind: 'cocktailTable', position: [2.15, 6.8] },
  { kind: 'cocktailTable', position: [-1.55, -5.6] },
  { kind: 'cocktailTable', position: [1.55, -5.6] },
]

export const LAYOUTS: Record<LayoutId, LayoutPreset> = {
  dinner: {
    id: 'dinner',
    label: 'Intimate Dining',
    capacity: '60 seated',
    blurb: 'Candlelit tapas dinners with a fully customizable menu.',
    items: dinnerItems,
  },
  cocktail: {
    id: 'cocktail',
    label: 'Cocktail Reception',
    capacity: '100 standing',
    blurb: 'Open floor, high-top tables and an open-bar welcome.',
    items: cocktailItems,
  },
  showcase: {
    id: 'showcase',
    label: 'Artistic Showcase',
    capacity: 'Gallery · up to 100',
    blurb: 'Gallery-style layout that puts artwork centre stage.',
    items: showcaseItems,
  },
}

export const LAYOUT_IDS = Object.keys(LAYOUTS) as LayoutId[]

export function isLayoutId(value: string | null | undefined): value is LayoutId {
  return value != null && value in LAYOUTS
}

export function seatedCapacity(preset: LayoutPreset): number {
  return preset.items.reduce((sum, item) => sum + SEATS[item.kind], 0)
}

export function deriveColliders(items: FurnitureItem[]): ColliderSpec[] {
  return items.map((item) => ({
    kind: 'circle',
    center: item.position,
    radius: FURNITURE_RADIUS[item.kind],
    label: item.kind,
  }))
}
