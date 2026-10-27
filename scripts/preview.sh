#!/bin/bash
# Static preview at https://leon-gold.github.io/leon-gold-app/site/ until the real hosting exists.
# Builds an export with that base path, prefixes the public files the pages reference, and copies it into the app repo.
set -e
BASE=/leon-gold-app/site
cd "$(dirname "$0")/.."
rm -rf out .next
# Git Bash would rewrite a leading-slash env value into a Windows path
MSYS2_ENV_CONV_EXCL=PREVIEW_BASE PREVIEW_BASE=$BASE npx next build
grep -rlE '/(museum|fonts|products|gl)/|/leaf\.png' out --include='*.html' --include='*.css' --include='*.js' --include='*.txt' | while read f; do
  sed -i -E "s#([\"'(])/(museum|fonts|products|gl)/#\1$BASE/\2/#g; s#([\"'(])/leaf\.png#\1$BASE/leaf.png#g" "$f"
done
rm -rf out/t.html out/t2.html out/t3.html out/t4.html out/t-pr.html  # local screenshot helpers
SITE=../leon-gold-app/site
rm -rf "$SITE" && cp -r out "$SITE"
echo "copied to $SITE"
