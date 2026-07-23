/* =========================================================================
   SPEAKEASY TAPAS LOUNGE — interactions
   Vanilla ES module. Three.js embers load as progressive enhancement.
   ========================================================================= */
'use strict';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer  = window.matchMedia('(pointer: fine)').matches;
const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

/* ---------------------------------------------------------------- INTRO */
(function intro() {
  const el = $('#intro');
  if (!el) return;
  const body = document.body;
  const seen = sessionStorage.getItem('se_seen') === '1';
  let done = false;

  const unlock = () => body.classList.remove('locked');

  if (seen) { el.classList.add('is-gone'); unlock(); return; }
  body.classList.add('locked');

  const finish = () => {
    if (done) return; done = true;
    sessionStorage.setItem('se_seen', '1');
    if (reduceMotion) {
      el.style.transition = 'opacity .4s ease';
      el.style.opacity = '0';
      setTimeout(() => { el.classList.add('is-gone'); unlock(); }, 420);
      return;
    }
    el.classList.add('is-open');           // doors swing
    unlock();
    setTimeout(() => el.classList.add('is-gone'), 1650);
  };

  $('.intro__enter', el)?.addEventListener('click', finish);
  $('.intro__skip', el)?.addEventListener('click', finish);
  el.addEventListener('click', (e) => { if (e.target === el) finish(); });
  window.addEventListener('keydown', (e) => {
    if ((e.key === 'Escape' || e.key === 'Enter') && !done && !el.classList.contains('is-gone')) finish();
  });
  // auto-open after a beat
  setTimeout(finish, reduceMotion ? 1200 : 4200);
})();

/* ---------------------------------------------------------------- NAV */
(function nav() {
  const nav = $('#nav');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 40);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // mobile menu
  const toggle = $('.nav__toggle');
  const menu = $('#mobileMenu');
  const setMenu = (open) => {
    document.body.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    if (open) { menu.hidden = false; requestAnimationFrame(() => menu.classList.add('open')); }
    else { menu.classList.remove('open'); setTimeout(() => (menu.hidden = true), 350); }
  };
  toggle?.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
  $$('#mobileMenu a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  window.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  // active-section highlight
  const links = $$('.nav__links a');
  const map = new Map();
  links.forEach(a => { const id = a.getAttribute('href').slice(1); const s = document.getElementById(id); if (s) map.set(s, a); });
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        links.forEach(l => l.classList.remove('active'));
        map.get(en.target)?.classList.add('active');
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  map.forEach((_, s) => io.observe(s));
})();

/* ---------------------------------------------------------------- MENU TABS */
(function tabs() {
  const tabs = $$('.tab');
  const ink = $('.tabs__ink');
  if (!tabs.length) return;

  const moveInk = (tab) => { ink.style.width = tab.offsetWidth + 'px'; ink.style.transform = `translateX(${tab.offsetLeft}px)`; };
  const activate = (tab) => {
    tabs.forEach(t => { t.classList.remove('is-active'); t.setAttribute('aria-selected', 'false'); });
    tab.classList.add('is-active'); tab.setAttribute('aria-selected', 'true');
    $$('.panel').forEach(p => (p.hidden = p.id !== tab.getAttribute('aria-controls')));
    moveInk(tab);
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => activate(t));
    t.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const n = (i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
        tabs[n].focus(); activate(tabs[n]);
      }
    });
  });
  const active = tabs.find(t => t.classList.contains('is-active')) || tabs[0];
  requestAnimationFrame(() => moveInk(active));
  window.addEventListener('resize', () => moveInk($('.tab.is-active') || active));
})();

/* ---------------------------------------------------------------- GALLERY + LIGHTBOX */
(function gallery() {
  const grid = $('#galleryGrid');
  if (!grid) return;
  const cards = $$('.gcard', grid);

  // filters
  $$('.chip').forEach(chip => chip.addEventListener('click', () => {
    $$('.chip').forEach(c => { c.classList.remove('is-active'); c.setAttribute('aria-selected', 'false'); });
    chip.classList.add('is-active'); chip.setAttribute('aria-selected', 'true');
    const f = chip.dataset.filter;
    cards.forEach(c => c.classList.toggle('hide', !(f === 'all' || c.dataset.cat === f)));
  }));

  // lightbox
  const lb = $('#lightbox'), img = $('#lbImg'), cap = $('#lbCap');
  let list = [], idx = 0;
  const visible = () => cards.filter(c => !c.classList.contains('hide'));
  const show = (i) => {
    list = visible(); idx = (i + list.length) % list.length;
    const c = list[idx];
    img.src = c.dataset.full; img.alt = c.querySelector('img')?.alt || '';
    cap.innerHTML = c.dataset.caption || '';
    img.style.animation = 'none'; requestAnimationFrame(() => (img.style.animation = ''));
  };
  const open = (c) => {
    lb.hidden = false; requestAnimationFrame(() => lb.classList.add('show'));
    document.body.classList.add('locked');
    show(cards.indexOf(c));
  };
  const close = () => { lb.classList.remove('show'); document.body.classList.remove('locked'); setTimeout(() => (lb.hidden = true), 300); };

  cards.forEach(c => {
    c.addEventListener('click', () => open(c));
    c.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(c); } });
  });
  $('.lb__close', lb).addEventListener('click', close);
  $('.lb__next', lb).addEventListener('click', () => show(idx + 1));
  $('.lb__prev', lb).addEventListener('click', () => show(idx - 1));
  lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
  window.addEventListener('keydown', (e) => {
    if (lb.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight') show(idx + 1);
    if (e.key === 'ArrowLeft') show(idx - 1);
  });
  // swipe
  let sx = 0;
  lb.addEventListener('touchstart', e => (sx = e.touches[0].clientX), { passive: true });
  lb.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
  }, { passive: true });
})();

/* ---------------------------------------------------------------- HOURS / OPEN NOW */
(function hours() {
  // Single source of truth — edit here to change hours. Minutes from midnight; 1440 = midnight.
  const SCHEDULE = {
    0: null,              // Sunday — closed
    1: null,              // Monday — closed
    2: { open: 16 * 60, close: 22 * 60 + 30 }, // Tue 4:00 PM – 10:30 PM
    3: { open: 16 * 60, close: 22 * 60 + 30 }, // Wed
    4: { open: 16 * 60, close: 22 * 60 + 30 }, // Thu
    5: { open: 16 * 60, close: 24 * 60 },      // Fri 4:00 PM – Midnight
    6: { open: 16 * 60, close: 24 * 60 },      // Sat 4:00 PM – Midnight
  };
  const NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const fmt = (m) => {
    m = m % 1440;
    let h = Math.floor(m / 60), mm = m % 60;
    const ap = h >= 12 ? 'PM' : 'AM'; let hh = h % 12; if (hh === 0) hh = 12;
    return mm === 0 ? `${hh} ${ap}` : `${hh}:${String(mm).padStart(2, '0')} ${ap}`;
  };
  const label = (d) => {
    const s = SCHEDULE[d];
    if (!s) return 'Closed';
    return `${fmt(s.open)} – ${s.close >= 1440 ? 'Midnight' : fmt(s.close)}`;
  };

  // "now" in America/Toronto
  const now = new Date();
  const tor = new Date(now.toLocaleString('en-US', { timeZone: 'America/Toronto' }));
  const day = tor.getDay();
  const mins = tor.getHours() * 60 + tor.getMinutes();

  const todaySched = SCHEDULE[day];
  const isOpen = !!todaySched && mins >= todaySched.open && mins < todaySched.close;

  // status badge
  const status = $('#openStatus');
  if (status) {
    const dot = $('.status__text', status);
    if (isOpen) {
      status.classList.add('open');
      dot.textContent = `Open now · until ${todaySched.close >= 1440 ? 'midnight' : fmt(todaySched.close)}`;
    } else {
      status.classList.add('closed');
      // find next opening
      let nd = day, add = 0, nextOpen = null;
      if (todaySched && mins < todaySched.open) { nextOpen = { d: day, m: todaySched.open }; }
      else {
        for (let i = 1; i <= 7; i++) { const dd = (day + i) % 7; if (SCHEDULE[dd]) { nextOpen = { d: dd, m: SCHEDULE[dd].open }; break; } }
      }
      dot.textContent = nextOpen
        ? `Closed · opens ${nextOpen.d === day ? 'today' : NAMES[nextOpen.d].slice(0, 3)} ${fmt(nextOpen.m)}`
        : 'Closed';
    }
  }

  // hours table (grouped ordering Tue→Mon for a service-week feel)
  const order = [2, 3, 4, 5, 6, 0, 1];
  const tbody = $('#hoursTable tbody');
  if (tbody) {
    tbody.innerHTML = order.map(d => {
      const cls = [d === day ? 'today' : '', !SCHEDULE[d] ? 'closed' : ''].filter(Boolean).join(' ');
      return `<tr class="${cls}"><td>${NAMES[d]}</td><td>${label(d)}</td></tr>`;
    }).join('');
  }
})();

/* ---------------------------------------------------------------- SCROLL REVEAL */
(function reveal() {
  const els = $$('[data-reveal]');
  if (!els.length || reduceMotion) { els.forEach(e => e.classList.add('is-visible')); return; }
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('is-visible'); obs.unobserve(en.target); } });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
  els.forEach(e => io.observe(e));
})();

/* ---------------------------------------------------------------- 3D TILT CARDS */
(function tilt() {
  if (!finePointer || reduceMotion) return;
  $$('[data-tilt]').forEach(card => {
    const max = 8;
    let raf = 0;
    const move = (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        card.style.setProperty('--ry', ((px - .5) * max * 2).toFixed(2) + 'deg');
        card.style.setProperty('--rx', ((.5 - py) * max * 2).toFixed(2) + 'deg');
        card.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
        card.style.setProperty('--my', (py * 100).toFixed(1) + '%');
      });
    };
    card.addEventListener('pointerenter', () => card.classList.add('tilting'));
    card.addEventListener('pointermove', move);
    card.addEventListener('pointerleave', () => {
      card.classList.remove('tilting');
      card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg');
    });
  });
})();

/* ---------------------------------------------------------------- HERO 3D COIN */
(function coin() {
  const coin = $('#coin');
  if (!coin) return;
  const inner = $('.coin__inner', coin);
  if (reduceMotion) { return; }             // stays static

  let angle = 0, vel = 0.15, dragging = false, lastX = 0, lastT = 0;
  const IDLE = 0.15, FRICTION = 0.94;

  const loop = () => {
    if (!dragging) { vel = IDLE + (vel - IDLE) * FRICTION; angle += vel; }
    inner.style.setProperty('--spin', (angle % 360) + 'deg');
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  coin.addEventListener('pointerdown', (e) => {
    dragging = true; lastX = e.clientX; lastT = performance.now();
    coin.setPointerCapture?.(e.pointerId);
  });
  coin.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX; const dt = Math.max(1, performance.now() - lastT);
    angle += dx * 0.6; vel = (dx * 0.6) / dt * 16;
    lastX = e.clientX; lastT = performance.now();
    inner.style.setProperty('--spin', (angle % 360) + 'deg');
  });
  const end = () => { dragging = false; };
  coin.addEventListener('pointerup', end);
  coin.addEventListener('pointercancel', end);
  coin.addEventListener('pointerleave', () => { if (dragging) dragging = false; });
})();

/* ---------------------------------------------------------------- HERO PARALLAX */
(function parallax() {
  if (!finePointer || reduceMotion) return;
  const hero = $('#hero');
  const layers = $$('[data-parallax]', hero);
  if (!hero || !layers.length) return;
  let raf = 0;
  hero.addEventListener('pointermove', (e) => {
    const r = hero.getBoundingClientRect();
    const dx = (e.clientX - r.left) / r.width - .5;
    const dy = (e.clientY - r.top) / r.height - .5;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      layers.forEach(l => {
        const f = parseFloat(l.dataset.parallax) || 0.2;
        l.style.transform = `translate3d(${(-dx * f * 40).toFixed(1)}px,${(-dy * f * 30).toFixed(1)}px,0)`;
      });
    });
  });
  hero.addEventListener('pointerleave', () => layers.forEach(l => (l.style.transform = '')));
})();

/* ---------------------------------------------------------------- PRIVATE PACKAGES */
(function packages() {
  $$('.pkg__more').forEach(btn => {
    const extra = btn.nextElementSibling;
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      extra.classList.toggle('open', !open);
    });
  });
})();

/* ---------------------------------------------------------------- TOAST */
const toast = (() => {
  const el = $('#toast');
  let t;
  return (msg) => {
    if (!el) return;
    el.textContent = msg; el.hidden = false;
    requestAnimationFrame(() => el.classList.add('show'));
    clearTimeout(t);
    t = setTimeout(() => { el.classList.remove('show'); setTimeout(() => (el.hidden = true), 400); }, 3200);
  };
})();

/* ---------------------------------------------------------------- FORMS */
(function forms() {
  const emailOK = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const contact = $('#contactForm');
  contact?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#cf-name'), email = $('#cf-email'), msg = $('#cf-msg'), note = $('#cfNote');
    let ok = true;
    [[name, name.value.trim().length > 1], [email, emailOK(email.value)], [msg, msg.value.trim().length > 3]]
      .forEach(([f, valid]) => { f.closest('.field').classList.toggle('invalid', !valid); if (!valid) ok = false; });
    if (!ok) { note.textContent = 'Please complete the highlighted fields.'; note.classList.add('err'); return; }
    note.classList.remove('err');
    note.textContent = 'Thank you — we’ll be in touch soon.';
    toast('Message sent · tell no one');
    // mailto fallback so the note is never lost even without a backend
    const body = encodeURIComponent(`${msg.value}\n\n— ${name.value} (${email.value})`);
    window.setTimeout(() => { window.location.href = `mailto:hello@speakeasytapas.ca?subject=Website%20enquiry&body=${body}`; }, 600);
    contact.reset();
  });

  const news = $('#newsForm');
  news?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = $('#nf-email'), note = $('#nfNote');
    const valid = emailOK(email.value);
    email.closest('.field').classList.toggle('invalid', !valid);
    if (!valid) { note.textContent = 'A valid email, please.'; note.classList.add('err'); return; }
    note.classList.remove('err');
    note.textContent = 'You’re on the list. Welcome to the inner circle.';
    toast('Subscribed · welcome in');
    news.reset();
  });
})();

/* ---------------------------------------------------------------- MISC: year + easter egg */
(function misc() {
  const y = $('#year'); if (y) y.textContent = new Date().getFullYear();
  let clicks = 0, timer;
  const secret = () => {
    clicks++; clearTimeout(timer);
    if (clicks >= 3) { clicks = 0; toast('Password accepted. Tell no one.'); }
    timer = setTimeout(() => (clicks = 0), 1200);
  };
  $('#footLogo')?.addEventListener('click', secret);
})();

/* ---------------------------------------------------------------- WEBGL EMBERS (progressive) */
(async function embers() {
  const canvas = $('#fx');
  if (!canvas || reduceMotion) return;
  // webgl support check
  const test = document.createElement('canvas');
  const gl = test.getContext('webgl2') || test.getContext('webgl');
  if (!gl) return;

  let THREE;
  try { THREE = await import('./vendor/three.module.js'); }
  catch (err) { console.warn('[embers] three.js unavailable, skipping', err); return; }

  try {
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'low-power' });
    renderer.setClearColor(0x000000, 0);
    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 1, 1000);
    cam.position.z = 340;

    const COUNT = Math.min(240, Math.floor(innerWidth / 6));
    const pos = new Float32Array(COUNT * 3);
    const spd = new Float32Array(COUNT);
    const sway = new Float32Array(COUNT);
    const R = 460;
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * R * 1.6;
      pos[i * 3 + 1] = (Math.random() - 0.5) * R;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 200 - 40;
      spd[i] = 0.15 + Math.random() * 0.5;
      sway[i] = Math.random() * Math.PI * 2;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

    // soft round golden sprite
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,228,150,1)');
    g.addColorStop(0.3, 'rgba(226,170,60,0.7)');
    g.addColorStop(1, 'rgba(226,170,60,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
    const tex = new THREE.CanvasTexture(c);

    const mat = new THREE.PointsMaterial({
      size: 7, map: tex, transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending, opacity: 0.9,
    });
    const pts = new THREE.Points(geo, mat);
    scene.add(pts);

    const resize = () => {
      renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
      renderer.setSize(innerWidth, innerHeight);
      cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix();
    };
    resize();
    window.addEventListener('resize', resize);

    let mx = 0, my = 0;
    window.addEventListener('pointermove', (e) => { mx = (e.clientX / innerWidth - .5); my = (e.clientY / innerHeight - .5); }, { passive: true });

    let running = true, t = 0;
    document.addEventListener('visibilitychange', () => { running = !document.hidden; if (running) tick(); });

    const p = geo.attributes.position.array;
    function tick() {
      if (!running) return;
      t += 0.016;
      for (let i = 0; i < COUNT; i++) {
        p[i * 3 + 1] += spd[i];                          // drift up
        p[i * 3]     += Math.sin(t + sway[i]) * 0.18;    // sway
        if (p[i * 3 + 1] > R / 2) { p[i * 3 + 1] = -R / 2; p[i * 3] = (Math.random() - 0.5) * R * 1.6; }
      }
      geo.attributes.position.needsUpdate = true;
      pts.rotation.y = mx * 0.25;
      cam.position.x += (mx * 60 - cam.position.x) * 0.03;
      cam.position.y += (-my * 40 - cam.position.y) * 0.03;
      cam.lookAt(0, 0, 0);
      renderer.render(scene, cam);
      requestAnimationFrame(tick);
    }
    tick();
  } catch (err) {
    console.warn('[embers] init failed', err);
    canvas.style.display = 'none';
  }
})();
