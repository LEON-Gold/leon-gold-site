#!/bin/bash
# rebuild the site, restart it on :3100 and run the taste inspector (Windows Git Bash or macOS)
[ -d "/c/Program Files/nodejs" ] && export PATH="/c/Program Files/nodejs:$PATH"
[ -d "$HOME/.local/bin" ] && export PATH="$HOME/.local/bin:$PATH"
cd "$(dirname "$0")/.."
TMPD="${TEMP:-${TMPDIR:-/tmp}}"
if command -v lsof >/dev/null 2>&1; then
  pids=$(lsof -ti tcp:3100 -sTCP:LISTEN 2>/dev/null); [ -n "$pids" ] && kill -9 $pids 2>/dev/null
else
  powershell -NoProfile -Command "\$c = Get-NetTCPConnection -LocalPort 3100 -State Listen -ErrorAction SilentlyContinue; if (\$c) { Stop-Process -Id \$c.OwningProcess -Force }" >/dev/null 2>&1
fi
rm -rf .next; npx next build 2>&1 | grep -iE 'error|✓ Compiled' | head -5
(npx next start -p 3100 > "$TMPD/nextstart.log" 2>&1 &); sleep 6
node .claude/skills/taste-skill/scripts/inspect.mjs http://localhost:3100/ "$@" 2>&1 | sed -n '/FAIL —/,/LOOK AT/p;/RESULT/p' | grep -v '^  *→'
