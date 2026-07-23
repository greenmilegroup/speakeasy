#!/usr/bin/env node
/**
 * Visual verification harness.
 *
 * Boots the app (vite dev server by default, or `--preview` to serve a built
 * dist/), then captures deterministic camera poses with headless Chromium and
 * writes PNGs to shots/<out>/. Fails on page errors and on draw-call budget
 * violations (when the app exposes window.__venue.info()).
 *
 * Usage:
 *   node scripts/screenshot.mjs --out m0
 *   node scripts/screenshot.mjs --out m3 --cams spawn,bar,stage --layouts dinner
 *   node scripts/screenshot.mjs --out m6 --cams spawn,stage --mobile
 *   node scripts/screenshot.mjs --out final --preview --cams spawn --ui
 */
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from 'playwright'

const PORT = 4179
const BASE_URL = `http://127.0.0.1:${PORT}`
const DRAW_CALL_BUDGET = 90

function parseArgs(argv) {
  const opts = {
    out: 'default',
    cams: ['default'],
    layouts: ['default'],
    mobile: false,
    preview: false,
    ui: false,
    quality: null,
  }
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--out') opts.out = argv[++i]
    else if (a === '--cams') opts.cams = argv[++i].split(',')
    else if (a === '--layouts') opts.layouts = argv[++i].split(',')
    else if (a === '--quality') opts.quality = argv[++i]
    else if (a === '--mobile') opts.mobile = true
    else if (a === '--preview') opts.preview = true
    else if (a === '--ui') opts.ui = true
    else throw new Error(`Unknown arg: ${a}`)
  }
  return opts
}

function startServer(preview) {
  const args = preview
    ? ['vite', 'preview', '--port', String(PORT), '--strictPort']
    : ['vite', '--port', String(PORT), '--strictPort']
  // detached → own process group, so we can kill vite AND its esbuild children
  const proc = spawn('npx', args, { stdio: ['ignore', 'ignore', 'pipe'], detached: true })
  proc.stderr.on('data', (d) => process.stderr.write(`[vite] ${d}`))
  proc.unref()
  return proc
}

function stopServer(proc) {
  try {
    process.kill(-proc.pid, 'SIGTERM')
  } catch {
    try {
      proc.kill('SIGTERM')
    } catch {
      /* already dead */
    }
  }
}

async function waitForServer(timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const res = await fetch(BASE_URL)
      if (res.ok) return
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 250))
  }
  throw new Error('vite server did not come up in time')
}

async function launchBrowser() {
  const args = [
    '--enable-unsafe-swiftshader',
    '--use-angle=swiftshader',
    '--hide-scrollbars',
    '--mute-audio',
  ]
  try {
    return await chromium.launch({ args })
  } catch (err) {
    const base = process.env.PLAYWRIGHT_BROWSERS_PATH ?? '/opt/pw-browsers'
    if (existsSync(base)) {
      for (const dir of readdirSync(base).filter((d) => d.startsWith('chromium'))) {
        const exe = join(base, dir, 'chrome-linux', 'chrome')
        if (existsSync(exe)) return chromium.launch({ executablePath: exe, args })
      }
    }
    throw err
  }
}

async function main() {
  const opts = parseArgs(process.argv)
  const outDir = join('shots', opts.out)
  mkdirSync(outDir, { recursive: true })

  const server = startServer(opts.preview)
  process.on('exit', () => stopServer(server))

  let browser
  const failures = []
  try {
    await waitForServer()
    browser = await launchBrowser()

    const context = await browser.newContext(
      opts.mobile
        ? {
            viewport: { width: 390, height: 844 },
            deviceScaleFactor: 2,
            isMobile: true,
            hasTouch: true,
            userAgent:
              'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
          }
        : { viewport: { width: 1280, height: 800 } },
    )

    for (const layout of opts.layouts) {
      for (const cam of opts.cams) {
        const page = await context.newPage()
        const pageErrors = []
        page.on('pageerror', (e) => pageErrors.push(String(e)))
        page.on('console', (msg) => {
          if (msg.type() === 'error') pageErrors.push(msg.text())
        })

        const params = new URLSearchParams({ autoenter: '1' })
        if (!opts.ui) params.set('ui', '0')
        if (cam !== 'default') params.set('cam', cam)
        if (layout !== 'default') params.set('layout', layout)
        if (opts.quality) params.set('quality', opts.quality)

        const url = `${BASE_URL}/?${params.toString()}`
        await page.goto(url, { waitUntil: 'domcontentloaded' })
        await page.waitForSelector('html[data-ready="1"]', { timeout: 30_000 })
        await page.waitForTimeout(500)

        const name = [layout, cam, opts.mobile ? 'mobile' : null].filter(Boolean).join('-')
        const file = join(outDir, `${name}.png`)
        await page.screenshot({ path: file })

        const info = await page.evaluate(() => globalThis.__venue?.info?.() ?? null)
        const infoStr = info
          ? ` calls=${info.calls} tris=${info.triangles} geoms=${info.geometries} tex=${info.textures}`
          : ''
        console.log(`shot ${file}${infoStr}`)

        if (info && info.calls > DRAW_CALL_BUDGET) {
          failures.push(`${name}: ${info.calls} draw calls > budget ${DRAW_CALL_BUDGET}`)
        }
        if (pageErrors.length > 0) {
          failures.push(`${name}: page errors:\n  ${pageErrors.join('\n  ')}`)
        }
        await page.close()
      }
    }
    await context.close()
  } finally {
    await browser?.close()
    stopServer(server)
  }

  if (failures.length > 0) {
    console.error('\nFAILURES:')
    for (const f of failures) console.error(` - ${f}`)
    process.exit(1)
  }
  console.log('all shots OK')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
