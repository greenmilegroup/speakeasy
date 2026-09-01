/* =========================================================================
   SPEAKEASY — events page: the "What's On" board.
   Data comes from js/events-data.js (Supabase, else assets/data/events.json).
   To add an event: talk to Claude via the MCP server, use the Supabase table
   editor, or edit assets/data/events.json. See README.
   ========================================================================= */
import { $, $$, toast } from './site.js';
import { loadEvents } from './events-data.js';
import { EVENTBRITE_URL, TEL } from './config.js';

const feature = $('#whatsonFeature');
if (feature) start();

const DAY = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const pad = n => String(n).padStart(2, '0');
const fmtTime = d => { let h=d.getHours(), m=d.getMinutes(); const ap=h>=12?'PM':'AM'; h=h%12||12; return m?`${h}:${pad(m)} ${ap}`:`${h} ${ap}`; };
const fmtFull = d => `${DAY[d.getDay()]} · ${MON[d.getMonth()]} ${d.getDate()} · ${fmtTime(d)}`;

function countdown(d) {
  const ms = d - Date.now();
  if (ms < 0) return 'On now';
  const days = Math.floor(ms / 864e5);
  if (days === 0) return 'Tonight';
  if (days === 1) return 'Tomorrow';
  if (days < 7) return `In ${days} days`;
  const w = Math.round(days / 7);
  return `In ${w} week${w > 1 ? 's' : ''}`;
}

function icsFor(ev) {
  const z = d => `${d.getUTCFullYear()}${pad(d.getUTCMonth()+1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
  const end = new Date(ev.date.getTime() + ev.durationMin * 60000);
  return 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Speakeasy Ottawa//EN\r\nBEGIN:VEVENT\r\n'
    + `UID:${ev.id}@speakeasytapas.ca\r\nDTSTAMP:${z(new Date())}\r\nDTSTART:${z(ev.date)}\r\nDTEND:${z(end)}\r\n`
    + (ev.recurrence === 'weekly' ? 'RRULE:FREQ=WEEKLY\r\n' : '')
    + `SUMMARY:${ev.title} — Speakeasy Ottawa\r\nLOCATION:55 York Street, Ottawa, ON\r\n`
    + `DESCRIPTION:${(ev.blurb || '').replace(/,/g, '\\,')}\r\nEND:VEVENT\r\nEND:VCALENDAR`;
}

function download(ev) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([icsFor(ev)], { type: 'text/calendar' }));
  a.download = `${ev.id}.ics`; a.click();
  toast('Added to your calendar');
}

const tickets = ev => ev.ticketUrl || EVENTBRITE_URL;

function renderFeature(ev) {
  if (!ev) { feature.innerHTML = ''; return; }
  const media = ev.imageUrl
    ? `<div class="feature__media"><div class="feature__bg" style="background-image:url('${ev.imageUrl}')"></div><img src="${ev.imageUrl}" alt="${ev.title}"/></div>`
    : '<div class="feature__media feature__media--none"></div>';
  feature.innerHTML = `${media}
    <div class="feature__body">
      <p class="feature__flag">Next up · ${countdown(ev.date)}</p>
      <p class="ecard__kicker">${ev.kicker}</p>
      <h2 class="feature__title">${ev.title}</h2>
      <div class="ecard__meta"><span class="mchip">${fmtFull(ev.date)}</span>${ev.priceText ? `<span class="mchip">${ev.priceText}</span>` : ''}${ev.recurrence === 'weekly' ? '<span class="mchip">Every week</span>' : ''}</div>
      <p class="feature__blurb">${ev.blurb}</p>
      <div class="feature__cta">
        <a class="btn btn--gold" href="${tickets(ev)}" target="_blank" rel="noopener">Get tickets</a>
        <button class="btn btn--ghost" type="button" data-ics>Add to calendar</button>
      </div>
    </div>`;
  feature.querySelector('[data-ics]')?.addEventListener('click', () => download(ev));
}

function renderList(list) {
  const ul = $('#whatsonList');
  ul.innerHTML = list.map((ev, i) => `
    <li class="wrow" data-cat="${ev.category}" style="--i:${i}">
      <div class="wrow__date"><span class="wrow__dow">${DAY[ev.date.getDay()]}</span><strong>${ev.date.getDate()}</strong><span class="wrow__mon">${MON[ev.date.getMonth()]}</span></div>
      ${ev.imageUrl
        ? `<div class="wrow__thumb"><img src="${ev.imageUrl}" alt="" loading="lazy"/></div>`
        : `<div class="wrow__thumb wrow__thumb--none" aria-hidden="true"><span>${(ev.title || '?').trim()[0]}</span></div>`}
      <div class="wrow__main">
        <p class="ecard__kicker">${ev.kicker}</p>
        <h3 class="wrow__title">${ev.title}</h3>
        <p class="wrow__blurb">${ev.blurb}</p>
        <div class="ecard__meta"><span class="mchip">${fmtTime(ev.date)}</span>${ev.priceText ? `<span class="mchip">${ev.priceText}</span>` : ''}${ev.recurrence === 'weekly' ? '<span class="mchip">Weekly</span>' : ''}</div>
      </div>
      <div class="wrow__act">
        <a class="btn btn--gold-sm" href="${tickets(ev)}" target="_blank" rel="noopener">Tickets</a>
        <button class="link-underline" type="button" data-id="${ev.id}">Add to calendar</button>
      </div>
    </li>`).join('');
  ul.querySelectorAll('[data-id]').forEach(btn =>
    btn.addEventListener('click', () => { const ev = list.find(x => String(x.id) === btn.dataset.id); if (ev) download(ev); }));
}

function schema(list) {
  if (!list.length) return;
  const ld = list.slice(0, 10).map(ev => ({
    '@context': 'https://schema.org', '@type': 'Event', name: ev.title,
    startDate: ev.date.toISOString(), description: ev.blurb,
    ...(ev.imageUrl ? { image: new URL(ev.imageUrl, location.href).href } : {}),
    eventStatus: 'https://schema.org/EventScheduled',
    location: { '@type': 'Place', name: 'Speakeasy Ottawa',
      address: { '@type': 'PostalAddress', streetAddress: '55 York Street', addressLocality: 'Ottawa', addressRegion: 'ON', postalCode: 'K1N 9B7', addressCountry: 'CA' } },
    ...(ev.ticketUrl ? { offers: { '@type': 'Offer', url: ev.ticketUrl } } : {}),
  }));
  const tag = document.createElement('script');
  tag.type = 'application/ld+json';
  tag.textContent = JSON.stringify(ld);
  document.head.appendChild(tag);
}

async function start() {
  const all = await loadEvents();
  const empty = $('#whatsonEmpty');
  const paint = (cat) => {
    const list = cat === 'all' ? all : all.filter(e => e.category === cat);
    const isEmpty = !list.length;
    empty.hidden = !isEmpty;
    feature.hidden = isEmpty;
    $('#whatsonList').hidden = isEmpty;
    if (isEmpty) return;
    renderFeature(list[0]);
    renderList(list.slice(1));
  };
  paint('all');
  schema(all);
  $$('.whatson__filters .chip').forEach(chip => chip.addEventListener('click', () => {
    $$('.whatson__filters .chip').forEach(c => { c.classList.remove('is-active'); c.setAttribute('aria-selected', 'false'); });
    chip.classList.add('is-active'); chip.setAttribute('aria-selected', 'true');
    paint(chip.dataset.filter);
  }));
}
