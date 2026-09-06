# Past-client logos

The seven official marks used on the Host Your Event page. Each is a
single-colour SVG drawn with `fill="currentColor"`.

    apple.svg  amazon.svg  google.svg  goldman-sachs.svg
    rbc.svg    morguard.svg  maison-birks.svg

## Why they are inlined rather than <img>

An SVG loaded through `<img>` is its own document, so `currentColor` resolves
to black there and these marks would be invisible on the site's dark ground.
Inlined into `private.html` they inherit the page colour instead: cream at
rest, gold on hover, one hover rule for all seven, and no extra requests.

The files are kept here as the source of truth. If you edit one, paste the new
markup into the `.clients__row` block in `private.html` as well.

## Sizing

Marks vary from Apple (aspect 0.82:1) to Maison Birks (11.6:1), so a single
height would make one tower over another. Each has its own height in
`css/styles.css` under `.clients__row`, normalised to equal optical weight,
with a smaller set under 720px. Adding a logo means adding its height rule.

**Before publishing:** using a company's logo to advertise them as a client
normally needs that company's written permission, and several of these have
strict brand-use policies. Confirm each is both a real past client and cleared
for use.
