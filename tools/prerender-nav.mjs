/* Puts real links in the header and footer of every page in dist/.
 *
 * js/site.js builds the chrome from one NAV array, which keeps the six pages
 * from drifting apart — but it means the HTML that leaves the server has an
 * empty <header> and <footer>. A crawler's first pass reads HTML without
 * running scripts, so on that pass the site has no internal links at all:
 * every page looks like an island reachable only from the sitemap.
 *
 * This writes the same links, read from the same NAV array, into the markup.
 * site.js replaces both elements with innerHTML on load, so a visitor sees
 * exactly what they saw before.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';

const root = new URL('..', import.meta.url);
const at = p => new URL(p, root);

const src = readFileSync(at('js/site.js'), 'utf8');
const grab = (re, what) => {
  const m = src.match(re);
  if (!m) { console.error(`prerender-nav: no ${what} in js/site.js`); process.exit(1); }
  return m[1];
};

/* The NAV array is this site's one description of its own shape. Read it from
   source rather than restating it, so a page added there appears here too. */
const NAV = new Function(`return ${grab(/const NAV = (\[[\s\S]*?\n\]);/, 'NAV array')}`)();
const TEL = grab(/const TEL = '([^']+)'/, 'TEL constant');

/* A nested entry carries its children in a fourth slot; the flat list is what
   a crawler should follow. */
const flat = NAV.flatMap(n => (n[3] ? n[3] : [n])).filter(n => n[1]);
const links = flat.map(([, href, label]) => `<a href="${href}">${label}</a>`).join('');

const header = `<div class="nav__inner"><a class="nav__brand" href="index.html">Speakeasy Ottawa</a>`
  + `<nav class="nav__links" aria-label="Sections">${links}</nav></div>`;

const footer = `<div class="footer__inner"><nav class="footer__links" aria-label="Footer">${links}</nav>`
  + `<div class="footer__meta"><p>55 York Street, Ottawa · K1N 9B7</p>`
  + `<p><a href="tel:${TEL}">613-241-6221</a></p></div></div>`;

let done = 0;
for (const page of readdirSync(at('dist')).filter(f => f.endsWith('.html'))) {
  const p = at(`dist/${page}`);
  let html = readFileSync(p, 'utf8');
  const before = html;
  html = html.replace(/(<header id="nav"[^>]*>)\s*(<\/header>)/, (_, a, b) => a + header + b);
  html = html.replace(/(<footer class="footer"[^>]*>)\s*(<\/footer>)/, (_, a, b) => a + footer + b);
  if (html === before) continue;
  writeFileSync(p, html);
  done++;
}

if (!done) { console.error('prerender-nav: no page had an empty header or footer to fill'); process.exit(1); }
console.log(`  nav and footer pre-rendered (${flat.length} links on ${done} pages)`);
