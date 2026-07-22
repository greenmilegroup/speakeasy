import {
  BoxGeometry,
  BufferGeometry,
  CircleGeometry,
  ConeGeometry,
  CylinderGeometry,
} from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

/**
 * Pre-built, merged geometries for the furniture. Each furniture kind is a
 * single merged BufferGeometry so drei <Instances> renders any number of them
 * in one draw call. Origins are at floor level (y=0), centered in XZ.
 */

function merged(parts: BufferGeometry[]): BufferGeometry {
  return mergeGeometries(parts, false)!
}

/** Black ladder-back chair. */
export const chairGeometry = (() => {
  const seatH = 0.46
  const parts: BufferGeometry[] = []
  const seat = new BoxGeometry(0.42, 0.05, 0.42)
  seat.translate(0, seatH, 0)
  parts.push(seat)
  for (const [x, z] of [
    [-0.18, -0.18],
    [0.18, -0.18],
    [-0.18, 0.18],
    [0.18, 0.18],
  ]) {
    const leg = new BoxGeometry(0.04, seatH, 0.04)
    leg.translate(x, seatH / 2, z)
    parts.push(leg)
  }
  for (const x of [-0.18, 0.18]) {
    const post = new BoxGeometry(0.04, 0.5, 0.04)
    post.translate(x, seatH + 0.25, -0.19)
    parts.push(post)
  }
  for (const y of [0.62, 0.74, 0.86]) {
    const rung = new BoxGeometry(0.36, 0.05, 0.03)
    rung.translate(0, y, -0.19)
    parts.push(rung)
  }
  return merged(parts)
})()

/** Square dining table under a draped black cloth. */
export const diningTableGeometry = (() => {
  const parts: BufferGeometry[] = []
  const top = new BoxGeometry(0.92, 0.04, 0.92)
  top.translate(0, 0.75, 0)
  parts.push(top)
  const skirt = new BoxGeometry(0.96, 0.72, 0.96)
  skirt.translate(0, 0.38, 0)
  parts.push(skirt)
  return merged(parts)
})()

/** Round cocktail high-top with a slim column and base. */
export const cocktailTableGeometry = (() => {
  const parts: BufferGeometry[] = []
  const top = new CylinderGeometry(0.34, 0.34, 0.05, 20)
  top.translate(0, 1.05, 0)
  parts.push(top)
  const skirt = new CylinderGeometry(0.35, 0.3, 1.0, 16)
  skirt.translate(0, 0.53, 0)
  parts.push(skirt)
  const base = new CylinderGeometry(0.3, 0.3, 0.03, 16)
  base.translate(0, 0.02, 0)
  parts.push(base)
  return merged(parts)
})()

/** White dinner plate. */
export const plateGeometry = new CylinderGeometry(0.13, 0.11, 0.02, 20)

/** Folded napkin (simple standing fan wedge). */
export const napkinGeometry = (() => {
  const g = new ConeGeometry(0.05, 0.14, 4)
  g.translate(0, 0.07, 0)
  return g
})()

/** Candle body (wax cylinder). */
export const candleGeometry = (() => {
  const g = new CylinderGeometry(0.03, 0.035, 0.11, 12)
  g.translate(0, 0.055, 0)
  return g
})()

/** Candle flame (tiny cone, emissive). */
export const flameGeometry = (() => {
  const g = new ConeGeometry(0.015, 0.05, 8)
  g.translate(0, 0.14, 0)
  return g
})()

/** Gallery easel: A-frame legs + a shelf ledge. */
export const easelGeometry = (() => {
  const parts: BufferGeometry[] = []
  for (const x of [-0.25, 0.25]) {
    const leg = new BoxGeometry(0.04, 1.6, 0.04)
    leg.translate(x, 0.8, 0)
    parts.push(leg)
  }
  const backLeg = new BoxGeometry(0.04, 1.5, 0.04)
  backLeg.translate(0, 0.75, 0.25)
  parts.push(backLeg)
  const ledge = new BoxGeometry(0.6, 0.05, 0.1)
  ledge.translate(0, 0.75, -0.02)
  parts.push(ledge)
  return merged(parts)
})()

/** Framed canvas that sits on the easel (separate so it can be lit). */
export const canvasGeometry = (() => {
  const g = new BoxGeometry(0.62, 0.82, 0.04)
  g.translate(0, 1.15, 0.02)
  return g
})()

/** Freestanding art display panel. */
export const artPanelGeometry = (() => {
  const parts: BufferGeometry[] = []
  const panel = new BoxGeometry(0.9, 1.9, 0.08)
  panel.translate(0, 1.1, 0)
  parts.push(panel)
  const foot = new BoxGeometry(1.0, 0.06, 0.4)
  foot.translate(0, 0.03, 0)
  parts.push(foot)
  return merged(parts)
})()

/** Flat disc for blob shadows. */
export const blobGeometry = new CircleGeometry(0.6, 20)
