#!/bin/bash
# Keeps what a website needs from ONE DataPallas instance alive: the three demo share links and the "Take the Tour" button.
#
# A website (the dev one, the public one) frames three dashboards of an instance (g-cube-country-sales, g-dashboard-demos,
# g-cube-stories) through share links, and reads their tokens from its settings file (DEMO_URL + DEMO_TOKEN_*). The links live in the
# instance's own database, and anything that wipes or re-seeds the instance (an e2e run on dp-dev, `publish-demo-datapallas.com --reset`)
# takes them away: the frames then stay hidden and say nothing. The "Take the Tour" button is not in the product's own dashboard template
# (a dashboard published from its canvas keeps its tests): frend/rb-webcomponents/scripts/tour-patch.mjs puts it on the instance's copy,
# so a re-seed takes that away too.
#
# This script puts both back. It is safe to run at any time:
#   1. waits until the instance answers (a restart compiles for a few minutes);
#   2. runs tour-patch on the Country Sales template (a page that already has the button is left exactly as it is);
#   3. opens each of the three links the way the website does; when all three still work it stops there;
#   4. otherwise revokes what links those three dashboards have and mints one new link each, with the instance's own API key
#      (config/_internal/api-key.txt: no password, nothing to keep in step with a test that changes users);
#   5. writes DEMO_URL and the tokens into the website's settings file and restarts the website, so it reads them;
#   6. DEMO_VERIFY_PUBLIC=1: opens the three links through the public address, from here.
# Tokens are never printed. Who starts it:
#   dev:    dp-ci.sh, after a run that stopped dp-dev and after `dp-ci.sh dev`  (the defaults below)
#   public: asbl/ci/demo-public/install-release.sh, at the end of an install (Jenkins job dp-ci-release-step4-demo-public), and
#           dp-ci.sh publish-demo-datapallas.com, at the end of a publish (by hand only, no job runs it)
#                                                                              (--target <the publish settings file>)
# By hand:  bash asbl/ci/demo-links.sh                                                  (dev)
#           bash asbl/ci/demo-links.sh --target /var/kraft-internalsystems/config/datapallas-ci/demo-datapallas-com.env   (public)
# The last line says what happened: DEMO_LINKS result=valid|minted|failed
#
# --target <file>: reads a publish settings file (demo-datapallas-com.env). Its TARGET_APP is the instance's container,
#   TARGET_DATA_DIR gives the template to put the tour button on (the instance's own copy), and its DEMO_* lines are the settings below.
#   The instance must be on this host (TARGET_HOST=local).
# Settings (environment, or DEMO_* lines of that file; the defaults are the dev site):
#   DEMO_CONTAINER         the container that serves the dashboards                (default datapallas-dev)
#   DEMO_URL               where the frames are loaded from                        (default https://dp-dev.bkstg.flowkraft.com)
#   DEMO_LINKS_KEYFILE     the instance's api-key.txt, as that container sees it   (default: dp-dev's testground)
#   DEMO_TOUR_TEMPLATES    templates that get the tour button, as paths on THIS host, space-separated
#                          (default: the Country Sales template in this checkout's testground/e2e)
#   DEMO_LINKS_WAIT_SECS   how long to wait for the instance to answer             (default 1800)
#   the website's settings file:
#     DEMO_SITE_ENV        its path                                                (default: the dev site's .env.local under DOCS_SITE)
#     DEMO_SITE_SSH        user@host when the file is on another host              (default: this host)
#     DEMO_SITE_RESTART    the command, run there, that makes the site read the file again
#                          (default: docker restart $DEMO_WEBSITE_CONTAINER, here, when it runs; the public website reads its file on
#                          every request, so there it is left empty)
#   DEMO_VERIFY_PUBLIC     1 = step 6 (the dev address sits behind the team login, so this is for the public one)
set -u

if [ "${1:-}" = --target ]; then
  [ -r "${2:-}" ] || { echo "demo links: cannot read the settings file '${2:-}'"; echo "DEMO_LINKS result=failed reason=no-settings"; exit 1; }
  set -a; . "$2"; set +a
  if [ "${TARGET_HOST:-local}" != local ]; then
    echo "demo links: the instance is on ${TARGET_HOST}; this script reaches an instance on this host only"
    echo "DEMO_LINKS result=failed reason=remote-instance"; exit 1
  fi
fi

REPO=$(cd "$(dirname "$0")/../.." && pwd)
CONTAINER=${DEMO_CONTAINER:-${TARGET_APP:-datapallas-dev}}
DEMO_URL=${DEMO_URL:-https://dp-dev.bkstg.flowkraft.com}
DOCS_SITE=${DOCS_SITE:-$(dirname "$(dirname "$REPO")")/company-biz/flowkraft/www/reportburster.com}
WEBSITE_CONTAINER=${DEMO_WEBSITE_CONTAINER:-www-datapallas-com-dev}
WAIT_SECS=${DEMO_LINKS_WAIT_SECS:-1800}
if [ -n "${TARGET_APP:-}" ]; then   # a published instance: its files are where the image puts them, its data folder is on this host
  KEYFILE=${DEMO_LINKS_KEYFILE:-/app/config/_internal/api-key.txt}
  TOUR_TEMPLATES=${DEMO_TOUR_TEMPLATES:-$TARGET_DATA_DIR/samples/reports/cubes/g-cube-country-sales-template.html}
else
  KEYFILE=${DEMO_LINKS_KEYFILE:-$REPO/frend/reporting/testground/e2e/config/_internal/api-key.txt}
  TOUR_TEMPLATES=${DEMO_TOUR_TEMPLATES:-$REPO/frend/reporting/testground/e2e/samples/reports/cubes/g-cube-country-sales-template.html}
fi
SITE_ENV=${DEMO_SITE_ENV:-$DOCS_SITE/.env.local}
SITE_SSH=${DEMO_SITE_SSH:-}
SITE_RESTART=${DEMO_SITE_RESTART:-}
CI_IMAGE=${DEMO_CI_IMAGE:-datapallas-ci}
API=http://127.0.0.1:9090   # as the container sees itself

# the dashboards, and the variable the website reads each one's token from (app/api/demo-frame/route.ts)
DASHBOARDS=(g-cube-country-sales g-dashboard-demos g-cube-stories)
declare -A TOKEN_VARIABLE=([g-cube-country-sales]=DEMO_TOKEN_COUNTRY_SALES
                           [g-dashboard-demos]=DEMO_TOKEN_DASHBOARD_DEMOS
                           [g-cube-stories]=DEMO_TOKEN_CUBE_STORIES)

say() { echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) demo links: $*"; }
q() { printf '%q' "$1"; }

# two of these at once for one instance would revoke each other's links
exec 9>"/tmp/demo-links-$CONTAINER.lock"
flock -n 9 || { say "another run of this script is active for $CONTAINER; leaving it to that one"; exit 0; }

# a command where the website's settings file is: here, or over ssh
site() {
  if [ -n "$SITE_SSH" ]; then ssh -o BatchMode=yes -o ConnectTimeout=20 "$SITE_SSH" "$1"; else bash -c "$1"; fi
}

SETTINGS=$(mktemp)
trap 'rm -f "$SETTINGS"' EXIT
site "cat $(q "$SITE_ENV")" > "$SETTINGS" 2>/dev/null || { say "cannot read the website's settings ${SITE_SSH:+on $SITE_SSH: }$SITE_ENV - nothing to keep up to date"; echo "DEMO_LINKS result=failed reason=no-env-file"; exit 1; }

answers() { [ "$(docker exec "$CONTAINER" curl -s -o /dev/null -w '%{http_code}' "$API/api/auth/first-run" 2>/dev/null)" = 200 ]; }

waited=0
until answers; do
  [ "$waited" -lt "$WAIT_SECS" ] || { say "$CONTAINER did not answer within ${WAIT_SECS}s - nothing changed"; echo "DEMO_LINKS result=failed reason=no-answer"; exit 1; }
  sleep 10; waited=$((waited + 10))
done

# the tour button (the instance reads the template on every request: no restart); a failure is said, and does not stop the links
tour_patch() {  # $1 = template, a path on this host
  local dir; dir=$(dirname "$1")
  [ -f "$1" ] || { echo "no such template"; return 1; }
  if command -v node >/dev/null 2>&1; then
    node "$REPO/frend/rb-webcomponents/scripts/tour-patch.mjs" "$1" --in-place 2>&1
  else
    docker run --rm -v "$REPO:$REPO" -v "$dir:$dir" -w "$REPO" "$CI_IMAGE" node "$REPO/frend/rb-webcomponents/scripts/tour-patch.mjs" "$1" --in-place 2>&1
  fi
}
for template in $TOUR_TEMPLATES; do
  if out=$(tour_patch "$template"); then
    say "tour button on $(basename "$template"): ${out##*: }"
  else
    say "tour button could not be put on $template: $out"
  fi
done

token_of() { grep -m1 "^$1=" "$SETTINGS" | cut -d= -f2-; }

# does the dashboard open with this token? (the token goes in through the environment, not the command line)
link_works() {  # $1 = dashboard id, $2 = token
  [ -n "$2" ] || return 1
  [ "$(docker exec -e T="$2" "$CONTAINER" sh -c 'curl -s -o /dev/null -w "%{http_code}" "$0/dashboard/$1?token=$T"' "$API" "$1" 2>/dev/null)" = 200 ]
}

all_links_work() {
  grep -qx "DEMO_URL=$DEMO_URL" "$SETTINGS" || return 1
  local id
  for id in "${DASHBOARDS[@]}"; do
    link_works "$id" "$(token_of "${TOKEN_VARIABLE[$id]}")" || return 1
  done
}

# the three links, opened through the public address
verify_public() {
  [ "${DEMO_VERIFY_PUBLIC:-0}" = 1 ] || return 0
  local id code bad=""
  for id in "${DASHBOARDS[@]}"; do
    code=$(curl -s -o /dev/null -m 30 -w '%{http_code}' -A 'Mozilla/5.0 (demo-links check)' -K - <<<"url = \"$DEMO_URL/dashboard/$id?token=$(token_of "${TOKEN_VARIABLE[$id]}")\"")
    [ "$code" = 200 ] || bad="$bad $id=$code"
  done
  if [ -z "$bad" ]; then say "the three links open through $DEMO_URL"; echo "DEMO_LINKS public=ok"
  else say "through $DEMO_URL these do not open:$bad"; echo "DEMO_LINKS public=failed$bad"; fi
}

if all_links_work; then
  say "the three links still work - nothing to do"
  verify_public
  echo "DEMO_LINKS result=valid"
  exit 0
fi

say "at least one link does not open on $CONTAINER - minting new ones"

OUT=$(docker exec -i -e API="$API" -e KEYFILE="$KEYFILE" -e IDS="${DASHBOARDS[*]}" "$CONTAINER" sh -s <<'EOS'
set -u
K=$(cat "$KEYFILE" 2>/dev/null)
[ -n "$K" ] || { echo "NO_KEY"; exit 1; }
for id in $IDS; do
  # revoke what is there, then mint one
  for old in $(curl -s -H "X-API-Key: $K" "$API/api/embed/share-link?reportId=$id" | grep -o '"id":[0-9]*' | cut -d: -f2); do
    curl -s -o /dev/null -X DELETE -H "X-API-Key: $K" "$API/api/embed/share-link/$old"
  done
  body=$(curl -s -X POST -H "X-API-Key: $K" -H 'Content-Type: application/json' -d "{\"reportId\":\"$id\"}" "$API/api/embed/share-link")
  tok=$(printf '%s' "$body" | grep -o '"token":"[^"]*"' | head -1 | cut -d'"' -f4)
  [ -n "$tok" ] || { echo "MINT_FAILED $id"; exit 1; }
  echo "TOKEN $id $tok"
done
EOS
)
if printf '%s' "$OUT" | grep -q 'NO_KEY\|MINT_FAILED'; then
  say "$(printf '%s\n' "$OUT" | grep 'NO_KEY\|MINT_FAILED' | head -1)"
  echo "DEMO_LINKS result=failed reason=mint"
  exit 1
fi

# keep the bytes of the file as they are: only the four lines are touched
TOKENS="$OUT" python3 - "$SETTINGS" "$DEMO_URL" <<'PY' || { echo "DEMO_LINKS result=failed reason=write"; exit 1; }
import os, re, sys
path, url = sys.argv[1], sys.argv[2]
tok = {}
for line in os.environ["TOKENS"].splitlines():
    p = line.split()
    if len(p) == 3 and p[0] == "TOKEN":
        tok[p[1]] = p[2]
want = {"DEMO_URL": url,
        "DEMO_TOKEN_COUNTRY_SALES": tok["g-cube-country-sales"],
        "DEMO_TOKEN_DASHBOARD_DEMOS": tok["g-dashboard-demos"],
        "DEMO_TOKEN_CUBE_STORIES": tok["g-cube-stories"]}
data = open(path, "rb").read().decode()
for key, value in want.items():
    pattern = re.compile(r"^" + key + r"=.*$", re.M)
    if pattern.search(data):
        data = pattern.sub(lambda m: key + "=" + value, data)
    else:
        if not data.endswith("\n"):
            data += "\n"
        data += key + "=" + value + "\n"
open(path, "wb").write(data.encode())
PY
# written in place (cat >, not mv): the file keeps its owner, mode and inode; one copy of what was there is kept beside it, on the other host only
{ [ -z "$SITE_SSH" ] || site "cp -p $(q "$SITE_ENV") $(q "$SITE_ENV.before-demo-links")"; } &&
  site "cat > $(q "$SITE_ENV")" < "$SETTINGS" || { say "could not write $SITE_ENV"; echo "DEMO_LINKS result=failed reason=write"; exit 1; }
say "wrote DEMO_URL and the three tokens into ${SITE_SSH:+$SITE_SSH:}$SITE_ENV"

# the website reads its settings when it starts
if [ -n "$SITE_RESTART" ]; then
  site "$SITE_RESTART" >/dev/null 2>&1 && say "website restarted" || say "the website's restart command failed: $SITE_RESTART"
elif [ -z "$SITE_SSH" ] && docker ps -q --filter "name=^${WEBSITE_CONTAINER}\$" | grep -q .; then
  docker restart "$WEBSITE_CONTAINER" >/dev/null 2>&1 && say "restarted $WEBSITE_CONTAINER" || say "could not restart $WEBSITE_CONTAINER"
else
  say "no restart configured: the website reads the file itself"
fi

if all_links_work; then
  say "the three links open on $CONTAINER"
  verify_public
  echo "DEMO_LINKS result=minted"
else
  say "new links were written but do not open - look at $CONTAINER"
  echo "DEMO_LINKS result=failed reason=verify"
  exit 1
fi
