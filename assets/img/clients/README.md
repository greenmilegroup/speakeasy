# Past-client logos

Drop a logo here and the Host Your Event page picks it up on the next load.
No code change is needed: `js/site.js` probes each `data-logo` path and swaps
the wordmark for the image only once the file actually loads.

Expected filenames (from `private.html`):

    apple.svg   amazon.svg   google.svg   goldman-sachs.svg   morguard.svg   birks.svg

SVG is preferred; PNG at roughly 400px wide also works. Update the `data-logo`
path in `private.html` if you use a different extension.

The wall renders logos in greyscale at rest and in full colour on hover, so a
plain single-colour or full-colour logo both sit correctly.

**Before publishing:** using a company's logo to advertise them as a client
normally needs that company's written permission, and several of these have
strict brand-use policies. Confirm each one is both a real past client and
cleared for use.
