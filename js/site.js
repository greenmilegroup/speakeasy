/* =========================================================================
   SPEAKEASY — shared site chrome + behaviour (loaded on every page)
   Injects header/footer/ambient layers, then wires nav, reveals, tilt,
   embers, forms, hours badge, toast. Page-specific JS lives elsewhere.
   ========================================================================= */
'use strict';

export const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const finePointer  = matchMedia('(pointer: fine)').matches;
export const $  = (s, c = document) => c.querySelector(s);
export const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
const TEL = '+16132416221';

/* pages, in nav order */
const NAV = [
  ['home', 'index.html', 'Home'],
  ['drinks', 'drinks.html', 'Drinks'],
  ['menu', 'menu.html', 'Menu'],
  ['events', 'events.html', 'Events'],
  ['private', 'private.html', 'Private Events'],
  ['tour', 'tour.html', '3D Tour'],
  ['visit', 'visit.html', 'Visit'],
];

/* ---------- toast (exported) ---------- */
export const toast = (() => {
  let el, t;
  return (msg) => {
    el = el || $('#toast');
    if (!el) return;
    el.textContent = msg; el.hidden = false;
    requestAnimationFrame(() => el.classList.add('show'));
    clearTimeout(t);
    t = setTimeout(() => { el.classList.remove('show'); setTimeout(() => (el.hidden = true), 400); }, 3200);
  };
})();

/* ---------- inject ambient layers + toast ---------- */
function injectAmbient() {
  const frag = document.createElement('div');
  frag.innerHTML =
    '<canvas id="fx" aria-hidden="true"></canvas>' +
    '<div class="grain" aria-hidden="true"></div>' +
    '<div class="vignette" aria-hidden="true"></div>' +
    '<div class="toast" id="toast" role="status" aria-live="polite" hidden></div>';
  while (frag.firstChild) document.body.appendChild(frag.firstChild);
}

/* ---------- header + footer ---------- */
function injectChrome() {
  const page = document.body.dataset.page || 'home';
  const link = ([p, href, label, sub]) => {
    if (sub) {
      const active = ['menu', ...sub.map(s => s[0])].includes(page) ? ' active' : '';
      return `<span class="has-sub"><a class="${active}" data-p="${p}" href="${sub[0][1]}">${label}</a>`
        + `<span class="nav__sub">${sub.map(s => `<a data-p="${s[0]}" href="${s[1]}">${s[2]}</a>`).join('')}</span></span>`;
    }
    return `<a class="${page === p ? 'active' : ''}" data-p="${p}" href="${href}">${label}</a>`;
  };

  const header = $('#nav');
  if (header) header.innerHTML =
    `<div class="nav__inner">
      <a class="nav__brand" href="index.html" aria-label="Speakeasy Tapas Lounge — home">
        <img src="assets/logo.png" alt="" width="44" height="44" class="nav__logo" />
        <span class="nav__name">Speakeasy<small>Tapas&nbsp;Lounge</small></span>
      </a>
      <nav class="nav__links" aria-label="Sections">${NAV.map(link).join('')}</nav>
      <a class="nav__call" href="tel:${TEL}">
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M6.6 10.8a15.5 15.5 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.24 11 11 0 0 0 3.5.56 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.2a1 1 0 0 1 1 1 11 11 0 0 0 .56 3.5 1 1 0 0 1-.24 1z"/></svg>
        <span>613-241-6221</span></a>
      <button class="nav__toggle" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="mobileMenu"><span></span><span></span><span></span></button>
    </div>`;

  // mobile overlay
  const mob = document.createElement('div');
  mob.id = 'mobileMenu'; mob.className = 'mobile'; mob.hidden = true;
  const flat = NAV.flatMap(n => n[3] ? n[3] : [n]).filter(n => n[1]);
  mob.innerHTML = `<nav class="mobile__nav" aria-label="Mobile">${flat.map(n => `<a href="${n[1]}">${n[2]}</a>`).join('')}<a class="mobile__call" href="tel:${TEL}">Call 613-241-6221</a></nav>`;
  document.body.appendChild(mob);

  // sticky mobile reserve bar
  const mr = document.createElement('div');
  mr.className = 'mobile-reserve';
  mr.innerHTML = `<a href="tel:${TEL}"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6.6 10.8a15.5 15.5 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.24 11 11 0 0 0 3.5.56 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.2a1 1 0 0 1 1 1 11 11 0 0 0 .56 3.5 1 1 0 0 1-.24 1z"/></svg>Reserve · 613-241-6221</a>`;
  document.body.appendChild(mr);

  const footer = $('.footer');
  if (footer) footer.innerHTML =
    `<div class="footer__inner">
      <div class="footer__brand">
        <img src="assets/logo.png" alt="" width="72" height="72" id="footLogo" />
        <p class="footer__name">Speakeasy <span>Tapas Lounge</span></p>
        <p class="footer__tag">“ This must be the place ”</p>
      </div>
      <nav class="footer__links" aria-label="Footer">${flat.map(n => `<a href="${n[1]}">${n[2]}</a>`).join('')}</nav>
      <div class="footer__meta">
        <p>55 York Street, Ottawa · K1N 9B7</p>
        <p><a href="tel:${TEL}">613-241-6221</a></p>
        <p class="footer__social"><a href="#" aria-label="Instagram">Instagram</a> · <a href="#" aria-label="Facebook">Facebook</a></p>
      </div>
    </div>
    <p class="footer__fine">© <span id="year"></span> Speakeasy Tapas Lounge · ByWard Market, Ottawa · Please enjoy responsibly.</p>`;
}

/* ---------- nav behaviour ---------- */
function nav() {
  const bar = $('#nav');
  const onScroll = () => bar && bar.classList.toggle('scrolled', scrollY > 40);
  onScroll(); addEventListener('scroll', onScroll, { passive: true });

  const toggle = $('.nav__toggle'), menu = $('#mobileMenu');
  const setMenu = (open) => {
    document.body.classList.toggle('menu-open', open);
    toggle?.setAttribute('aria-expanded', String(open));
    if (open) { menu.hidden = false; requestAnimationFrame(() => menu.classList.add('open')); }
    else { menu.classList.remove('open'); setTimeout(() => (menu.hidden = true), 350); }
  };
  toggle?.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
  $$('#mobileMenu a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
}

/* ---------- scroll reveal ---------- */
function reveal() {
  const els = $$('[data-reveal]');
  if (!els.length) return;
  if (reduceMotion) { els.forEach(e => e.classList.add('is-visible')); return; }
  const io = new IntersectionObserver((ents, obs) => ents.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add('is-visible'); obs.unobserve(en.target); }
  }), { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
  els.forEach(e => io.observe(e));
}

/* ---------- 3D tilt ---------- */
export function tilt(scope = document) {
  if (!finePointer || reduceMotion) return;
  $$('[data-tilt]', scope).forEach(card => {
    if (card.dataset.tiltReady) return; card.dataset.tiltReady = '1';
    const max = 8; let raf = 0;
    card.addEventListener('pointerenter', () => card.classList.add('tilting'));
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        card.style.setProperty('--ry', ((px - .5) * max * 2).toFixed(2) + 'deg');
        card.style.setProperty('--rx', ((.5 - py) * max * 2).toFixed(2) + 'deg');
        card.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
        card.style.setProperty('--my', (py * 100).toFixed(1) + '%');
      });
    });
    card.addEventListener('pointerleave', () => {
      card.classList.remove('tilting');
      card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg');
    });
  });
}

/* ---------- forms ---------- */
function forms() {
  const emailOK = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const contact = $('#contactForm');
  contact?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#cf-name'), email = $('#cf-email'), msg = $('#cf-msg'), note = $('#cfNote');
    let ok = true;
    [[name, name.value.trim().length > 1], [email, emailOK(email.value)], [msg, msg.value.trim().length > 3]]
      .forEach(([f, v]) => { f.closest('.field').classList.toggle('invalid', !v); if (!v) ok = false; });
    if (!ok) { note.textContent = 'Please complete the highlighted fields.'; note.classList.add('err'); return; }
    note.classList.remove('err'); note.textContent = 'Thank you — we’ll be in touch soon.';
    toast('Message sent · tell no one');
    const body = encodeURIComponent(`${msg.value}\n\n— ${name.value} (${email.value})`);
    setTimeout(() => { location.href = `mailto:hello@speakeasytapas.ca?subject=Website%20enquiry&body=${body}`; }, 600);
    contact.reset();
  });
  const news = $('#newsForm');
  news?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = $('#nf-email'), note = $('#nfNote'), v = emailOK(email.value);
    email.closest('.field').classList.toggle('invalid', !v);
    if (!v) { note.textContent = 'A valid email, please.'; note.classList.add('err'); return; }
    note.classList.remove('err'); note.textContent = 'You’re on the list. Welcome to the inner circle.';
    toast('Subscribed · welcome in'); news.reset();
  });
}

/* ---------- hours / open-now (visit page) ---------- */
export const SCHEDULE = {
  0: null, 1: null,
  2: { open: 16 * 60, close: 22 * 60 + 30 }, 3: { open: 16 * 60, close: 22 * 60 + 30 }, 4: { open: 16 * 60, close: 22 * 60 + 30 },
  5: { open: 16 * 60, close: 24 * 60 }, 6: { open: 16 * 60, close: 24 * 60 },
};
function hours() {
  const status = $('#openStatus'), tbody = $('#hoursTable tbody');
  if (!status && !tbody) return;
  const NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const fmt = (m) => { m %= 1440; let h = (m / 60) | 0, mm = m % 60, ap = h >= 12 ? 'PM' : 'AM', hh = h % 12 || 12; return mm ? `${hh}:${String(mm).padStart(2, '0')} ${ap}` : `${hh} ${ap}`; };
  const label = (d) => { const s = SCHEDULE[d]; return s ? `${fmt(s.open)} – ${s.close >= 1440 ? 'Midnight' : fmt(s.close)}` : 'Closed'; };
  const tor = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Toronto' }));
  const day = tor.getDay(), mins = tor.getHours() * 60 + tor.getMinutes(), s = SCHEDULE[day];
  const isOpen = !!s && mins >= s.open && mins < s.close;
  if (status) {
    const txt = $('.status__text', status);
    if (isOpen) { status.classList.add('open'); txt.textContent = `Open now · until ${s.close >= 1440 ? 'midnight' : fmt(s.close)}`; }
    else {
      status.classList.add('closed');
      let next = (s && mins < s.open) ? { d: day, m: s.open } : null;
      if (!next) for (let i = 1; i <= 7; i++) { const dd = (day + i) % 7; if (SCHEDULE[dd]) { next = { d: dd, m: SCHEDULE[dd].open }; break; } }
      txt.textContent = next ? `Closed · opens ${next.d === day ? 'today' : NAMES[next.d].slice(0, 3)} ${fmt(next.m)}` : 'Closed';
    }
  }
  if (tbody) tbody.innerHTML = [2, 3, 4, 5, 6, 0, 1].map(d =>
    `<tr class="${[d === day ? 'today' : '', SCHEDULE[d] ? '' : 'closed'].filter(Boolean).join(' ')}"><td>${NAMES[d]}</td><td>${label(d)}</td></tr>`).join('');
}

/* ---------- misc: year + easter egg ---------- */
function misc() {
  const y = $('#year'); if (y) y.textContent = new Date().getFullYear();
  let clicks = 0, t;
  $('#footLogo')?.addEventListener('click', () => { if (++clicks >= 3) { clicks = 0; toast('Password accepted. Tell no one.'); } clearTimeout(t); t = setTimeout(() => (clicks = 0), 1200); });
}

/* ---------- ambient WebGL embers (progressive) ---------- */
async function embers() {
  const canvas = $('#fx');
  if (!canvas || reduceMotion) return;
  const test = document.createElement('canvas');
  if (!(test.getContext('webgl2') || test.getContext('webgl'))) return;
  let THREE;
  try { THREE = await import('./vendor/three.module.js'); } catch { return; }
  try {
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'low-power' });
    renderer.setClearColor(0x000000, 0);
    const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 1, 1000); cam.position.z = 340;
    const COUNT = Math.min(240, Math.floor(innerWidth / 6)), pos = new Float32Array(COUNT * 3), spd = new Float32Array(COUNT), sway = new Float32Array(COUNT), R = 460;
    for (let i = 0; i < COUNT; i++) { pos[i*3]=(Math.random()-.5)*R*1.6; pos[i*3+1]=(Math.random()-.5)*R; pos[i*3+2]=(Math.random()-.5)*200-40; spd[i]=.15+Math.random()*.5; sway[i]=Math.random()*Math.PI*2; }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const c = document.createElement('canvas'); c.width = c.height = 64; const cx = c.getContext('2d');
    const g = cx.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,228,150,1)'); g.addColorStop(.3, 'rgba(226,170,60,.7)'); g.addColorStop(1, 'rgba(226,170,60,0)');
    cx.fillStyle = g; cx.fillRect(0, 0, 64, 64);
    const mat = new THREE.PointsMaterial({ size: 7, map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: .9 });
    const pts = new THREE.Points(geo, mat); scene.add(pts);
    const resize = () => { renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75)); renderer.setSize(innerWidth, innerHeight); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); };
    resize(); addEventListener('resize', resize);
    let mx = 0, my = 0; addEventListener('pointermove', e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; }, { passive: true });
    let running = true, t = 0; const p = geo.attributes.position.array;
    document.addEventListener('visibilitychange', () => { running = !document.hidden; if (running) tick(); });
    function tick() {
      if (!running) return; t += .016;
      for (let i = 0; i < COUNT; i++) { p[i*3+1]+=spd[i]; p[i*3]+=Math.sin(t+sway[i])*.18; if (p[i*3+1]>R/2){p[i*3+1]=-R/2;p[i*3]=(Math.random()-.5)*R*1.6;} }
      geo.attributes.position.needsUpdate = true; pts.rotation.y = mx * .25;
      cam.position.x += (mx*60 - cam.position.x)*.03; cam.position.y += (-my*40 - cam.position.y)*.03; cam.lookAt(0,0,0);
      renderer.render(scene, cam); requestAnimationFrame(tick);
    }
    tick();
  } catch { canvas.style.display = 'none'; }
}

/* ---------- 3D tour fullscreen ---------- */
function tourFullscreen() {
  const btn = $('#tourFullscreen'); if (!btn) return;
  btn.addEventListener('click', () => {
    const el = $('.tour-embed'); if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen?.();
    else (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el);
  });
}

/* ---------- menu tabs (Shareables / Dinner / Desserts) ---------- */
function tabs() {
  const bar = $('.tabs'); if (!bar) return;
  const tabEls = $$('.tab', bar), ink = $('.tabs__ink', bar);
  const moveInk = (t) => { ink.style.width = t.offsetWidth + 'px'; ink.style.transform = `translateX(${t.offsetLeft}px)`; };
  const activate = (t, focus) => {
    tabEls.forEach(x => { x.classList.remove('is-active'); x.setAttribute('aria-selected', 'false'); });
    t.classList.add('is-active'); t.setAttribute('aria-selected', 'true');
    $$('.panel').forEach(pn => (pn.hidden = pn.id !== t.getAttribute('aria-controls')));
    moveInk(t); if (focus) t.focus();
    history.replaceState(null, '', '#' + t.id.replace('tab-', ''));
  };
  tabEls.forEach((t, i) => {
    t.addEventListener('click', () => activate(t));
    t.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); activate(tabEls[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabEls.length) % tabEls.length], true); }
    });
  });
  const byHash = () => tabEls.find(t => '#' + t.id.replace('tab-', '') === location.hash);
  const start = byHash() || tabEls.find(t => t.classList.contains('is-active')) || tabEls[0];
  requestAnimationFrame(() => activate(start));
  addEventListener('hashchange', () => { const t = byHash(); if (t) activate(t, true); });
  addEventListener('resize', () => { const a = $('.tab.is-active', bar); if (a) moveInk(a); });
}

/* ---------- boot ---------- */
injectAmbient();
injectChrome();
nav(); reveal(); tilt(); tabs(); forms(); hours(); misc(); tourFullscreen(); embers();
