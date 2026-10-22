#!/bin/bash
# The public demo (decision OD4 (a), 2026-10-22): job dp-ci-release-step4-demo-public, step 4 of a release. Plain script, run on
# the host: Jenkins calls it over SSH, it also runs by hand. The preview dp-demo.bkstg was retired on 2026-10-22: dp-dev.bkstg
# (dp-ci-dev-server) shows the code under development.
#
#   DEMO=demo.datapallas.com  RESET_DEMO_DATA=no|yes  DRY_RUN=no|yes  bash asbl/ci/jenkins/release-demos.sh
#
#   demo.datapallas.com  the public demo is a plain install of the published release, nothing built: setup.sh and setup.sh --edge
#                        (its folders and its two vhosts), asbl/ci/demo-public/install-release.sh (newest/datapallas-server-docker.zip,
#                        its own folder per version, the data carried over, rolled back when it does not answer; nothing to do
#                        when it already runs the released version), setup.sh --check (must end with DEMO_SETUP result=ok).
# RESET_DEMO_DATA=yes: demo.datapallas.com's next release starts from the bundle's own data, not the previous version's (what
# visitors made stays in the previous folder). DRY_RUN=yes builds nothing and changes nothing: it says what each part would do.
# Every part is marked START/END with its time (asbl/ci/marks.sh). The output is masked the way the Rundeck ops jobs mask theirs.
set -uo pipefail
cd "$(dirname "$0")/../../.." || exit 2
. asbl/ci/marks.sh

DEMO="${DEMO:-demo.datapallas.com}"; RESET="${RESET_DEMO_DATA:-no}"; DRY="${DRY_RUN:-no}"
case "$DEMO" in demo.datapallas.com) ;; *) echo "FAIL  DEMO must be demo.datapallas.com (got '$DEMO'; dp-demo.bkstg was retired on 2026-10-22)"; exit 2 ;; esac
case "$RESET" in no|yes) ;; *) echo "FAIL  RESET_DEMO_DATA must be no or yes (got '$RESET')"; exit 2 ;; esac
case "$DRY" in no|yes) ;; *) echo "FAIL  DRY_RUN must be no or yes (got '$DRY')"; exit 2 ;; esac

# share-link tokens, passwords in URLs and settings, private keys (the same rules as the Rundeck ops jobs)
MASK_PY=$(cat <<'PY'
import re, sys
kv = re.compile(r'''(?i)((?:password|passwd|secret|token|api[_-]?key|apikey|access[_-]?key|private[_-]?key|credential)[a-z0-9_.-]*["']?\s*[:=]\s*["']?)([^\s"',;]+)''')
bearer = re.compile(r'(?i)(bearer\s+)[a-z0-9._~+/=-]{8,}')
url = re.compile(r'(://[^/\s:@]+:)[^@\s/]+@')
inkey = False
for line in sys.stdin:
    if '-----BEGIN' in line and 'PRIVATE KEY' in line: inkey = True; sys.stdout.write('*** private key hidden ***\n'); sys.stdout.flush(); continue
    if inkey:
        if '-----END' in line: inkey = False
        continue
    sys.stdout.write(url.sub(lambda m: m.group(1) + '***@', bearer.sub(r'\1***', kv.sub(lambda m: m.group(1) + '***', line))))
    sys.stdout.flush()
PY
)

main() {
  local total=3 n=1 bl dry=0
  [ "$DRY" = yes ] && dry=1
  echo "DEMOS: demo=$DEMO reset_demo_data=$RESET dry_run=$DRY  checkout: $(git log -1 --format='%h %s')"

  mark_start "DEMOS STEP $n/$total" "demo.datapallas.com setup: its folders and its two vhosts (setup.sh, setup.sh --edge)"
  if [ "$dry" = 1 ]; then
    echo "dry run: only looking (setup.sh --check)"
    bash asbl/ci/demo-public/setup.sh --check
  else
    bash asbl/ci/demo-public/setup.sh || return 1
    bash asbl/ci/demo-public/setup.sh --edge || return 1
  fi
  n=$((n + 1)); mark_next "DEMOS STEP $n/$total" "demo.datapallas.com: install the published release (asbl/ci/demo-public/install-release.sh)"
  bl=$(mktemp)
  DRY_RUN=$DRY RESET_DEMO_DATA=$RESET bash asbl/ci/demo-public/install-release.sh 2>&1 | tee "$bl"
  case "$(tail -n 1 "$bl")" in
    "DEMO_INSTALL result=installed"|"DEMO_INSTALL result=nothing-to-do"|"DEMO_INSTALL result=dry-run") rm -f "$bl" ;;
    *) rm -f "$bl"; echo "FAILED: the release is not installed on demo.datapallas.com (above)"; return 1 ;;
  esac
  n=$((n + 1)); mark_next "DEMOS STEP $n/$total" "demo.datapallas.com check: edge to instance (setup.sh --check)"
  if [ "$dry" = 1 ]; then echo "dry run: nothing was changed, nothing to check"; mark_end 0; return 0; fi
  local out; out=$(bash asbl/ci/demo-public/setup.sh --check 2>&1); echo "$out"
  [ "$(printf '%s\n' "$out" | tail -n 1)" = "DEMO_SETUP result=ok" ] || { echo "FAILED: setup.sh --check found problems (above)"; return 1; }
  echo "the demo runs the release and the chain checks out"
  mark_end 0
}

mark_run main 2>&1 | python3 -u -c "$MASK_PY"
rc=${PIPESTATUS[0]}
if [ "$rc" -eq 0 ]; then echo "DEMOS_RESULT=SUCCESS demo=$DEMO dry_run=$DRY"; else echo "DEMOS_RESULT=FAILED demo=$DEMO dry_run=$DRY"; fi
exit "$rc"
