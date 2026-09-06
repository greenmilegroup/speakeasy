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

   Minutes from midnight. null means closed that day.
   Taken from the Google Business listing, which is the copy the owner keeps
   current and the one most guests actually read. A close past midnight is
   written as minutes beyond 1440: Friday shuts at 1 AM, so 25 * 60. */
export const SCHEDULE = {
  0: { open: 16 * 60, close: 23 * 60 },        // Sunday      4 PM - 11 PM
  1: null,                                      // Monday      closed
  2: { open: 16 * 60, close: 23 * 60 },        // Tuesday     4 PM - 11 PM
  3: { open: 16 * 60, close: 23 * 60 },        // Wednesday   4 PM - 11 PM
  4: { open: 16 * 60, close: 23 * 60 },        // Thursday    4 PM - 11 PM
  5: { open: 16 * 60, close: 25 * 60 },        // Friday      4 PM - 1 AM
  6: { open: 16 * 60, close: 25 * 60 },        // Saturday    4 PM - 1 AM
};

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const clock = (m) => { m %= 1440; const h = (m / 60) | 0, mm = m % 60, ap = h >= 12 ? 'PM' : 'AM', hh = h % 12 || 12; return mm ? `${hh}:${String(mm).padStart(2, '0')} ${ap}` : `${hh} ${ap}`; };
export const span = (s, cap) => `${clock(s.open)} to ${closeLabel(s.close, cap)}`;
/* A close of exactly 1440 reads as midnight; anything past it is the small
   hours of the next day and must show the real time, not "Midnight". */
export const closeLabel = (m, cap) => (m === 1440 ? (cap ? 'Midnight' : 'midnight') : clock(m));

/* Friday's session ends at 1 AM on Saturday. Asking "are we open?" at 00:30 on
   Saturday must therefore look at Friday, or the bar reads Closed while it is
   serving. Returns the session in progress, with the minute it ends. */
export function openSession(day, mins) {
  const today = SCHEDULE[day];
  if (today && mins >= today.open && mins < today.close) return { until: today.close };
  const yesterday = SCHEDULE[(day + 6) % 7];
  if (yesterday && yesterday.close > 1440 && mins < yesterday.close - 1440) {
    return { until: yesterday.close };
  }
  return null;
}

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
