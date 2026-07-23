import { spawn } from 'node:child_process'
import { existsSync, readdirSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from 'playwright'

const PORT = 4183
const BASE = `http://127.0.0.1:${PORT}`
const proc = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], {
  stdio: ['ignore', 'ignore', 'pipe'], detached: true,
})
proc.unref()
const stop = () => { try { process.kill(-proc.pid, 'SIGTERM') } catch {} }
process.on('exit', stop)

async function up() {
  const end = Date.now() + 30000
  while (Date.now() < end) {
    try { if ((await fetch(BASE)).ok) return } catch {}
    await new Promise((r) => setTimeout(r, 250))
  }
  throw new Error('no server')
}
async function launch() {
  const args = ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--mute-audio']
  try { return await chromium.launch({ args }) } catch {
    const base = process.env.PLAYWRIGHT_BROWSERS_PATH ?? '/opt/pw-browsers'
    for (const d of readdirSync(base).filter((x) => x.startsWith('chromium'))) {
      const exe = join(base, d, 'chrome-linux', 'chrome')
      if (existsSync(exe)) return chromium.launch({ executablePath: exe, args })
    }
    throw new Error('no chromium')
  }
}

mkdirSync('shots/m5', { recursive: true })
const fails = []
await up()
const browser = await launch()
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } })

// 1. intro screen (no autoenter)
{
  const page = await ctx.newPage()
  page.on('pageerror', (e) => fails.push('intro pageerror: ' + e))
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('html[data-ready="1"]', { timeout: 30000 })
  await page.waitForTimeout(600)
  const introBtn = await page.$('.btn-primary')
  if (!introBtn) fails.push('no intro Enter button')
  await page.screenshot({ path: 'shots/m5/intro.png' })
  console.log('intro shot done, enter button:', !!introBtn)
  await page.close()
}

// 2. hotspot card + CTA (autoenter, drag mode so markers are clickable)
{
  const page = await ctx.newPage()
  page.on('pageerror', (e) => fails.push('card pageerror: ' + e))
  await page.goto(`${BASE}/?autoenter=1`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('html[data-ready="1"]', { timeout: 30000 })
  await page.waitForTimeout(400)
  // open a card programmatically (deterministic regardless of pointer-lock)
  await page.evaluate(() => {
    const s = window.__venue
    // fall back to store if setActiveHotspot isn't on __venue
  })
  // click via the store through a marker: use E-less path — set via DOM eval
  await page.evaluate(() => {
    // access zustand store through the marker click is unreliable headless;
    // simulate by dispatching to the global store via a marker button click
    const btn = document.querySelector('.hotspot-marker')
    if (btn) btn.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
  await page.waitForTimeout(500)
  const card = await page.$('.hotspot-card')
  const cta = await page.$eval('.hotspot-card .cta', (a) => ({
    href: a.getAttribute('href'), target: a.getAttribute('target'), rel: a.getAttribute('rel'),
  })).catch(() => null)
  console.log('card open:', !!card, 'cta:', JSON.stringify(cta))
  if (!card) fails.push('hotspot card did not open on marker click')
  if (cta && cta.href !== 'https://speakeasyottawa.com/host-your-event') fails.push('CTA href wrong: ' + cta?.href)
  if (cta && cta.target !== '_blank') fails.push('CTA not _blank')
  await page.screenshot({ path: 'shots/m5/card.png' })
  await page.close()
}

// 3. HUD CTA href present
{
  const page = await ctx.newPage()
  await page.goto(`${BASE}/?autoenter=1`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('html[data-ready="1"]', { timeout: 30000 })
  const hudCta = await page.$eval('.hud-bottom .cta', (a) => a.getAttribute('href')).catch(() => null)
  console.log('hud CTA href:', hudCta)
  if (hudCta !== 'https://speakeasyottawa.com/host-your-event') fails.push('HUD CTA href wrong: ' + hudCta)
  // layout switch has 3 buttons
  const n = await page.$$eval('.layout-btn', (els) => els.length)
  if (n !== 3) fails.push('expected 3 layout buttons, got ' + n)
  console.log('layout buttons:', n)
  await page.close()
}

await browser.close()
stop()
if (fails.length) { console.error('FAILURES:\n' + fails.join('\n')); process.exit(1) }
console.log('UI verify OK')
