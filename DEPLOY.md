# Publishing to GoDaddy

The site is plain HTML, CSS and JavaScript — there is nothing to build. Deploying
means copying the files onto the GoDaddy account. `.github/workflows/deploy-godaddy.yml`
does that over FTPS on every push to `main`, and uploads only the files that
actually changed.

## One-time setup

### 1. Get the FTP details from GoDaddy

In your GoDaddy account: **My Products → Web Hosting → Manage → cPanel Admin →
Files → FTP Accounts**. Create an account (or use the existing one) and note:

- **Server** — the hostname, e.g. `ftp.speakeasytapas.ca` or the server IP
- **Username** — the full FTP username, usually `something@speakeasytapas.ca`
- **Password** — the one you set
- **Directory** — where the site is served from. For a primary domain that is
  `public_html/`. For an add-on domain it is `public_html/speakeasytapas.ca/`.

### 2. Put them in GitHub as secrets

In this repo: **Settings → Secrets and variables → Actions → New repository
secret**. Add four:

| Secret name | Value |
| --- | --- |
| `FTP_SERVER` | the hostname from above |
| `FTP_USERNAME` | the full FTP username |
| `FTP_PASSWORD` | the FTP password |
| `FTP_SERVER_DIR` | `public_html/` (with the trailing slash) |

They are write-only — GitHub never shows them again, and they never appear in
the build logs.

### 3. Run it

**Actions → Deploy to GoDaddy → Run workflow.** The first run uploads everything
(a minute or two, mostly the video and fonts). After that, every push to `main`
uploads only what changed, in a few seconds.

## What gets uploaded

Everything the browser needs: the HTML pages, `css/`, `js/`, `assets/`. Left
behind: `mcp/`, `supabase/`, `tools/`, `README.md` and the repo plumbing — those
are development files that do not belong on a public web server.

## If a deploy fails

- **530 Login authentication failed** — the username usually needs to be the
  full `user@domain` form, not just the short name.
- **Connection timeout** — GoDaddy blocks FTP from unknown IPs on some plans.
  In cPanel, check **Security → IP Blocker**, or switch the workflow's
  `protocol:` from `ftps` to `ftp` if the plan does not offer FTPS.
- **Files upload but the site does not change** — `FTP_SERVER_DIR` is pointing at
  the wrong folder. Log in over FTP by hand and find the folder that already
  holds the live `index.html`.

## A note on GoDaddy plans

This works on **cPanel Web Hosting** (shared, business or dedicated), which is
what gives you FTP access. It does **not** work on **GoDaddy Website Builder**
— that product has no file access at all, so a site built there can only be
edited in their editor. If that is the plan you are on, the move is either to
switch to Web Hosting, or to point the domain at a free static host like
Cloudflare Pages or Netlify, which deploy from GitHub with no FTP at all.
