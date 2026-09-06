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

rm -rf dist
mkdir -p dist

cp -r assets css js dist/
cp ./*.html robots.txt sitemap.xml .nojekyll _headers dist/

# Pages Functions are compiled from functions/ at the repo root, so they are
# not copied here — dist/ holds static files only.

# A stamp of what actually got built, so "is the site up to date?" is a
# question anyone can answer by opening /version.txt rather than guessing from
# what the page looks like. Cloudflare Pages sets CF_PAGES_COMMIT_SHA.
SHA="${CF_PAGES_COMMIT_SHA:-$(git rev-parse --short HEAD 2>/dev/null || echo unknown)}"
printf 'commit %s\nbuilt  %s\n' "$SHA" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > dist/version.txt

echo "Built dist/ — $(find dist -type f | wc -l) files (commit $SHA)"
