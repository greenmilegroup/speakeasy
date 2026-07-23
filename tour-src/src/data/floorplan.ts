/**
 * Single source of truth for the venue's geometry.
 *
 * Units are meters, origin at floor center.
 *   +X = right wall (banquette / damask)   −X = left wall (bar / brick)
 *   −Z = stage / back wall                 +Z = entrance / front wall
 * Eye height is 1.6. All scene components AND the collision system derive
 * from the specs in this file — change a number here and both follow.
 */

export type Vec2 = readonly [x: number, z: number]

export interface RoomSpec {
  /** X extent */
  width: number
  /** Z extent */
  length: number
  height: number
  carpet: { width: number; zFrom: number; zTo: number }
  spawn: { position: Vec2; yaw: number }
}

export type ColliderSpec =
  | { kind: 'aabb'; min: Vec2; max: Vec2; label?: string }
  | { kind: 'circle'; center: Vec2; radius: number; label?: string }

export const ROOM: RoomSpec = {
  width: 9,
  length: 20,
  height: 3.4,
  carpet: { width: 1.5, zFrom: -7.3, zTo: 9.3 },
  // just inside the front door, looking straight down the carpet at the stage
  spawn: { position: [0, 8.6], yaw: 0 },
}

export const EYE_HEIGHT = 1.6
export const PLAYER_RADIUS = 0.35

/** Bar along the left (−X) wall. */
export const BAR = {
  zFrom: -2,
  zTo: 8,
  /** guest-facing face of the counter */
  counterFrontX: -3.55,
  counterDepth: 0.65,
  counterHeight: 1.1,
  /** shelving unit depth against the brick wall */
  backBarDepth: 0.42,
} as const

/** Low performance stage against the back (−Z) wall. */
export const STAGE = {
  width: 4.6,
  depth: 2.4,
  height: 0.45,
  centerZ: -8.6,
} as const

/** Banquette bench along the right (+X) wall. */
export const BANQUETTE = {
  zFrom: -6,
  zTo: 7,
  depth: 0.55,
} as const

/** Living plant wall panel on the left wall, past the bar. */
export const PLANT_WALL = {
  zFrom: -5.5,
  zTo: -3,
  height: 2.6,
  depth: 0.15,
} as const

/** Rustic wood-clad structural columns right of the carpet. */
export const COLUMNS: readonly { center: Vec2; size: number }[] = [
  { center: [2.6, -2.2], size: 0.45 },
  { center: [2.6, 2.8], size: 0.45 },
]

const halfW = ROOM.width / 2

export const STATIC_COLLIDERS: ColliderSpec[] = [
  {
    kind: 'aabb',
    min: [-halfW, BAR.zFrom],
    max: [BAR.counterFrontX, BAR.zTo],
    label: 'bar',
  },
  {
    kind: 'aabb',
    min: [-STAGE.width / 2, STAGE.centerZ - STAGE.depth / 2],
    max: [STAGE.width / 2, STAGE.centerZ + STAGE.depth / 2],
    label: 'stage',
  },
  {
    kind: 'aabb',
    min: [halfW - BANQUETTE.depth, BANQUETTE.zFrom],
    max: [halfW, BANQUETTE.zTo],
    label: 'banquette',
  },
  {
    kind: 'aabb',
    min: [-halfW, PLANT_WALL.zFrom],
    max: [-halfW + PLANT_WALL.depth + 0.05, PLANT_WALL.zTo],
    label: 'plant-wall',
  },
  ...COLUMNS.map(
    (c): ColliderSpec => ({
      kind: 'circle',
      center: c.center,
      radius: c.size * 0.5 + 0.12,
      label: 'column',
    }),
  ),
]
