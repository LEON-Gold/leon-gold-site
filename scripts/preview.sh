#!/bin/bash
# Static preview at https://leon-gold.github.io/leon-gold-app/site/ until the real hosting exists.
# Builds an export with that base path, prefixes the public files the pages reference, and copies it into the app repo.
set -e
BASE=/leon-gold-app/site
[ -d "$HOME/.local/bin" ] && export PATH="$HOME/.local/bin:$PATH"
cd "$(dirname "$0")/.."
rm -rf out .next
# Git Bash would rewrite a leading-slash env value into a Windows path (the extra variable is harmless on macOS)
MSYS2_ENV_CONV_EXCL=PREVIEW_BASE PREVIEW_BASE=$BASE npx next build
grep -rlE '/(museum|fonts|products|gl|kidsart)/|/hesab/icon-|/leaf(-hd)?\.(png|webp)' out --include='*.html' --include='*.css' --include='*.js' --include='*.txt' | while read f; do
  sed -i.lgbak -E "s#([\"'(])/(museum|fonts|products|gl|kidsart)/#\1$BASE/\2/#g; s#([\"'(])/hesab/icon-#\1$BASE/hesab/icon-#g; s#([\"'(])/leaf(-hd)?\.(png|webp)#\1$BASE/leaf\2.\3#g" "$f" && rm -f "$f.lgbak"
done  # -i.lgbak works with both GNU sed and macOS (BSD) sed
rm -rf out/t.html out/t2.html out/t3.html out/t4.html out/t-pr.html out/t-vt.html  # local screenshot helpers
SITE=../leon-gold-app/site
rm -rf "$SITE" && cp -r out "$SITE"
# GitHub Pages answers any address it does not have with the repo root's 404.html: the site's own «not found»
cp "$SITE/404.html" "$SITE/../404.html"
echo "copied to $SITE"
