import { CanvasTexture, NoColorSpace, RepeatWrapping, SRGBColorSpace } from 'three'

/**
 * Every surface texture in the venue is painted here on 2D canvases at
 * startup — brick, tile, wood, damask, tin ceiling, signage, art — so the app
 * ships zero image assets and still looks like the real room. Generators are
 * deterministic (seeded PRNG) so screenshots are reproducible, and cached so
 * each texture is painted exactly once.
 */

type Rng = () => number

function lcg(seed: number): Rng {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 0xffffffff
  }
}

type Ctx = CanvasRenderingContext2D

const cache = new Map<string, CanvasTexture>()

function makeTexture(
  key: string,
  width: number,
  height: number,
  draw: (ctx: Ctx, w: number, h: number) => void,
  opts: { linear?: boolean } = {},
): CanvasTexture {
  const hit = cache.get(key)
  if (hit) return hit
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  draw(ctx, width, height)
  const tex = new CanvasTexture(canvas)
  tex.wrapS = RepeatWrapping
  tex.wrapT = RepeatWrapping
  tex.anisotropy = 4
  tex.colorSpace = opts.linear ? NoColorSpace : SRGBColorSpace
  cache.set(key, tex)
  return tex
}

function speckle(ctx: Ctx, w: number, h: number, rng: Rng, count: number, alpha: number) {
  for (let i = 0; i < count; i++) {
    const shade = rng() < 0.5 ? 0 : 255
    ctx.fillStyle = `rgba(${shade},${shade},${shade},${alpha * rng()})`
    ctx.fillRect(rng() * w, rng() * h, 1 + rng() * 2, 1 + rng() * 2)
  }
}

// ---------------------------------------------------------------- brick wall

function drawBricks(ctx: Ctx, w: number, h: number, bump: boolean) {
  const rng = lcg(7031)
  const brickW = 128
  const brickH = 42
  const mortar = 7
  ctx.fillStyle = bump ? '#5a5a5a' : '#241a16' // mortar
  ctx.fillRect(0, 0, w, h)
  const rows = Math.ceil(h / (brickH + mortar))
  for (let r = 0; r < rows; r++) {
    const y = r * (brickH + mortar)
    const offset = r % 2 === 0 ? 0 : -(brickW + mortar) / 2
    for (let x = offset; x < w; x += brickW + mortar) {
      const tone = rng()
      if (bump) {
        const v = 150 + Math.floor(tone * 70)
        ctx.fillStyle = `rgb(${v},${v},${v})`
      } else {
        // weathered brown brick with per-brick variation
        const hue = 14 + tone * 10
        const sat = 20 + rng() * 12
        const light = 16 + rng() * 11
        ctx.fillStyle = `hsl(${hue},${sat}%,${light}%)`
      }
      // slightly irregular brick edges
      const jx = (rng() - 0.5) * 3
      const jy = (rng() - 0.5) * 2
      ctx.fillRect(x + jx, y + jy, brickW, brickH)
      if (!bump && rng() < 0.45) {
        // scorch/patina patches
        ctx.fillStyle = `rgba(16,10,7,${0.15 + rng() * 0.25})`
        ctx.fillRect(x + rng() * brickW * 0.5, y + rng() * brickH * 0.5, brickW * 0.6, brickH * 0.7)
      }
    }
  }
  speckle(ctx, w, h, rng, bump ? 3000 : 9000, bump ? 0.2 : 0.1)
}

/** Warm exposed brick; repeat ≈ every 4m × 1.6m of wall. */
export const brickTexture = () => makeTexture('brick', 1024, 512, (c, w, h) => drawBricks(c, w, h, false))
export const brickBumpTexture = () =>
  makeTexture('brick-bump', 1024, 512, (c, w, h) => drawBricks(c, w, h, true), { linear: true })

// ---------------------------------------------------------------- floor tile

/** Large-format gray tiles, 4×4 per texture; repeat every 3.2m. */
export const floorTileTexture = () =>
  makeTexture('floor', 1024, 1024, (ctx, w, h) => {
    const rng = lcg(1213)
    const cell = 256
    const grout = 6
    ctx.fillStyle = '#2b2825'
    ctx.fillRect(0, 0, w, h)
    for (let ty = 0; ty < 4; ty++) {
      for (let tx = 0; tx < 4; tx++) {
        const x = tx * cell
        const y = ty * cell
        const base = 68 + rng() * 22
        const grad = ctx.createLinearGradient(x, y, x + cell, y + cell)
        grad.addColorStop(0, `rgb(${base},${base - 3},${base - 8})`)
        grad.addColorStop(1, `rgb(${base - 18},${base - 20},${base - 24})`)
        ctx.fillStyle = grad
        ctx.fillRect(x + grout / 2, y + grout / 2, cell - grout, cell - grout)
        // faint marbling strokes
        ctx.strokeStyle = `rgba(255,255,255,0.05)`
        for (let i = 0; i < 5; i++) {
          ctx.beginPath()
          ctx.moveTo(x + rng() * cell, y + rng() * cell)
          ctx.bezierCurveTo(
            x + rng() * cell, y + rng() * cell,
            x + rng() * cell, y + rng() * cell,
            x + rng() * cell, y + rng() * cell,
          )
          ctx.stroke()
        }
      }
    }
    speckle(ctx, w, h, rng, 6000, 0.05)
  })

// ---------------------------------------------------------------- wood planks

/** Light rustic plank wood (shelves, columns, stage trim). Repeat ~1m. */
export const woodTexture = () =>
  makeTexture('wood', 512, 512, (ctx, w, h) => {
    const rng = lcg(4457)
    const planks = 5
    const ph = h / planks
    for (let p = 0; p < planks; p++) {
      const y = p * ph
      const base = 96 + rng() * 40
      const grad = ctx.createLinearGradient(0, y, w, y)
      grad.addColorStop(0, `rgb(${base + 18},${base * 0.72 + 8},${base * 0.5})`)
      grad.addColorStop(0.5, `rgb(${base},${base * 0.7},${base * 0.48})`)
      grad.addColorStop(1, `rgb(${base + 10},${base * 0.74 + 4},${base * 0.52})`)
      ctx.fillStyle = grad
      ctx.fillRect(0, y, w, ph)
      // grain streaks
      for (let i = 0; i < 26; i++) {
        const gy = y + rng() * ph
        ctx.strokeStyle = `rgba(60,38,22,${0.08 + rng() * 0.16})`
        ctx.lineWidth = 1 + rng() * 1.6
        ctx.beginPath()
        ctx.moveTo(0, gy)
        ctx.bezierCurveTo(w * 0.3, gy + (rng() - 0.5) * 9, w * 0.7, gy + (rng() - 0.5) * 9, w, gy)
        ctx.stroke()
      }
      // occasional knot
      if (rng() < 0.7) {
        const kx = rng() * w
        const ky = y + ph * (0.3 + rng() * 0.4)
        const kr = 4 + rng() * 7
        const knot = ctx.createRadialGradient(kx, ky, 1, kx, ky, kr)
        knot.addColorStop(0, 'rgba(52,32,18,0.9)')
        knot.addColorStop(1, 'rgba(52,32,18,0)')
        ctx.fillStyle = knot
        ctx.fillRect(kx - kr, ky - kr, kr * 2, kr * 2)
      }
      // gap between planks
      ctx.fillStyle = 'rgba(24,14,8,0.85)'
      ctx.fillRect(0, y + ph - 2, w, 2)
    }
    speckle(ctx, w, h, rng, 2500, 0.06)
  })

// ---------------------------------------------------------------- damask wall

/** Near-black tone-on-tone damask for the banquette wall. Repeat ~1.2m. */
export const damaskTexture = () =>
  makeTexture('damask', 512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#120e0d'
    ctx.fillRect(0, 0, w, h)
    const cell = 256
    const drawMotif = (cx: number, cy: number, flip: number) => {
      ctx.save()
      ctx.translate(cx, cy)
      ctx.scale(flip, 1)
      ctx.strokeStyle = 'rgba(64,50,42,0.55)'
      ctx.lineWidth = 3
      ctx.beginPath()
      // stylized acanthus swirl
      ctx.moveTo(0, 70)
      ctx.bezierCurveTo(-46, 40, -46, -10, 0, -52)
      ctx.bezierCurveTo(34, -22, 26, 14, 0, 26)
      ctx.moveTo(0, 70)
      ctx.bezierCurveTo(40, 46, 52, 4, 22, -34)
      ctx.stroke()
      ctx.strokeStyle = 'rgba(52,40,34,0.4)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.ellipse(0, -66, 12, 20, 0, 0, Math.PI * 2)
      ctx.moveTo(-30, 84)
      ctx.quadraticCurveTo(0, 64, 30, 84)
      ctx.stroke()
      ctx.restore()
    }
    // 2×2 grid, mirrored columns so the tile wraps seamlessly
    for (let gy = 0; gy < 2; gy++) {
      for (let gx = 0; gx < 2; gx++) {
        drawMotif(gx * cell + cell / 2, gy * cell + cell / 2, gx === 0 ? 1 : -1)
      }
    }
  })

// ------------------------------------------------------------- ceiling tin

function drawTin(ctx: Ctx, w: number, h: number, bump: boolean) {
  const base = bump ? '#808080' : '#15100d'
  const line1 = bump ? '#d0d0d0' : '#2c211b'
  const line2 = bump ? '#404040' : '#080604'
  ctx.fillStyle = base
  ctx.fillRect(0, 0, w, h)
  ctx.strokeStyle = line1
  ctx.lineWidth = 6
  ctx.strokeRect(10, 10, w - 20, h - 20)
  ctx.strokeStyle = line2
  ctx.lineWidth = 3
  ctx.strokeRect(26, 26, w - 52, h - 52)
  ctx.strokeStyle = line1
  ctx.lineWidth = 2
  ctx.strokeRect(60, 60, w - 120, h - 120)
  // center rosette
  const cx = w / 2
  const cy = h / 2
  ctx.beginPath()
  ctx.arc(cx, cy, 46, 0, Math.PI * 2)
  ctx.stroke()
  ctx.strokeStyle = line2
  ctx.beginPath()
  ctx.arc(cx, cy, 30, 0, Math.PI * 2)
  ctx.stroke()
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    ctx.beginPath()
    ctx.moveTo(cx + Math.cos(a) * 30, cy + Math.sin(a) * 30)
    ctx.lineTo(cx + Math.cos(a) * 46, cy + Math.sin(a) * 46)
    ctx.stroke()
  }
}

/** Black pressed-tin coffer; one texture = one coffer cell (~0.68m). */
export const tinTexture = () => makeTexture('tin', 512, 512, (c, w, h) => drawTin(c, w, h, false))
export const tinBumpTexture = () =>
  makeTexture('tin-bump', 512, 512, (c, w, h) => drawTin(c, w, h, true), { linear: true })

// ---------------------------------------------------------------- utilities

/** Tileable gray noise, used as a subtle roughness map. */
export const noiseTexture = () =>
  makeTexture(
    'noise',
    256,
    256,
    (ctx, w, h) => {
      const rng = lcg(9199)
      const img = ctx.createImageData(w, h)
      for (let i = 0; i < img.data.length; i += 4) {
        const v = 150 + Math.floor(rng() * 80)
        img.data[i] = v
        img.data[i + 1] = v
        img.data[i + 2] = v
        img.data[i + 3] = 255
      }
      ctx.putImageData(img, 0, 0)
    },
    { linear: true },
  )

/** Radial soft blob, black center fading out — fake contact shadow. */
export const blobShadowTexture = () =>
  makeTexture('blob', 256, 256, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 8, w / 2, h / 2, w / 2)
    g.addColorStop(0, 'rgba(0,0,0,0.85)')
    g.addColorStop(0.6, 'rgba(0,0,0,0.4)')
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
  })

/** Radial warm glow for additive light-pool decals. */
export function glowTexture(key: string, inner: string, outer = 'rgba(0,0,0,0)') {
  return makeTexture(`glow-${key}`, 256, 256, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, w / 2)
    g.addColorStop(0, inner)
    g.addColorStop(1, outer)
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
  })
}

// ---------------------------------------------------------------- signage

function drawSign(ctx: Ctx, w: number, h: number) {
  ctx.clearRect(0, 0, w, h)
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, w, h)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  // glow halo pass
  ctx.font = `700 ${Math.round(h * 0.5)}px Limelight, Georgia, serif`
  ctx.shadowColor = '#ff2a2f'
  ctx.shadowBlur = 44
  ctx.fillStyle = '#ff5a4e'
  ctx.fillText('SPEAKEASY', w / 2, h * 0.42)
  // bright core
  ctx.shadowBlur = 10
  ctx.fillStyle = '#ff8a72'
  ctx.fillText('SPEAKEASY', w / 2, h * 0.42)
  ctx.shadowBlur = 0
  // small tagline
  ctx.font = `400 ${Math.round(h * 0.13)}px Georgia, serif`
  ctx.fillStyle = '#d99a5a'
  ctx.fillText('TAPAS  LOUNGE', w / 2, h * 0.8)
}

/**
 * Emissive "SPEAKEASY" sign for above the stage. Redraws once the Limelight
 * web font finishes loading so the art-deco face isn't missed on first paint.
 */
export function signTexture(): CanvasTexture {
  const key = 'sign'
  const hit = cache.get(key)
  if (hit) return hit
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 256
  const ctx = canvas.getContext('2d')!
  drawSign(ctx, canvas.width, canvas.height)
  const tex = new CanvasTexture(canvas)
  tex.colorSpace = SRGBColorSpace
  tex.anisotropy = 4
  cache.set(key, tex)
  if (typeof document !== 'undefined' && document.fonts?.ready) {
    document.fonts.ready.then(() => {
      drawSign(ctx, canvas.width, canvas.height)
      tex.needsUpdate = true
    })
  }
  return tex
}

// ---------------------------------------------------------------- NYC skyline

/** Colorful painted night skyline for the canvas above the back bar. */
export const skylineTexture = () =>
  makeTexture('skyline', 512, 384, (ctx, w, h) => {
    const rng = lcg(2027)
    // night sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, h)
    sky.addColorStop(0, '#241448')
    sky.addColorStop(0.5, '#7a2a5a')
    sky.addColorStop(1, '#e0663c')
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, w, h)
    // moon
    ctx.fillStyle = 'rgba(255,240,210,0.9)'
    ctx.beginPath()
    ctx.arc(w * 0.8, h * 0.22, 26, 0, Math.PI * 2)
    ctx.fill()
    // building silhouettes in a few depth bands
    const bands = [
      { base: 0.95, color: '#160d24', min: 0.28, max: 0.55 },
      { base: 1.0, color: '#0d0818', min: 0.4, max: 0.78 },
    ]
    for (const band of bands) {
      let x = 0
      while (x < w) {
        const bw = 24 + rng() * 46
        const bh = h * (band.min + rng() * (band.max - band.min))
        const by = h * band.base - bh
        ctx.fillStyle = band.color
        ctx.fillRect(x, by, bw, bh)
        // lit windows
        for (let wy = by + 8; wy < h * band.base - 6; wy += 12) {
          for (let wx = x + 5; wx < x + bw - 5; wx += 10) {
            if (rng() < 0.5) {
              ctx.fillStyle = rng() < 0.5 ? '#ffd36b' : '#ffe9a8'
              ctx.fillRect(wx, wy, 4, 6)
            }
          }
        }
        x += bw + 3
      }
    }
    // painted frame border
    ctx.strokeStyle = '#3a2a1c'
    ctx.lineWidth = 18
    ctx.strokeRect(9, 9, w - 18, h - 18)
    ctx.strokeStyle = '#c9a45c'
    ctx.lineWidth = 3
    ctx.strokeRect(20, 20, w - 40, h - 40)
  })

// ---------------------------------------------------------------- plant wall

/** Stippled foliage panel — reads as a living green wall at distance. */
export const plantWallTexture = () =>
  makeTexture('plant', 512, 512, (ctx, w, h) => {
    const rng = lcg(3313)
    ctx.fillStyle = '#0d1a0c'
    ctx.fillRect(0, 0, w, h)
    const greens = ['#1f4a1c', '#2f6227', '#3c7a30', '#4f9a3a', '#6bad4a', '#12300f']
    for (let i = 0; i < 4200; i++) {
      const x = rng() * w
      const y = rng() * h
      const r = 4 + rng() * 12
      ctx.fillStyle = greens[(rng() * greens.length) | 0]
      ctx.globalAlpha = 0.5 + rng() * 0.5
      ctx.beginPath()
      ctx.ellipse(x, y, r, r * (0.5 + rng() * 0.5), rng() * Math.PI, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  })

// ---------------------------------------------------------------- velvet

/** Vertical AO gradient for the stage curtain folds (top/bottom shading). */
export const curtainShadeTexture = () =>
  makeTexture(
    'curtain-shade',
    64,
    512,
    (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h)
      g.addColorStop(0, '#000000')
      g.addColorStop(0.14, '#5a0c10')
      g.addColorStop(0.5, '#7e1418')
      g.addColorStop(0.9, '#3a080b')
      g.addColorStop(1, '#000000')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, w, h)
    },
    { linear: false },
  )
