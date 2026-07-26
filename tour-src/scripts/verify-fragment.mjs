import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from 'playwright'
import { createServer } from 'node:http'
import { readFileSync } from 'node:fs'

const html = readFileSync('dist/wrapped-preview.html')
const server = createServer((_req, res) => {
  res.writeHead(200, { 'content-type': 'text/html' })
  res.end(html)
}).listen(4188)

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

const errors = []
const browser = await launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
page.on('pageerror', (e) => errors.push('pageerror: ' + e))
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()) })
await page.goto('http://127.0.0.1:4188/', { waitUntil: 'domcontentloaded' })
// no ?autoenter here — emulates a real user opening the artifact
try {
  await page.waitForSelector('html[data-ready="1"]', { timeout: 20000 })
  console.log('RENDERED: data-ready set (scene drew a frame)')
} catch {
  errors.push('scene never became ready (no first frame)')
}
await page.waitForTimeout(500)
await page.screenshot({ path: 'shots/artifact-preview.png' })
const info = await page.evaluate(() => globalThis.__venue?.info?.() ?? null)
console.log('info:', JSON.stringify(info))
await browser.close()
server.close()
if (errors.length) { console.error('FAILURES:\n' + errors.join('\n')); process.exit(1) }
console.log('fragment verify OK')
