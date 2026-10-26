#!/bin/bash
# rebuild the site, restart it on :3100 and run the taste inspector
export PATH="/c/Program Files/nodejs:$PATH"; cd "$(dirname "$0")/.."
powershell -NoProfile -Command "\$c = Get-NetTCPConnection -LocalPort 3100 -State Listen -ErrorAction SilentlyContinue; if (\$c) { Stop-Process -Id \$c.OwningProcess -Force }" >/dev/null 2>&1
rm -rf .next; npx next build 2>&1 | grep -iE 'error|✓ Compiled' | head -5
(npx next start -p 3100 > "$TEMP/nextstart.log" 2>&1 &); sleep 6
node .claude/skills/taste-skill/scripts/inspect.mjs http://localhost:3100/ "$@" 2>&1 | sed -n '/FAIL —/,/LOOK AT/p;/RESULT/p' | grep -v '^  *→'
