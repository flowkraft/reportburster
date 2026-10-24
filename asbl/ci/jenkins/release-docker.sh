#!/bin/bash
# Job dp-ci-release-step2-release-docker: the Docker release, MODE=rehearsal (the default) or MODE=public. Built once, on
# this host (owner, 2026-10-22: "docker image should be built once, prefereably on Linux and published from Linux"),
# proven as a user meets it on Linux and on Windows without a registry (the zip the build made, installed the way the
# self-host page says, datapallas.com/docs/server/self-host, against the image the build made), and only then uploaded
# where users do not get it, when UPLOAD=yes. Plain script, run on the host: Jenkins calls it over SSH, it also runs by hand.
#
#   MODE=rehearsal|public UPLOAD=no|yes DRY_RUN=no|yes  bash asbl/ci/jenkins/release-docker.sh
#
# MODE=rehearsal: build, prove, upload, in that order; nothing users get changes.
#   DOCKER RELEASE STEP 1/6  the version gate and the prerequisites: this checkout on origin/main (nothing built), then
#                            release-state.sh version-check docker. Nothing to release ends here, green. Then the
#                            prerequisites, within seconds (asbl/ci/release-publish.sh preflight docker: the Windows VM of
#                            part 4, and with UPLOAD=yes the tools, the publish credentials and that they work): any
#                            missing = FAILED, each named with what to provide, nothing built. Then the step 1 guard: step
#                            1 not green on this commit = REFUSED, within seconds, naming step 1 (it never runs a step 1 lane)
#   DOCKER RELEASE STEP 2/6  the build of origin/main, only when there is none yet (dp-ci.sh build-if-needed): the image
#                            <repo>:<version>-<commit> and asbl/dist/datapallas-server-docker.zip, the artifact proven below
#   DOCKER RELEASE STEP 3/6  Linux proof, no registry: the docker-server lane installs that zip as the self-host page says,
#                            its compose's <repo>:<version> being the build's image (never pulled), the light set, then the
#                            one-command docker run of that image (E2E_DOCKER_ONE_COMMAND=yes)
#   DOCKER RELEASE STEP 4/6  Windows proof, no registry: the windows-vm-docker lane (dp-ci.sh win docker-e2e) carries the
#                            same image to the VM (docker save, copy, docker load, tagged as the compose names it), installs
#                            the same zip in Docker Desktop, the light set
#   Parts 3 and 4 both run, so one run shows every problem. A red one: rehearsal.docker FAIL, nothing pushed or staged.
#   DOCKER RELEASE STEP 5/6  guard: origin/main still this commit, step 1 still green on it, the image and the zip still the
#                            ones proven (image id, sha256)
#   DOCKER RELEASE STEP 6/6  the upload (release-publish.sh stage-docker): UPLOAD=yes: :<version> pushed (never :latest) and
#                            the docker zip in rehearsal/<version>-<commit>/, both checked, then rehearsal.docker PASS
#                            (upload=yes), which MODE=public copies. UPLOAD=no (the default): the exact commands it would
#                            run, nothing written to Docker Hub or the bucket, no credential read; rehearsal.docker PASS
#                            upload=no, which MODE=public never copies.
# MODE=public: the public release, the deliberate act: it refuses at once unless UPLOAD=yes. It never replaces public files
# with files that did not pass a rehearsal that uploaded them.
#   DOCKER RELEASE STEP 1/6  the version gate, as above: this version already public = nothing to release, green
#   then the newest PASSED, uploaded rehearsal of this version (release-state.sh rehearsed docker <version>, on whichever
#   commit), and the prerequisites of what follows, all at the start (preflight docker public: the Cloudflare token too;
#   with copy when only the copy follows, which needs no VM):
#     found: DOCKER PUBLIC, the copy, minutes (release-publish.sh publish docker): the rehearsed zip to newest/ and
#            <version>/, :latest pointed at the rehearsed :<version>, newest/docker-version.txt, public.docker recorded;
#     none:  "no passed rehearsal of <version> on the docker channel: rehearsing first", the rehearsal above on origin/main
#            (UPLOAD=yes), then the copy, only when the rehearsal is green. A red rehearsal leaves the public files as they are.
# DRY_RUN=yes, both modes: builds, proves, pushes, uploads and copies nothing: the gate, the prerequisites (UPLOAD=yes: the
# bucket listed, not written), the guards, which rehearsal it would copy or that it would rehearse first, and what each part
# would do. One Windows run at a time: part 4 refuses to start while another Windows run is going (the prerequisites check
# it first). RELEASE_PUBLISH_ENV and RELEASE_DOWNLOAD_BASE are the ones of release-publish.sh (a test points them at a
# fixture).
set -uo pipefail
cd "$(dirname "$0")/../../.." || exit 2
. asbl/ci/marks.sh

MODE="${MODE:-rehearsal}"
case "$MODE" in rehearsal|public) ;; *) echo "FAIL  MODE must be rehearsal or public (got '$MODE')"; exit 2 ;; esac
DRY="${DRY_RUN:-no}"
case "$DRY" in no|yes) ;; *) echo "FAIL  DRY_RUN must be no or yes (got '$DRY')"; exit 2 ;; esac
UPLOAD="${UPLOAD:-no}"
case "$UPLOAD" in no|yes) ;; *) echo "FAIL  UPLOAD must be no or yes (got '$UPLOAD')"; exit 2 ;; esac
export UPLOAD   # release-publish.sh reads it at every upload
RELEASE_DOWNLOAD_BASE="${RELEASE_DOWNLOAD_BASE:-https://downloads.datapallas.com/file/datapallas}"
RELEASE_IMAGE_REPO="${RELEASE_IMAGE_REPO:-flowkraft/datapallas-server}"
LOG_DIR="${LOG_DIR:-/var/kraft-internalsystems/logs/datapallas-ci}"
STATE="bash asbl/ci/release-state.sh"

main() {
  local out gate rc v c reh
  echo "DOCKER RELEASE: mode=$MODE upload=$UPLOAD dry_run=$DRY  checkout: $(git log -1 --format='%h %s')"
  if [ "$MODE" = public ] && [ "$UPLOAD" != yes ]; then
    echo "REFUSED: MODE=public publishes, the deliberate act: run it with UPLOAD=yes. Nothing was built, proven, pushed or copied."
    echo "DOCKER_RELEASE_RESULT refused: MODE=public needs UPLOAD=yes"
    return 1
  fi

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

# rehearse <version> <commit>: DOCKER RELEASE STEP 2/6 .. 6/6: build, prove on Linux and Windows, then the upload
rehearse() {
  local v="$1" c="$2" dry=0 out rc tag image_id zip=asbl/dist/datapallas-server-docker.zip zip_sha light rehearsal url
  local res_linux=NOT_RUN res_windows=NOT_RUN
  [ "$DRY" = yes ] && dry=1
  mark_next "DOCKER RELEASE STEP 2/6" "the build of origin/main, only when there is none yet (dp-ci.sh build-if-needed)"
  out=$(mktemp) || return 1
  DRY_RUN=$dry bash asbl/ci/dp-ci.sh build-if-needed 2>&1 | tee "$out"; rc=${PIPESTATUS[0]}
  tag=$(sed -n 's/^BUILD_TAG=//p' "$out" | tail -1); rm -f "$out"
  [ "$rc" = 0 ] || { echo "FAILED: no build of ${c:0:8} (above)"; return 1; }
  [ "$(git rev-parse HEAD)" = "$c" ] || { echo "FAILED: origin/main moved during the run (${c:0:8} -> $(git rev-parse --short HEAD)): run it again"; return 1; }
  # the light set: the Windows lanes' WIN_LIGHT_SPEC, read from dp-ci.sh so there is one list
  light=$(sed -n "s/^WIN_LIGHT_SPEC='\(.*\)'\$/\1/p" asbl/ci/dp-ci.sh)
  [ -n "$light" ] || { echo "FAILED: no WIN_LIGHT_SPEC in asbl/ci/dp-ci.sh"; return 1; }
  if [ "$dry" = 1 ]; then
    mark_next "DOCKER RELEASE STEP 3/6" "Linux proof (dry run)"
    echo "dry run: would install asbl/dist/datapallas-server-docker.zip of the build on this host against the build's image (no registry), the light set, the one-command run"
    mark_next "DOCKER RELEASE STEP 4/6" "Windows proof (dry run)"
    echo "dry run: would load the build's image on the VM (docker save, copy, docker load) and install the same zip in its Docker Desktop, the light set"
    mark_next "DOCKER RELEASE STEP 5/6" "guard (dry run)"
    echo "dry run: would check that origin/main is still ${c:0:8}, step 1 still green, the image and the zip still the proven ones"
    mark_next "DOCKER RELEASE STEP 6/6" "the upload (dry run, UPLOAD=$UPLOAD)"
    if [ "$UPLOAD" = yes ]; then echo "dry run: would push the build's image as :$v (never :latest), stage datapallas-server-docker.zip in rehearsal/$v-${c:0:8}/ and record rehearsal.docker"
    else echo "dry run: UPLOAD=no: would print the push and the upload it skips, write nothing, and record rehearsal.docker upload=no"; fi
    mark_end 0; return 0
  fi
  [ -n "$tag" ] || { echo "FAILED: dp-ci.sh build-if-needed printed no BUILD_TAG (above)"; return 1; }
  image_id=$(docker image inspect "$RELEASE_IMAGE_REPO:$tag" --format '{{.Id}}' 2>/dev/null) ||
    { echo "FAILED: the build's image $RELEASE_IMAGE_REPO:$tag is not on this host"; return 1; }
  [ -s "$zip" ] || { echo "FAILED: $zip is missing (the build's)"; return 1; }
  zip_sha=$(sha256sum "$zip" | cut -d' ' -f1)
  echo "the artifact under proof: $RELEASE_IMAGE_REPO:$tag ($image_id) and $zip (sha256 $zip_sha)"

  mark_next "DOCKER RELEASE STEP 3/6" "Linux proof, no registry: $zip installed as the self-host page says against $RELEASE_IMAGE_REPO:$tag, the light set, the one-command run"
  # E2E_DOCKER_FROM_URL empty = the build's own zip and image (docker-server never pulls them); retries 1, as the Windows light set has
  if E2E_TARGET=docker-server E2E_SPEC="$light" E2E_GREP="" E2E_RETRIES=1 E2E_DOCKER_FROM_URL="" E2E_DOCKER_ONE_COMMAND=yes \
     FOLLOW_PIDFILE="" bash asbl/ci/jenkins/follow-ci.sh run bash asbl/ci/dp-ci.sh e2e; then res_linux=PASS; else res_linux=FAIL; fi
  mark_end "$([ "$res_linux" = PASS ] && echo 0 || echo 1)"
  mark_start "DOCKER RELEASE STEP 4/6" "Windows proof, no registry: the same image loaded on the VM, the same zip installed in its Docker Desktop, the light set"
  # empty filters = the lane's light set (WIN_LIGHT_SPEC, retries 1); E2E_DOCKER_FROM_URL empty = the build's image copied over, the build's zip
  if E2E_SPEC="" E2E_GREP="" E2E_RETRIES="" E2E_DOCKER_FROM_URL="" FOLLOW_PIDFILE="$LOG_DIR/win-e2e.pid" \
     bash asbl/ci/jenkins/follow-ci.sh run bash asbl/ci/jenkins/win-e2e.sh docker-e2e; then res_windows=PASS; else res_windows=FAIL; fi
  mark_end "$([ "$res_windows" = PASS ] && echo 0 || echo 1)"
  if [ "$res_linux" != PASS ] || [ "$res_windows" != PASS ]; then
    RELEASE_COMMIT="$c" $STATE record rehearsal.docker FAIL "version=$v" "linux=$res_linux" "windows=$res_windows" "upload=NOT_RUN" "image=$RELEASE_IMAGE_REPO:$tag"
    echo "DOCKER_RELEASE_RESULT commit=${c:0:8} version=$v rehearsal=FAIL linux=$res_linux windows=$res_windows upload=NOT_RUN (nothing pushed or staged: Docker Hub and the bucket are as they were)"
    [ "$MODE" = public ] && echo "MODE=public: the rehearsal is red, nothing copied: the public files are as they were"
    return 1
  fi

  mark_start "DOCKER RELEASE STEP 5/6" "guard: origin/main still ${c:0:8}, step 1 still green on it, the image and the zip still the proven ones"
  if ! git fetch -q origin || [ "$(git rev-parse origin/main)" != "$c" ]; then
    echo "FAILED: origin/main moved since the start (or could not be read): nothing pushed or staged; run it again"; return 1
  fi
  RELEASE_COMMIT="$c" $STATE step1-guard || return 1
  [ "$(docker image inspect "$RELEASE_IMAGE_REPO:$tag" --format '{{.Id}}' 2>/dev/null)" = "$image_id" ] && [ "$(sha256sum "$zip" | cut -d' ' -f1)" = "$zip_sha" ] ||
    { echo "FAILED: the image or the zip changed since the proofs (a build ran meanwhile?): nothing pushed or staged; run it again"; return 1; }
  echo "ok: the image and the zip are the ones proven"

  if [ "$UPLOAD" = yes ]; then mark_next "DOCKER RELEASE STEP 6/6" "the upload, UPLOAD=yes: :$v pushed, the docker zip in rehearsal/$v-${c:0:8}/ (release-publish.sh stage-docker)"
  else mark_next "DOCKER RELEASE STEP 6/6" "the upload, UPLOAD=no: nothing pushed or uploaded, the commands it would run printed (release-publish.sh stage-docker)"; fi
  RELEASE_COMMIT="$c" RELEASE_PROVEN_IMAGE_ID="$image_id" RELEASE_PROVEN_ZIP_SHA256="$zip_sha" bash asbl/ci/release-publish.sh stage-docker || {
    RELEASE_COMMIT="$c" $STATE record rehearsal.docker FAIL "version=$v" "linux=PASS" "windows=PASS" "upload=FAIL"; echo "FAILED: not uploaded (above)"
    echo "DOCKER_RELEASE_RESULT commit=${c:0:8} version=$v rehearsal=FAIL linux=PASS windows=PASS upload=FAIL"; return 1; }
  if [ "$UPLOAD" != yes ]; then
    RELEASE_COMMIT="$c" $STATE record rehearsal.docker PASS "version=$v" "linux=PASS" "windows=PASS" "upload=no" "image=$RELEASE_IMAGE_REPO:$tag" "zip_sha256=$zip_sha"
    echo "DOCKER_RELEASE_RESULT commit=${c:0:8} version=$v rehearsal=PASS linux=PASS windows=PASS upload=no (proven; nothing pushed or staged, nothing for MODE=public to copy: run it again with UPLOAD=yes)"
    return 0
  fi
  rehearsal=$(RELEASE_COMMIT="$c" $STATE get rehearsal.docker-stage rehearsal)
  url="$RELEASE_DOWNLOAD_BASE/${rehearsal%/}/datapallas-server-docker.zip"
  RELEASE_COMMIT="$c" $STATE record rehearsal.docker PASS "version=$v" "linux=PASS" "windows=PASS" "upload=yes" "zip=$url"
  echo "DOCKER_RELEASE_RESULT commit=${c:0:8} version=$v rehearsal=PASS linux=PASS windows=PASS upload=yes"
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
if [ "$rc" -eq 0 ]; then echo "DOCKER_RELEASE=SUCCESS mode=$MODE upload=$UPLOAD dry_run=$DRY"; else echo "DOCKER_RELEASE=FAILED mode=$MODE upload=$UPLOAD dry_run=$DRY"; fi
exit "$rc"
