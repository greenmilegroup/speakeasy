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
   or a wrong closing time here sends people to a locked door, or loses the
   last two hours of a Friday. Compare every day's opening AND closing. */
const hhmm = (m) => `${String(Math.floor((m % 1440) / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
/* Every page carrying the schema, not just one: index.html has its own copy,
   and it sat on the old hours after visit.html was corrected. */
for (const f of ['index.html', 'visit.html']) {
  const m = read(f).match(/"openingHoursSpecification":(\[.*?\}\])/s);
  if (!m) continue;
  const schema = new Map();
  for (const r of JSON.parse(m[1])) for (const d of r.dayOfWeek) schema.set(d, `${r.opens}-${r.closes}`);
  for (const [d, name] of DAY_NAMES.entries()) {
    const s = SCHEDULE[d];
    const want = s ? `${hhmm(s.open)}-${hhmm(s.close)}` : null;
    const got = schema.get(name) ?? null;
    check(f, want === got,
      `Restaurant schema has ${name} as ${got ?? 'closed'}, schedule says ${want ?? 'closed'}`);
  }
}

if (fails.length) {
  console.error('\nHours disagree with js/hours.js:\n');
  fails.forEach(f => console.error('  - ' + f));
  console.error('\nEdit js/hours.js, then bring these into line.\n');
  process.exit(1);
}
console.log(`hours consistent across every page (${nightsOpen()} nights: ${line})`);
