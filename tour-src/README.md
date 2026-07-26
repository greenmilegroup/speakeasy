# Speakeasy Tapas Lounge — Walkable 3D Venue Tour

A first-person, walkable 3D tour of **Speakeasy Tapas Lounge** (55 York St, ByWard
Market, Ottawa), built to help prospective customers picture the space for a
private event and send them to the booking page.

- Walk the room on **desktop** (WASD / arrows + mouse-look, Shift to hurry) or
  **phone** (thumb joystick to walk, drag to look).
- Switch between three **event layouts** live — Intimate Dining (60 seated),
  Cocktail Reception (100 standing), Artistic Showcase (gallery).
- Tap **info hotspots** (bar, stage, dining, "host your event") and a persistent
  **Book this venue** button that opens the venue's inquiry page.
- Everything is drawn in code — **no downloaded images or 3D models** — so it
  loads fast and runs on mid-range phones.

## Tech

Vite + React + TypeScript + three.js (via @react-three/fiber / drei) +
@react-three/postprocessing + zustand. All textures are generated at runtime on
`<canvas>` (brick, wood, damask, tin, signage, art). One room, instanced
furniture, a tiny light rig plus emissive materials and a bloom pass — target
60 fps desktop / 30+ fps mid phones.

## Develop

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # data + collision unit tests (vitest)
npm run build      # type-check + production build to dist/
```

### Handy URL parameters

| Param | Effect |
|-------|--------|
| `?layout=dinner\|cocktail\|showcase` | open straight into a layout |
| `?autoenter` | skip the intro overlay |
| `?quality=high\|med\|low` | force a quality tier (else auto) |
| `?ui=0` | hide all UI (clean scene, used for screenshots) |
| `?debug` | orbit fly-camera + FPS stats + `window.__venue` helpers |

Example deep link for a marketing email: `…/?layout=cocktail&autoenter`

## Deploy / host

The build is **relocatable** (`base: './'`), so the contents of `dist/` work from
any web host, any subfolder, or inside an `<iframe>` with no reconfiguration.

```bash
npm run build      # → dist/  (index.html + assets/)
```

Then either:

- **Any static host** — upload the `dist/` folder (Netlify drag-and-drop, Vercel,
  S3, cPanel, your existing web host, etc.).
- **GitHub Pages** — serve `dist/` (e.g. via an action or the `gh-pages` branch).
  Because `base` is relative, it works under `/<repo>/` without changes.
- **Single self-contained file** — `npm run artifact` produces `dist/tour.html`
  (a fragment) and `dist/index.html` (a full page) with **all** JS/CSS/fonts
  inlined and **zero external requests**. Drop the single file anywhere.

### Embed it on speakeasyottawa.com

Add the tour to any page with an iframe (point `src` at wherever you hosted it):

```html
<iframe
  src="https://YOUR-HOST/tour/"
  title="Speakeasy Tapas Lounge — 3D Venue Tour"
  allow="fullscreen; pointer-lock"
  allowfullscreen
  style="width:100%;height:80vh;border:0;border-radius:12px"
></iframe>
```

Notes:
- Keep `allow="pointer-lock"` for the smoothest desktop mouse-look. If a host
  strips it, the tour automatically falls back to click-and-drag look, so it
  never breaks.
- Prefer a simple link/button instead of an iframe? Just link to the tour URL —
  optionally with a deep-link like `?layout=cocktail&autoenter`.

## Project layout

```
src/
  data/            floorplan, layout presets, hotspots (single source of truth)
  textures/        procedural CanvasTexture generators
  controls/        collision resolver, keyboard, pointer-lock + touch controls
  scene/           Room, Ceiling, Bar, Stage, Banquette, Furniture, Hotspots,
                   Lighting, Effects, camera + debug
  ui/              intro overlay, HUD, hotspot card, interact prompt, styles
  hooks/           quality tiers + performance auto-adjust
scripts/           Playwright screenshot / walk / UI verification harnesses
```

## Verify

```bash
npm test                       # unit tests
node scripts/walktest.mjs      # end-to-end movement + collision in a browser
node scripts/verify-ui.mjs     # intro, hotspot card, CTA links, layout switch
npm run screenshot -- --out check --cams spawn,bar,stage --layouts dinner
```
