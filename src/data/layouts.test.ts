import { describe, expect, it } from 'vitest'
import { PLAYER_RADIUS, ROOM, STATIC_COLLIDERS } from './floorplan'
import type { ColliderSpec } from './floorplan'
import { FURNITURE_RADIUS, LAYOUTS, LAYOUT_IDS, deriveColliders, seatedCapacity } from './layouts'

const halfW = ROOM.width / 2
const halfL = ROOM.length / 2

function circleDistance(a: ColliderSpec & { kind: 'circle' }, b: ColliderSpec & { kind: 'circle' }) {
  const dx = a.center[0] - b.center[0]
  const dz = a.center[1] - b.center[1]
  return Math.hypot(dx, dz)
}

describe('layout presets', () => {
  it('dinner seats exactly 60', () => {
    expect(seatedCapacity(LAYOUTS.dinner)).toBe(60)
  })

  it('cocktail keeps an open floor with 10+ high-tops', () => {
    const highTops = LAYOUTS.cocktail.items.filter((i) => i.kind === 'cocktailTable')
    expect(highTops.length).toBeGreaterThanOrEqual(10)
    expect(LAYOUTS.cocktail.items).toHaveLength(highTops.length)
  })

  it('showcase has at least 8 gallery pieces and a clear stage front', () => {
    const art = LAYOUTS.showcase.items.filter((i) => i.kind === 'easel' || i.kind === 'artPanel')
    expect(art.length).toBeGreaterThanOrEqual(8)
    // the area directly in front of the stage (within its width) stays open
    // for talks: colliders must end 1.2m+ from the stage front line (z=-7.4)
    const stageFront = -7.4
    for (const c of deriveColliders(LAYOUTS.showcase.items)) {
      if (c.kind !== 'circle') continue
      if (Math.abs(c.center[0]) < 2.3) {
        expect(c.center[1] - c.radius, `${c.label}@${c.center}`).toBeGreaterThan(stageFront + 1.2)
      }
    }
  })

  it.each(LAYOUT_IDS)('%s: every item stays inside the room with margin', (id) => {
    for (const item of LAYOUTS[id].items) {
      const [x, z] = item.position
      expect(Math.abs(x)).toBeLessThanOrEqual(halfW - 0.5)
      expect(Math.abs(z)).toBeLessThanOrEqual(halfL - 0.5)
    }
  })

  it.each(LAYOUT_IDS)('%s: furniture colliders do not overlap each other', (id) => {
    const colliders = deriveColliders(LAYOUTS[id].items)
    for (let i = 0; i < colliders.length; i++) {
      for (let j = i + 1; j < colliders.length; j++) {
        const a = colliders[i]
        const b = colliders[j]
        if (a.kind !== 'circle' || b.kind !== 'circle') continue
        expect(
          circleDistance(a, b),
          `${a.label}@${a.center} overlaps ${b.label}@${b.center}`,
        ).toBeGreaterThanOrEqual(a.radius + b.radius - 1e-6)
      }
    }
  })

  it.each(LAYOUT_IDS)('%s: the carpet corridor stays walkable', (id) => {
    // A guest walking the center line |x| < 0.75 must never intersect furniture.
    const corridor = 0.75
    for (const c of deriveColliders(LAYOUTS[id].items)) {
      if (c.kind !== 'circle') continue
      const [x, z] = c.center
      if (z > ROOM.carpet.zFrom && z < ROOM.carpet.zTo) {
        expect(
          Math.abs(x) - c.radius,
          `${c.label}@${c.center} blocks the carpet corridor`,
        ).toBeGreaterThanOrEqual(corridor)
      }
    }
  })

  it.each(LAYOUT_IDS)('%s: furniture keeps clear of columns and stage', (id) => {
    const statics = STATIC_COLLIDERS.filter((c) => c.kind === 'circle')
    for (const c of deriveColliders(LAYOUTS[id].items)) {
      if (c.kind !== 'circle') continue
      for (const s of statics) {
        if (s.kind !== 'circle') continue
        expect(
          circleDistance(c, s),
          `${c.label}@${c.center} overlaps column @${s.center}`,
        ).toBeGreaterThanOrEqual(c.radius + s.radius - 1e-6)
      }
    }
  })

  it.each(LAYOUT_IDS)('%s: spawn point is clear of furniture', (id) => {
    const [sx, sz] = ROOM.spawn.position
    for (const c of deriveColliders(LAYOUTS[id].items)) {
      if (c.kind !== 'circle') continue
      const d = Math.hypot(c.center[0] - sx, c.center[1] - sz)
      expect(d).toBeGreaterThan(c.radius + PLAYER_RADIUS)
    }
  })

  it('furniture radii are defined for every kind', () => {
    for (const id of LAYOUT_IDS) {
      for (const item of LAYOUTS[id].items) {
        expect(FURNITURE_RADIUS[item.kind]).toBeGreaterThan(0)
      }
    }
  })
})
