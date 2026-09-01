/* =========================================================================
   SPEAKEASY — home page only: "shhh" door intro, hero coin, hero parallax
   ========================================================================= */
import { $, $$, reduceMotion, finePointer } from './site.js';

/* ---------- INTRO (slower) ---------- */
const heroVideos = $$('.hero__video');
const heroMain = $('#heroVideo');
const heroBg = $('#heroVideoBg');
const heroSound = $('#heroSound');

const paintSound = () => {
  if (!heroSound || !heroMain) return;
  const on = !heroMain.muted;
  heroSound.textContent = on ? '🔊 Sound on' : '🔇 Sound off';
  heroSound.setAttribute('aria-pressed', String(on));
  heroSound.setAttribute('aria-label', on ? 'Turn sound off' : 'Turn sound on');
  heroSound.classList.toggle('is-on', on);
};

/* Autoplay with sound is only permitted off a user gesture. Entering through
   the doors is one, so that path gets audio; the 7s auto-open and returning
   visitors do not, and fall back to muted with the toggle offered. */
const playHero = (withSound = false) => {
  if (reduceMotion) return;
  heroVideos.forEach(v => {
    const show = () => v.classList.add('is-playing');
    v.addEventListener('playing', show, { once: true });
    v.addEventListener('loadeddata', show, { once: true });
    v.currentTime = 0;
  });
  if (heroBg) { heroBg.muted = true; heroBg.play().catch(() => {}); }  // backdrop stays silent
  if (!heroMain) return;
  heroMain.muted = !withSound;
  heroMain.play().then(paintSound).catch(() => {
    heroMain.muted = true;                     // blocked without a gesture
    heroMain.play().catch(() => {});
    paintSound();
  });
};

heroSound?.addEventListener('click', () => {
  if (!heroMain) return;
  heroMain.muted = !heroMain.muted;
  if (!heroMain.muted) heroMain.play().catch(() => {});
  paintSound();
});
heroMain?.addEventListener('volumechange', paintSound);
paintSound();

(function intro() {
  const el = $('#intro');
  if (!el) return;
  const body = document.body;
  const seen = sessionStorage.getItem('se_seen') === '1';
  let done = false;
  const unlock = () => body.classList.remove('locked');

  if (seen) { el.classList.add('is-gone'); unlock(); playHero(); return; }
  body.classList.add('locked');

  const finish = (withSound = false) => {
    if (done) return; done = true;
    sessionStorage.setItem('se_seen', '1');
    if (reduceMotion) {
      el.style.transition = 'opacity .5s ease'; el.style.opacity = '0';
      setTimeout(() => { el.classList.add('is-gone'); unlock(); playHero(withSound); }, 520); return;
    }
    el.classList.add('is-open'); unlock(); playHero(withSound);
    setTimeout(() => el.classList.add('is-gone'), 3000);   // matches slower door swing
  };

  $('.intro__enter', el)?.addEventListener('click', () => finish(true));
  $('.intro__skip', el)?.addEventListener('click', () => finish(true));
  el.addEventListener('click', (e) => { if (e.target === el) finish(true); });
  addEventListener('keydown', (e) => { if ((e.key === 'Escape' || e.key === 'Enter') && !done && !el.classList.contains('is-gone')) finish(true); });
  setTimeout(() => finish(false), reduceMotion ? 1600 : 7000);  // no gesture: stays muted          // slower auto-enter
})();

/* ---------- HERO 3D COIN ---------- */
(function coin() {
  const coin = $('#coin'); if (!coin || reduceMotion) return;
  const inner = $('.coin__inner', coin);
  let angle = 0, vel = 0.15, dragging = false, lastX = 0, lastT = 0;
  const IDLE = 0.15, FRICTION = 0.94;
  const loop = () => { if (!dragging) { vel = IDLE + (vel - IDLE) * FRICTION; angle += vel; } inner.style.setProperty('--spin', (angle % 360) + 'deg'); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
  coin.addEventListener('pointerdown', (e) => { dragging = true; lastX = e.clientX; lastT = performance.now(); coin.setPointerCapture?.(e.pointerId); });
  coin.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX, dt = Math.max(1, performance.now() - lastT);
    angle += dx * 0.6; vel = (dx * 0.6) / dt * 16; lastX = e.clientX; lastT = performance.now();
    inner.style.setProperty('--spin', (angle % 360) + 'deg');
  });
  const end = () => (dragging = false);
  coin.addEventListener('pointerup', end); coin.addEventListener('pointercancel', end);
  coin.addEventListener('pointerleave', () => { if (dragging) dragging = false; });
})();

/* ---------- HERO PARALLAX ---------- */
(function parallax() {
  if (!finePointer || reduceMotion) return;
  const hero = $('#hero'); if (!hero) return;
  const layers = $$('[data-parallax]', hero); if (!layers.length) return;
  let raf = 0;
  hero.addEventListener('pointermove', (e) => {
    const r = hero.getBoundingClientRect();
    const dx = (e.clientX - r.left) / r.width - .5, dy = (e.clientY - r.top) / r.height - .5;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => layers.forEach(l => {
      const f = parseFloat(l.dataset.parallax) || 0.2;
      l.style.transform = `translate3d(${(-dx * f * 40).toFixed(1)}px,${(-dy * f * 30).toFixed(1)}px,0)`;
    }));
  });
  hero.addEventListener('pointerleave', () => layers.forEach(l => (l.style.transform = '')));
})();

/* ---------- GALLERY + LIGHTBOX (home) ---------- */
(function gallery() {
  const grid = $('#galleryGrid'); if (!grid) return;
  const cards = $$('.gcard', grid);
  $$('.chip').forEach(chip => chip.addEventListener('click', () => {
    $$('.chip').forEach(c => { c.classList.remove('is-active'); c.setAttribute('aria-selected', 'false'); });
    chip.classList.add('is-active'); chip.setAttribute('aria-selected', 'true');
    const f = chip.dataset.filter;
    cards.forEach(c => c.classList.toggle('hide', !(f === 'all' || c.dataset.cat === f)));
  }));
  const lb = $('#lightbox'); if (!lb) return;
  const img = $('#lbImg'), cap = $('#lbCap'); let idx = 0, list = [];
  const visible = () => cards.filter(c => !c.classList.contains('hide'));
  const show = (i) => { list = visible(); idx = (i + list.length) % list.length; const c = list[idx]; img.src = c.dataset.full; img.alt = c.querySelector('img')?.alt || ''; cap.innerHTML = c.dataset.caption || ''; img.style.animation = 'none'; requestAnimationFrame(() => (img.style.animation = '')); };
  const open = (c) => { lb.hidden = false; requestAnimationFrame(() => lb.classList.add('show')); document.body.classList.add('locked'); show(cards.indexOf(c)); };
  const close = () => { lb.classList.remove('show'); document.body.classList.remove('locked'); setTimeout(() => (lb.hidden = true), 300); };
  cards.forEach(c => { c.addEventListener('click', () => open(c)); c.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(c); } }); });
  $('.lb__close', lb).addEventListener('click', close);
  $('.lb__next', lb).addEventListener('click', () => show(idx + 1));
  $('.lb__prev', lb).addEventListener('click', () => show(idx - 1));
  lb.addEventListener('click', e => { if (e.target === lb) close(); });
  addEventListener('keydown', e => { if (lb.hidden) return; if (e.key === 'Escape') close(); if (e.key === 'ArrowRight') show(idx + 1); if (e.key === 'ArrowLeft') show(idx - 1); });
  let sx = 0; lb.addEventListener('touchstart', e => (sx = e.touches[0].clientX), { passive: true });
  lb.addEventListener('touchend', e => { const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1)); }, { passive: true });
})();
