/* =========================================================================
   SPEAKEASY opening hours.

   Deliberately free of any DOM reference so tools/check-hours.mjs can import it
   and verify the hand-written copies on the pages still agree with it.
   ========================================================================= */
/* THE ONE PLACE OPENING HOURS ARE WRITTEN.

   They used to be typed out in six places — this object, two noscript
   fallbacks, the "six nights a week" line, the menu page's dinner line, and the
   Restaurant schema Google reads — and they drifted apart. The site claimed
   "six nights a week" while this object listed five, and said "Closed · opens
   Tue" on a Sunday it was selling concert tickets for.

   Everything below is now derived from this object. To change the hours, edit
   this and nothing else; `node tools/check-hours.mjs` fails the build if any
   hand-written copy disagrees.

   Minutes from midnight. null means closed that day. */
export const SCHEDULE = {
  0: { open: 16 * 60, close: 22 * 60 + 30 },   // Sunday
  1: null,                                      // Monday, the dark night
  2: { open: 16 * 60, close: 22 * 60 + 30 }, 3: { open: 16 * 60, close: 22 * 60 + 30 }, 4: { open: 16 * 60, close: 22 * 60 + 30 },
  5: { open: 16 * 60, close: 24 * 60 }, 6: { open: 16 * 60, close: 24 * 60 },
};

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const clock = (m) => { m %= 1440; const h = (m / 60) | 0, mm = m % 60, ap = h >= 12 ? 'PM' : 'AM', hh = h % 12 || 12; return mm ? `${hh}:${String(mm).padStart(2, '0')} ${ap}` : `${hh} ${ap}`; };
export const span = (s, cap) => `${clock(s.open)} to ${s.close >= 1440 ? (cap ? 'Midnight' : 'midnight') : clock(s.close)}`;

/** How many nights a week the room is open, counted rather than asserted. */
export const nightsOpen = () => Object.values(SCHEDULE).filter(Boolean).length;

/** "Tue to Thu, 4 PM to 10:30 PM · Fri and Sat, 4 PM to Midnight · Sun, ..." —
 *  consecutive days sharing the same hours are grouped, closed days listed last. */
export function hoursSentence() {
  const groups = [];
  for (let d = 0; d < 7; d++) {
    const key = SCHEDULE[d] ? span(SCHEDULE[d], true) : 'closed';
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.days.push(d); else groups.push({ key, days: [d] });
  }
  // A run that wraps from Saturday round to Sunday reads as one run.
  if (groups.length > 1 && groups[0].key === groups[groups.length - 1].key) {
    const first = groups.shift();
    groups[groups.length - 1].days.push(...first.days);
  }
  const name = (d, short = true) => (short ? DAY_NAMES[d].slice(0, 3) : DAY_NAMES[d]);
  return groups.map(g => {
    const ds = g.days;
    const label = ds.length === 1 ? name(ds[0])
      : ds.length === 2 ? `${name(ds[0])} and ${name(ds[1])}`
      : `${name(ds[0])} to ${name(ds[ds.length - 1])}`;
    return g.key === 'closed' ? `${label}, closed` : `${label}, ${g.key}`;
  }).join(' · ');
}
