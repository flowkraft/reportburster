#!/bin/bash
# demo.datapallas.com = a plain install of the published release (decision OD4 (a), 2026-10-22): what a user does on the self-host
# page (https://datapallas.com/docs/server/self-host), plus the one file a public demo needs on top. Run as root on internalsystems,
# from the repository (asbl/ci/jenkins/release-demos.sh runs it; it also runs by hand):
#
#   bash asbl/ci/demo-public/install-release.sh          DRY_RUN=yes: only says what it would do
#
#   1. the version: the Docker channel's released version, the x.y.z tag that Docker Hub's :latest has (release-state.sh
#      version-check --print, released=). Nothing to do when the demo
#      already runs <repo>:<that version>.
#   2. newest/datapallas-server-docker.zip downloaded and unzipped into a folder of its own, <dir>/<version>/DataPallas (a folder
#      of that name left by an earlier try is moved aside, never deleted); its docker-compose.yml must name <repo>:<version>.
#   3. docker-compose.override.yml (next to this script) put next to it: the proxy network, a memory limit, no-new-privileges,
#      no Docker socket, no host port, no MailHog.
#   4. the running demo stopped (docker compose down, from its own folder), and its data carried over: every folder it mounts under
#      /app (config, db, output, ...) copied into the new folder, the self-host page's upgrade, where the folders carry over as they
#      are. Copied, not moved: the previous folder stays as it was. RESET_DEMO_DATA=yes: the new bundle's own folders instead.
#   5. the new one started (docker compose up -d) and checked: it runs <repo>:<version> and answers 200 on / within
#      SMOKE_TIMEOUT_SECS (default 300). When it does not, it is stopped and the previous folder started again.
#   6. the demo links (asbl/ci/demo-links.sh --target <settings>, as after every publish) when the settings file feeds a website.
#      Never undoes the install: the demo runs at that point; it says what to run instead.
# RESET_DEMO_DATA=yes only matters when a new version is installed. The last line says what happened:
#   DEMO_INSTALL result=installed|nothing-to-do|dry-run|failed|rolled-back
#
# Places (environment; the defaults are the real ones, a test points them at a throwaway install):
#   DEMO_INSTALL_DIR       where the version folders go  (default /var/kraft-internalsystems/apps/program-files/custom-datapallas-demo-public)
#   DEMO_INSTALL_URL       the zip, http(s):// or file:// (default <downloads>/newest/datapallas-server-docker.zip)
#   DEMO_INSTALL_APP       the demo's container           (default datapallas-demo-public, as the override names it)
#   DEMO_INSTALL_OVERRIDE  the override file              (default the one next to this script)
#   DEMO_INSTALL_SETTINGS  the publish settings file      (default /var/kraft-internalsystems/config/datapallas-ci/demo-datapallas-com.env)
#   DEMO_RELEASE_VERSION   the version to install         (default the released one)
#   RELEASE_IMAGE_REPO     the image's repository         (default flowkraft/datapallas-server)
set -uo pipefail
HERE=$(cd "$(dirname "$0")" && pwd)
cd "$HERE/../../.." || exit 2

DIR=${DEMO_INSTALL_DIR:-/var/kraft-internalsystems/apps/program-files/custom-datapallas-demo-public}
URL=${DEMO_INSTALL_URL:-https://downloads.datapallas.com/file/datapallas/newest/datapallas-server-docker.zip}
APP=${DEMO_INSTALL_APP:-datapallas-demo-public}
OVERRIDE=${DEMO_INSTALL_OVERRIDE:-$HERE/docker-compose.override.yml}
SETTINGS=${DEMO_INSTALL_SETTINGS:-/var/kraft-internalsystems/config/datapallas-ci/demo-datapallas-com.env}
IMAGE_REPO=${RELEASE_IMAGE_REPO:-flowkraft/datapallas-server}
DRY=0; case "${DRY_RUN:-no}" in yes|1) DRY=1 ;; no|0) ;; *) echo "FAIL  DRY_RUN must be no or yes (got '$DRY_RUN')"; exit 2 ;; esac
RESET=0; case "${RESET_DEMO_DATA:-no}" in yes) RESET=1 ;; no) ;; *) echo "FAIL  RESET_DEMO_DATA must be no or yes"; exit 2 ;; esac

say() { echo "$(date -u +%H:%M:%S) $*"; }
end() { echo "DEMO_INSTALL result=$1"; exit "$2"; }
fail() { say "FAIL  $1"; end failed 1; }

# 1. the version, and what runs now
v=${DEMO_RELEASE_VERSION:-}
if [ -z "$v" ]; then
  line=$(bash asbl/ci/release-state.sh version-check --print)
  v=$(printf '%s\n' "$line" | sed -n 's/.* released=\([0-9][0-9.]*\):.*/\1/p')
  [ -n "$v" ] || fail "no released version to install ($line)"
fi
printf '%s' "$v" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+$' || fail "'$v' is not a version (x.y.z)"
want="$IMAGE_REPO:$v"; dest="$DIR/$v"; app_dir="$dest/DataPallas"
running=$(docker inspect -f '{{.Config.Image}}' "$APP" 2>/dev/null)
say "the released version: $v ($want); $APP runs: ${running:-nothing}"
if [ "$running" = "$want" ]; then
  say "the demo already runs the released version: nothing to do"
  [ "$RESET" = 0 ] || say "(RESET_DEMO_DATA=yes applies when a new release is installed)"
  end nothing-to-do 0
fi

# the running demo: how it was started (its compose labels) and the data folders it mounts
OLD=(); old_wd=""; MOUNTS=""
if [ -n "$running" ]; then
  p=$(docker inspect -f '{{index .Config.Labels "com.docker.compose.project"}}' "$APP")
  old_wd=$(docker inspect -f '{{index .Config.Labels "com.docker.compose.project.working_dir"}}' "$APP")
  files=$(docker inspect -f '{{index .Config.Labels "com.docker.compose.project.config_files"}}' "$APP")
  [ -n "$p" ] && [ -n "$old_wd" ] && [ -n "$files" ] || fail "$APP was not started by docker compose: stop it by hand first"
  OLD=(docker compose -p "$p" --project-directory "$old_wd"); for f in ${files//,/ }; do OLD+=(-f "$f"); done
  case "$old_wd/" in "$dest"/*) fail "$APP runs from $old_wd, inside $dest, but not $want: look at it by hand" ;; esac
  MOUNTS=$(docker inspect -f '{{range .Mounts}}{{if eq .Type "bind"}}{{.Source}}|{{.Destination}}{{"\n"}}{{end}}{{end}}' "$APP" |
    while IFS='|' read -r src dst; do
      rel=${dst#/app/}
      case "$dst" in /app/*) ;; *) continue ;; esac   # the Docker socket and anything else outside /app is not data
      case "$rel" in ""|*..*) continue ;; esac
      echo "$src|$rel"
    done)
fi

if [ "$DRY" = 1 ]; then
  say "dry run: would download $URL and unzip it into $app_dir$([ -e "$dest" ] && echo " ($dest exists: moved aside first)")"
  say "dry run: would check that its docker-compose.yml names $want, and put $OVERRIDE next to it"
  if [ -n "$running" ]; then
    say "dry run: would stop the running demo: ${OLD[*]} down"
    if [ "$RESET" = 1 ]; then say "dry run: RESET_DEMO_DATA=yes: would start from the bundle's own folders (the previous folder keeps its data)"
    else printf '%s\n' "$MOUNTS" | while IFS='|' read -r src rel; do [ -n "$src" ] && say "dry run: would copy $src -> $app_dir/$rel"; done; fi
  fi
  say "dry run: would start it (docker compose up -d in $app_dir), check it runs $want and answers 200, else stop it and start the previous one again"
  [ -f "$SETTINGS" ] && grep -q '^DEMO_SITE_ENV=' "$SETTINGS" && say "dry run: would then run asbl/ci/demo-links.sh --target $SETTINGS"
  end dry-run 0
fi

# 2. the release's bundle, in a folder of its own
[ -f "$OVERRIDE" ] || fail "no override file $OVERRIDE"
mkdir -p "$DIR" || fail "cannot create $DIR"
tmp=$(mktemp -d "$DIR/.download-XXXXXX") || fail "cannot create a download folder in $DIR"
trap 'rm -rf "$tmp"' EXIT
say "downloading $URL"
curl -fsSL --max-time 1800 -o "$tmp/bundle.zip" "$URL" || fail "cannot download $URL"
say "downloaded: sha256 $(sha256sum "$tmp/bundle.zip" | cut -c1-16)..."
unzip -q "$tmp/bundle.zip" -d "$tmp/x" || fail "cannot unzip $URL"
[ -f "$tmp/x/DataPallas/docker-compose.yml" ] || fail "the zip has no DataPallas/docker-compose.yml"
img=$(sed -n 's/^ *image: *\([^ ]*\) *$/\1/p' "$tmp/x/DataPallas/docker-compose.yml" | grep -F "$IMAGE_REPO:" | head -1)
[ "$img" = "$want" ] || fail "the zip's docker-compose.yml names ${img:-no $IMAGE_REPO image}, not $want: is newest/ the released version?"
if [ -e "$dest" ]; then
  mv "$dest" "$dest.replaced-$(date -u +%Y%m%dT%H%M%SZ)" || fail "cannot move the earlier $dest aside"
  say "an earlier $dest was moved aside"
fi
mkdir -p "$dest" && mv "$tmp/x/DataPallas" "$app_dir" || fail "cannot put the bundle in $app_dir"
cp "$OVERRIDE" "$app_dir/docker-compose.override.yml" || fail "cannot put the override in $app_dir"
say "the bundle of $v is in $app_dir, with docker-compose.override.yml"

# 3. the switch: the old one stopped, its data copied over, the new one started and checked
if [ -n "$running" ]; then
  "${OLD[@]}" down || fail "cannot stop the running demo (${OLD[*]} down)"
  say "stopped the running demo ($old_wd)"
  if [ "$RESET" = 1 ]; then
    say "RESET_DEMO_DATA=yes: the bundle's own folders (the previous folder keeps its data)"
  else
    while IFS='|' read -r src rel; do
      [ -n "$src" ] && [ -d "$src" ] || continue
      rm -rf "${app_dir:?}/$rel" && mkdir -p "$(dirname "$app_dir/$rel")" && cp -a "$src" "$app_dir/$rel" ||
        { say "FAIL  cannot copy $src"; "${OLD[@]}" up -d; end failed 1; }
      say "carried over: $src -> $app_dir/$rel"
    done <<< "$MOUNTS"
  fi
fi
rollback() {
  say "!!! $1: stopping it, starting the previous one again"
  (cd "$app_dir" && docker compose down)
  if [ -n "$running" ]; then "${OLD[@]}" up -d && say "rolled back: $old_wd runs again ($running)"; else say "there was no previous demo"; fi
  end rolled-back 1
}
(cd "$app_dir" && docker compose up -d) || rollback "docker compose up -d failed"
deadline=$(( $(date +%s) + ${SMOKE_TIMEOUT_SECS:-300} )); code=""
while [ "$(date +%s)" -lt "$deadline" ]; do
  code=$(docker exec "$APP" curl -s -o /dev/null -m 10 -w '%{http_code}' http://localhost:9090/ 2>/dev/null)
  [ "$code" = 200 ] && break
  sleep 5
done
now=$(docker inspect -f '{{.Config.Image}}' "$APP" 2>/dev/null)
say "check: $APP runs ${now:-nothing}, http://localhost:9090/ inside -> ${code:-no answer} (expected $want, 200)"
[ "$now" = "$want" ] && [ "$code" = 200 ] || rollback "the new demo is not right"
say "the demo runs $want from $app_dir"

# 4. the website's feed, as after every publish
if [ -f "$SETTINGS" ] && grep -q '^DEMO_SITE_ENV=' "$SETTINGS"; then
  tour="$app_dir/samples/reports/cubes/g-cube-country-sales-template.html"
  if DEMO_TOUR_TEMPLATES="$tour" DEMO_LINKS_WAIT_SECS=${DEMO_LINKS_WAIT_SECS:-600} bash asbl/ci/demo-links.sh --target "$SETTINGS"; then
    say "the demo links are set up"
  else
    say "!!! the demo runs, but its website feed is NOT set up: after the cause is fixed, run"
    say "!!!   DEMO_TOUR_TEMPLATES=$tour bash asbl/ci/demo-links.sh --target $SETTINGS"
  fi
fi
end installed 0
