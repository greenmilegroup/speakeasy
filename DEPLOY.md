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

## The forms

Four forms post to `/api/contact`, a Cloudflare Pages Function in
`functions/api/contact.js`:

- **Send a note**, on `visit.html` — emailed to the venue through Resend.
- **Private event enquiry**, on `host-your-event.html` — name, email, roughly when and
  how many, plus optional phone and occasion; emailed with a subject that
  carries all three ("Private event enquiry — Ada · 40 people · Sat 14 Nov").
  It replaced a `mailto:` link, which does nothing on a device with no mail
  client configured.
- **Society card request**, on `society.html` — name, email, phone and how
  often they are in. Stored as a Resend contact with `society_interest:
  applied`, then emailed with the subject "Society card request — Name ·
  frequency". Nothing is charged by the site: the owner replies with the
  payment link (Stripe or Square) once they approve.
- **The Guest List** (the Society block on the home, events and visit pages) —
  the free mailing list. The function first **stores the person as a Resend contact** in the
  "General" segment, with `society_interest` (yes/no), `society_feedback` and
  `signup_source` as contact properties, then emails the venue a notification
  that says whether the contact was stored. If Resend refuses the contact the
  notification still goes, marked *"Stored in Resend: NO — add by hand"*, so
  no sign-up is ever lost. The list lives at https://resend.com/contacts and
  a broadcast to it is sent from https://resend.com/broadcasts.

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
| `RESEND_SEGMENT` | the id of the Resend segment new members join (default: "General") | Plaintext |
| `SOCIETY_JOIN_URL` | the Stripe payment link for the $50/month membership | Plaintext |
| `STRIPE_WEBHOOK_SECRET` | the `whsec_…` signing secret from the Stripe webhook endpoint | **Secret** (Encrypt) |
| `STRIPE_SECRET_KEY` | optional; only so a cancellation can name the member | **Secret** (Encrypt) |

`RESEND_API_KEY` must be added with **Encrypt**. The other three are optional —
the defaults in the code match the values above.

**3. Redeploy** so the function picks the variables up, then send yourself a
test through the form on `/visit.html`.

## The Society membership

$50 a month, recurring, taken by Stripe. **Stripe does all of the billing and
the site does none of it** — no card ever touches speakeasyottawa.com, which is
what keeps the venue's PCI obligation to the lightest kind there is.

### Setting it up in Stripe

1. **Create the product.** Stripe → Product catalogue → add *The Speakeasy
   Society*, price **$50 CAD, recurring monthly**. Attach a fixed **13% HST
   (Ontario)** tax rate rather than switching on Stripe Tax — one province, one
   rate, and Stripe Tax charges per transaction.
2. **Create a Payment Link** for it. Turn on: collect **name**, collect
   **phone**, and **Apple Pay / Google Pay** (on by default — this is most of
   "seamless" on a phone). Set the **after-payment redirect** to
   `https://speakeasyottawa.com/society-welcome`.
3. **Turn on the customer portal.** Stripe → Settings → Billing → Customer
   portal: allow customers to update their payment method and cancel. Stripe puts
   a link to it in every receipt. This is the single biggest saving of the
   owner's time — a member with an expiring card fixes it themselves and nobody
   emails anyone.
4. **Turn on failed-payment recovery.** Settings → Billing → Revenue recovery:
   Smart Retries plus the automatic emails. A card that fails is retried on a
   schedule and the member is asked to fix it, with no work at this end.
5. **Add the webhook.** Developers → Webhooks → add endpoint
   `https://speakeasyottawa.com/api/stripe-webhook`, subscribed to
   **`checkout.session.completed`** and **`customer.subscription.deleted`**.
   Copy the `whsec_…` secret into `STRIPE_WEBHOOK_SECRET`.
6. **Paste the payment link into `SOCIETY_JOIN_URL`.** From then on every Society
   card request arrives with the link in it, so approving somebody is a reply
   and a paste.

That one variable now feeds both ways in. `society.html` has a **Join the
Society** button pointing at `/api/join`, a Function that reads
`SOCIETY_JOIN_URL` and redirects to it — so the link is never copied into the
markup, and the English and French pages cannot drift apart. It is checked
before anyone is sent there: the host must be exactly `buy.stripe.com` or
`checkout.stripe.com`, over https, with a path.

**A test-mode link is rejected too**, and that is the case worth understanding.
A `buy.stripe.com/test_…` link is a genuine Stripe URL and looks completely
normal — the visitor reaches a real-looking checkout that silently declines
every real card, and nothing tells the venue it happened. Live mode and test
mode are separate worlds in Stripe, and a membership set up in the wrong one
looks finished from the dashboard.

Anything rejected — empty, mistyped, not Stripe, or test mode — sends the
visitor to the request form on the page they came from, in their language.
That is a slower way in but a real one, rather than an error or a dead
checkout. Changing the payment link is
a dashboard edit and a redeploy, never a code change.

### What happens on its own after that

- Stripe charges $50 + HST every month, forever, and emails the receipt.
- A member changes their card or cancels from the portal, unaided.
- `functions/api/stripe-webhook.js` emails the venue when a membership starts or
  ends, and marks the person `member` or `lapsed` in the Resend list — so the
  member list maintains itself and the door knows whose card is good.
- A new member lands on `/society-welcome`, which tells them what happens next.

Test the whole path in Stripe's **test mode** with card `4242 4242 4242 4242`
before a real card is used.

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

## Is the live site up to date?

`tools/build-site.sh` writes `dist/version.txt` with the commit it built from,
so **https://speakeasyottawa.com/version.txt** answers the question directly.
Compare it against the head of `main`. If it is behind, a deploy failed and
Cloudflare is still serving the last build that worked — the site does not go
down when a build breaks, it just quietly stops changing.

`.github/workflows/build.yml` runs the same build on every push and pull
request, so a broken build shows as a failed check on the commit rather than
only inside the Cloudflare dashboard. It also asserts the build produced a
whole site: every English page has a French counterpart, French pages carry
absolute asset paths, and `functions/` stayed out of `dist/`.

Node is pinned in `.node-version`. Cloudflare Pages reads that file, so the
build runs on the same version locally, in CI and on the host.

### When the site looks fine but has stopped changing

This has now bitten the project twice, both times for the same reason: **Pages
keeps the build command and output directory in its dashboard, not in this
repository.** With those two fields empty, Pages publishes the repository as it
sits in git instead of `dist/`.

What makes it hard to spot is that the site keeps looking normal. The English
pages still work — their asset paths are relative and happen to resolve
correctly at the root — so nothing appears broken. What silently goes missing
is everything the build produces: all ten `/fr/` pages, the pre-rendered events
and schema, `version.txt`, and the exclusion of `mcp/`, `supabase/` and
`tools/` from the public web.

**The giveaway is any `/fr/` address.** It either 404s or falls back to the
English home page with no styling at all — that page's relative
`css/styles.css` resolves to `/fr/css/styles.css` from one folder deep, so it
loads no CSS and no JavaScript. An unstyled English home page at a French URL
means these two fields are empty:

| Field | Value |
| --- | --- |
| Build command | `bash tools/build-site.sh` |
| Build output directory | `dist` |

Setting them does not rebuild anything on its own. **Deployments → ⋯ → Retry
deployment.**

### One host, not two

Cloudflare Pages serves speakeasyottawa.com, and is the only thing that should.

A Vercel project (`speakeasy6/speakeasy`) was also connected to this repository
and built on every push. It had no build command either, so what it published
was the raw repository at a second public address. **Deleted in September
2026.**

Both hosts reported back to GitHub, but by different mechanisms, and that is
worth knowing before diagnosing anything from them: **Cloudflare Pages posts a
check run, Vercel posted a commit status.** Asking GitHub for one does not
return the other. Reading only the commit statuses showed Vercel alone, which
made it look like the live host and sent a session to the wrong dashboard.

If a deployment check or status from anything other than Cloudflare appears on
a commit again, a second host is building this repository. Find out why before
trusting what either one publishes.
