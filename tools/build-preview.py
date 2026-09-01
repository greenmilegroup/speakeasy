#!/usr/bin/env python3
"""Bundle the whole site into one self-contained HTML file.

Used to publish a shareable preview. Every page becomes a route in a single
document, and every asset is inlined, because the preview host allows no
external requests at all.

Not part of the site — nothing here is served to visitors. Safe to delete.

    python3 tools/build-preview.py            # mp4 video only (default)
    SE_VIDEO=mp4,webm python3 tools/build-preview.py

Notable constraints this works around, all learned the hard way:
  * Images are emitted once into a JS array and referenced by index. Inlining
    them at each use site duplicated ~3.4 MB of base64 (the logo alone appears
    four times).
  * Videos are NOT data: URIs — Chromium stalls indefinitely on multi-megabyte
    data: URIs in media elements. They are base64 payloads turned into Blob
    URLs at runtime instead.
  * The Google Maps embed on Visit is stripped; external frames are blocked.
"""
import base64, json, mimetypes, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "speakeasy-preview.html")

PAGES = [
    ("home",    "index.html"),
    ("drinks",  "drinks.html"),
    ("menu",    "menu.html"),
    ("events",  "events.html"),
    ("private", "private.html"),
    ("visit",   "visit.html"),
    ("careers", "careers.html"),
]
HREF2ROUTE = {f: r for r, f in PAGES}

VIDEO_FORMATS = os.environ.get("SE_VIDEO", "mp4").split(",")
MIME = {"mp4": "video/mp4", "webm": "video/webm"}

IMG_PATHS, CSS_IMG_VARS, VIDEOS, _cache = [], set(), {}, {}


def img_ref(path):
    if path not in IMG_PATHS:
        IMG_PATHS.append(path)
    return IMG_PATHS.index(path)


def data_uri(path):
    if path not in _cache:
        full = os.path.join(ROOT, path)
        mime = "font/woff2" if path.endswith(".woff2") else (
            mimetypes.guess_type(full)[0] or "application/octet-stream")
        with open(full, "rb") as f:
            _cache[path] = f"data:{mime};base64," + base64.b64encode(f.read()).decode("ascii")
    return _cache[path]


def read(rel):
    with open(os.path.join(ROOT, rel), encoding="utf-8") as f:
        return f.read()


# ------------------------------------------------------------------ CSS
fonts_css = re.sub(r"url\('([^']+\.woff2)'\)",
                   lambda m: f"url('{data_uri('assets/fonts/' + m.group(1))}')",
                   read("assets/fonts/fonts.css"))


def css_url(m):
    url = m.group(1)
    if url.startswith("data:") or "../assets/" not in url:
        return m.group(0)
    i = img_ref("assets/" + url.split("../assets/")[1])
    CSS_IMG_VARS.add(i)
    return f"var(--img-{i})"


styles_css = re.sub(r'url\("([^"]+)"\)', css_url, read("css/styles.css"))
combined_css = fonts_css + "\n" + styles_css + """
/* --- single-file multi-page shell --- */
.route[hidden]{display:none!important}
"""

# ------------------------------------------------------------------ routes
MAIN_RE = re.compile(r'<main id="main">(.*)</main>', re.S)


def inline_media(html):
    def video(m):
        block = m.group(0)
        srcs = re.findall(r'<source src="assets/video/([^"/]+\.(?:mp4|webm))"', block)
        keep = [k for k in srcs if k.rsplit(".", 1)[1] in VIDEO_FORMATS
                and os.path.exists(os.path.join(ROOT, "assets/video", k))]
        if not keep:
            return block
        open_tag = re.match(r"<video[^>]*>", block).group(0).rstrip(">")
        name = keep[0].rsplit(".", 1)[0]
        # The hero shows the same clip twice (sharp + blurred backdrop). Embed the
        # payload once and let the duplicate copy the source at runtime.
        if name in VIDEOS:
            return open_tag + f' data-copy-src="{name}">' + "</video>"
        VIDEOS[name] = keep
        sources = "".join(
            f'<source src="{data_uri("assets/video/" + k)}" type="{MIME[k.rsplit(".", 1)[1]]}"/>'
            for k in keep)
        return open_tag + f' data-vid-name="{name}">' + sources + "</video>"

    html = re.sub(r"<video[^>]*>.*?</video>", video, html, flags=re.S)
    return re.sub(r'(src|poster)="(assets/[^"]+)"',
                  lambda m: f'data-{"poster" if m.group(1) == "poster" else "img"}="{img_ref(m.group(2))}"',
                  html)


routes = []
for route, fname in PAGES:
    body = MAIN_RE.search(read(fname)).group(1)
    if route == "visit":
        # external frames are blocked here; promote the fallback the site ships
        body = re.sub(r'<iframe title="[^"]*— map".*?</iframe>\s*', "", body, flags=re.S)
        body = body.replace('<div class="tour__fallback" aria-hidden="true">', '<div class="tour__fallback">')
    body = inline_media(body)
    hidden = "" if route == "home" else " hidden"
    routes.append(f'<div class="route" data-route="{route}"{hidden}>{body}</div>')

# ------------------------------------------------------------------ JS
site_js = re.sub(r"^export\s+", "", read("js/site.js"), flags=re.M)
site_js = re.sub(r"^nav\(\); reveal\(\);.*?$", "", site_js, flags=re.M)
site_js = site_js.replace('src="assets/logo.png"',
                          f'src="${{IMG[{img_ref("assets/logo.png")}]}}"')
# history.replaceState throws inside a sandboxed frame
site_js = site_js.replace("history.replaceState(null, '', '#' + t.id.replace('tab-', ''));",
                          "SEhash('#' + t.id.replace('tab-', ''));")

# --- events: the What's On board is data-driven and fetches its seed JSON.
# There is no network inside a single-file preview, so the data is inlined and
# the fetch short-circuited.
def strip_mod(t):
    t = re.sub(r"^import\s[^\n]*\n", "", t, flags=re.M)
    return re.sub(r"^export\s+(?=const|function|async|let|var)", "", t, flags=re.M)

config_js = strip_mod(read("js/config.js"))
# site.js and config.js both declare TEL; concatenating them into one scope
# would be a duplicate declaration, so drop the later copy (same value).
for name in re.findall(r"^const (\w+)", site_js, flags=re.M):
    config_js = re.sub(rf"^const {name}\s*=.*$", "", config_js, flags=re.M)
events_data_js = strip_mod(read("js/events-data.js"))
events_data_js = events_data_js.replace(
    "  const res = await fetch('assets/data/events.json', { cache: 'no-store' });\n"
    "  if (!res.ok) throw new Error('events.json ' + res.status);\n"
    "  return res.json();",
    "  return EVENTS_SEED;")
seed = json.loads(read("assets/data/events.json"))
for row in seed:
    u = row.get("image_url")
    if u and u.startswith("assets/"):
        row["image_url"] = f"@@IMG{img_ref(u)}@@"
seed_js = re.sub(r'"@@IMG(\d+)@@"', r"IMG[\1]", json.dumps(seed, ensure_ascii=False))
events_data_js = "const EVENTS_SEED = " + seed_js + ";\n" + events_data_js

events_js = strip_mod(read("js/events.js"))
# run on demand rather than at import time
# `feature` is referenced throughout the module, so keep the binding and only
# defer the call until the events route is first shown.
events_js = events_js.replace("const feature = $('#whatsonFeature');\nif (feature) start();",
                              "let feature = null;\n"
                              "function initEvents(){ feature = $('#whatsonFeature'); if (feature) start(); }")

intro_js = re.sub(r"^import\s*\{[^}]*\}\s*from\s*'\./site\.js';\n", "", read("js/intro.js"), flags=re.M)
intro_js = intro_js.replace("sessionStorage.getItem('se_seen') === '1'", "SEstore.get('se_seen') === '1'")
intro_js = intro_js.replace("sessionStorage.setItem('se_seen', '1');", "SEstore.set('se_seen', '1');")

assets_js = "const SE_ASSETS = {" + ", ".join(
    f"{json.dumps(p)}: IMG[{img_ref(p)}]" for p in [
        "assets/img/event-15-first-dates.jpg", "assets/img/interior.jpg", "assets/img/blue-lagoon.jpg",
        "assets/img/stamps/comedy.png", "assets/img/stamps/concerts.png", "assets/img/stamps/private-events.png",
    ]) + "};"

prelude = """
/* ---- sandbox-safe shims ---- */
const SEstore = (() => { const mem = {}; return {
  get: k => { try { return sessionStorage.getItem(k); } catch (e) { return mem[k] ?? null; } },
  set: (k, v) => { try { sessionStorage.setItem(k, v); } catch (e) { mem[k] = v; } } }; })();
const SEhash = (h) => { try { history.replaceState(null, '', h); } catch (e) {} };
"""

router_js = """
/* ---------- video: the hero's blurred backdrop reuses the sharp copy ---------- */
function shareVideoSources(root = document) {
  $$('video[data-copy-src]', root).forEach(v => {
    if (v.dataset.copied) return;
    const src = document.querySelector(`video[data-vid-name="${v.dataset.copySrc}"] source`);
    if (!src) return;
    v.dataset.copied = '1';
    const s = document.createElement('source');
    s.src = src.src; s.type = src.type;
    v.appendChild(s); v.load();
  });
}

/* ---------- images: rehydrate from the shared array ---------- */
function hydrateImages(root = document) {
  $$('[data-img]', root).forEach(e => { e.src = IMG[+e.dataset.img]; e.removeAttribute('data-img'); });
  $$('[data-poster]', root).forEach(e => { e.poster = IMG[+e.dataset.poster]; e.removeAttribute('data-poster'); });
}

/* ---------- client-side router ---------- */
const ROUTES = Object.fromEntries(%%HREF2ROUTE%%);
const started = new Set();

function showRoute(page, hash) {
  const all = $$('.route');
  if (!all.some(r => r.dataset.route === page)) page = 'home';
  all.forEach(r => (r.hidden = r.dataset.route !== page));
  document.body.dataset.page = page;
  $$('#nav .nav__links a[data-p]').forEach(a => a.classList.toggle('active', a.dataset.p === page));

  const view = all.find(r => r.dataset.route === page);
  if (!started.has(page)) {
    started.add(page);
    if (page === 'menu')   tabs();
    if (page === 'events') initEvents();
  }
  reveal(); tilt();

  const target = hash && document.querySelector(hash);
  if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  else window.scrollTo(0, 0);
}

document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href]');
  if (!a || a.target === '_blank') return;
  const href = a.getAttribute('href');
  if (!href) return;
  const [file, hash] = href.split('#');
  if (!(file in ROUTES)) return;
  e.preventDefault();
  document.body.classList.remove('menu-open');
  const mob = $('#mobileMenu');
  if (mob) { mob.classList.remove('open'); mob.hidden = true; }
  showRoute(ROUTES[file], hash ? '#' + hash : '');
});

/* ---------- boot ---------- */
CSS_IMG_VARS.forEach(i => document.documentElement.style.setProperty('--img-' + i, `url("${IMG[i]}")`));
hydrateImages();
shareVideoSources();
injectAmbient();
injectChrome();
nav(); misc(); forms(); hours(); packages();
showRoute('home');
"""
router_js = router_js.replace("%%HREF2ROUTE%%", json.dumps(sorted(HREF2ROUTE.items())))
router_js = router_js.replace("%%VIDEO_FORMATS%%", json.dumps([[e, MIME[e]] for e in VIDEO_FORMATS]))

# ------------------------------------------------------------------ shell
index = read("index.html")
body = index[index.index("<body"):index.index("</body>")]
intro_block = inline_media(re.search(r'<div id="intro".*?</div>\s*(?=<header)', body, re.S).group(0))
lightbox = re.search(r'<div class="lightbox".*?</div>\s*(?=<script)', body, re.S).group(0)

# built last: every stage above registers into IMG_PATHS as it rewrites references
img_js = ("const IMG = " + json.dumps([data_uri(p) for p in IMG_PATHS]) + ";\n"
          "const CSS_IMG_VARS = " + json.dumps(sorted(CSS_IMG_VARS)) + ";")
combined_js = "\n".join([img_js, prelude, assets_js, site_js,
                         config_js, events_data_js, events_js, intro_js, router_js])

html = f"""<title>Speakeasy Ottawa</title>
<style>
{combined_css}
</style>
<a class="skip-link" href="#main">Skip to content</a>
{intro_block}
<header id="nav" class="nav" aria-label="Primary"></header>
<main id="main">
{chr(10).join(routes)}
</main>
<footer class="footer"></footer>
{lightbox}
<script>
{combined_js}
</script>
"""

with open(OUT, "w", encoding="utf-8") as f:
    f.write(html)

print("routes:", [r for r, _ in PAGES])
print("videos: inlined as data: URIs")
print(f"size:   {os.path.getsize(OUT)/1048576:.2f} MB  ->  {OUT}")
