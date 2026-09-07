/* Bakes the events board into dist/events.html at build time.
 *
 * The page renders every performer, date and ticket link from JavaScript.
 * Google does run JavaScript, but on a second pass that can lag the first by
 * days — and a listing for last Thursday indexed next Tuesday is worth
 * nothing. So the same content is written into the HTML here, where the
 * first-pass crawler and anyone without JavaScript can read it.
 *
 * js/events.js still owns the live page: every container below is filled with
 * innerHTML on load, so this snapshot is replaced the moment the script runs.
 * That means it can never disagree with what a visitor sees — it is only what
 * is true before the script arrives.
 *
 * Runs against dist/, never the source tree, so nothing here has to be kept in
 * sync by hand in the repo.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const root = new URL('..', import.meta.url);
const at = p => new URL(p, root);

const VENUE_TZ = 'America/Toronto';
const SITE = 'https://speakeasyottawa.com';
const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MON_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
  'August', 'September', 'October', 'November', 'December'];
const DOW_INDEX = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
const pad = n => String(n).padStart(2, '0');

/* Venue time, the same way js/events.js reads it: a 7 PM set is 7 PM whoever
   is reading, and the build machine runs in UTC. */
const FMT = new Intl.DateTimeFormat('en-CA', {
  timeZone: VENUE_TZ, hourCycle: 'h23', year: 'numeric', month: 'numeric',
  day: 'numeric', hour: 'numeric', minute: 'numeric', weekday: 'short',
});
const OFFSET = new Intl.DateTimeFormat('en-CA', { timeZone: VENUE_TZ, timeZoneName: 'longOffset' });

function vp(d) {
  const p = Object.fromEntries(FMT.formatToParts(d).map(x => [x.type, x.value]));
  return {
    y: +p.year, m: +p.month - 1, d: +p.day,
    h: +p.hour % 24, min: +p.minute, dow: DOW_INDEX[p.weekday] ?? 0,
  };
}

/** ISO 8601 in venue local time, offset included — DST handled by Intl. */
function isoLocal(d) {
  const v = vp(d);
  const off = OFFSET.formatToParts(d).find(p => p.type === 'timeZoneName').value.replace('GMT', '') || '+00:00';
  return `${v.y}-${pad(v.m + 1)}-${pad(v.d)}T${pad(v.h)}:${pad(v.min)}:00${off}`;
}

const fmtTime = d => { const { h, min } = vp(d); const ap = h >= 12 ? 'PM' : 'AM'; const hh = h % 12 || 12; return min ? `${hh}:${pad(min)} ${ap}` : `${hh} ${ap}`; };
const fmtFull = d => { const v = vp(d); return `${DAY[v.dow]} · ${MON[v.m]} ${v.d} · ${fmtTime(d)}`; };
const dayKey = d => { const v = vp(d); return `${v.y}-${pad(v.m + 1)}-${pad(v.d)}`; };
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ---------- data ---------- */

const EVENTBRITE = readFileSync(at('js/config.js'), 'utf8').match(/EVENTBRITE_URL\s*=\s*'([^']+)'/)[1];

/* Mirrors normalise() in js/events-data.js for the one-off events the tracker
   produces. A weekly recurrence has no fixed date to bake, so it is left to
   the script, which knows what day it is. */
const rows = JSON.parse(readFileSync(at('assets/data/events.json'), 'utf8'));
const now = new Date();
const events = rows
  .filter(r => r.published !== false && r.recurrence !== 'weekly' && r.starts_at)
  .map(r => ({
    id: r.id, title: r.title || 'Untitled', kicker: r.kicker || '', blurb: r.blurb || '',
    category: r.category || 'special',
    ticketed: r.ticketed ?? (Boolean(r.ticket_url) || r.category === 'comedy'),
    date: new Date(r.starts_at), startsAt: r.starts_at,
    durationMin: Number(r.duration_min ?? 120),
    priceText: r.price_text || '',
    imageUrl: r.image_url ? r.image_url.replace(/^(?!https?:|\/)/, '/') : '',   // as events-data.js does
    ticketUrl: r.ticket_url || '',
  }))
  .filter(e => e.date > new Date(now - 3 * 3600e3))
  .sort((a, b) => a.date - b.date);

const ticketed = events.filter(e => e.ticketed);
const ticketHref = e => e.ticketUrl || EVENTBRITE;

/* ---------- markup ----------
   Same classes js/events.js uses, so the snapshot is styled correctly on its
   own. Buttons that only do something with JavaScript (Add to calendar) are
   left out rather than rendered dead. */

function featureHtml(ev) {
  if (!ev) return '';
  const media = ev.imageUrl
    ? `<div class="feature__media"><div class="feature__bg" style="background-image:url('${esc(ev.imageUrl)}')"></div><img src="${esc(ev.imageUrl)}" alt="${esc(ev.title)}"/></div>`
    : '<div class="feature__media feature__media--none"></div>';
  return `${media}<div class="feature__body"><p class="feature__flag">Next up</p>`
    + (ev.kicker ? `<p class="ecard__kicker">${esc(ev.kicker)}</p>` : '')
    + `<h3 class="feature__title">${esc(ev.title)}</h3>`
    + `<div class="ecard__meta"><span class="mchip">${fmtFull(ev.date)}</span>${ev.priceText ? `<span class="mchip">${esc(ev.priceText)}</span>` : ''}</div>`
    + (ev.blurb ? `<p class="feature__blurb">${esc(ev.blurb)}</p>` : '')
    + `<div class="feature__cta"><a class="btn btn--gold" href="${esc(ticketHref(ev))}" target="_blank" rel="noopener">Get tickets on Eventbrite</a></div></div>`;
}

function ticketListHtml(list) {
  return list.map((ev, i) => {
    const v = vp(ev.date);
    return `<li class="wrow" data-cat="${esc(ev.category)}" style="--i:${i}">`
      + `<div class="wrow__date"><span class="wrow__dow">${DAY[v.dow]}</span><strong>${v.d}</strong><span class="wrow__mon">${MON[v.m]}</span></div>`
      + (ev.imageUrl
        ? `<div class="wrow__thumb"><img src="${esc(ev.imageUrl)}" alt="" loading="lazy"/></div>`
        : `<div class="wrow__thumb wrow__thumb--none" aria-hidden="true"><span>${esc((ev.title || '?').trim()[0])}</span></div>`)
      + `<div class="wrow__main">${ev.kicker ? `<p class="ecard__kicker">${esc(ev.kicker)}</p>` : ''}`
      + `<h3 class="wrow__title">${esc(ev.title)}</h3>`
      + (ev.blurb ? `<p class="wrow__blurb">${esc(ev.blurb)}</p>` : '')
      + `<div class="ecard__meta"><span class="mchip">${fmtTime(ev.date)}</span>${ev.priceText ? `<span class="mchip">${esc(ev.priceText)}</span>` : ''}</div></div>`
      + `<div class="wrow__act"><a class="btn btn--gold-sm" href="${esc(ticketHref(ev))}" target="_blank" rel="noopener">Tickets</a></div></li>`;
  }).join('');
}

/* The live page shows one month at a time behind arrows a crawler cannot
   click. The snapshot lists every upcoming night instead, so the whole
   line-up is in the HTML; the script narrows it to the current month. */
function musicHtml(list) {
  const days = new Map();
  for (const ev of list) {
    const k = dayKey(ev.date);
    if (!days.has(k)) days.set(k, []);
    days.get(k).push(ev);
  }
  return [...days.values()].map((evs, i) => {
    const v = vp(evs[0].date);
    return `<div class="mus__day" id="day-${dayKey(evs[0].date)}" style="--i:${i}">`
      + `<div class="mus__when"><span class="mus__dow">${DAY[v.dow]}</span><strong>${v.d}</strong><span class="mus__mon">${MON[v.m]}</span></div>`
      + `<ul class="mus__sets">${evs.map(ev => `<li${ev.ticketed ? ' class="is-ticketed"' : ''}>`
        + `<span class="mus__time">${fmtTime(ev.date)}</span>`
        + `<div class="mus__what"><h3>${esc(ev.title)}</h3>${ev.kicker ? `<p>${esc(ev.kicker)}</p>` : ''}</div>`
        + (ev.priceText ? `<span class="mchip${ev.ticketed ? ' mchip--ticket' : ''}">${esc(ev.priceText)}</span>` : '')
        + (ev.ticketed ? `<a class="btn btn--gold-sm mus__tickets" href="${esc(ticketHref(ev))}" target="_blank" rel="noopener">Tickets</a>` : '')
        + '</li>').join('')}</ul></div>`;
  }).join('');
}

function rangeLabel(list) {
  const nights = new Set(list.map(e => dayKey(e.date))).size;
  if (!nights) return '';
  const a = vp(list[0].date), b = vp(list[list.length - 1].date);
  const span = a.m === b.m && a.y === b.y
    ? `in ${MON_LONG[a.m]}`
    : `between ${MON_LONG[a.m]} and ${MON_LONG[b.m]}`;
  return `${nights} night${nights > 1 ? 's' : ''} on the stage ${span}`;
}

/* ---------- structured data ----------
   Every field below is copied or mechanically derived from events.json. The
   description is assembled from the act's own name, instrument and price —
   it states nothing the data does not already say. */

const PLACE = {
  '@type': 'Place', name: 'Speakeasy Ottawa', url: `${SITE}/visit.html`,
  address: {
    '@type': 'PostalAddress', streetAddress: '55 York Street', addressLocality: 'Ottawa',
    addressRegion: 'ON', postalCode: 'K1N 9B7', addressCountry: 'CA',
  },
};

/** "From $35" and "CA$33.28" both mean 35 and 33.28. "No cover" means free. */
function priceOf(text) {
  if (!text) return null;
  if (/no cover|free/i.test(text)) return '0';
  const m = text.replace(/,/g, '').match(/(\d+(?:\.\d{1,2})?)/);
  return m ? m[1] : null;
}

function describe(ev) {
  if (ev.blurb) return ev.blurb;
  const who = ev.kicker ? `${ev.title} — ${ev.kicker}.` : `${ev.title}.`;
  const how = ev.ticketed
    ? 'Ticketed show at Speakeasy Ottawa, 55 York Street in the ByWard Market.'
    : 'Live music with dinner at Speakeasy Ottawa, 55 York Street in the ByWard Market. No cover.';
  return `${who} ${how}`;
}

function eventLd(ev) {
  const end = new Date(ev.date.getTime() + ev.durationMin * 60000);
  const price = priceOf(ev.priceText);
  return {
    '@context': 'https://schema.org',
    '@type': ev.category === 'music' ? 'MusicEvent' : 'Event',
    name: ev.title,
    description: describe(ev),
    startDate: ev.startsAt,
    endDate: isoLocal(end),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    url: `${SITE}/events.html`,
    image: [ev.imageUrl ? new URL(ev.imageUrl, `${SITE}/`).href : `${SITE}/assets/og-card.jpg`],
    location: PLACE,
    /* For a live-music night the act's name is the performer; that is what the
       tracker records and what the page prints. */
    ...(ev.category === 'music' ? { performer: { '@type': 'PerformingGroup', name: ev.title } } : {}),
    organizer: { '@type': 'Organization', name: 'Speakeasy Ottawa', url: `${SITE}/` },
    ...(price !== null ? {
      offers: {
        '@type': 'Offer', url: ticketHref(ev), price, priceCurrency: 'CAD',
        availability: 'https://schema.org/InStock', validFrom: isoLocal(now),
      },
    } : {}),
  };
}

/* ---------- write ---------- */

const page = at('dist/events.html');
let html = readFileSync(page, 'utf8');

const fill = (id, inner) => {
  const re = new RegExp(`(<[^>]*id="${id}"[^>]*>)([\\s\\S]*?)(</(?:div|ul|p)>)`);
  if (!re.test(html)) { console.error(`prerender: #${id} not found in dist/events.html`); process.exit(1); }
  html = html.replace(re, (_, open, __, close) => open + inner + close);
};

fill('whatsonFeature', featureHtml(ticketed[0]));
fill('ticketList', ticketListHtml(ticketed.slice(1)));
fill('musList', musicHtml(events));
fill('musRange', rangeLabel(events));

const ld = `<script type="application/ld+json" data-events>${JSON.stringify(events.map(eventLd))}</script>\n`;
html = html.replace('</head>', ld + '</head>');

writeFileSync(page, html);

/* Read back what was written. A regex that matches but captures nothing fails
   silently and ships an empty board that still looks fine in the browser,
   because the script fills it in a moment later — the exact failure this whole
   file exists to prevent. */
const out = readFileSync(page, 'utf8');
const missing = [...new Set(events.map(e => e.title))].filter(t => !out.includes(esc(t)));
if (missing.length) {
  console.error(`prerender: written page is missing ${missing.length} act(s): ${missing.join(', ')}`);
  process.exit(1);
}
console.log(`  events pre-rendered (${events.length} upcoming, ${ticketed.length} ticketed, ${new Set(events.map(e => dayKey(e.date))).size} nights) + Event schema`);
