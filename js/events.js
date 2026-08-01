/* =========================================================================
   SPEAKEASY — events page: swipe (yes/no) event deck, like a dating app.
   Edit the EVENTS array to change the line-up. Cards with `img` show a photo;
   cards with `art` show the matching wax-seal stamp on a deco ground.
   ========================================================================= */
import { $, $$, reduceMotion, toast } from './site.js';

const EVENTS = [
  {
    id: 'first-dates', kicker: 'Ottawa Speed Dating', title: '15 First Dates',
    when: 'Sun · Jul 26 · 1:00 PM', meta: ['Ages 35–45', '55 York St'],
    blurb: 'Meet local singles over real conversations and real connections — in the most charming hideaway in the ByWard Market.',
    img: 'assets/img/event-15-first-dates.jpg', startISO: '2026-07-26T13:00:00', durMin: 180,
  },
  {
    id: 'jazz', kicker: 'On the stage', title: 'Live Jazz Nights',
    when: 'Every night · 7 PM', meta: ['Live music', 'No cover'],
    blurb: 'Brass, keys and a low candlelit hum. The line-up changes with the night and the last set runs late.',
    img: 'assets/img/interior.jpg', weekly: 5, time: '19:00', durMin: 180,
  },
  {
    id: 'golden-hour', kicker: 'Aperitivo', title: 'Golden-Hour Cocktails',
    when: 'Daily · 4 – 6 PM', meta: ['Feature pours', 'Bar seats'],
    blurb: 'Signature cocktails poured with prohibition swagger while the sun goes down over York Street.',
    img: 'assets/img/blue-lagoon.jpg', weekly: 4, time: '16:00', durMin: 120,
  },
  {
    id: 'comedy', kicker: 'Comedy', title: 'Comedy Night',
    when: 'Thursdays · 8 PM', meta: ['Stand-up', 'Local line-up'],
    blurb: 'Laugh in the dark. A rotating bill of Ottawa’s funniest, close enough to heckle (politely).',
    art: 'comedy', weekly: 4, time: '20:00', durMin: 120,
  },
  {
    id: 'latin', kicker: 'Weekend', title: 'Latin & Soul Weekends',
    when: 'Fri – Sat · 9 PM', meta: ['DJ + live', 'Late set'],
    blurb: 'The late set runs hot — soul, funk and Latin rhythm until the candles burn low.',
    art: 'concerts', weekly: 5, time: '21:00', durMin: 180,
  },
  {
    id: 'private', kicker: 'Host with us', title: 'Book the Room',
    when: 'Your date · your way', meta: ['Up to 100', 'Custom menus'],
    blurb: 'Take over the lounge for a private event — weddings, launches, showcases and themed nights.',
    art: 'private-events',
  },
];

const deck = $('#swipeDeck');
if (deck) run();

function run() {
  const recap = $('#swipeRecap');
  const buttons = $('#swipeButtons');
  const liked = [];
  const history = [];              // {ev, dir, node}
  let cards = [];

  // build cards (index 0 = top of deck)
  EVENTS.forEach((ev, i) => {
    const card = document.createElement('article');
    card.className = 'ecard' + (ev.art ? ' ecard--art' : '');
    card.dataset.i = i;
    const media = ev.img
      ? `<div class="ecard__media"><div class="ecard__bg" style="background-image:url('${ev.img}')"></div><img src="${ev.img}" alt="${ev.title}" draggable="false" /></div>`
      : `<div class="ecard__media"><img src="assets/img/stamps/${ev.art}.png" alt="" draggable="false" /></div>`;
    card.innerHTML =
      `<div class="ecard__stamp ecard__stamp--yes">Yes</div>
       <div class="ecard__stamp ecard__stamp--no">Nope</div>` + media +
      `<div class="ecard__body">
         <p class="ecard__kicker">${ev.kicker}</p>
         <h3 class="ecard__title">${ev.title}</h3>
         <div class="ecard__meta"><span class="mchip">${ev.when}</span>${ev.meta.map(m => `<span class="mchip">${m}</span>`).join('')}</div>
         <p class="ecard__blurb">${ev.blurb}</p>
       </div>`;
    deck.appendChild(card);
    cards.push(card);
  });

  const restack = () => {
    const live = cards.filter(c => !c.dataset.gone);
    live.forEach((c, depth) => {
      c.style.zIndex = String(100 - depth);
      if (depth === 0) { c.style.transform = ''; c.style.pointerEvents = 'auto'; }
      else { c.style.transform = `translateY(${depth * 12}px) scale(${1 - depth * 0.04})`; c.style.pointerEvents = 'none'; c.style.opacity = depth > 2 ? '0' : '1'; }
    });
    if (!live.length) end();
    else attach(live[0]);
  };

  const setStamp = (card, dx) => {
    const yes = $('.ecard__stamp--yes', card), no = $('.ecard__stamp--no', card);
    yes.style.opacity = dx > 0 ? Math.min(1, dx / 90) : 0;
    no.style.opacity = dx < 0 ? Math.min(1, -dx / 90) : 0;
  };

  function decide(card, dir) {                 // dir: 1 = yes, -1 = no
    if (card.dataset.gone) return;
    card.dataset.gone = '1';
    const ev = EVENTS[+card.dataset.i];
    history.push({ ev, dir, node: card });
    if (dir > 0) { liked.push(ev); toast(`Nice — “${ev.title}” saved`); }
    card.classList.remove('dragging');
    card.style.transition = 'transform .5s cubic-bezier(.4,0,.2,1), opacity .5s';
    card.style.transform = `translate(${dir * 140}%, -30px) rotate(${dir * 22}deg)`;
    card.style.opacity = '0';
    setStamp(card, dir * 100);
    setTimeout(restack, reduceMotion ? 60 : 320);
  }

  let bound = null;
  function attach(card) {
    if (bound === card) return; bound = card;
    let dragging = false, sx = 0, dx = 0;
    const down = (e) => { dragging = true; sx = e.clientX; card.classList.add('dragging'); card.setPointerCapture?.(e.pointerId); };
    const move = (e) => { if (!dragging) return; dx = e.clientX - sx; card.style.transform = `translateX(${dx}px) rotate(${dx * 0.06}deg)`; setStamp(card, dx); };
    const up = () => {
      if (!dragging) return; dragging = false; card.classList.remove('dragging');
      if (Math.abs(dx) > 110) decide(card, dx > 0 ? 1 : -1);
      else { card.style.transform = ''; setStamp(card, 0); }
      dx = 0;
    };
    card.addEventListener('pointerdown', down);
    card.addEventListener('pointermove', move);
    card.addEventListener('pointerup', up);
    card.addEventListener('pointercancel', up);
  }

  // buttons
  const top = () => cards.find(c => !c.dataset.gone);
  $('#btnNo')?.addEventListener('click', () => { const c = top(); if (c) decide(c, -1); });
  $('#btnYes')?.addEventListener('click', () => { const c = top(); if (c) decide(c, 1); });
  $('#btnUndo')?.addEventListener('click', undo);
  addEventListener('keydown', (e) => {
    if (recap.classList.contains('show')) return;
    if (e.key === 'ArrowRight') { const c = top(); if (c) decide(c, 1); }
    if (e.key === 'ArrowLeft') { const c = top(); if (c) decide(c, -1); }
  });

  function undo() {
    const last = history.pop(); if (!last) return;
    if (last.dir > 0) { const idx = liked.lastIndexOf(last.ev); if (idx > -1) liked.splice(idx, 1); }
    const c = last.node; delete c.dataset.gone;
    c.style.transition = 'transform .4s var(--ease), opacity .4s'; c.style.opacity = '1'; setStamp(c, 0);
    recap.classList.remove('show'); deck.style.display = ''; buttons.style.display = '';
    restack();
  }

  function end() {
    deck.style.display = 'none'; buttons.style.display = 'none';
    if (!liked.length) {
      recap.innerHTML = `<h3>No matches — that’s allowed.</h3><p class="note">Not in the mood tonight? The bar’s always open.</p><button class="btn btn--ghost" id="reBtn">Start over</button>`;
    } else {
      const rows = liked.map(e => `<li><b>${e.title}</b><span>${e.when}</span></li>`).join('');
      recap.innerHTML = `<h3>You’re into ${liked.length} night${liked.length > 1 ? 's' : ''}.</h3>
        <p class="note">We saved them below. Call to reserve, or drop them in your calendar.</p>
        <ul>${rows}</ul>
        <a class="btn btn--gold" href="https://www.eventbrite.ca/o/speakeasy-tapas-lounge-57744410063" target="_blank" rel="noopener">Get tickets on Eventbrite</a>
        <button class="btn btn--ghost" id="icsBtn">Add to calendar</button>
        <button class="btn btn--ghost" id="reBtn">Start over</button>`;
    }
    recap.classList.add('show');
    $('#reBtn')?.addEventListener('click', () => location.reload());
    $('#icsBtn')?.addEventListener('click', downloadICS);
  }

  function downloadICS() {
    const pad = n => String(n).padStart(2, '0');
    const fmt = d => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
    const nextWeekly = (wd, time) => { const [h, m] = time.split(':').map(Number); const d = new Date(); d.setHours(h, m, 0, 0); let add = (wd - d.getDay() + 7) % 7; if (add === 0 && d < new Date()) add = 7; d.setDate(d.getDate() + add); return d; };
    let ics = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Speakeasy Tapas Lounge//EN\r\n';
    liked.forEach(e => {
      let start;
      if (e.startISO) start = new Date(e.startISO);
      else if (e.weekly != null) start = nextWeekly(e.weekly, e.time || '19:00');
      else return;
      const endD = new Date(start.getTime() + (e.durMin || 120) * 60000);
      ics += 'BEGIN:VEVENT\r\n' +
        `UID:${e.id}-${start.getTime()}@speakeasytapas.ca\r\nDTSTAMP:${fmt(new Date())}\r\n` +
        `DTSTART:${fmt(start)}\r\nDTEND:${fmt(endD)}\r\n` +
        (e.weekly != null ? 'RRULE:FREQ=WEEKLY\r\n' : '') +
        `SUMMARY:${e.title} — Speakeasy Tapas Lounge\r\nLOCATION:55 York Street, Ottawa, ON\r\n` +
        `DESCRIPTION:${e.blurb.replace(/,/g, '\\,')}\r\nEND:VEVENT\r\n`;
    });
    ics += 'END:VCALENDAR';
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
    a.download = 'speakeasy-events.ics'; a.click();
    toast('Calendar file downloaded');
  }

  restack();
}
