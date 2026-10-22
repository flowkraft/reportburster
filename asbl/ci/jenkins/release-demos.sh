#!/bin/bash
# Job dp-ci-release-demos: the demos on the code of origin/main. Its own build first (only when there is no build of that
# commit yet), then that very image published. Plain script, run on the host: Jenkins calls it over SSH, it also runs by hand.
#
#   DEMO=dp-demo.bkstg|demo.datapallas.com|both  RESET_DEMO_DATA=no|yes  DRY_RUN=no|yes  bash asbl/ci/jenkins/release-demos.sh
#
#   dp-demo.bkstg        https://dp-demo.bkstg.flowkraft.com: dp-ci.sh publish-demo-bkstg
#   demo.datapallas.com  the public demo, the three parts of the Rundeck job ops/change/demo-publish: setup.sh and
#                        setup.sh --edge (its folders and its two vhosts), dp-ci.sh publish-demo-datapallas.com,
#                        setup.sh --check (must end with DEMO_SETUP result=ok)
#   both                 dp-demo.bkstg first, then demo.datapallas.com
# RESET_DEMO_DATA=yes wipes demo.datapallas.com's data and seeds it again from the image (what visitors made is gone).
# DRY_RUN=yes builds nothing and changes nothing: it says whether a build is needed and what each publish would do.
# Every part is marked START/END with its time (asbl/ci/marks.sh). The output is masked the way the Rundeck job masks it.
set -uo pipefail
cd "$(dirname "$0")/../../.." || exit 2
. asbl/ci/marks.sh

DEMO="${DEMO:-dp-demo.bkstg}"; RESET="${RESET_DEMO_DATA:-no}"; DRY="${DRY_RUN:-no}"
case "$DEMO" in dp-demo.bkstg|demo.datapallas.com|both) ;; *) echo "FAIL  DEMO must be dp-demo.bkstg, demo.datapallas.com or both (got '$DEMO')"; exit 2 ;; esac
case "$RESET" in no|yes) ;; *) echo "FAIL  RESET_DEMO_DATA must be no or yes (got '$RESET')"; exit 2 ;; esac
case "$DRY" in no|yes) ;; *) echo "FAIL  DRY_RUN must be no or yes (got '$DRY')"; exit 2 ;; esac
[ "$RESET" = no ] || [ "$DEMO" != dp-demo.bkstg ] || { echo "FAIL  RESET_DEMO_DATA=yes is for demo.datapallas.com"; exit 2; }

# share-link tokens, passwords in URLs and settings, private keys (the same rules as the Rundeck job)
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
  local total n=1 tag bl dry=0 args=()
  [ "$DRY" = yes ] && dry=1
  case "$DEMO" in dp-demo.bkstg) total=2 ;; demo.datapallas.com) total=4 ;; both) total=5 ;; esac
  echo "DEMOS: demo=$DEMO reset_demo_data=$RESET dry_run=$DRY  checkout: $(git log -1 --format='%h %s')"

  mark_start "DEMOS STEP $n/$total" "the build of origin/main, only when there is none yet (dp-ci.sh build-if-needed)"
  bl=$(mktemp)
  DRY_RUN=$dry bash asbl/ci/dp-ci.sh build-if-needed | tee "$bl"
  [ "${PIPESTATUS[0]}" -eq 0 ] || { rm -f "$bl"; echo "FAILED: no build to publish (above)"; return 1; }
  tag=$(sed -n 's/^BUILD_TAG=//p' "$bl" | tail -1); rm -f "$bl"
  [ -n "$tag" ] || [ "$dry" = 1 ] || { echo "FAILED: build-if-needed printed no BUILD_TAG line"; return 1; }
  [ -n "$tag" ] && args+=("$tag")

  if [ "$DEMO" != demo.datapallas.com ]; then
    n=$((n + 1)); mark_next "DEMOS STEP $n/$total" "publish to dp-demo.bkstg (dp-ci.sh publish-demo-bkstg ${tag:-<the build a real run makes>})"
    DRY_RUN=$dry bash asbl/ci/jenkins/follow-ci.sh run bash asbl/ci/dp-ci.sh publish-demo-bkstg "${args[@]}" || return 1
  fi
  [ "$DEMO" = dp-demo.bkstg ] && { mark_end 0; return 0; }

  n=$((n + 1)); mark_next "DEMOS STEP $n/$total" "demo.datapallas.com setup: its folders and its two vhosts (setup.sh, setup.sh --edge)"
  if [ "$dry" = 1 ]; then
    echo "dry run: only looking (setup.sh --check)"
    bash asbl/ci/demo-public/setup.sh --check
  else
    bash asbl/ci/demo-public/setup.sh || return 1
    bash asbl/ci/demo-public/setup.sh --edge || return 1
  fi
  [ "$RESET" = yes ] && args+=(--reset)
  n=$((n + 1)); mark_next "DEMOS STEP $n/$total" "publish to demo.datapallas.com (dp-ci.sh publish-demo-datapallas.com ${args[*]:-<the build a real run makes>})"
  DRY_RUN=$dry bash asbl/ci/jenkins/follow-ci.sh run bash asbl/ci/dp-ci.sh publish-demo-datapallas.com "${args[@]}" || return 1
  n=$((n + 1)); mark_next "DEMOS STEP $n/$total" "demo.datapallas.com check: edge to instance (setup.sh --check)"
  if [ "$dry" = 1 ]; then echo "dry run: nothing was changed, nothing to check"; mark_end 0; return 0; fi
  local out; out=$(bash asbl/ci/demo-public/setup.sh --check 2>&1); echo "$out"
  [ "$(printf '%s\n' "$out" | tail -n 1)" = "DEMO_SETUP result=ok" ] || { echo "FAILED: setup.sh --check found problems (above)"; return 1; }
  echo "the demo is published and the chain checks out"
  mark_end 0
}

mark_run main 2>&1 | python3 -u -c "$MASK_PY"
rc=${PIPESTATUS[0]}
if [ "$rc" -eq 0 ]; then echo "DEMOS_RESULT=SUCCESS demo=$DEMO dry_run=$DRY"; else echo "DEMOS_RESULT=FAILED demo=$DEMO dry_run=$DRY"; fi
exit "$rc"
