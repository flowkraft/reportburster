#!/bin/bash
# Job dp-ci-release-step2-pack-and-uat-docker: the Docker release, step 2 of 4. Built once, on this host (owner,
# 2026-10-22: "docker image should be built once, prefereably on Linux and published from Linux"), staged, then installed
# from the download the way a user installs it (datapallas.com/docs/server/self-host), on Linux and on Windows. Plain
# script, run on the host: Jenkins calls it over SSH, it also runs by hand.
#
#   DRY_RUN=no|yes  bash asbl/ci/jenkins/release-docker.sh
#
#   DOCKER RELEASE STEP 1/6  the version gate: this checkout on origin/main (nothing built), then release-state.sh
#                            version-check. Nothing to release (settings.xml = the released version) ends here, green.
#   DOCKER RELEASE STEP 2/6  the build of origin/main, only when there is none yet (dp-ci.sh build-if-needed)
#   DOCKER RELEASE STEP 3/6  guards: step 1 green on this commit (release-state.sh require step1), the publish
#                            credentials file present and root-only (never read here)
#   DOCKER RELEASE STEP 4/6  stage (asbl/ci/release-publish.sh stage-docker): :<version> pushed (never :latest), the
#                            docker zip in candidate/<version>-<commit>/, both checked
#   DOCKER RELEASE STEP 5/6  Linux: the docker-server lane installing from that candidate zip (E2E_DOCKER_FROM_URL), the
#                            light set, then the one-command docker run
#   DOCKER RELEASE STEP 6/6  Windows: the same install in the VM's Docker Desktop (dp-ci.sh win docker-e2e), the light set
# Parts 5 and 6 both run, so one run shows every problem. Records step2.docker (PASS, or FAIL with the parts' results).
# No public link moves: step 4 (dp-ci-release-step4-publish) publishes. One Windows run at a time: part 6 refuses to
# start while another Windows run is going. DRY_RUN=yes builds, pushes and installs nothing: it says what would happen.
# RELEASE_PUBLISH_ENV and RELEASE_DOWNLOAD_BASE are the ones of release-publish.sh (a test points them at a fixture).
set -uo pipefail
cd "$(dirname "$0")/../../.." || exit 2
. asbl/ci/marks.sh

DRY="${DRY_RUN:-no}"
case "$DRY" in no|yes) ;; *) echo "FAIL  DRY_RUN must be no or yes (got '$DRY')"; exit 2 ;; esac
RELEASE_PUBLISH_ENV="${RELEASE_PUBLISH_ENV:-/var/kraft-internalsystems/config/datapallas-ci/release-publish.env}"
RELEASE_DOWNLOAD_BASE="${RELEASE_DOWNLOAD_BASE:-https://downloads.datapallas.com/file/datapallas}"
LOG_DIR="${LOG_DIR:-/var/kraft-internalsystems/logs/datapallas-ci}"
STATE="bash asbl/ci/release-state.sh"

main() {
  local dry=0 out gate rc v c candidate url light res_linux=NOT_RUN res_windows=NOT_RUN
  [ "$DRY" = yes ] && dry=1
  echo "DOCKER RELEASE: dry_run=$DRY  checkout: $(git log -1 --format='%h %s')"

  mark_start "DOCKER RELEASE STEP 1/6" "the version gate: settings.xml of origin/main against the released version"
  # this checkout on origin/main first, so the gate reads the version that would be released (DRY_RUN=1: no build)
  out=$(DRY_RUN=1 bash asbl/ci/dp-ci.sh build-if-needed 2>&1) ||
    { printf '%s\n' "$out"; echo "FAILED: could not put this checkout on origin/main (dp-ci.sh build-if-needed, above)"; return 1; }
  echo "this checkout on origin/main: $(git log -1 --format='%h %s')"
  gate=$($STATE version-check); rc=$?
  printf '%s\n' "$gate"
  case "$rc" in
    0) v=$(printf '%s\n' "$gate" | sed -n 's/^RELEASE_VERSION=\([^ ]*\) .*/\1/p') ;;
    3) echo "DOCKER_RELEASE_RESULT nothing to release: nothing built, pushed or installed"; mark_end 0; return 0 ;;
    *) echo "FAILED: refused by the version gate (above)"; return 1 ;;
  esac
  c=$(git rev-parse HEAD)

  mark_next "DOCKER RELEASE STEP 2/6" "the build of origin/main, only when there is none yet (dp-ci.sh build-if-needed)"
  DRY_RUN=$dry bash asbl/ci/dp-ci.sh build-if-needed || { echo "FAILED: no build of ${c:0:8} (above)"; return 1; }
  [ "$(git rev-parse HEAD)" = "$c" ] || { echo "FAILED: origin/main moved during the run (${c:0:8} -> $(git rev-parse --short HEAD)): run it again"; return 1; }

  mark_next "DOCKER RELEASE STEP 3/6" "guards: step 1 green on ${c:0:8}, the publish credentials file present"
  RELEASE_COMMIT="$c" $STATE require step1 || { echo "FAILED: step 1 is not green on ${c:0:8}: run the missing or red lanes first"; return 1; }
  [ -f "$RELEASE_PUBLISH_ENV" ] && [ "$(stat -c %a "$RELEASE_PUBLISH_ENV")" = 600 ] ||
    { echo "FAILED: $RELEASE_PUBLISH_ENV is missing or not mode 600: the owner writes it (DOCKERHUB_USER, DOCKERHUB_TOKEN, RCLONE_CONFIG, CLOUDFLARE_PURGE_TOKEN, CLOUDFLARE_ZONE_ID)"; return 1; }
  echo "the publish credentials file is there, mode 600 (not read here)"
  if [ "$dry" = 1 ]; then
    mark_next "DOCKER RELEASE STEP 4/6" "stage (dry run)"
    echo "dry run: would push the build's image as :$v (never :latest) and stage datapallas-server-docker.zip in candidate/$v-${c:0:8}/"
    mark_next "DOCKER RELEASE STEP 5/6" "Linux install (dry run)"
    echo "dry run: would install from $RELEASE_DOWNLOAD_BASE/candidate/$v-${c:0:8}/datapallas-server-docker.zip on this host, the light set, the one-command run"
    mark_next "DOCKER RELEASE STEP 6/6" "Windows install (dry run)"
    echo "dry run: would do the same in the VM's Docker Desktop"
    mark_end 0; return 0
  fi

  mark_next "DOCKER RELEASE STEP 4/6" "stage: :$v pushed, the docker zip in candidate/$v-${c:0:8}/ (release-publish.sh stage-docker)"
  bash asbl/ci/release-publish.sh stage-docker || {
    RELEASE_COMMIT="$c" $STATE record step2.docker FAIL "version=$v" "stage=FAIL"; echo "FAILED: not staged (above)"; return 1; }
  candidate=$(RELEASE_COMMIT="$c" $STATE get step2.docker-stage candidate)
  url="$RELEASE_DOWNLOAD_BASE/${candidate%/}/datapallas-server-docker.zip"
  # the light set: the Windows lanes' WIN_LIGHT_SPEC, read from dp-ci.sh so there is one list
  light=$(sed -n "s/^WIN_LIGHT_SPEC='\(.*\)'\$/\1/p" asbl/ci/dp-ci.sh)
  [ -n "$light" ] || { echo "FAILED: no WIN_LIGHT_SPEC in asbl/ci/dp-ci.sh"; return 1; }

  mark_next "DOCKER RELEASE STEP 5/6" "Linux: the self-host install from $url, the light set, the one-command run"
  # retries 1, as the Windows light set has
  if E2E_TARGET=docker-server E2E_SPEC="$light" E2E_GREP="" E2E_RETRIES=1 E2E_DOCKER_FROM_URL="$url" \
     FOLLOW_PIDFILE="" bash asbl/ci/jenkins/follow-ci.sh run bash asbl/ci/dp-ci.sh e2e; then res_linux=PASS; else res_linux=FAIL; fi
  mark_end "$([ "$res_linux" = PASS ] && echo 0 || echo 1)"
  mark_start "DOCKER RELEASE STEP 6/6" "Windows: the same install in the VM's Docker Desktop, the light set"
  # empty filters = the lane's light set (WIN_LIGHT_SPEC, retries 1)
  if E2E_SPEC="" E2E_GREP="" E2E_RETRIES="" E2E_DOCKER_FROM_URL="$url" FOLLOW_PIDFILE="$LOG_DIR/win-e2e.pid" \
     bash asbl/ci/jenkins/follow-ci.sh run bash asbl/ci/jenkins/win-e2e.sh docker-e2e; then res_windows=PASS; else res_windows=FAIL; fi
  mark_end "$([ "$res_windows" = PASS ] && echo 0 || echo 1)"

  if [ "$res_linux" = PASS ] && [ "$res_windows" = PASS ]; then
    RELEASE_COMMIT="$c" $STATE record step2.docker PASS "version=$v" "linux=PASS" "windows=PASS" "zip=$url"
    echo "DOCKER_RELEASE_RESULT commit=${c:0:8} version=$v stage=PASS linux=PASS windows=PASS"; return 0
  fi
  RELEASE_COMMIT="$c" $STATE record step2.docker FAIL "version=$v" "linux=$res_linux" "windows=$res_windows" "zip=$url"
  echo "DOCKER_RELEASE_RESULT commit=${c:0:8} version=$v stage=PASS linux=$res_linux windows=$res_windows"
  return 1
}

mark_run main
rc=$?
if [ "$rc" -eq 0 ]; then echo "DOCKER_RELEASE=SUCCESS dry_run=$DRY"; else echo "DOCKER_RELEASE=FAILED dry_run=$DRY"; fi
exit "$rc"
