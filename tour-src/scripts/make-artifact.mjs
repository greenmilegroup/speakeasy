#!/usr/bin/env node
/**
 * Turns the single-file build (dist/index.html, a full HTML document) into an
 * Artifact-ready fragment (dist/tour.html): styles + #root + inlined module
 * script, with no <html>/<head>/<body> wrapper (the Artifact publisher adds
 * its own). Run after `npm run build:single`.
 */
import { readFileSync, writeFileSync } from 'node:fs'

const src = readFileSync('dist/index.html', 'utf-8')
const styles = src.match(/<style[^>]*>[\s\S]*?<\/style>/g) ?? []
const scripts = src.match(/<script\b[^>]*>[\s\S]*?<\/script>/g) ?? []
const bodyInner = src.slice(src.indexOf('<body>') + 6, src.indexOf('</body>'))
const rootMarkup = bodyInner.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '').trim()

const fragment = [...styles, rootMarkup, ...scripts].join('\n') + '\n'
writeFileSync('dist/tour.html', fragment)

const externalRefs = (fragment.match(/(src|href)="https?:\/\//g) ?? []).length
console.log(
  `dist/tour.html: ${(fragment.length / 1024 / 1024).toFixed(2)} MB, ` +
    `styles=${styles.length} scripts=${scripts.length} externalRefs=${externalRefs}`,
)
if (externalRefs > 0) {
  console.error('ERROR: fragment has external references — would break under artifact CSP')
  process.exit(1)
}
