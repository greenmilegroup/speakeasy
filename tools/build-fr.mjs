/* Writes the French site into dist/fr/, one page per English page.
 *
 * The site has carried a full French translation for some time, applied in
 * the browser by js/i18n.js when a reader taps FR. That is invisible to a
 * search engine: there is one URL per page, indexed in one language, and no
 * French page for a French query to land on — in a bilingual city. The
 * translation existed; it just had no address.
 *
 * This gives it one. Each page in dist/ is walked as text, every text node and
 * translatable attribute is looked up through the same translateText() the
 * browser uses — the same dictionary, the same pattern rules, so the two can
 * never disagree — and the result is written to dist/fr/. Both copies then
 * point at each other with hreflang, and the sitemap lists both.
 *
 * Runs after the pre-render steps, so the French pages carry the events board,
 * the nav and the schema too.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { translateText } from '../js/i18n.js';

const root = new URL('..', import.meta.url);
const at = p => new URL(p, root);
const SITE = 'https://speakeasyottawa.com';
const PAGES = ['index.html', 'drinks.html', 'menu.html', 'events.html', 'private.html', 'visit.html'];

/* ---------- entities ----------
   The dictionary is keyed on what the browser renders, so text is decoded
   before lookup and the French re-escaped after. */
const NAMED = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', middot: '·',
  hellip: '…', ldquo: '“', rdquo: '”', lsquo: '‘', rsquo: '’', lsaquo: '‹', rsaquo: '›',
  eacute: 'é', egrave: 'è', agrave: 'à', ccedil: 'ç', ecirc: 'ê', ocirc: 'ô', uuml: 'ü', ndash: '–', mdash: '—' };
const decode = s => s
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
  .replace(/&([a-z]+);/gi, (m, n) => NAMED[n] ?? m);
const escText = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escAttr = s => escText(s).replace(/"/g, '&quot;');

/* ---------- translation ---------- */

let hits = 0;
const missed = new Map();   // English that stayed English, for the report

/** One text node: keep its own leading and trailing whitespace, swap the words. */
function text(raw) {
  if (!raw.trim()) return raw;
  const plain = decode(raw);
  const fr = translateText(plain);
  if (fr === undefined) {
    const k = plain.trim();
    // Numbers, prices, symbols and single names are not translation gaps.
    if (/[a-z]{3,}/i.test(k) && k.split(/\s+/).length > 1) missed.set(k, (missed.get(k) || 0) + 1);
    return raw;
  }
  hits++;
  return raw.match(/^\s*/)[0] + escText(fr) + raw.match(/\s*$/)[0];
}

const ATTRS = /\b(aria-label|placeholder|title|alt|content)="([^"]*)"/g;

/** One tag: translate the attributes worth translating, leave the rest. */
function tag(t) {
  return t.replace(ATTRS, (m, name, val) => {
    if (!val.trim()) return m;
    const fr = translateText(decode(val));
    if (fr === undefined) return m;
    hits++;
    return `${name}="${escAttr(fr)}"`;
  });
}

/* Split the page into things that are tags and things that are not. Script,
   style and comment blocks are kept whole and untouched; everything else is
   either a tag or a text node. */
const TOKEN = /<!--[\s\S]*?-->|<script\b[\s\S]*?<\/script>|<style\b[\s\S]*?<\/style>|<[^>]+>/g;

function translatePage(html) {
  let out = '', last = 0;
  for (const m of html.matchAll(TOKEN)) {
    out += text(html.slice(last, m.index));
    const t = m[0];
    out += t.startsWith('<!--') || /^<(script|style)\b/i.test(t) ? t : tag(t);
    last = m.index + t.length;
  }
  return out + text(html.slice(last));
}

/* ---------- addressing ---------- */

const urlOf = (page, fr) => `${SITE}/${fr ? 'fr/' : ''}${page === 'index.html' ? '' : page}`;

function alternates(page) {
  return `<link rel="alternate" hreflang="en" href="${urlOf(page, false)}"/>\n`
    + `<link rel="alternate" hreflang="fr" href="${urlOf(page, true)}"/>\n`
    + `<link rel="alternate" hreflang="x-default" href="${urlOf(page, false)}"/>\n`;
}

const head = (html, extra) => html.replace('</head>', extra + '</head>');

/** The French copy of one already-built English page. */
function frenchCopy(html, page) {
  let s = html;
  s = s.replace(/^<html lang="en">/m, '<html lang="fr-CA">');
  // Relative asset paths break one directory down. Page links stay relative
  // on purpose: from /fr/, "menu.html" is /fr/menu.html, which is the point.
  s = s.replace(/(\b(?:href|src|poster)=")(assets|css|js)\//g, '$1/$2/');
  s = s.replace(/url\('(assets\/)/g, "url('/$1");
  // Every absolute address of a page on this site now names its French copy:
  // canonical, og:url, breadcrumbs, the events' url, the menu's @id.
  s = s.replace(/https:\/\/speakeasyottawa\.com\/((?:index|drinks|menu|events|private|visit)\.html)?(?=[#"'\s])/g,
    (_, p) => `${SITE}/fr/${p || ''}`);
  s = s.replace(/<meta property="og:locale" content="en_CA"\/>\n<meta property="og:locale:alternate" content="fr_CA"\/>\n/,
    '<meta property="og:locale" content="fr_CA"/>\n<meta property="og:locale:alternate" content="en_CA"/>\n');
  s = translatePage(s);
  return s;
}

/* ---------- run ---------- */

mkdirSync(at('dist/fr'), { recursive: true });
let sitemapRows = '';

for (const page of PAGES) {
  const src = at(`dist/${page}`);
  let en = readFileSync(src, 'utf8');
  if (en.includes('rel="alternate" hreflang=')) { console.error(`build-fr: ${page} already carries hreflang; refusing to run twice`); process.exit(1); }

  // The English page learns that a French one exists.
  en = head(en, `<meta property="og:locale" content="en_CA"/>\n<meta property="og:locale:alternate" content="fr_CA"/>\n` + alternates(page));
  writeFileSync(src, en);

  const before = hits;
  let fr = frenchCopy(en, page);
  // The hreflang links were translated along with everything else in the
  // page; the English one must still say English. Put them back verbatim.
  fr = fr.replace(/<link rel="alternate" hreflang="[^"]+" href="[^"]+"\/>\n/g, '');
  fr = head(fr, alternates(page));
  const n = hits - before;
  if (n < 20) { console.error(`build-fr: only ${n} strings translated on ${page}; something is wrong`); process.exit(1); }
  if (!/<html lang="fr-CA">/.test(fr) || /(?:href|src)="(?:assets|css|js)\//.test(fr)) {
    console.error(`build-fr: ${page} came out wrong (lang or relative asset path)`); process.exit(1);
  }
  writeFileSync(at(`dist/fr/${page}`), fr);

  const freq = page === 'index.html' || page === 'events.html' ? 'weekly' : 'monthly';
  sitemapRows += `  <url><loc>${urlOf(page, true)}</loc><changefreq>${freq}</changefreq><priority>${page === 'index.html' ? '0.9' : '0.7'}</priority></url>\n`;
}

const sm = at('dist/sitemap.xml');
writeFileSync(sm, readFileSync(sm, 'utf8').replace('</urlset>', sitemapRows + '</urlset>'));

const gaps = [...missed.entries()].sort((a, b) => b[1] - a[1]);
console.log(`  French site built: ${PAGES.length} pages under /fr/, ${hits} strings translated, ${gaps.length} distinct English strings left`);
for (const [k, n] of gaps.slice(0, 8)) console.log(`      ${n}× ${k.length > 70 ? k.slice(0, 67) + '…' : k}`);
