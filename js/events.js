/* =========================================================================
   SPEAKEASY events page.

   Three bands, in the order a guest actually asks the questions:
     1. Tonight        what's on today, or the next night we're open.
     2. The Main Event ticketed shows: one featured, the rest listed.
     3. Live Music     the recurring nights, over a week or a month.

   Data comes from js/events-data.js (Supabase, else assets/data/events.json).
   To add an event: talk to Claude via the MCP server, use the Supabase table
   editor, or edit assets/data/events.json. See README.
   ========================================================================= */
import { $, $$, toast } from './site.js';
import { loadEvents, expand } from './events-data.js';
import { EVENTBRITE_URL } from './config.js';

if ($('#tonightBand')) start();

const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad = n => String(n).padStart(2, '0');
const DAY_MS = 864e5;

/* ---------- venue time ----------
   A show at 7 PM in Ottawa is at 7 PM for everyone reading about it. Dates
   parsed from an ISO string carry a real instant, so getHours() and friends
   answer in the *reader's* zone: from Vancouver a 7 PM set reads 4 PM, and
   from Tokyo it lands on the following day. Every date part shown on this
   page is therefore read in the venue's own zone, never the browser's. */
const VENUE_TZ = 'America/Toronto';
const VENUE_FMT = new Intl.DateTimeFormat('en-CA', {
  timeZone: VENUE_TZ, hourCycle: 'h23',
  year: 'numeric', month: 'numeric', day: 'numeric',
  hour: 'numeric', minute: 'numeric', weekday: 'short',
});
const DOW_INDEX = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

/** Calendar parts of an instant as they read at 55 York Street. */
function vp(d) {
  const p = Object.fromEntries(VENUE_FMT.formatToParts(d).map(x => [x.type, x.value]));
  return {
    y: Number(p.year), m: Number(p.month) - 1, d: Number(p.day),
    h: Number(p.hour) % 24, min: Number(p.minute),
    dow: DOW_INDEX[p.weekday] ?? 0,
  };
}

const fmtTime = d => { const { h, min } = vp(d); const ap = h >= 12 ? 'PM' : 'AM'; const hh = h % 12 || 12; return min ? `${hh}:${pad(min)} ${ap}` : `${hh} ${ap}`; };
const fmtFull = d => { const v = vp(d); return `${DAY[v.dow]} · ${MON[v.m]} ${v.d} · ${fmtTime(d)}`; };
const fmtShort = d => { const v = vp(d); return `${DAY[v.dow]} ${v.d} ${MON[v.m]}`; };
const dayKey = d => { const v = vp(d); return `${v.y}-${pad(v.m + 1)}-${pad(v.d)}`; };
/** Whole days from one instant to another, counted by venue calendar day. */
const daysBetween = (a, b) => Math.round((Date.parse(`${dayKey(b)}T00:00:00Z`) - Date.parse(`${dayKey(a)}T00:00:00Z`)) / DAY_MS);

/** Ticketed shows are the ones you make plans for; the rest is the house programme. */
const isTicketed = ev => Boolean(ev.ticketed);

function countdown(d) {
  const ms = d - Date.now();
  if (ms < 0) return 'On now';
  const days = daysBetween(new Date(), d);
  if (days === 0) return 'Tonight';
  if (days === 1) return 'Tomorrow';
  if (days < 7) return `In ${days} days`;
  const w = Math.round(days / 7);
  return `In ${w} week${w > 1 ? 's' : ''}`;
}

/* ---------- calendar export ---------- */

function icsFor(ev) {
  const z = d => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
  const end = new Date(ev.date.getTime() + ev.durationMin * 60000);
  return 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Speakeasy Ottawa//EN\r\nBEGIN:VEVENT\r\n'
    + `UID:${ev.id}-${dayKey(ev.date)}@speakeasyottawa.com\r\nDTSTAMP:${z(new Date())}\r\nDTSTART:${z(ev.date)}\r\nDTEND:${z(end)}\r\n`
    + (ev.recurrence === 'weekly' ? 'RRULE:FREQ=WEEKLY\r\n' : '')
    + `SUMMARY:${ev.title} at Speakeasy Ottawa\r\nLOCATION:55 York Street, Ottawa, ON\r\n`
    + `DESCRIPTION:${(ev.blurb || '').replace(/,/g, '\\,')}\r\nEND:VEVENT\r\nEND:VCALENDAR`;
}

function download(ev) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([icsFor(ev)], { type: 'text/calendar' }));
  a.download = `${ev.id}.ics`; a.click();
  URL.revokeObjectURL(a.href);
  toast('Added to your calendar');
}

const tickets = ev => ev.ticketUrl || EVENTBRITE_URL;
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ---------- 1. tonight ---------- */

function renderTonight(all) {
  const band = $('#tonightBand');
  if (!band) return;
  const now = new Date();
  const today = dayKey(now);
  const soon = expand(all, new Date(now - 3 * 3600e3), new Date(now.getTime() + 30 * DAY_MS));
  const tonight = soon.filter(e => dayKey(e.date) === today);

  const vNow = vp(now);
  if (tonight.length) {
    band.innerHTML = `
      <div class="tonight__mark"><span class="tonight__dot" aria-hidden="true"></span><p class="kicker">Tonight · ${DAY_LONG[vNow.dow]} ${vNow.d} ${MON[vNow.m]}</p></div>
      <ul class="tonight__list">${tonight.map(e => `
        <li><span class="tonight__time">${fmtTime(e.date)}</span><span class="tonight__name">${esc(e.title)}</span>${e.priceText ? `<span class="mchip">${esc(e.priceText)}</span>` : ''}</li>`).join('')}</ul>
      <a class="btn btn--gold-sm" href="tel:+16132416221">Book a table</a>`;
    return;
  }

  const next = soon[0];
  band.innerHTML = next
    ? `<div class="tonight__mark"><span class="tonight__dot tonight__dot--quiet" aria-hidden="true"></span><p class="kicker">Nothing on tonight</p></div>
       <ul class="tonight__list"><li><span class="tonight__time">${fmtShort(next.date)}</span><span class="tonight__name">Next up: ${esc(next.title)}, ${fmtTime(next.date)}</span></li></ul>
       <a class="btn btn--gold-sm" href="tel:+16132416221">Book a table</a>`
    : `<div class="tonight__mark"><span class="tonight__dot tonight__dot--quiet" aria-hidden="true"></span><p class="kicker">Tonight</p></div>
       <ul class="tonight__list"><li><span class="tonight__name">Call for tonight’s line-up. The stage is rarely empty.</span></li></ul>
       <a class="btn btn--gold-sm" href="tel:+16132416221">Call 613-241-6221</a>`;
}

/* ---------- 2. the main event ---------- */

function renderFeature(ev) {
  const feature = $('#whatsonFeature');
  if (!feature) return;
  if (!ev) { feature.innerHTML = ''; return; }
  const media = ev.imageUrl
    ? `<div class="feature__media"><div class="feature__bg" style="background-image:url('${esc(ev.imageUrl)}')"></div><img src="${esc(ev.imageUrl)}" alt="${esc(ev.title)}"/></div>`
    : '<div class="feature__media feature__media--none"></div>';
  feature.innerHTML = `${media}
    <div class="feature__body">
      <p class="feature__flag">Next up · ${countdown(ev.date)}</p>
      <p class="ecard__kicker">${esc(ev.kicker)}</p>
      <h3 class="feature__title">${esc(ev.title)}</h3>
      <div class="ecard__meta"><span class="mchip">${fmtFull(ev.date)}</span>${ev.priceText ? `<span class="mchip">${esc(ev.priceText)}</span>` : ''}${ev.recurrence === 'weekly' ? '<span class="mchip">Every week</span>' : ''}</div>
      ${ev.blurb ? `<p class="feature__blurb">${esc(ev.blurb)}</p>` : ''}
      <div class="feature__cta">
        <a class="btn btn--gold" href="${esc(tickets(ev))}" target="_blank" rel="noopener">Get tickets on Eventbrite</a>
        <button class="btn btn--ghost" type="button" data-ics>Add to calendar</button>
      </div>
    </div>`;
  feature.querySelector('[data-ics]')?.addEventListener('click', () => download(ev));
}

function renderTicketList(list) {
  const ul = $('#ticketList');
  if (!ul) return;
  ul.innerHTML = list.map((ev, i) => `
    <li class="wrow" data-cat="${esc(ev.category)}" style="--i:${i}">
      <div class="wrow__date"><span class="wrow__dow">${DAY[vp(ev.date).dow]}</span><strong>${vp(ev.date).d}</strong><span class="wrow__mon">${MON[vp(ev.date).m]}</span></div>
      ${ev.imageUrl
        ? `<div class="wrow__thumb"><img src="${esc(ev.imageUrl)}" alt="" loading="lazy"/></div>`
        : `<div class="wrow__thumb wrow__thumb--none" aria-hidden="true"><span>${esc((ev.title || '?').trim()[0])}</span></div>`}
      <div class="wrow__main">
        <p class="ecard__kicker">${esc(ev.kicker)}</p>
        <h3 class="wrow__title">${esc(ev.title)}</h3>
        ${ev.blurb ? `<p class="wrow__blurb">${esc(ev.blurb)}</p>` : ''}
        <div class="ecard__meta"><span class="mchip">${fmtTime(ev.date)}</span>${ev.priceText ? `<span class="mchip">${esc(ev.priceText)}</span>` : ''}${ev.recurrence === 'weekly' ? '<span class="mchip">Weekly</span>' : ''}</div>
      </div>
      <div class="wrow__act">
        <a class="btn btn--gold-sm" href="${esc(tickets(ev))}" target="_blank" rel="noopener">Tickets</a>
        <button class="link-underline" type="button" data-i="${i}">Add to calendar</button>
      </div>
    </li>`).join('');
  ul.querySelectorAll('[data-i]').forEach(btn =>
    btn.addEventListener('click', () => download(list[Number(btn.dataset.i)])));
}

/* ---------- 3. live music, browsed a month at a time ---------- */

const MON_LONG = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

/** The month currently on show, always the 1st at midnight. */
let calMonth = (() => { const v = vp(new Date()); return new Date(v.y, v.m, 1); })();

/* The board looks three months ahead: this month and the two after it. Further
   out the line-up is not settled, so a month with nothing in it says so rather
   than reading as a mistake, and stepping past the window is closed off. */
const MONTHS_AHEAD = 2;
const monthStart = (y, m) => new Date(y, m, 1);
const CAL_FIRST = (() => { const v = vp(new Date()); return monthStart(v.y, v.m); })();
const CAL_LAST = monthStart(CAL_FIRST.getFullYear(), CAL_FIRST.getMonth() + MONTHS_AHEAD);
const inWindow = m => m >= CAL_FIRST && m <= CAL_LAST;

/* A month's edges are venue-calendar edges, not the reader's. Expanding a
   couple of days wide and then filtering on the venue month stops a set on the
   30th from sliding into the next month for someone reading from Tokyo. */
function nightsIn(house, month) {
  const from = new Date(month.getFullYear(), month.getMonth(), 1);
  const to = new Date(month.getFullYear(), month.getMonth() + 1, 1);
  from.setDate(from.getDate() - 2);
  to.setDate(to.getDate() + 2);
  return expand(house, from, to)
    .filter(ev => { const v = vp(ev.date); return v.y === month.getFullYear() && v.m === month.getMonth(); });
}

/** Every night in the given month, keyed by day-of-month. */
function nightsByDay(house, month) {
  const map = new Map();
  for (const ev of nightsIn(house, month)) {
    const d = vp(ev.date).d;
    if (!map.has(d)) map.set(d, []);
    map.get(d).push(ev);
  }
  return map;
}

function renderCalendar(house, selectedDay) {
  const grid = $('#calGrid'), label = $('#calMonth');
  if (!grid) return;
  label.textContent = `${MON_LONG[calMonth.getMonth()]} ${calMonth.getFullYear()}`;
  // Close off the arrows at the edges of the three-month window.
  $$('#musCal .cal__nav').forEach(btn => {
    const to = monthStart(calMonth.getFullYear(), calMonth.getMonth() + Number(btn.dataset.step));
    btn.disabled = !inWindow(to);
  });

  const byDay = nightsByDay(house, calMonth);
  const first = new Date(calMonth.getFullYear(), calMonth.getMonth(), 1).getDay();
  const days = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 0).getDate();
  const today = vp(new Date());
  const isThisMonth = today.m === calMonth.getMonth() && today.y === calMonth.getFullYear();

  let cells = '';
  for (let i = 0; i < first; i++) cells += '<span class="cal__pad" aria-hidden="true"></span>';
  for (let d = 1; d <= days; d++) {
    const on = byDay.get(d);
    const cls = ['cal__day'];
    if (on) cls.push('has-event');
    // A ticketed night gets its own mark: the gold dot means "walk in", and
    // these do not, so they must not look the same.
    if (on && on.some(isTicketed)) cls.push('has-ticket');
    if (isThisMonth && d === today.d) cls.push('is-today');
    if (selectedDay === d) cls.push('is-picked');
    const who = on ? on.map(e => e.title).join(', ') : '';
    cells += on
      ? `<button class="${cls.join(' ')}" type="button" data-day="${d}" aria-label="${d} ${MON_LONG[calMonth.getMonth()]}: ${esc(who)}"><span>${d}</span><i aria-hidden="true"></i></button>`
      : `<span class="${cls.join(' ')}" aria-hidden="true"><span>${d}</span></span>`;
  }
  grid.innerHTML = cells;
  grid.querySelectorAll('[data-day]').forEach(btn => btn.addEventListener('click', () => {
    const day = Number(btn.dataset.day);
    paintMusic(house, day === selectedDay ? null : day);   // click again to clear
  }));
}

function renderMusic(house, selectedDay) {
  const list = $('#musList'), empty = $('#musEmpty'), label = $('#musRange');
  if (!list || !empty || !label) return;
  let nights = nightsIn(house, calMonth);
  if (selectedDay) nights = nights.filter(e => vp(e.date).d === selectedDay);

  const days = new Map();
  for (const ev of nights) {
    const k = dayKey(ev.date);
    if (!days.has(k)) days.set(k, []);
    days.get(k).push(ev);
  }

  // A Friday runs two sets, so count nights rather than records.
  const n = days.size;
  label.textContent = n
    ? (selectedDay
        ? `${DAY[vp(nights[0].date).dow]} ${selectedDay} ${MON[calMonth.getMonth()]} · ${nights.length} set${nights.length > 1 ? 's' : ''} on the stage`
        : `${n} night${n > 1 ? 's' : ''} on the stage in ${MON_LONG[calMonth.getMonth()]}`)
    : '';
  empty.hidden = Boolean(n);
  list.hidden = !n;
  if (!n) {
    list.innerHTML = '';
    // Inside the window an empty month is simply not booked yet; say that
    // rather than implying the guest looked in the wrong place.
    $('.whatson__empty-title', empty).textContent =
      `${MON_LONG[calMonth.getMonth()]} · coming soon`;
    $('.whatson__empty-sub', empty).textContent =
      'The line-up for this month is still being booked. Call and we will tell you what is taking shape.';
    return;
  }

  list.innerHTML = [...days.values()].map((evs, i) => {
    const d = evs[0].date, v = vp(d);
    const today = dayKey(d) === dayKey(new Date());
    return `
      <div class="mus__day${today ? ' is-today' : ''}" id="day-${dayKey(d)}" style="--i:${i}">
        <div class="mus__when">
          <span class="mus__dow">${DAY[v.dow]}</span>
          <strong>${v.d}</strong>
          <span class="mus__mon">${MON[v.m]}</span>
          ${today ? '<span class="mus__today">Tonight</span>' : ''}
        </div>
        <ul class="mus__sets">${evs.map(ev => `
          <li${isTicketed(ev) ? ' class="is-ticketed"' : ''}>
            <span class="mus__time">${fmtTime(ev.date)}</span>
            <div class="mus__what">
              <h3>${esc(ev.title)}</h3>
              ${ev.kicker ? `<p>${esc(ev.kicker)}</p>` : ''}
            </div>
            ${ev.priceText ? `<span class="mchip${isTicketed(ev) ? ' mchip--ticket' : ''}">${esc(ev.priceText)}</span>` : ''}
            ${isTicketed(ev) ? `<a class="btn btn--gold-sm mus__tickets" href="${esc(tickets(ev))}" target="_blank" rel="noopener">Tickets</a>` : ''}
          </li>`).join('')}</ul>
      </div>`;
  }).join('');
}

/** Repaint the calendar and the list together; they share one selection. */
function paintMusic(house, selectedDay = null) {
  renderCalendar(house, selectedDay);
  renderMusic(house, selectedDay);
}

/* ---------- structured data ---------- */

function schema(list) {
  if (!list.length) return;
  const ld = list.slice(0, 10).map(ev => ({
    '@context': 'https://schema.org', '@type': 'Event', name: ev.title,
    startDate: ev.date.toISOString(), description: ev.blurb,
    ...(ev.imageUrl ? { image: new URL(ev.imageUrl, location.href).href } : {}),
    eventStatus: 'https://schema.org/EventScheduled',
    location: {
      '@type': 'Place', name: 'Speakeasy Ottawa',
      address: { '@type': 'PostalAddress', streetAddress: '55 York Street', addressLocality: 'Ottawa', addressRegion: 'ON', postalCode: 'K1N 9B7', addressCountry: 'CA' },
    },
    ...(ev.ticketUrl ? { offers: { '@type': 'Offer', url: ev.ticketUrl } } : {}),
  }));
  const tag = document.createElement('script');
  tag.type = 'application/ld+json';
  tag.textContent = JSON.stringify(ld);
  document.head.appendChild(tag);
}

/* ---------- boot ---------- */

/* The three bands are independent, so they fail independently.
   A cached copy of this file once ran against newer HTML, reached for an
   element that had since been deleted, threw, and silently took the featured
   show and the whole calendar down with it. The page looked fine above the
   fold, which is the worst way for it to break. One band failing must never
   cost the others. */
function safely(name, fn) {
  try { fn(); } catch (err) { console.error(`events: ${name} failed`, err); }
}

/** Set .hidden only if the element is actually there. */
const setHidden = (sel, hidden) => { const el = $(sel); if (el) el.hidden = hidden; };

async function start() {
  const all = await loadEvents();
  const ticketed = all.filter(isTicketed);

  safely('tonight', () => renderTonight(all));

  // The Main Event is the Eventbrite board: whatever is still to come, with the
  // soonest featured. A show that has already happened is not news, and the
  // section never announces its own emptiness.
  safely('main event', () => {
    const upcoming = expand(ticketed, new Date(), new Date(Date.now() + 400 * DAY_MS));
    setHidden('#whatsonFeature', !upcoming.length);
    setHidden('#ticketList', upcoming.length < 2);
    renderFeature(upcoming[0]);
    renderTicketList(upcoming.slice(1));
  });

  safely('live music', () => {
    paintMusic(all);
    $$('#musCal .cal__nav').forEach(btn => btn.addEventListener('click', () => {
      const to = monthStart(calMonth.getFullYear(), calMonth.getMonth() + Number(btn.dataset.step));
      if (!inWindow(to)) return;
      calMonth = to;
      paintMusic(all);
    }));
  });

  safely('schema', () => schema(all));
}
