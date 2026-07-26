#!/usr/bin/env node
/**
 * End-to-end movement/collision test. Boots the app and drives the REAL
 * movement code deterministically via window.__venue.simulate() at a fixed
 * dt, so results don't depend on the headless renderer's (very low) frame
 * rate. Asserts the player stops at the bar counter, the stage, and a dining
 * table, and that sprint outpaces a walk.
 */
import { spawn } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from 'playwright'

const PORT = 4181
const BASE_URL = `http://127.0.0.1:${PORT}`

function startServer() {
  const proc = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], {
    stdio: ['ignore', 'ignore', 'pipe'],
    detached: true,
  })
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
  const args = ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--mute-audio']
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

const failures = []
function check(label, actual, min, max) {
  const ok = actual >= min && actual <= max
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}: ${actual.toFixed(3)} (expected ${min}..${max})`)
  if (!ok) failures.push(label)
}

async function main() {
  const server = startServer()
  process.on('exit', () => stopServer(server))
  let browser
  try {
    await waitForServer()
    browser = await launchBrowser()
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
    page.on('pageerror', (e) => failures.push(`pageerror: ${e}`))

    await page.goto(`${BASE_URL}/?autoenter=1&ui=0`, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('html[data-ready="1"]', { timeout: 30_000 })

    const pos0 = await page.evaluate(() => window.__venue.getPosition())
    check('spawn x', pos0.x, -0.01, 0.01)
    check('spawn z', pos0.z, 8.59, 8.61)

    // 1. from a clear spot near the front, walk toward the bar (-X): the
    //    counter (front face x=-3.55) stops the player at x = -3.55 + 0.35.
    let pos = await page.evaluate(() => {
      window.__venue.teleport(-1.0, 7.5, Math.PI / 2) // yaw +pi/2 -> forward walks -X
      return window.__venue.simulate(4, { forward: 1 })
    })
    check('bar stop x (counter -3.55 + r 0.35)', pos.x, -3.3, -3.1)
    check('bar walk z stays near start', pos.z, 7.3, 7.7)

    // 2. walk down the open carpet aisle into the stage front
    pos = await page.evaluate(() => {
      window.__venue.teleport(0, -5, 0) // yaw 0 -> forward walks -Z
      return window.__venue.simulate(4, { forward: 1 })
    })
    check('stage stop z (front -7.4 + r 0.35)', pos.z, -7.15, -6.95)
    check('stage x stays centered', pos.x, -0.05, 0.05)

    // 3. speed: in the clear carpet aisle, sprint covers ~4.2m and walk ~2.8m
    //    in one simulated second (no furniture in the |x|<0.75 corridor).
    const walk = await page.evaluate(() => {
      window.__venue.teleport(0, 6.0, 0)
      return 6.0 - window.__venue.simulate(1, { forward: 1 }).z
    })
    const sprint = await page.evaluate(() => {
      window.__venue.teleport(0, 6.0, 0)
      return 6.0 - window.__venue.simulate(1, { forward: 1, sprint: true }).z
    })
    console.log(`walk ${walk.toFixed(2)}m vs sprint ${sprint.toFixed(2)}m per simulated second`)
    check('walk speed ~2.8 m/s', walk, 2.6, 3.0)
    check('sprint speed ~4.2 m/s', sprint, 4.0, 4.4)

    // 4. dining layout: approaching the table at (-2.15, -5) from the aisle,
    //    the player is blocked ~1.2m short of its centre (r 0.85 + player 0.35).
    pos = await page.evaluate(() => {
      window.__venue.teleport(0, -5, Math.PI / 2) // yaw +pi/2 -> forward walks -X along z=-5
      return window.__venue.simulate(3, { forward: 1 })
    })
    const distFromTable = Math.hypot(pos.x - -2.15, pos.z - -5)
    check('table blocks approach (dist from centre)', distFromTable, 1.15, 1.35)

    await browser.close()
    browser = undefined
  } finally {
    await browser?.close()
    stopServer(server)
  }

  if (failures.length > 0) {
    console.error(`\n${failures.length} FAILURES`)
    process.exit(1)
  }
  console.log('\nwalktest OK')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
