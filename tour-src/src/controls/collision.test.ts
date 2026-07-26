import { describe, expect, it } from 'vitest'
import type { ColliderSpec } from '../data/floorplan'
import { resolveMovement } from './collision'

const R = 0.35
const bounds = { halfW: 4.5, halfL: 10 }

describe('resolveMovement', () => {
  it('moves freely when nothing is in the way', () => {
    const out = resolveMovement(0, 0, 0.1, -0.1, R, [], bounds)
    expect(out.x).toBeCloseTo(0.1)
    expect(out.z).toBeCloseTo(-0.1)
  })

  it('zero delta against nothing stays put', () => {
    const out = resolveMovement(1, 2, 0, 0, R, [], bounds)
    expect(out).toEqual({ x: 1, z: 2 })
  })

  it('clamps to the room walls', () => {
    const out = resolveMovement(4.4, 9.9, 1, 1, R, [], bounds)
    expect(out.x).toBeCloseTo(4.5 - R)
    expect(out.z).toBeCloseTo(10 - R)
  })

  it('pushes out of a circle collider', () => {
    const table: ColliderSpec = { kind: 'circle', center: [0, 0], radius: 0.85 }
    const out = resolveMovement(1.3, 0, -0.2, 0, R, [table], bounds)
    // stopped at the collider surface: 0.85 + 0.35 = 1.2
    expect(Math.hypot(out.x, out.z)).toBeGreaterThanOrEqual(1.2 - 1e-9)
    expect(out.x).toBeCloseTo(1.2, 5)
  })

  it('slides along a circle instead of sticking', () => {
    const table: ColliderSpec = { kind: 'circle', center: [0, 0], radius: 0.85 }
    // walking diagonally into the table: tangential motion survives
    const out = resolveMovement(1.25, 0.4, -0.1, -0.1, R, [table], bounds)
    expect(out.z).toBeLessThan(0.4)
    expect(Math.hypot(out.x, out.z)).toBeGreaterThanOrEqual(1.2 - 1e-9)
  })

  it('stops at an AABB face and slides along it', () => {
    const bar: ColliderSpec = { kind: 'aabb', min: [-4.5, -2], max: [-3.55, 8] }
    // walking straight into the bar front while drifting +z
    const out = resolveMovement(-3.1, 3, -0.15, 0.1, R, [bar], bounds)
    expect(out.x).toBeCloseTo(-3.55 + R, 5)
    expect(out.z).toBeCloseTo(3.1, 5)
  })

  it('escapes when the center ends up inside an AABB', () => {
    const box: ColliderSpec = { kind: 'aabb', min: [-1, -1], max: [1, 1] }
    const out = resolveMovement(0.9, 0.05, 0.05, 0, R, [box], bounds)
    // nearest face is +X
    expect(out.x).toBeCloseTo(1 + R, 5)
  })

  it('settles a corner formed by two colliders without deep penetration', () => {
    // circle near a wall: relaxation resolves both constraints to within a
    // small tolerance (a thin feasible sliver won't converge exactly, but the
    // player must never be left deeply inside either collider).
    const wall: ColliderSpec = { kind: 'aabb', min: [1.5, -5], max: [3, 5] }
    const table: ColliderSpec = { kind: 'circle', center: [0, 0], radius: 1.1 }
    const out = resolveMovement(0.8, 0.5, 0.3, 0.3, R, [wall, table], bounds)
    const tol = 0.06
    // not deeply inside the wall (front face x = 1.5, player radius R)
    expect(out.x).toBeLessThanOrEqual(1.5 - R + tol)
    // not deeply inside the table circle
    expect(Math.hypot(out.x, out.z)).toBeGreaterThanOrEqual(1.1 + R - tol)
  })

  it('handles the degenerate dead-center case', () => {
    const c: ColliderSpec = { kind: 'circle', center: [2, 2], radius: 0.5 }
    const out = resolveMovement(2, 2, 0, 0, R, [c], bounds)
    expect(Math.hypot(out.x - 2, out.z - 2)).toBeGreaterThanOrEqual(0.85 - 1e-9)
  })
})
