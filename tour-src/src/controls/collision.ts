import type { ColliderSpec } from '../data/floorplan'

/**
 * 2D (XZ-plane) collision for a circular player against circles and AABBs.
 *
 * Movement per frame is far smaller than the player radius (4.2 m/s sprint ×
 * 50ms clamped dt = 0.21m < 0.35m), so tunneling can't happen and a simple
 * push-out relaxation is enough: each iteration displaces the player along
 * the minimal translation vector of any collider it penetrates, which
 * naturally produces wall sliding and settles multi-contact corners.
 */

export interface RoomBounds {
  halfW: number
  halfL: number
}

const ITERATIONS = 5

export function resolveMovement(
  x: number,
  z: number,
  dx: number,
  dz: number,
  radius: number,
  colliders: readonly ColliderSpec[],
  bounds: RoomBounds,
): { x: number; z: number } {
  let nx = x + dx
  let nz = z + dz

  for (let iter = 0; iter < ITERATIONS; iter++) {
    let moved = false

    for (const c of colliders) {
      if (c.kind === 'circle') {
        const ox = nx - c.center[0]
        const oz = nz - c.center[1]
        const minDist = c.radius + radius
        const d2 = ox * ox + oz * oz
        if (d2 >= minDist * minDist) continue
        const d = Math.sqrt(d2)
        if (d < 1e-6) {
          // dead-center degenerate case: push along +X
          nx = c.center[0] + minDist
        } else {
          const push = (minDist - d) / d
          nx += ox * push
          nz += oz * push
        }
        moved = true
      } else {
        // circle vs AABB: closest point on the box to the player center
        const cx = Math.max(c.min[0], Math.min(nx, c.max[0]))
        const cz = Math.max(c.min[1], Math.min(nz, c.max[1]))
        const ox = nx - cx
        const oz = nz - cz
        const d2 = ox * ox + oz * oz
        if (ox === 0 && oz === 0) {
          // center inside the box: escape through the nearest face
          const toMinX = nx - c.min[0]
          const toMaxX = c.max[0] - nx
          const toMinZ = nz - c.min[1]
          const toMaxZ = c.max[1] - nz
          const m = Math.min(toMinX, toMaxX, toMinZ, toMaxZ)
          if (m === toMinX) nx = c.min[0] - radius
          else if (m === toMaxX) nx = c.max[0] + radius
          else if (m === toMinZ) nz = c.min[1] - radius
          else nz = c.max[1] + radius
          moved = true
        } else if (d2 < radius * radius) {
          const d = Math.sqrt(d2)
          const push = (radius - d) / d
          nx += ox * push
          nz += oz * push
          moved = true
        }
      }
    }

    if (!moved) break
  }

  // the room's four walls need no collider entries — just clamp
  nx = Math.max(-bounds.halfW + radius, Math.min(bounds.halfW - radius, nx))
  nz = Math.max(-bounds.halfL + radius, Math.min(bounds.halfL - radius, nz))
  return { x: nx, z: nz }
}

/**
 * One movement step: turn a (moveX, moveZ) intent relative to camera `yaw`
 * into a world-space displacement and resolve it against colliders. Shared by
 * the per-frame loop and the deterministic simulate() debug hook so both
 * exercise the exact same path.
 */
export function stepMove(
  x: number,
  z: number,
  yaw: number,
  moveX: number,
  moveZ: number,
  speed: number,
  dt: number,
  radius: number,
  colliders: readonly ColliderSpec[],
  bounds: RoomBounds,
): { x: number; z: number } {
  let mx = moveX
  let mz = moveZ
  const len = Math.hypot(mx, mz)
  if (len === 0) return { x, z }
  if (len > 1) {
    mx /= len
    mz /= len
  }
  const sin = Math.sin(yaw)
  const cos = Math.cos(yaw)
  const dx = (-sin * mz + cos * mx) * speed * dt
  const dz = (-cos * mz - sin * mx) * speed * dt
  return resolveMovement(x, z, dx, dz, radius, colliders, bounds)
}
