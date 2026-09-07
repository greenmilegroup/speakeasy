/* Adds the structured data the pages already have the content for.
 *
 * Search engines will not infer a menu from a styled list or a site's shape
 * from its nav. Both are stated here, in dist/, from the markup itself — so a
 * dish renamed on the page is renamed in the schema, and there is no second
 * copy of the menu to forget about.
 *
 * Deliberately absent: aggregateRating. The home page prints "5.0 on Google"
 * with no review count behind it, and marking up a rating that cannot be
 * sourced is what earns a manual penalty. It goes in when there is a real
 * count to put beside it.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const root = new URL('..', import.meta.url);
const at = p => new URL(p, root);
const SITE = 'https://speakeasyottawa.com';

/* The booking link has one home, js/site.js, and tools/check-links.mjs keeps
   the pages honest about it. Read it rather than writing the slug again. */
const OPENTABLE = readFileSync(at('js/site.js'), 'utf8').match(/const OPENTABLE\s*=\s*'([^']+)'/)[1];

const read = p => readFileSync(at(`dist/${p}`), 'utf8');
const write = (p, s) => writeFileSync(at(`dist/${p}`), s);

const decode = s => String(s)
  .replace(/<[^>]*>/g, '')
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
  .replace(/&eacute;/g, 'é').replace(/&nbsp;/g, ' ')
  .replace(/\s+/g, ' ').trim();

/** Sections and their items, read in document order from the page's own markup. */
function sections(html) {
  const re = /<h3[^>]*>([\s\S]*?)<\/h3>|<h4[^>]*>([\s\S]*?)<\/h4>\s*<span class="price[^"]*"[^>]*>([\s\S]*?)<\/span>[\s\S]*?<\/div>\s*<p[^>]*>([\s\S]*?)<\/p>/g;
  const out = [];
  let m;
  while ((m = re.exec(html))) {
    if (m[1] !== undefined) { out.push({ name: decode(m[1]), items: [] }); continue; }
    if (!out.length) continue;                       // an item before any heading
    const price = decode(m[3]);
    out.at(-1).items.push({
      name: decode(m[2]),
      description: decode(m[4]),
      // "MP" is market price; a number nobody can quote is better left unsaid.
      ...(/^\d+(\.\d+)?$/.test(price) ? { offers: { '@type': 'Offer', price, priceCurrency: 'CAD' } } : {}),
    });
  }
  return out.filter(s => s.items.length);
}

function menuLd(html, { name, url, id }) {
  const secs = sections(html);
  const items = secs.reduce((n, s) => n + s.items.length, 0);
  if (!items) { console.error(`add-schema: no menu items found for ${name}`); process.exit(1); }
  return [{
    '@context': 'https://schema.org', '@type': 'Menu', '@id': id, name, url,
    inLanguage: 'en-CA',
    hasMenuSection: secs.map(s => ({
      '@type': 'MenuSection', name: s.name,
      hasMenuItem: s.items.map(i => ({ '@type': 'MenuItem', ...i })),
    })),
  }, items];
}

function crumbs(trail) {
  return {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: trail.map(([name, url], i) => ({
      '@type': 'ListItem', position: i + 1, name, item: `${SITE}/${url}`,
    })),
  };
}

const inject = (html, obj) =>
  html.replace('</head>', `<script type="application/ld+json">${JSON.stringify(obj)}</script>\n</head>`);

/* ---------- menus ---------- */

let total = 0;
for (const [page, name] of [['menu.html', 'Speakeasy Ottawa menu'], ['drinks.html', 'Speakeasy Ottawa bar list']]) {
  const html = read(page);
  const [ld, n] = menuLd(html, { name, url: `${SITE}/${page}`, id: `${SITE}/${page}#menu` });
  write(page, inject(html, ld));
  total += n;
}

/* ---------- the Restaurant nodes point at the menu ---------- */

for (const page of ['index.html', 'visit.html']) {
  const html = read(page);
  const re = /(<script type="application\/ld\+json">\s*)(\{[\s\S]*?"@type":"Restaurant"[\s\S]*?)(\s*<\/script>)/;
  const m = html.match(re);
  if (!m) { console.error(`add-schema: no Restaurant node in ${page}`); process.exit(1); }
  const node = JSON.parse(m[2]);
  node.hasMenu = `${SITE}/menu.html#menu`;
  node.acceptsReservations = OPENTABLE;
  node.sameAs = [
    'https://www.instagram.com/speakeasy_ottawa/',
    'https://www.facebook.com/speakeasyottawa',
  ];
  write(page, html.replace(re, (_, a, __, c) => a + JSON.stringify(node) + c));
}

/* ---------- breadcrumbs ---------- */

const TRAIL = {
  'menu.html': 'Menu', 'drinks.html': 'The Bar', 'events.html': 'On Stage',
  'private.html': 'Host Your Event', 'visit.html': 'Visit',
};
for (const [page, label] of Object.entries(TRAIL)) {
  write(page, inject(read(page), crumbs([['Home', ''], [label, page]])));
}

console.log(`  schema added (${total} menu items, 2 menus, 5 breadcrumb trails)`);
