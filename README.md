# Speakeasy Tapas Lounge — website

A cinematic one-page site for **Speakeasy Tapas Lounge** · 55 York Street, ByWard Market, Ottawa · ☎ 613-241-6221.
It opens with the house crest whispering **“Shhh…”**, then a pair of art-deco doors swings open into the room.

> **“This must be the place.”**

Built as a **zero-build static site** — plain HTML, CSS and JavaScript. No frameworks, no bundler, nothing to compile.
Open `index.html` in a browser, or host the folder anywhere (GitHub Pages, Netlify, any web server).

---

## What’s in the box

```
index.html          The whole site (one page, all content)
css/styles.css      Design system, layout & every animation
js/main.js          Intro/doors, nav, menu tabs, gallery + lightbox,
                    live open/closed hours, 3D tilt, draggable coin,
                    parallax, forms, and the Three.js ember layer
js/vendor/          Three.js (self-hosted — no CDN needed)
assets/
  logo.png          Your crest (converted from the supplied PDF)
  favicon*.png/.ico, apple-touch-icon.png, og-image.jpg
  fonts/            Self-hosted web fonts + fonts.css
  img/              Photos (see “Swapping in photos” below)
.nojekyll           Lets GitHub Pages serve the files as-is
```

Everything loads locally, so the site works offline and has **no third-party runtime dependencies** except the optional Google Map embed in the “virtual tour”.

---

## The interactive bits

- **Intro** — plays once per browser session (`sessionStorage`). “Skip →”, `Esc`/`Enter`, or a tap enters; it auto-opens after ~4 s. Honours `prefers-reduced-motion` (fades instead of the door animation).
- **Draggable 3D coin** in the hero — grab and flick the crest to spin it.
- **3D tilt** on cocktail/plate/package cards, **ambient gold embers** (WebGL), **parallax hero**, scroll reveals, neon “LIVE MUSIC” sign and an audio-style equalizer.
- **Live hours badge** — “Open now / Closed” is calculated in real time for Ottawa (America/Toronto).
- **Gallery lightbox** — click a photo; arrow keys / swipe to move, `Esc` to close.
- **Easter egg** — click the footer crest three times. 🤫

---

## Editing the content

Everything is hand-editable HTML/JS — no database.

### Menus
All items live in `index.html` under `<section id="menus">`. Each dish/cocktail is a small block:

```html
<article class="ck tilt" data-tilt>
  <div class="ck__top"><h4>The Capone</h4><span class="price">18</span></div>
  <p class="ck__ing">Bourbon · sweet vermouth · amaro · orange bitters</p>
  <p class="ck__note">Bold and brooding…</p>
</article>
```

The `<span class="price">18</span>` renders as **$18** automatically (the `$` is added in CSS).

### Business hours (and the “Open now” badge)
Edit the single `SCHEDULE` object at the top of the `hours()` function in `js/main.js`.
Times are **minutes from midnight**; `24*60` means midnight. `null` = closed.

```js
const SCHEDULE = {
  0: null,                                   // Sunday closed
  2: { open: 16*60, close: 22*60 + 30 },     // Tuesday 4:00 PM – 10:30 PM
  5: { open: 16*60, close: 24*60 },          // Friday 4:00 PM – Midnight
};
```

The hours table and the live badge both read from this one object.

### Swapping in photos
Drop a JPG into `assets/img/` and point the matching `<img src="…">` at it. Current photos:

| File | Used for |
|------|----------|
| `assets/img/interior.jpg` | hero background · About · gallery |
| `assets/img/tuna-tartare.jpg` | Shareables (From the Sea) · gallery |
| `assets/img/rigatoni-bolognese.jpg` | Dinner feature · gallery |
| `assets/img/storefront.jpg` | Visit · virtual-tour fallback · gallery |

To add more gallery photos, copy a `<figure class="gcard">…</figure>` block inside
`<div class="gallery__grid">` and set its `data-full`, `src`, `alt`, `data-caption` and `data-cat`
(`plates` or `room`).

### Contact & newsletter forms
The forms validate in the browser and show a confirmation; the contact form also opens a
pre-filled email as a fallback. To capture submissions properly, wire each `<form>` to a
service such as **Formspree**, **Netlify Forms**, or your **Supabase** table — add the
provider’s `action`/handler in the `forms()` function of `js/main.js`. Update the fallback
address (`hello@speakeasytapas.ca`) to your real inbox.

---

## Notes / assumptions to confirm

The kitchen & bar copy follows the supplied inventory. A few details were filled in to make
the menus feel complete — please review and adjust:

- **Cocktails** — the 10 named signatures are listed; three era-appropriate pours
  (French 75, Boulevardier, Clover Club) round the list to the stated **13**. Ingredients and
  **prices ($15–18)** are placeholders.
- **Wine & beer** — representative selections with sample prices (local Ottawa draughts named).
- **Dish prices** — chosen to sit inside the ranges given (Dinner $26–48, Desserts $12–18).
- **Hours** — modelled as Tue–Thu 4–10:30 PM, Fri–Sat 4 PM–Midnight, Sun–Mon closed. Adjust in
  `SCHEDULE` (above) if the room keeps different hours.
- **`interior.jpg`** is used exactly as supplied, including its “AI-generated content” watermark.
- The **virtual-tour** iframe points at Google Maps for 55 York Street; a photo fallback shows if
  the embed is blocked.

---

## Running & deploying

**Locally:** any static server, e.g.
```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

**GitHub Pages:** push this folder and enable Pages on the branch (the included `.nojekyll`
keeps the file layout intact). It’s also drop-in ready for Netlify, Vercel, or Cloudflare Pages.
