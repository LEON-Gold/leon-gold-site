#!/bin/bash
# build the static preview from the committed tree, push it into ../leon-gold-app/site, push this repo; $1 = preview message
# Several tabs share this folder: commit only your own files first (git add <your paths>; git commit), then run this.
# It refuses while any file is uncommitted, so it never builds or ships another tab's half-done work.
export PATH="/c/Program Files/nodejs:$PATH"; cd "$(dirname "$0")/.."
if [ -n "$(git status --porcelain)" ]; then
  echo "refused: uncommitted files below. Commit your own; if the rest belong to another tab, wait for it or publish from your own worktree."
  git status --short; exit 1
fi
git pull -q --rebase || { echo "git pull --rebase failed"; exit 1; }
bash scripts/preview.sh >/dev/null 2>&1 || { echo "preview build failed"; exit 1; }
G="git -c http.version=HTTP/1.1"   # this network drops HTTP/2 pushes to GitHub
(cd ../leon-gold-app && git add -A site >/dev/null 2>&1 && { git diff --cached --quiet || git commit -qm "Preview: $1"; } && $G pull -q --rebase && $G push -q) || { echo "FAILED: preview push to leon-gold-app"; exit 1; }
$G push -q || { echo "FAILED: push of leon-gold-site"; exit 1; }
echo "published: $1"
