/* Speakeasy — events admin: shows what's live and drafts new event records. */
import { $, $$, toast } from './site.js';
import { loadEvents, source } from './events-data.js';

const DAY = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'').slice(0,40);

(async function list() {
  const status = $('#adminStatus');
  const events = await loadEvents();
  const live = source() === 'supabase';
  status.innerHTML = live
    ? '<strong>Supabase connected.</strong> Changes appear on the site immediately.'
    : '<strong>Local mode.</strong> Events come from <code>assets/data/events.json</code> — add Supabase keys in <code>js/config.js</code> to go live without redeploying.';
  status.classList.add(live ? 'is-live' : 'is-local');

  const ul = $('#adminList');
  if (!events.length) { ul.innerHTML = '<li class="wrow"><div class="wrow__main"><p class="wrow__blurb">Nothing on the board yet.</p></div></li>'; return; }
  ul.innerHTML = events.map(e => `
    <li class="wrow">
      <div class="wrow__date"><span class="wrow__dow">${DAY[e.date.getDay()]}</span><strong>${e.date.getDate()}</strong><span class="wrow__mon">${MON[e.date.getMonth()]}</span></div>
      <div class="wrow__main">
        <p class="ecard__kicker">${e.kicker || '—'}</p>
        <h3 class="wrow__title">${e.title}</h3>
        <p class="wrow__blurb">${e.blurb}</p>
        <div class="ecard__meta"><span class="mchip">${e.category}</span>${e.recurrence==='weekly'?'<span class="mchip">Weekly</span>':''}${e.priceText?`<span class="mchip">${e.priceText}</span>`:''}<span class="mchip">id: ${e.id}</span></div>
      </div>
    </li>`).join('');
})();

$('#adminForm')?.addEventListener('submit', (ev) => {
  ev.preventDefault();
  const v = id => $('#'+id).value.trim();
  const note = $('#adNote'), out = $('#adminOut');
  if (!v('ad-title')) { note.textContent = 'A title, at least.'; note.classList.add('err'); return; }
  note.classList.remove('err'); note.textContent = '';
  const rec = {
    id: slug(v('ad-title')) || 'event',
    title: v('ad-title'),
    kicker: v('ad-kicker'),
    blurb: v('ad-blurb'),
    category: v('ad-cat'),
    starts_at: v('ad-when') ? new Date(v('ad-when')).toISOString() : null,
    recurrence: 'none',
    duration_min: 120,
    price_text: v('ad-price'),
    image_url: v('ad-img'),
    ticket_url: '',
    published: true,
  };
  out.hidden = false;
  out.textContent = JSON.stringify(rec, null, 2);
  navigator.clipboard?.writeText(JSON.stringify(rec, null, 2)).then(
    () => toast('Copied to clipboard'), () => toast('Generated below'));
});
