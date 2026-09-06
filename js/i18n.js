/* =========================================================================
   SPEAKEASY: English / French

   Ottawa is bilingual, so the site carries a language toggle in the header.

   How it works: rather than tagging every element in every page with a key,
   the dictionary below is keyed on the exact English string. On switching to
   French each text node is looked up, and its English original is kept on the
   node so switching back is exact. Anything not in the dictionary simply
   stays in English, so a missing translation is a gap, never a broken page.

   To translate more of the site, add entries to FR. Keys must match the
   rendered text exactly, whitespace collapsed.

   The chrome (header, footer, mobile menu) and the whole home page are
   covered. The interior pages are not yet, and fall back to English.
   ========================================================================= */

const FR = {
  /* ---- header, footer, chrome ---- */
  'Skip to content': 'Aller au contenu',
  'Home': 'Accueil',
  'Drinks': 'Le Bar',
  'Menu': 'Menu',
  'On Stage': 'Sur Scène',
  'Host Your Event': 'Événements Privés',
  'Reservations': 'Réservations',
  'Book': 'Réserver',
  'Book a table': 'Réserver une table',
  'Reserve a table': 'Réserver une table',
  'Call 613-241-6221': 'Appelez le 613-241-6221',
  'or call 613-241-6221': 'ou appelez le 613-241-6221',
  'Explore the menu': 'Voir le menu',
  'Open menu': 'Ouvrir le menu',
  'Instagram': 'Instagram',
  'Facebook': 'Facebook',
  '55 York Street, Ottawa · K1N 9B7': '55, rue York, Ottawa · K1N 9B7',
  '© 2022 Speakeasy Ottawa · ByWard Market · Please enjoy responsibly.':
    '© 2022 Speakeasy Ottawa · Marché By · À consommer avec modération.',
  '“ This must be the place ”': '“ Ce doit être ici ”',
  'scroll': 'défiler',
  '🔇 Sound off': '🔇 Son coupé',
  '🔊 Sound on': '🔊 Son activé',

  /* ---- home: about ---- */
  'The House Rules': 'La Maison',
  'Pull Up a': 'Prenez',
  'Seat.': 'place.',
  "Tucked into Ottawa's ByWard Market, Speakeasy is an elegant restaurant and live-music venue where the lights stay low and the night runs long.":
    'Niché dans le Marché By, le Speakeasy est un restaurant élégant et une salle de spectacle où la lumière reste tamisée et la soirée se prolonge.',
  'Internationally inspired plates, craft cocktails poured with prohibition-era swagger, live performances every evening, and a candlelit room that feels like a secret worth keeping. Pull up a chair.':
    "Des assiettes d'inspiration internationale, des cocktails d'artisan servis avec l'allure de la prohibition, un spectacle chaque soir et une salle aux chandelles qui a tout d'un secret bien gardé. Prenez place.",
  'This must be the place.': 'Ce doit être ici.',
  'Nightly': 'Chaque soir',
  'Live music from 7 PM': 'Musique live dès 19 h',
  'Signature cocktails': 'Cocktails signature',
  'ByWard Market': 'Marché By',
  'Food': 'Cuisine',
  'Live Music': 'Musique Live',
  'Comedy': 'Humour',
  'Concerts': 'Concerts',
  'Cocktails': 'Cocktails',

  /* ---- home: opening hours ---- */
  'When we are open': 'Nos heures',
  'Checking hours…': 'Vérification des heures…',
  'Kitchen and bar, six nights a week. Live music from 7 PM.':
    'Cuisine et bar, six soirs par semaine. Musique live dès 19 h.',
  'Opening hours': "Heures d'ouverture",
  'Monday': 'Lundi', 'Tuesday': 'Mardi', 'Wednesday': 'Mercredi', 'Thursday': 'Jeudi',
  'Friday': 'Vendredi', 'Saturday': 'Samedi', 'Sunday': 'Dimanche',
  'Closed': 'Fermé',
  '4 PM to 10:30 PM': '16 h à 22 h 30',
  '4 PM to Midnight': '16 h à minuit',
  'Tue to Thu, 4:00 PM to 10:30 PM · Fri and Sat, 4:00 PM to Midnight · Sun and Mon, closed':
    'Mar au jeu, 16 h à 22 h 30 · Ven et sam, 16 h à minuit · Dim et lun, fermé',

  /* ---- home: the doorman ---- */
  'At the door': 'À la porte',
  'The man in the': "L'homme au",
  'yellow suit.': 'complet jaune.',
  "Every speakeasy needs a doorman. Ours doesn't ask for a password. He just grins, holds the door, and points you down the red carpet.":
    "Tout speakeasy a son portier. Le nôtre ne demande pas de mot de passe : il sourit, tient la porte et vous indique le tapis rouge.",
  "If you spot him on York Street, you've found the right place. Say hello, get a photo, and head inside. The candles are already lit.":
    "Si vous l'apercevez rue York, vous êtes au bon endroit. Saluez-le, prenez une photo et entrez. Les chandelles sont déjà allumées.",
  'Find the door': 'Trouver la porte',
  "See what's on tonight →": "Voir la soirée →",
  'Most nights, out front · 55 York': 'Presque tous les soirs, devant · 55 York',

  /* ---- home: reviews ---- */
  'Word of mouth': 'Bouche à oreille',
  'What People Say': 'Ce Que L’On Dit',
  'on Google': 'sur Google',
  'Read our Google reviews': 'Lire nos avis Google',
  'Leave a review': 'Laisser un avis',

  /* ---- home: instagram ---- */
  'Follow along': 'Suivez-nous',
  'Nightly sets, new pours and the odd secret. Come find us.':
    'Des sets chaque soir, de nouveaux services et quelques secrets. Venez nous trouver.',
  'Follow on Instagram': 'Suivre sur Instagram',
};

/* The live open/closed badge and the hours table are composed at runtime from
   a day and a time, so there is no fixed string to key on. These rules cover
   those shapes; a 12-hour clock also becomes the 24-hour one Quebec and
   francophone Ontario expect (16 h, 22 h 30). */
const DAY_ABBR_FR = { Sun: 'dim', Mon: 'lun', Tue: 'mar', Wed: 'mer', Thu: 'jeu', Fri: 'ven', Sat: 'sam' };

function timeFr(t) {
  const s = String(t).trim();
  if (/^midnight$/i.test(s)) return 'minuit';
  const m = s.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (!m) return s;
  let h = Number(m[1]) % 12;
  if (/pm/i.test(m[3])) h += 12;
  return m[2] ? `${h} h ${m[2]}` : `${h} h`;
}

const PATTERNS = [
  [/^Open now · until (.+)$/i, (m) => `Ouvert · jusqu'à ${timeFr(m[1])}`],
  [/^Closed · opens today (.+)$/i, (m) => `Fermé · ouvre aujourd'hui à ${timeFr(m[1])}`],
  [/^Closed · opens (\w{3}) (.+)$/i, (m) => `Fermé · ouvre ${DAY_ABBR_FR[m[1]] || m[1]} à ${timeFr(m[2])}`],
  [/^(\d{1,2}(?::\d{2})?\s*(?:AM|PM)) to (midnight|\d{1,2}(?::\d{2})?\s*(?:AM|PM))$/i,
    (m) => `${timeFr(m[1])} à ${timeFr(m[2])}`],
];

function fromPattern(key) {
  for (const [re, fn] of PATTERNS) {
    const m = key.match(re);
    if (m) return fn(m);
  }
  return undefined;
}

/* Attributes worth translating as well as text. */
const ATTRS = ['aria-label', 'placeholder', 'title'];

const norm = (s) => s.replace(/\s+/g, ' ').trim();

function translateNode(node, toFr) {
  const raw = node.textContent;
  const key = norm(raw);
  if (!key) return;
  if (toFr) {
    const fr = FR[key] ?? fromPattern(key);
    if (!fr) return;
    if (node.__en === undefined) node.__en = raw;
    node.textContent = raw.replace(key, fr);
  } else if (node.__en !== undefined) {
    node.textContent = node.__en;
    delete node.__en;
  }
}

function walk(root, toFr) {
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.parentNode && /^(SCRIPT|STYLE)$/.test(n.parentNode.nodeName)
      ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
  });
  const nodes = [];
  let n; while ((n = w.nextNode())) nodes.push(n);
  nodes.forEach((node) => translateNode(node, toFr));

  const els = root.nodeType === 1 ? [root, ...root.querySelectorAll('*')] : [...root.querySelectorAll('*')];
  els.forEach((el) => {
    if (el.nodeType !== 1) return;
    ATTRS.forEach((a) => {
      const cur = el.getAttribute(a);
      if (cur === null) return;
      const store = `__en_${a}`;
      if (toFr) {
        const fr = FR[norm(cur)];
        if (!fr) return;
        if (el[store] === undefined) el[store] = cur;
        el.setAttribute(a, fr);
      } else if (el[store] !== undefined) {
        el.setAttribute(a, el[store]);
        delete el[store];
      }
    });
  });
}

let current = 'en';

export function applyLang(lang, root = document.body) {
  walk(root, lang === 'fr');
}

function setLang(lang) {
  current = lang === 'fr' ? 'fr' : 'en';
  document.documentElement.lang = current === 'fr' ? 'fr-CA' : 'en';
  try { localStorage.setItem('speakeasy-lang', current); } catch { /* private mode */ }
  applyLang(current);
  document.querySelectorAll('.lang__opt').forEach((b) => {
    const on = b.dataset.lang === current;
    b.classList.toggle('is-on', on);
    b.setAttribute('aria-pressed', String(on));
  });
}

export function initLang() {
  let saved = 'en';
  try { saved = localStorage.getItem('speakeasy-lang') || 'en'; } catch { /* private mode */ }
  setLang(saved);

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.lang__opt');
    if (btn) setLang(btn.dataset.lang);
  });

  // The events board renders after load, so translate what arrives later too.
  new MutationObserver((records) => {
    if (current !== 'fr') return;
    records.forEach((r) => r.addedNodes.forEach((n) => {
      if (n.nodeType === 1) applyLang('fr', n);
      else if (n.nodeType === 3) translateNode(n, true);
    }));
  }).observe(document.body, { childList: true, subtree: true });
}
