#!/usr/bin/env bash
# Assembles the publishable site into dist/.
#
# Cloudflare Pages serves whatever is in its output directory, so this copies
# across only what a browser needs. The development folders — mcp/, supabase/,
# tools/ — stay off the public web.
set -euo pipefail

cd "$(dirname "$0")/.."

# Opening hours live in js/hours.js. Refuse to ship pages that contradict them.
node tools/check-hours.mjs
node tools/check-counts.mjs
node tools/check-links.mjs

rm -rf dist
mkdir -p dist

cp -r assets css js dist/
# admin.html is the in-house event editor. It carries noindex and is absent
# from the sitemap, but copying it here still puts it on the public web at a
# guessable URL, and it will be a live editor once Supabase is configured.
for f in ./*.html; do
  [ "$(basename "$f")" = "admin.html" ] && continue
  cp "$f" dist/
done
cp robots.txt sitemap.xml .nojekyll _headers dist/

# The events board and the menus render from data at runtime, which the first
# crawl of a page never sees. Write them into the copies in dist/, along with
# the structured data that earns rich results. Source stays script-driven.
node tools/prerender-nav.mjs
node tools/prerender-events.mjs
node tools/add-schema.mjs

# The French site, built from the finished English pages so it carries the
# same board, nav and schema. Before the sitemap is stamped, so its pages
# are stamped too.
node tools/build-fr.mjs

# Stamp each sitemap entry with the date that page last actually changed, taken
# from git. A hand-maintained lastmod goes stale the first time nobody
# remembers to touch it, and a wrong one is worse than none: it tells search
# engines not to bother recrawling a page that has been rewritten.
python3 - <<'PY'
import re, subprocess, sys, io
p = 'dist/sitemap.xml'
s = io.open(p, encoding='utf-8').read()

def changed(page):
    out = subprocess.run(['git', 'log', '-1', '--format=%cs', '--', page],
                         capture_output=True, text=True).stdout.strip()
    return out or None

def stamp(m):
    url = m.group(0)
    tail = m.group(1).rstrip('/').split('/')[-1]
    # the root URL ends in the domain, not a filename
    page = tail if tail.endswith('.html') else 'index.html'
    when = changed(page)
    if not when or '<lastmod>' in url:
        return url
    return url.replace('<changefreq>', f'<lastmod>{when}</lastmod><changefreq>')

s = re.sub(r'<url><loc>([^<]+)</loc>.*?</url>', stamp, s)
io.open(p, 'w', encoding='utf-8').write(s)
print('  sitemap lastmod stamped from git')
PY

# Pages Functions are compiled from functions/ at the repo root, so they are
# not copied here — dist/ holds static files only.

# A stamp of what actually got built, so "is the site up to date?" is a
# question anyone can answer by opening /version.txt rather than guessing from
# what the page looks like. Cloudflare Pages sets CF_PAGES_COMMIT_SHA.
SHA="${CF_PAGES_COMMIT_SHA:-$(git rev-parse --short HEAD 2>/dev/null || echo unknown)}"
printf 'commit %s\nbuilt  %s\n' "$SHA" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > dist/version.txt

echo "Built dist/ — $(find dist -type f | wc -l) files (commit $SHA)"
