#!/bin/bash
# Job dp-ci-release-step2-release-docker: the Docker release, MODE=rehearsal (the default) or MODE=public. Built once, on
# this host (owner, 2026-10-22: "docker image should be built once, prefereably on Linux and published from Linux"),
# staged where users do not get it, then installed from that download the way a user installs it
# (datapallas.com/docs/server/self-host), on Linux and on Windows. Plain script, run on the host: Jenkins calls it over
# SSH, it also runs by hand.
#
#   MODE=rehearsal|public DRY_RUN=no|yes  bash asbl/ci/jenkins/release-docker.sh
#
# MODE=rehearsal: a real release into places users do not get; nothing users get changes.
#   DOCKER RELEASE STEP 1/6  the version gate and the prerequisites: this checkout on origin/main (nothing built), then
#                            release-state.sh version-check docker. Nothing to release ends here, green. Then the
#                            prerequisites, within seconds (asbl/ci/release-publish.sh preflight docker: the tools, the
#                            publish credentials and that they work, the Windows VM of part 6): any missing = FAILED, each
#                            named with what to provide, nothing built. Then the step 1 guard: step 1 not green on this
#                            commit = REFUSED, within seconds, naming step 1 (it never runs a step 1 lane)
#   DOCKER RELEASE STEP 2/6  the build of origin/main, only when there is none yet (dp-ci.sh build-if-needed)
#   DOCKER RELEASE STEP 3/6  guard: step 1 still green on this commit
#   DOCKER RELEASE STEP 4/6  stage (asbl/ci/release-publish.sh stage-docker): :<version> pushed (never :latest), the
#                            docker zip in rehearsal/<version>-<commit>/, both checked
#   DOCKER RELEASE STEP 5/6  Linux: the docker-server lane installing from that rehearsal zip (E2E_DOCKER_FROM_URL), the
#                            light set, then the one-command docker run
#   DOCKER RELEASE STEP 6/6  Windows: the same install in the VM's Docker Desktop (dp-ci.sh win docker-e2e), the light set
#   Parts 5 and 6 both run, so one run shows every problem. Records rehearsal.docker (PASS, or FAIL with the parts' results).
# MODE=public: the public release. It never replaces public files with files that did not pass a rehearsal.
#   DOCKER RELEASE STEP 1/6  the version gate, as above: this version already public = nothing to release, green
#   then the newest PASSED rehearsal of this version (release-state.sh rehearsed docker <version>, on whichever commit),
#   and the prerequisites of what follows, all at the start (preflight docker public: the Cloudflare token too; with
#   copy when only the copy follows, which needs no VM):
#     found: DOCKER PUBLIC, the copy, minutes (release-publish.sh publish docker): the rehearsed zip to newest/ and
#            <version>/, :latest pointed at the rehearsed :<version>, newest/docker-version.txt, public.docker recorded;
#     none:  "no passed rehearsal of <version> on the docker channel: rehearsing first", the rehearsal above on origin/main,
#            then the copy, only when the rehearsal is green. A red rehearsal leaves the public files as they are.
# DRY_RUN=yes, both modes: builds, pushes, installs and copies nothing: the gate, the prerequisites (the bucket listed,
# not written), the guards, which rehearsal it would copy or that it would rehearse first, and what each part would do.
# One Windows run at a time: part 6 refuses to start while another Windows run is going (the prerequisites check it
# first). RELEASE_PUBLISH_ENV and RELEASE_DOWNLOAD_BASE are the ones of release-publish.sh (a test points them at a
# fixture).
set -uo pipefail
cd "$(dirname "$0")/../../.." || exit 2
. asbl/ci/marks.sh

MODE="${MODE:-rehearsal}"
case "$MODE" in rehearsal|public) ;; *) echo "FAIL  MODE must be rehearsal or public (got '$MODE')"; exit 2 ;; esac
DRY="${DRY_RUN:-no}"
case "$DRY" in no|yes) ;; *) echo "FAIL  DRY_RUN must be no or yes (got '$DRY')"; exit 2 ;; esac
RELEASE_DOWNLOAD_BASE="${RELEASE_DOWNLOAD_BASE:-https://downloads.datapallas.com/file/datapallas}"
LOG_DIR="${LOG_DIR:-/var/kraft-internalsystems/logs/datapallas-ci}"
STATE="bash asbl/ci/release-state.sh"

main() {
  local out gate rc v c reh
  echo "DOCKER RELEASE: mode=$MODE dry_run=$DRY  checkout: $(git log -1 --format='%h %s')"

  mark_start "DOCKER RELEASE STEP 1/6" "the version gate and the prerequisites: settings.xml of origin/main against the released Docker version"
  # this checkout on origin/main first, so the gate reads the version that would be released (DRY_RUN=1: no build)
  out=$(DRY_RUN=1 bash asbl/ci/dp-ci.sh build-if-needed 2>&1) ||
    { printf '%s\n' "$out"; echo "FAILED: could not put this checkout on origin/main (dp-ci.sh build-if-needed, above)"; return 1; }
  echo "this checkout on origin/main: $(git log -1 --format='%h %s')"
  gate=$($STATE version-check docker); rc=$?
  printf '%s\n' "$gate"
  case "$rc" in
    0) v=$(printf '%s\n' "$gate" | sed -n 's/^RELEASE_VERSION=\([^ ]*\) .*/\1/p') ;;
    3) echo "DOCKER_RELEASE_RESULT nothing to release: nothing built, pushed, installed or copied"; mark_end 0; return 0 ;;
    *) echo "FAILED: refused by the version gate (above)"; return 1 ;;
  esac
  c=$(git rev-parse HEAD)
  if [ "$MODE" = public ]; then
    if reh=$($STATE rehearsed docker "$v"); then
      set -- $reh   # REHEARSED <commit> <time>
      echo "MODE=public: copying the rehearsal of $v that passed on ${2:0:8} ($3): nothing is built or tested again"
      prerequisites public copy || return 1
      mark_end 0
      copy "$v" "$2"; return $?
    fi
    printf '%s\n' "$reh"
    echo "no passed rehearsal of $v on the docker channel: rehearsing first (on ${c:0:8}, origin/main), then the copy"
  fi
  prerequisites $([ "$MODE" = public ] && echo public) || return 1
  RELEASE_COMMIT="$c" $STATE step1-guard || return 1
  rehearse "$v" "$c" || return 1
  [ "$MODE" = public ] || return 0
  if [ "$DRY" = yes ]; then
    echo "dry run: then would copy that rehearsal to the public places (release-publish.sh publish docker $v ${c:0:8})"
    return 0
  fi
  copy "$v" "$c"
}

# prerequisites [public] [copy]: what the run needs, checked within seconds, before anything slow (release-publish.sh preflight)
prerequisites() {
  DRY_RUN=$DRY bash asbl/ci/release-publish.sh preflight docker "$@" ||
    { echo "FAILED: prerequisites missing (above): nothing built, pushed, installed or copied"; return 1; }
}

# rehearse <version> <commit>: DOCKER RELEASE STEP 2/6 .. 6/6, into places users do not get
rehearse() {
  local v="$1" c="$2" dry=0 rehearsal url light res_linux=NOT_RUN res_windows=NOT_RUN
  [ "$DRY" = yes ] && dry=1
  mark_next "DOCKER RELEASE STEP 2/6" "the build of origin/main, only when there is none yet (dp-ci.sh build-if-needed)"
  DRY_RUN=$dry bash asbl/ci/dp-ci.sh build-if-needed || { echo "FAILED: no build of ${c:0:8} (above)"; return 1; }
  [ "$(git rev-parse HEAD)" = "$c" ] || { echo "FAILED: origin/main moved during the run (${c:0:8} -> $(git rev-parse --short HEAD)): run it again"; return 1; }

  mark_next "DOCKER RELEASE STEP 3/6" "guard: step 1 still green on ${c:0:8}"
  RELEASE_COMMIT="$c" $STATE step1-guard || return 1
  if [ "$dry" = 1 ]; then
    mark_next "DOCKER RELEASE STEP 4/6" "stage (dry run)"
    echo "dry run: would push the build's image as :$v (never :latest) and stage datapallas-server-docker.zip in rehearsal/$v-${c:0:8}/"
    mark_next "DOCKER RELEASE STEP 5/6" "Linux install (dry run)"
    echo "dry run: would install from $RELEASE_DOWNLOAD_BASE/rehearsal/$v-${c:0:8}/datapallas-server-docker.zip on this host, the light set, the one-command run"
    mark_next "DOCKER RELEASE STEP 6/6" "Windows install (dry run)"
    echo "dry run: would do the same in the VM's Docker Desktop, then record rehearsal.docker"
    mark_end 0; return 0
  fi

  mark_next "DOCKER RELEASE STEP 4/6" "stage: :$v pushed, the docker zip in rehearsal/$v-${c:0:8}/ (release-publish.sh stage-docker)"
  bash asbl/ci/release-publish.sh stage-docker || {
    RELEASE_COMMIT="$c" $STATE record rehearsal.docker FAIL "version=$v" "stage=FAIL"; echo "FAILED: not staged (above)"; return 1; }
  rehearsal=$(RELEASE_COMMIT="$c" $STATE get rehearsal.docker-stage rehearsal)
  url="$RELEASE_DOWNLOAD_BASE/${rehearsal%/}/datapallas-server-docker.zip"
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
    RELEASE_COMMIT="$c" $STATE record rehearsal.docker PASS "version=$v" "linux=PASS" "windows=PASS" "zip=$url"
    echo "DOCKER_RELEASE_RESULT commit=${c:0:8} version=$v rehearsal=PASS stage=PASS linux=PASS windows=PASS"; return 0
  fi
  RELEASE_COMMIT="$c" $STATE record rehearsal.docker FAIL "version=$v" "linux=$res_linux" "windows=$res_windows" "zip=$url"
  echo "DOCKER_RELEASE_RESULT commit=${c:0:8} version=$v rehearsal=FAIL stage=PASS linux=$res_linux windows=$res_windows"
  [ "$MODE" = public ] && echo "MODE=public: the rehearsal is red, nothing copied: the public files are as they were"
  return 1
}

# copy <version> <commit>: MODE=public's copy of the rehearsal that passed on <commit>
copy() {
  local rc
  mark_start "DOCKER PUBLIC" "the rehearsal of $1 on ${2:0:8} copied to the public places (release-publish.sh publish docker)"
  DRY_RUN=$DRY bash asbl/ci/release-publish.sh publish docker "$1" "$2"; rc=$?
  mark_end "$rc"
  if [ "$rc" != 0 ]; then echo "DOCKER_RELEASE_RESULT commit=${2:0:8} version=$1 public=FAIL"
  elif [ "$DRY" = yes ]; then echo "DOCKER_RELEASE_RESULT commit=${2:0:8} version=$1 public=DRY_RUN (nothing copied)"
  else echo "DOCKER_RELEASE_RESULT commit=${2:0:8} version=$1 public=PASS"; fi
  return "$rc"
}

mark_run main
rc=$?
if [ "$rc" -eq 0 ]; then echo "DOCKER_RELEASE=SUCCESS mode=$MODE dry_run=$DRY"; else echo "DOCKER_RELEASE=FAILED mode=$MODE dry_run=$DRY"; fi
exit "$rc"
