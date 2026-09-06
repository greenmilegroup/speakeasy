# Publishing the site

The site is plain HTML, CSS and JavaScript. `tools/build-site.sh` copies the
publishable files into `dist/` — every page, `css/`, `js/`, `assets/` — and
leaves the development folders (`mcp/`, `supabase/`, `tools/`) off the public
web. A host runs that script on every push to `main` and serves `dist/`.

The live domain is **speakeasyottawa.com**.

## Why not GoDaddy

The GoDaddy account is on **Websites + Marketing**, their site builder. It has
no FTP and no file access, so nothing can be deployed to it from GitHub. The
domain still lives at GoDaddy — only the DNS records change, and the hosting
happens elsewhere.

## Setting up Cloudflare Pages

1. Sign up free at https://dash.cloudflare.com/sign-up
2. **Workers & Pages → Create → Pages → Connect to Git**, authorise GitHub and
   pick `greenmilegroup/speakeasy`.
3. Set the build settings:

   | Field | Value |
   | --- | --- |
   | Production branch | `main` |
   | Build command | `bash tools/build-site.sh` |
   | Build output directory | `dist` |

4. **Save and Deploy.** In about a minute the site is live on a
   `speakeasy-xxx.pages.dev` URL. Check it there before pointing the domain.
5. **Custom domains → Set up a domain →** `speakeasyottawa.com`. Cloudflare
   shows the DNS records to create.
6. In GoDaddy: **Domain → speakeasyottawa.com → Manage DNS**, and add the
   records Cloudflare gave you. Propagation is usually minutes, up to a few
   hours. HTTPS is issued automatically once the domain resolves.

From then on, every push to `main` republishes the site on its own.

## Setting up Vercel instead

Same shape, different dashboard. **Add New → Project → Import** the repo, then:

| Field | Value |
| --- | --- |
| Framework Preset | Other |
| Build Command | `bash tools/build-site.sh` |
| Output Directory | `dist` |

Then **Settings → Domains** to add `speakeasyottawa.com`, and create the records
it gives you in GoDaddy's Manage DNS.

Note that Vercel's free Hobby plan is licensed for non-commercial use only, and
caps bandwidth at 100 GB/month. A restaurant site is commercial, and the video
on this site pushes it past that cap — see below. Vercel means the Pro plan.

## Bandwidth

The site is about 30 MB, of which 24 MB is the video in `assets/video/`. A
visitor does not pull all of it — the videos load per page — but a typical visit
still runs a few MB.

At roughly 50,000 visitors a month that is well over 100 GB. Cloudflare Pages
does not meter bandwidth on any plan. Vercel's Pro plan includes 1 TB.

If the bill or the load times ever become a concern, the fix is the video: move
`assets/video/` to a video host, or re-encode it smaller. That is where nearly
all the weight is.

## Local preview

    ./tools/build-site.sh && cd dist && python3 -m http.server 8000

Then open http://localhost:8000.

## The contact forms

The three forms — enquiry and newsletter on `visit.html`, applications on
`careers.html` — post to `/api/contact`, a Cloudflare Pages Function in
`functions/api/contact.js` that emails the venue through Resend.

They used to open the visitor's mail client with a `mailto:` link, which did
nothing at all on a phone or a machine with no mail client configured, while
still telling the visitor the message had been sent.

The Resend API key lives in the Pages environment and is only ever read
server-side, so the page itself carries no credential. `functions/` sits at the
repository root, not in `dist/` — Pages compiles it from there.

### Setting it up

**1. Verify the domain in Resend.** At https://resend.com/domains add
`send.speakeasyottawa.com` — a subdomain, so its SPF cannot collide with the
Microsoft 365 records on the main domain. Resend gives you DNS records; add them
in Cloudflare under **DNS → Records**, each one **DNS only** (grey cloud).

**2. Add the environment variables.** In Cloudflare: **Workers & Pages → your
project → Settings → Environment variables**, for Production *and* Preview:

| Name | Value | Type |
| --- | --- | --- |
| `RESEND_API_KEY` | the key from resend.com/api-keys | **Secret** (Encrypt) |
| `CONTACT_TO` | `info@speakeasyottawa.com` | Plaintext |
| `CONTACT_FROM` | `Speakeasy Website <website@send.speakeasyottawa.com>` | Plaintext |

`RESEND_API_KEY` must be added with **Encrypt**. The other two are optional —
the defaults in the code match the values above.

**3. Redeploy** so the function picks the variables up, then send yourself a
test through the form on `/visit.html`.

### Spam

Each form carries a honeypot field named `company`, hidden off-screen and out of
the tab order. A submission that fills it in is accepted and silently discarded,
so the bot sees success and does not retry. If real spam still arrives, add a
Cloudflare Turnstile widget — free, and it works without asking visitors to
identify traffic lights.

### Résumés

The application form sends the applicant's details but cannot carry a file. The
confirmation asks them to email the résumé to `info@speakeasyottawa.com`
separately. Resend can take attachments if a proper upload is wanted later.
