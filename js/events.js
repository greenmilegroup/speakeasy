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

const fmtTime = d => { let h = d.getHours(); const m = d.getMinutes(), ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; return m ? `${h}:${pad(m)} ${ap}` : `${h} ${ap}`; };
const fmtFull = d => `${DAY[d.getDay()]} · ${MON[d.getMonth()]} ${d.getDate()} · ${fmtTime(d)}`;
const fmtShort = d => `${DAY[d.getDay()]} ${d.getDate()} ${MON[d.getMonth()]}`;
const midnight = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const dayKey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Ticketed shows are the ones you make plans for; the rest is the house programme. */
const isTicketed = ev => Boolean(ev.ticketed);

function countdown(d) {
  const ms = d - Date.now();
  if (ms < 0) return 'On now';
  const days = Math.floor((midnight(d) - midnight(new Date())) / DAY_MS);
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
  const now = new Date();
  const end = midnight(now); end.setDate(end.getDate() + 1);
  const soon = expand(all, new Date(now - 3 * 3600e3), new Date(now.getTime() + 30 * DAY_MS));
  const tonight = soon.filter(e => e.date < end);

  if (tonight.length) {
    band.innerHTML = `
      <div class="tonight__mark"><span class="tonight__dot" aria-hidden="true"></span><p class="kicker">Tonight · ${DAY_LONG[now.getDay()]} ${now.getDate()} ${MON[now.getMonth()]}</p></div>
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
      <p class="feature__blurb">${esc(ev.blurb)}</p>
      <div class="feature__cta">
        <a class="btn btn--gold" href="${esc(tickets(ev))}" target="_blank" rel="noopener">Get tickets on Eventbrite</a>
        <button class="btn btn--ghost" type="button" data-ics>Add to calendar</button>
      </div>
    </div>`;
  feature.querySelector('[data-ics]')?.addEventListener('click', () => download(ev));
}

function renderTicketList(list) {
  const ul = $('#ticketList');
  ul.innerHTML = list.map((ev, i) => `
    <li class="wrow" data-cat="${esc(ev.category)}" style="--i:${i}">
      <div class="wrow__date"><span class="wrow__dow">${DAY[ev.date.getDay()]}</span><strong>${ev.date.getDate()}</strong><span class="wrow__mon">${MON[ev.date.getMonth()]}</span></div>
      ${ev.imageUrl
        ? `<div class="wrow__thumb"><img src="${esc(ev.imageUrl)}" alt="" loading="lazy"/></div>`
        : `<div class="wrow__thumb wrow__thumb--none" aria-hidden="true"><span>${esc((ev.title || '?').trim()[0])}</span></div>`}
      <div class="wrow__main">
        <p class="ecard__kicker">${esc(ev.kicker)}</p>
        <h3 class="wrow__title">${esc(ev.title)}</h3>
        <p class="wrow__blurb">${esc(ev.blurb)}</p>
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
let calMonth = (() => { const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d; })();

/** Every night in the given month, keyed by day-of-month. */
function nightsByDay(house, month) {
  const from = new Date(month);
  const to = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59);
  const map = new Map();
  for (const ev of expand(house, from, to)) {
    const d = ev.date.getDate();
    if (!map.has(d)) map.set(d, []);
    map.get(d).push(ev);
  }
  return map;
}

function renderCalendar(house, selectedDay) {
  const grid = $('#calGrid'), label = $('#calMonth');
  if (!grid) return;
  label.textContent = `${MON_LONG[calMonth.getMonth()]} ${calMonth.getFullYear()}`;

  const byDay = nightsByDay(house, calMonth);
  const first = new Date(calMonth.getFullYear(), calMonth.getMonth(), 1).getDay();
  const days = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 0).getDate();
  const today = new Date();
  const isThisMonth = today.getMonth() === calMonth.getMonth() && today.getFullYear() === calMonth.getFullYear();

  let cells = '';
  for (let i = 0; i < first; i++) cells += '<span class="cal__pad" aria-hidden="true"></span>';
  for (let d = 1; d <= days; d++) {
    const on = byDay.get(d);
    const cls = ['cal__day'];
    if (on) cls.push('has-event');
    if (isThisMonth && d === today.getDate()) cls.push('is-today');
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
  const from = new Date(calMonth);
  const to = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 0, 23, 59, 59);
  let nights = expand(house, from, to);
  if (selectedDay) nights = nights.filter(e => e.date.getDate() === selectedDay);

  label.textContent = nights.length
    ? (selectedDay
        ? `${DAY[nights[0].date.getDay()]} ${selectedDay} ${MON[calMonth.getMonth()]} · ${nights.length} on the stage`
        : `${nights.length} night${nights.length > 1 ? 's' : ''} on the stage in ${MON_LONG[calMonth.getMonth()]}`)
    : '';
  empty.hidden = Boolean(nights.length);
  list.hidden = !nights.length;
  if (!nights.length) { list.innerHTML = ''; return; }

  const days = new Map();
  for (const ev of nights) {
    const k = dayKey(ev.date);
    if (!days.has(k)) days.set(k, []);
    days.get(k).push(ev);
  }

  list.innerHTML = [...days.values()].map((evs, i) => {
    const d = evs[0].date;
    const today = dayKey(d) === dayKey(new Date());
    return `
      <div class="mus__day${today ? ' is-today' : ''}" id="day-${dayKey(d)}" style="--i:${i}">
        <div class="mus__when">
          <span class="mus__dow">${DAY[d.getDay()]}</span>
          <strong>${d.getDate()}</strong>
          <span class="mus__mon">${MON[d.getMonth()]}</span>
          ${today ? '<span class="mus__today">Tonight</span>' : ''}
        </div>
        <ul class="mus__sets">${evs.map(ev => `
          <li>
            <span class="mus__time">${fmtTime(ev.date)}</span>
            <div class="mus__what">
              <h3>${esc(ev.title)}</h3>
              <p>${esc(ev.blurb)}</p>
            </div>
            ${ev.priceText ? `<span class="mchip">${esc(ev.priceText)}</span>` : ''}
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

async function start() {
  const all = await loadEvents();
  const ticketed = all.filter(isTicketed);
  const house = all.filter(ev => !isTicketed(ev));

  renderTonight(all);

  const noTickets = !ticketed.length;
  $('#ticketEmpty').hidden = !noTickets;
  $('#whatsonFeature').hidden = noTickets;
  $('#ticketList').hidden = noTickets;
  if (!noTickets) {
    renderFeature(ticketed[0]);
    renderTicketList(ticketed.slice(1));
  }

  // open on the first month that actually has something on
  const upcoming = expand(house, new Date(), new Date(Date.now() + 400 * DAY_MS))[0];
  if (upcoming) { calMonth = new Date(upcoming.date.getFullYear(), upcoming.date.getMonth(), 1); }
  paintMusic(house);

  $$('#musCal .cal__nav').forEach(btn => btn.addEventListener('click', () => {
    calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + Number(btn.dataset.step), 1);
    paintMusic(house);
  }));

  schema(all);
}
