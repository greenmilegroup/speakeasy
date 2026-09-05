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
  ul.innerHTML = events.map((e, i) => `
    <li class="wrow" data-cat="${e.category}" style="--i:${i}">
      <div class="wrow__date"><span class="wrow__dow">${DAY[e.date.getDay()]}</span><strong>${e.date.getDate()}</strong><span class="wrow__mon">${MON[e.date.getMonth()]}</span></div>
      ${e.imageUrl
        ? `<div class="wrow__thumb"><img src="${e.imageUrl}" alt="" loading="lazy"/></div>`
        : `<div class="wrow__thumb wrow__thumb--none" aria-hidden="true"><span>no photo</span></div>`}
      <div class="wrow__main">
        <p class="ecard__kicker">${e.kicker || '—'}</p>
        <h3 class="wrow__title">${e.title}</h3>
        <p class="wrow__blurb">${e.blurb}</p>
        <div class="ecard__meta"><span class="mchip">${e.category}</span>${e.recurrence==='weekly'?'<span class="mchip">Weekly</span>':''}${e.priceText?`<span class="mchip">${e.priceText}</span>`:''}<span class="mchip">id: ${e.id}</span></div>
      </div>
    </li>`).join('');
})();


/* ---------- photo picker: resize in the browser, embed in the record ---------- */
const MAX_EDGE = 1200, QUALITY = 0.82;
let photoData = '';                       // the data URI, once a photo is chosen

const kb = n => (n < 1024 * 1024 ? `${Math.round(n / 1024)} KB` : `${(n / 1048576).toFixed(1)} MB`);

/** Draw the file onto a canvas no bigger than MAX_EDGE and export a JPEG data URI. */
function shrink(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
      const c = Object.assign(document.createElement('canvas'), { width: w, height: h });
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#0a0a0b'; ctx.fillRect(0, 0, w, h);   // flatten any transparency
      ctx.drawImage(img, 0, 0, w, h);
      resolve({ uri: c.toDataURL('image/jpeg', QUALITY), w, h });
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("That file isn't an image the browser can read.")); };
    img.src = url;
  });
}

async function usePhoto(file) {
  const note = $('#adNote');
  if (!file) return;
  if (!/^image\//.test(file.type)) { note.textContent = 'That needs to be an image file.'; note.classList.add('err'); return; }
  note.classList.remove('err'); note.textContent = 'Processing photo…';
  try {
    const { uri, w, h } = await shrink(file);
    photoData = uri;
    $('#adPreviewImg').src = uri;
    $('#adPreviewMeta').textContent = `${file.name} · ${w}×${h} · ${kb(uri.length * 0.75)} embedded`;
    $('#adPreview').hidden = false;
    $('#adDrop').classList.add('has-photo');
    note.textContent = uri.length * 0.75 > 500 * 1024
      ? 'Photo added — it is on the large side, so consider a smaller original.'
      : 'Photo added.';
  } catch (err) {
    note.textContent = err.message; note.classList.add('err');
  }
}

function clearPhoto() {
  photoData = '';
  $('#adPreview').hidden = true;
  $('#adPreviewImg').removeAttribute('src');
  $('#adDrop').classList.remove('has-photo');
  const f = $('#ad-file'); if (f) f.value = '';
}

(function photoPicker() {
  const drop = $('#adDrop'), input = $('#ad-file');
  if (!drop || !input) return;
  drop.addEventListener('click', () => input.click());
  drop.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); }
  });
  input.addEventListener('change', () => usePhoto(input.files?.[0]));
  $('#adClear')?.addEventListener('click', clearPhoto);

  ['dragenter', 'dragover'].forEach(t => drop.addEventListener(t, e => {
    e.preventDefault(); drop.classList.add('is-over');
  }));
  ['dragleave', 'drop'].forEach(t => drop.addEventListener(t, e => {
    e.preventDefault(); drop.classList.remove('is-over');
  }));
  drop.addEventListener('drop', e => usePhoto(e.dataTransfer?.files?.[0]));
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
    image_url: photoData || v('ad-img'),
    ticket_url: v('ad-ticket'),
    ticketed: $('#ad-ticketed')?.checked ?? false,
    published: true,
  };
  const full = JSON.stringify(rec, null, 2);

  // An embedded photo is tens of thousands of base64 characters. Show it
  // abbreviated so the record stays readable; the clipboard gets the real thing.
  const shown = photoData
    ? JSON.stringify({ ...rec, image_url: `data:image/jpeg;base64,…${kb(photoData.length * 0.75)} photo, copied in full…` }, null, 2)
    : full;
  out.hidden = false;
  out.textContent = shown;
  note.textContent = photoData
    ? 'The photo is embedded in the copied record — paste it straight into events.json or the Supabase row.'
    : '';

  navigator.clipboard?.writeText(full).then(
    () => toast(photoData ? 'Copied — photo included' : 'Copied to clipboard'),
    () => toast('Generated below'));
});
