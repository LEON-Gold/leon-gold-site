#!/bin/bash
# build the static preview, push it into ../leon-gold-app/site, commit and push this repo; $1 = commit message
export PATH="/c/Program Files/nodejs:$PATH"; cd "$(dirname "$0")/.."
bash scripts/preview.sh >/dev/null 2>&1 || { echo "preview build failed"; exit 1; }
(cd ../leon-gold-app && git add -A site >/dev/null 2>&1 && git commit -qm "Preview: $1" && git push -q 2>/dev/null)
git add -A >/dev/null 2>&1 && git commit -qm "$1

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" && git push -q 2>/dev/null && echo "published: $1"
