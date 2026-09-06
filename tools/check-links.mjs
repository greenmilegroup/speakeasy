/* Every booking and ticketing link on the site must point at the same place.
   The OpenTable slug is repeated across five pages, so a rename that misses
   one leaves a dead Book button on a page nobody thought to check. This holds
   the HTML hrefs to the constants in js/site.js and js/config.js. */
import { readFileSync, readdirSync } from 'node:fs';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const one = (file, re, what) => {
  const m = read(file).match(re);
  if (!m) { console.error(`check-links: no ${what} in ${file}`); process.exit(1); }
  return m[1];
};

const OPENTABLE  = one('js/site.js',   /const OPENTABLE\s*=\s*'([^']+)'/,        'OPENTABLE constant');
const EVENTBRITE = one('js/config.js', /EVENTBRITE_URL\s*=\s*'([^']+)'/,         'EVENTBRITE_URL constant');

const pages = readdirSync(new URL('..', import.meta.url))
  .filter(f => f.endsWith('.html') && f !== 'admin.html');

let bad = 0, seen = 0;
for (const p of pages) {
  const html = read(p);
  for (const [, href] of html.matchAll(/href="(https:\/\/www\.opentable\.com\/[^"]+)"/g)) {
    seen++;
    if (href !== OPENTABLE) { console.error(`check-links: ${p} books at ${href}, site.js says ${OPENTABLE}`); bad++; }
  }
  for (const [, href] of html.matchAll(/href="(https:\/\/www\.eventbrite\.[^"]+)"/g)) {
    seen++;
    if (!href.startsWith(EVENTBRITE)) { console.error(`check-links: ${p} links ${href}, config.js says ${EVENTBRITE}`); bad++; }
  }
  /* A Maps search that names the venue breaks the day the venue is renamed.
     Anchor it to the street address, which does not change. */
  for (const [, q] of html.matchAll(/google\.com\/maps\/search\/\?api=1&(?:amp;)?query=([^"&]+)/g)) {
    seen++;
    if (!/55\+York\+Street/.test(q)) { console.error(`check-links: ${p} searches Maps for "${q}" without the street address`); bad++; }
    if (/Tapas|Lounge/i.test(q))    { console.error(`check-links: ${p} searches Maps under the retired name: "${q}"`); bad++; }
  }
}

if (bad) process.exit(1);
console.log(`links consistent (${seen} booking, ticketing and map links across ${pages.length} pages)`);
console.log(`  OpenTable  ${OPENTABLE}`);
console.log(`  Eventbrite ${EVENTBRITE}`);
