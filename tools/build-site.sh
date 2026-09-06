#!/usr/bin/env bash
# Assembles the publishable site into dist/.
#
# Cloudflare Pages serves whatever is in its output directory, so this copies
# across only what a browser needs. The development folders — mcp/, supabase/,
# tools/ — stay off the public web.
set -euo pipefail

cd "$(dirname "$0")/.."
rm -rf dist
mkdir -p dist

cp -r assets css js dist/
cp ./*.html robots.txt sitemap.xml .nojekyll _headers dist/

# Pages Functions are compiled from functions/ at the repo root, so they are
# not copied here — dist/ holds static files only.

echo "Built dist/ — $(find dist -type f | wc -l) files"
