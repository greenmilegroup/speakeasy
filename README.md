# Speakeasy Tapas Lounge — website

A cinematic, multi-page site for **Speakeasy Tapas Lounge** · 55 York Street, ByWard Market, Ottawa · ☎ 613-241-6221.
The home page opens with the house crest whispering **“Shhh…”**, then art-deco doors swing open into the room.

> **“This must be the place.”**

Built as a **zero-build static site** — plain HTML, CSS and vanilla-JS ES modules. No framework, no bundler for the
main site. Host the folder anywhere (GitHub Pages, Netlify, any web server) or open `index.html` directly.

---

## Pages

| File | What it is |
|------|------------|
| `index.html` | Home — “shhh” door intro, hero, about, the six **stamps**, house signatures, 3D-tour teaser, gallery |
| `drinks.html` | The Bar — blue-cocktail hero, 13 signature cocktails, wine, local draught |
| `menu.html` | The Menu — one page, **toggle** between **Shareables · Dinner · Desserts** (also deep-links: `menu.html#dinner`) |
| `events.html` | Events — the **“What’s On” board**: next-up feature with countdown, dated list, filters, add-to-calendar. Data-driven ([see below](#events-are-data-driven)) |
| `private.html` | Private Events — the four hosting packages |
| `tour.html` | **3D Venue Tour** — the walkable 3D room. **Currently hidden** (see below) |
| `visit.html` | Visit & Reserve — live open/closed badge, hours, map, contact + newsletter |

The header, footer and ambient layers are injected on every page by `js/site.js`, so there’s one source of truth for nav.

```
css/styles.css      design system + every animation
js/site.js          shared: header/footer inject, nav, reveals, 3D tilt, menu tabs,
                    forms, live hours badge, toast
js/intro.js         home only: “shhh” doors, draggable crest coin, hero parallax, gallery/lightbox
js/events.js        events page: renders the What's On board (+ .ics export)
js/events-data.js   loads events from Supabase, or assets/data/events.json
js/config.js        Supabase URL + anon key go here (empty = local mode)
js/admin.js         admin.html: status, current line-up, event-record generator
admin.html          owner-only console for events (noindex)
assets/data/        events.json — the event list when Supabase isn't configured
mcp/                MCP server so Claude can add/edit events by chat (not served)
supabase/           schema.sql + setup notes for the events table
assets/
  logo.png, favicon*, apple-touch-icon.png, og-image.jpg
  fonts/            self-hosted web fonts + fonts.css
  img/              photos, posters, and img/stamps/ (the six wax-seal badges)
  video/            real venue footage (webm + mp4) used as page backgrounds
tour/               the built, self-contained 3D venue tour (served as-is)
tour-src/           source for the 3D tour (React + three.js) — only needed to rebuild it
.nojekyll           lets GitHub Pages serve the files unchanged
```

---

## The interactive bits

- **Intro** (home) — the crest whispers “Shhh…”, then doors swing open. Plays once per browser session, honours
  `prefers-reduced-motion`, and is skippable (Skip → / `Esc` / tap). *Timing lives in `css/styles.css` (`.door`
  transition + `.intro__shh` delays) and `js/intro.js` (auto-open delay).*
- **Stamps** — the six red seals on the home page link to the matching pages.
- **Draggable 3D coin** in the hero, **3D tilt** on cards, restrained scroll reveals. (No particle effects —
  atmosphere comes from typography, hairline rules and negative space.)
- **Menu tabs** — Shareables / Dinner / Desserts on one page.
- **What’s On board** (events) — the soonest event is featured with a live countdown (“in 4 days”); everything else
  falls into a dated list, each row carrying the event’s photo and a category accent (gold for music, red for comedy,
  cream for special nights). Filter by Live Music / Comedy / Special Nights, grab tickets on Eventbrite, or download an
  `.ics`. Weekly nights auto-roll to their next occurrence, and an on-brand empty state means the page is never blank.
- **3D tour** *(hidden for now)* — the walkable venue, embedded from `tour/`. The **setup switcher** re-loads the
  room as Intimate Dining / Cocktail Reception / Artistic Showcase via `?layout=`, and the **booking form** below
  composes a private-event request.
- **Video backgrounds** — real footage of the room (home), the stage (events) and the pass (menu). Each is muted,
  looping, `playsinline`, with a poster fallback and disabled under `prefers-reduced-motion`.
- **Live hours badge** (visit) — “Open now / Closed” computed in real time for Ottawa (America/Toronto).
- **Easter egg** — click the footer crest three times. 🤫

---

## Editing the content

Everything is hand-editable — no database.

- **Menus & cocktails** — edit the item blocks in `drinks.html` / `menu.html`. `<span class="price">18</span>` renders as
  **$18** automatically.
- **Events** — no longer hand-coded; see [Events are data-driven](#events-are-data-driven) below.
- **Business hours & the “Open now” badge** — edit the single `SCHEDULE` object in `js/site.js` (minutes from midnight;
  `24*60` = midnight; `null` = closed). The badge and the hours table both read from it.
- **Gallery** — currently an empty “photographs coming soon” state. To fill it, drop `<figure class="gcard">` blocks
  into `<div class="gallery__grid" id="galleryGrid">` in `index.html` (set `data-full`, `src`, `alt`, `data-caption`,
  `data-cat`); the placeholder hides itself automatically once the grid has children. You may also re-add the
  filter chips above it.
- **Photos** — drop a JPG into `assets/img/` and point the matching `<img src>` at it. Current photos: `interior.jpg`,
  `tuna-tartare.jpg`, `rigatoni-bolognese.jpg`, `storefront.jpg`, `blue-lagoon.jpg`, `event-15-first-dates.jpg`.
- **Fonts** — swap the files in `assets/fonts/` and the `@font-face` rules in `assets/fonts/fonts.css`. The site uses
  **Cinzel** (display) and **Cormorant Garamond** (body/italic accents). No script/cursive faces —
  the elegance comes from letter-spacing and scale.
- **Contact / newsletter forms** — they validate and confirm in the browser (contact also opens a pre-filled email).
  To capture submissions, wire each `<form>` in `js/site.js` to Formspree / Netlify Forms / Supabase and update the
  fallback address.

---

## Events are data-driven

The events page reads its line-up from data, not from code. There are **three ways to change what’s on**, and they
all write to the same place.

### Where the data lives

`js/events-data.js` loads events from **Supabase** when `js/config.js` has credentials, and falls back to
**`assets/data/events.json`** otherwise — including if Supabase is unreachable. So the site works today, before any
database exists, and keeps working if the database has a bad day.

```js
// js/config.js — the only file you paste credentials into
export const SUPABASE_URL      = '';   // e.g. 'https://abcdefgh.supabase.co'
export const SUPABASE_ANON_KEY = '';   // the public "anon" key — safe to ship
```

Leave them empty and you're in **local mode**: events come from `assets/data/events.json` and a change means a commit.
Fill them in and events go live the moment they're saved — no redeploy.

> **Never** put the Supabase **service-role** key in `js/config.js`, or in any file in this repo. It goes in the MCP
> server's environment only. `js/config.js` ships to every visitor's browser.

### 1. Ask Claude (the MCP server)

`mcp/` is a [Model Context Protocol](https://modelcontextprotocol.io) server. Once it's connected, you manage the
board by talking:

> *“Add a jazz night this Friday at 8, no cover.”*
> *“Hide the comedy night next week.”*
> *“What’s on the books right now?”*

It exposes `list_events`, `create_event`, `update_event`, `delete_event` and `set_published`, understands dates like
`"Friday 8pm"` or `"next Saturday 9pm"`, and writes to Supabase when configured or to `events.json` when not.
Setup — including the exact config block to paste — is in **`mcp/README.md`**.

### 2. Supabase table editor

Once the project exists, `events` is an ordinary table: add a row, set `published`, done. Run
**`supabase/schema.sql`** once to create it (with row-level security: the public can read only published rows;
writes need the service-role key). Full steps in **`supabase/README.md`**.

### 3. Edit the JSON by hand

Add an object to `assets/data/events.json`, commit, push:

```json
{
  "id": "jazz-night",
  "title": "Live Jazz Nights",
  "kicker": "On the stage",
  "blurb": "A rotating trio, brushes on the snare, and the lights down low.",
  "category": "music",              // music | comedy | special — drives the filter chips
  "recurrence": "weekly",           // "none" for a one-off
  "weekday": 5,                     // weekly only: 0=Sun … 6=Sat
  "time": "20:00",                  // weekly only, 24h
  "starts_at": null,                // one-off only: ISO timestamp
  "duration_min": 120,
  "price_text": "No cover",
  "image_url": "assets/img/ig-sax.jpg",
  "ticket_url": "",                 // blank falls back to the venue Eventbrite page
  "published": true
}
```

**`admin.html`** (linked from nowhere, and `noindex`) is a small console for this: it shows whether you're in
Supabase or local mode, lists what's currently on the board — each with its photo — and generates a correctly-shaped
record from a form, copied to your clipboard, ready for options 2 and 3.

**Adding a photo.** Drop a picture on the photo box (or click to pick one). It's resized to 1200px and turned into a
JPEG data URI right in the browser, so it travels inside the record — no upload, no file to commit, and it renders on
the board immediately. The output panel abbreviates the photo so the record stays readable; the clipboard gets the
full thing. If you'd rather point at a picture already in `assets/img/`, there's a field for that instead.

A ~1200px photo lands around 40–80 KB of base64. That's fine for a handful of events; if the line-up ever grows large,
move to Supabase Storage and put the resulting URL in `image_url` instead.

It is a **read-only convenience page**, not a protected admin area: it holds no keys, writes nothing, and shows only
the events that are already public. Treat the URL as unlisted rather than secret. Real write access lives behind the
service-role key, which only the MCP server has.

---

## The 3D tour is hidden

The page and its files are all still here — it's just unlinked. It was taken out of the nav rather than deleted, so
turning it back on is one line: uncomment the `tour` entry in the `NAV` array in `js/site.js`. Header and footer both
read from that array.

If you bring it back, also re-add `tour.html` to `sitemap.xml` and drop the `noindex` meta tag from `tour.html`.
`tour/` and `tour-src/` were left untouched, and `tour.html` still works if you open it directly.

---

## Rebuilding the 3D tour (only if you change `tour-src/`)

```bash
cd tour-src
npm install
npm run artifact          # → tour-src/dist/index.html (self-contained)
cp dist/index.html ../tour/index.html
```

The tour build is relocatable (`base: './'`) and inlines everything, so `tour/` works from any host or inside the iframe.
Deep links: `tour/index.html?layout=cocktail&autoenter`.

---

## Notes / assumptions to confirm

Menu/bar copy follows the supplied inventory, with a few details filled in — please review:

- **Cocktails** — the 10 named signatures plus three era-appropriate pours (French 75, Boulevardier, Clover Club) to reach
  the stated **13**. Ingredients and prices ($15–18) are placeholders.
- **Wine & beer** — representative selections with sample prices (local Ottawa draughts named).
- **Dish prices** — chosen inside the given ranges (Dinner $26–48, Desserts $12–18).
- **Hours** — modelled as Tue–Thu 4–10:30 PM, Fri–Sat 4 PM–Midnight, Sun–Mon closed. Adjust in `SCHEDULE`.
- **`interior.jpg`** (still used in the About block) is as supplied, including its “AI-generated content”
  watermark. The hero now uses real video instead.
- **Events** — the **15 First Dates** night is real; the recurring nights are placeholders. They now live in
  `assets/data/events.json` (or Supabase), so they can be edited without touching code.

---

## Running & deploying

**Locally:** any static server, e.g. `python3 -m http.server 8000` → http://localhost:8000

**GitHub Pages:** push and enable Pages on the branch (the included `.nojekyll` keeps the layout intact). Drop-in ready
for Netlify, Vercel or Cloudflare Pages too.

## Google reviews & Instagram (home page)

Both sections are in `index.html`.

- **Reviews** — three real Google reviews (Valeria Restrepo, Cindy Harbottle, Haneen Darwesh) with dates omitted.
  Update them in the `<blockquote class="quote">` cards and the rating in `#gRating`. Set your Place ID on the
  "Leave a review" link (`https://search.google.com/local/writereview?placeid=YOUR_PLACE_ID`).
- **Instagram** — the six tiles link to your profile. Replace the `https://www.instagram.com/` hrefs with your real
  handle, and swap the tile images for your latest posts. For a live feed, use a widget (Behold, EmbedSocial,
  Elfsight) or the Instagram Basic Display API and render into `.insta__grid`.
