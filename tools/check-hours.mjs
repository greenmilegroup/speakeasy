/* Opening hours are written once, in js/hours.js. They used to be typed out in
   six places and drifted: the site claimed "six nights a week" while the
   schedule listed five, and showed "Closed · opens Tue" on a Sunday it was
   selling concert tickets for.

   This fails the build if any hand-written copy no longer agrees with the
   schedule, so the same drift cannot happen quietly again. */
import { readFileSync } from 'node:fs';
import { SCHEDULE, DAY_NAMES, nightsOpen, hoursSentence } from '../js/hours.js';

const read = (f) => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const WORD = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven'];
const fails = [];
const check = (file, ok, what) => { if (!ok) fails.push(`${file}: ${what}`); };

const line = hoursSentence();

for (const f of ['index.html', 'visit.html']) {
  const html = read(f);
  const m = html.match(/<noscript><p>([^<]+)<\/p><\/noscript>/);
  check(f, m && m[1] === line,
    `no-JavaScript hours read "${m ? m[1] : '(none found)'}"\n      expected "${line}"`);
}

const idx = read('index.html').match(/data-hours-nights[^>]*>([^<]+)</);
check('index.html', idx && new RegExp(`\\b${WORD[nightsOpen()]} nights?\\b`, 'i').test(idx[1]),
  `the note says "${idx ? idx[1].trim() : '(none)'}" but the schedule has ${nightsOpen()} nights open`);

const menu = read('menu.html').match(/data-hours-line[^>]*>([^<]+)</);
check('menu.html', menu && menu[1] === line,
  `dinner line reads "${menu ? menu[1] : '(none)'}"\n      expected "${line}"`);

/* The Restaurant schema is what Google shows in search results, so a wrong day
   here sends people to a locked door. */
const spec = JSON.parse(read('visit.html').match(/"openingHoursSpecification":(\[.*?\}\])/s)[1]);
const fromSchema = new Set(spec.flatMap(r => r.dayOfWeek));
const fromCode = new Set(DAY_NAMES.filter((_, d) => SCHEDULE[d]));
check('visit.html', fromSchema.size === fromCode.size && [...fromCode].every(d => fromSchema.has(d)),
  `Restaurant schema lists ${[...fromSchema].join(', ') || '(none)'}\n      expected ${[...fromCode].join(', ')}`);

if (fails.length) {
  console.error('\nHours disagree with js/hours.js:\n');
  fails.forEach(f => console.error('  - ' + f));
  console.error('\nEdit js/hours.js, then bring these into line.\n');
  process.exit(1);
}
console.log(`hours consistent across every page (${nightsOpen()} nights: ${line})`);
