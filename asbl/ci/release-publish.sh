#!/bin/bash
# The release's uploads: what a release job stages, and later publishes, on Backblaze (downloads.datapallas.com) and
# Docker Hub. Run on the host, by the release jobs (asbl/ci/dp-ci.sh, asbl/ci/jenkins); the Windows VM never holds a
# credential. Each upload is checked by downloading it back the way a user gets it, and each verdict goes to the release
# record (asbl/ci/release-state.sh):
#
#   bash asbl/ci/release-publish.sh stage-files <version> <list> <dir>
#       The files of <list> (the pack's sha256 list, <log>-step-release-files.txt: 'commit', 'version' and 'sha256' lines;
#       a line with a note after the name, "(not shipped ...)", is not staged), taken from <dir>: each checked against its
#       sha256, uploaded to backblaze:datapallas/candidate/<version>-<commit>/, downloaded back from
#       downloads.datapallas.com and checked again. Records step3.windows (PASS with candidate= and sha256=, or FAIL with
#       reason=). Nothing outside candidate/ is written: no public link moves before step 4.
#
#   bash asbl/ci/release-publish.sh stage-docker
#       The Docker release, built once on this host: this checkout on origin/main and built (dp-ci.sh build-if-needed,
#       which builds only when there is no build of it yet), the version gate (release-state.sh version-check, whose
#       version must be the build's), step 1's Docker lanes green on this commit; then the build's image
#       <repo>:<version>-<commit> tagged and pushed as <repo>:<version> (never :latest; logged in with a throwaway
#       DOCKER_CONFIG, so this host's own docker login is never touched) and the registry's digest read back; then
#       asbl/dist/datapallas-server-docker.zip, the zip whose compose pins that tag, uploaded to
#       candidate/<version>-<commit>/ and checked by download. Records step2.docker-stage (digest=, which version-check
#       accepts as staged by a release, candidate=, sha256=). Exit 3 = nothing to release (nothing pushed).
#
#   DRY_RUN=no|yes  bash asbl/ci/release-publish.sh promote
#       Step 4, the publish (job dp-ci-release-step4-publish, the owner only), parts marked PUBLISH STEP 1/4 .. 4/4: this
#       checkout on origin/main, the version gate (nothing to release: green, nothing done), step2.docker and
#       step3.windows PASS on this commit for this version, staged in the same candidate folder, no step4.publish yet,
#       the registry's :<version> still the staged digest. Then the staged files copied server side to newest/ and to
#       <version>/ (the archive) and each newest/ file checked by download; the Cloudflare cache of the newest/ links
#       purged; :latest pointed at :<version> in the registry (no pull, no push of layers) and checked; step4.publish
#       recorded. A failure before :latest moves records nothing (run it again once fixed); :latest moved to anything
#       but the staged digest records step4.publish FAIL, and version-check then refuses until a person looks.
#       DRY_RUN=yes: the gate and the guards, then what each part would do.
#
# The commit is RELEASE_COMMIT (the full hash the list names). The credentials are the owner's root-only file
# (decision OD3, 2026-10-22), sourced silently, never printed: DOCKERHUB_USER, DOCKERHUB_TOKEN, RCLONE_CONFIG (the path of
# an rclone config with the 'backblaze' remote), CLOUDFLARE_PURGE_TOKEN, CLOUDFLARE_ZONE_ID.
# RELEASE_PUBLISH_ENV, RELEASE_RCLONE_REMOTE, RELEASE_DOWNLOAD_BASE, RELEASE_IMAGE_REPO and RELEASE_CLOUDFLARE_API are
# variables so a test can point them at a fixture (RELEASE_IMAGE_REPO: a local registry, e.g. localhost:5000/datapallas-server).
set -uo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
CALLER_PWD="$PWD"
cd "$HERE/../.." || exit 2

RELEASE_PUBLISH_ENV="${RELEASE_PUBLISH_ENV:-/var/kraft-internalsystems/config/datapallas-ci/release-publish.env}"
RELEASE_RCLONE_REMOTE="${RELEASE_RCLONE_REMOTE:-backblaze:datapallas}"
RELEASE_DOWNLOAD_BASE="${RELEASE_DOWNLOAD_BASE:-https://downloads.datapallas.com/file/datapallas}"
RELEASE_IMAGE_REPO="${RELEASE_IMAGE_REPO:-flowkraft/datapallas-server}"
RELEASE_CLOUDFLARE_API="${RELEASE_CLOUDFLARE_API:-https://api.cloudflare.com/client/v4}"

creds() {  # the OD3 file: present, mode 600, then sourced with no output at all
  [ -f "$RELEASE_PUBLISH_ENV" ] || {
    echo "FAIL  $RELEASE_PUBLISH_ENV is missing: the owner writes it (OD3), root-only, mode 600"; return 2; }
  [ "$(stat -c %a "$RELEASE_PUBLISH_ENV")" = 600 ] || {
    echo "FAIL  $RELEASE_PUBLISH_ENV must be mode 600 (it is $(stat -c %a "$RELEASE_PUBLISH_ENV")): not read"; return 2; }
  set -a; . "$RELEASE_PUBLISH_ENV" >/dev/null 2>&1; set +a
  return 0
}
abs() { case "$1" in /*|"") echo "$1" ;; *) echo "$CALLER_PWD/$1" ;; esac; }  # a path given relative to the caller
sha_of() { sha256sum "$1" 2>/dev/null | cut -d' ' -f1; }
# the sha256 of a published file as a user downloads it; the query string only gets past the CDN's cache
sha_by_download() { curl -fsSL --max-time 3600 "$1?check=$(date +%s)-$RANDOM" 2>/dev/null | sha256sum | cut -d' ' -f1; }
upload_checked() {  # upload_checked <file> <folder>: rclone it to <folder>/, download it back, compare the sha256
  local n want got out
  n=$(basename "$1"); want=$(sha_of "$1")
  out=$(rclone copyto -q "$1" "$RELEASE_RCLONE_REMOTE/$2/$n" 2>&1) || {
    printf '%s\n' "$out" | tail -5; echo "FAIL  rclone could not upload $n to $2/"; return 1; }
  got=$(sha_by_download "$RELEASE_DOWNLOAD_BASE/$2/$n")
  [ "$got" = "$want" ] || {
    echo "FAIL  $n downloaded back from $RELEASE_DOWNLOAD_BASE/$2/ is not the one uploaded (sha256 ${got:0:16}...)"; return 1; }
  echo "STAGE  $n  uploaded to $2/, downloaded back: the same sha256"
}

digest_of() { docker buildx imagetools inspect "$1" 2>/dev/null | sed -n 's/^Digest: *\(sha256:[0-9a-f]\{64\}\)$/\1/p' | head -1; }
registry_login() {  # a throwaway DOCKER_CONFIG, so this host's own docker login is never touched
  reg="${RELEASE_IMAGE_REPO%%/*}"; case "$reg" in *.*|*:*|localhost) ;; *) reg="" ;; esac
  DOCKER_CONFIG=$(mktemp -d) || return 2; export DOCKER_CONFIG
  trap 'rm -rf "$DOCKER_CONFIG"' EXIT
  printf '%s' "${DOCKERHUB_TOKEN:-}" | docker login ${reg:+"$reg"} -u "${DOCKERHUB_USER:-}" --password-stdin >/dev/null 2>&1
}
registry_logout() { docker logout ${reg:+"$reg"} >/dev/null 2>&1; rm -rf "$DOCKER_CONFIG"; }

promote() {
  local dry=0 out gate rc v c c8 folder digest sums p n h s files before latest
  case "${DRY_RUN:-no}" in no) ;; yes) dry=1 ;; *) echo "FAIL  DRY_RUN must be no or yes (got '$DRY_RUN')"; return 2 ;; esac
  rec() { RELEASE_COMMIT="$c" bash "$HERE/release-state.sh" get "$@" 2>/dev/null; }
  # before :latest moves nothing is recorded: the same run can simply be started again
  refuse() { echo "FAIL  $1"; echo "RELEASE_PUBLISH FAIL (nothing recorded, :latest untouched: run it again once fixed)"; }

  mark_start "PUBLISH STEP 1/4" "the version gate and the guards: steps 2 and 3 green on this commit, for this version"
  out=$(DRY_RUN=1 bash asbl/ci/dp-ci.sh build-if-needed 2>&1) ||
    { printf '%s\n' "$out"; refuse "could not put this checkout on origin/main (dp-ci.sh build-if-needed, above)"; return 1; }
  c=$(git rev-parse HEAD); c8=${c:0:8}
  echo "this checkout on origin/main: $(git log -1 --format='%h %s')"
  gate=$(bash "$HERE/release-state.sh" version-check); rc=$?
  printf '%s\n' "$gate"
  case "$rc" in
    0) v=$(printf '%s\n' "$gate" | sed -n 's/^RELEASE_VERSION=\([^ ]*\) .*/\1/p') ;;
    3) echo "RELEASE_PUBLISH NOTHING TO RELEASE: nothing copied, purged or retagged"; return 0 ;;
    *) refuse "refused by the version gate (above)"; return 1 ;;
  esac
  [ -z "$(rec step4.publish result)" ] ||
    { refuse "step4.publish is already recorded on $c8 ($(rec step4.publish result)): bash asbl/ci/release-state.sh show"; return 1; }
  RELEASE_COMMIT="$c" bash "$HERE/release-state.sh" require step2.docker step3.windows ||
    { refuse "steps 2 and 3 are not both green on $c8"; return 1; }
  for s in step2.docker step2.docker-stage step3.windows; do
    [ "$(rec "$s" version)" = "$v" ] || { refuse "$s on $c8 is of version $(rec "$s" version), settings.xml says $v"; return 1; }
  done
  folder=$(rec step2.docker-stage candidate)
  [ "$folder" = "candidate/$v-$c8/" ] && [ "$(rec step3.windows candidate)" = "$folder" ] ||
    { refuse "steps 2 and 3 did not stage in candidate/$v-$c8/ (step 2: '$folder', step 3: '$(rec step3.windows candidate)')"; return 1; }
  [ "$(rec step2.docker-stage image)" = "$RELEASE_IMAGE_REPO:$v" ] ||
    { refuse "step 2 staged '$(rec step2.docker-stage image)', not $RELEASE_IMAGE_REPO:$v"; return 1; }
  digest=$(rec step2.docker-stage digest)
  sums="$(rec step3.windows sha256) $(rec step2.docker-stage sha256)"
  for p in $sums; do
    printf '%s' "$p" | grep -qE '^[A-Za-z0-9._-]+:[0-9a-f]{64}$' || { refuse "the records' sha256 list has '$p'"; return 1; }
  done
  [ -f "$RELEASE_PUBLISH_ENV" ] && [ "$(stat -c %a "$RELEASE_PUBLISH_ENV")" = 600 ] ||
    { refuse "$RELEASE_PUBLISH_ENV is missing or not mode 600: the owner writes it (OD3)"; return 1; }
  before=$(digest_of "$RELEASE_IMAGE_REPO:$v")
  [ -n "$digest" ] && [ "$before" = "$digest" ] ||
    { refuse "the registry's $RELEASE_IMAGE_REPO:$v is ${before:-unreadable}, not the staged ${digest:-?}"; return 1; }
  echo "ok: steps 2 and 3 green on $c8 for $v, staged in $folder, $RELEASE_IMAGE_REPO:$v is still $digest"

  if [ "$dry" = 1 ]; then
    mark_next "PUBLISH STEP 2/4" "the files (dry run)"
    for p in $sums; do echo "dry run: would copy $folder${p%%:*} to newest/ and $v/, then check newest/${p%%:*} by download: sha256 ${p#*:}"; done
    mark_next "PUBLISH STEP 3/4" "the Cloudflare purge (dry run)"
    for p in $sums; do echo "dry run: would purge $RELEASE_DOWNLOAD_BASE/newest/${p%%:*}"; done
    mark_next "PUBLISH STEP 4/4" ":latest (dry run)"
    echo "dry run: would point $RELEASE_IMAGE_REPO:latest at $RELEASE_IMAGE_REPO:$v ($digest) and record step4.publish"
    echo "RELEASE_PUBLISH DRY RUN: nothing copied, purged or retagged"
    return 0
  fi
  creds || { refuse "no publish credentials (above)"; return 1; }

  mark_next "PUBLISH STEP 2/4" "the files: $folder copied to newest/ and $v/, each newest/ file checked by download"
  for p in $sums; do
    n=${p%%:*}
    for s in "$v" newest; do
      out=$(rclone copyto -q "$RELEASE_RCLONE_REMOTE/$folder$n" "$RELEASE_RCLONE_REMOTE/$s/$n" 2>&1) ||
        { printf '%s\n' "$out" | tail -5; refuse "rclone could not copy $folder$n to $s/"; return 1; }
    done
    echo "PUBLISH  $n  copied to newest/ and $v/"
  done
  for p in $sums; do
    n=${p%%:*}; h=${p#*:}
    s=$(sha_by_download "$RELEASE_DOWNLOAD_BASE/newest/$n")
    [ "$s" = "$h" ] || { refuse "newest/$n as downloaded is not the staged file (sha256 ${s:0:16}..., staged ${h:0:16}...): newest/ needs a look"; return 1; }
    echo "PUBLISH  newest/$n  downloaded: the staged sha256 ${h:0:16}..."
  done

  mark_next "PUBLISH STEP 3/4" "the Cloudflare cache of the newest/ links purged"
  files=""; for p in $sums; do files="$files\"$RELEASE_DOWNLOAD_BASE/newest/${p%%:*}\","; done
  # the token goes to curl on stdin (-K -), never on its command line
  out=$(printf 'header = "Authorization: Bearer %s"\n' "${CLOUDFLARE_PURGE_TOKEN:-}" |
    curl -sS --max-time 60 -K - -H 'Content-Type: application/json' -X POST \
      "$RELEASE_CLOUDFLARE_API/zones/${CLOUDFLARE_ZONE_ID:-}/purge_cache" --data "{\"files\":[${files%,}]}" 2>&1)
  printf '%s' "$out" | python3 -c 'import json,sys; sys.exit(0 if json.load(sys.stdin).get("success") is True else 1)' 2>/dev/null ||
    { printf '%s\n' "$out" | head -c 600; echo; refuse "Cloudflare did not purge the newest/ links"; return 1; }
  echo "PUBLISH  Cloudflare purged the newest/ links: ${files%,}"

  mark_next "PUBLISH STEP 4/4" "$RELEASE_IMAGE_REPO:latest pointed at :$v ($digest), checked; step4.publish recorded"
  registry_login || { registry_logout; refuse "docker login refused the credentials of $RELEASE_PUBLISH_ENV"; return 1; }
  before=$(digest_of "$RELEASE_IMAGE_REPO:latest")
  # --prefer-index=false: a copy of the staged manifest, so :latest has its very digest (the default wraps it in a new index)
  out=$(docker buildx imagetools create --prefer-index=false -t "$RELEASE_IMAGE_REPO:latest" "$RELEASE_IMAGE_REPO:$v" 2>&1); rc=$?
  latest=$(digest_of "$RELEASE_IMAGE_REPO:latest")
  registry_logout
  if [ "$latest" != "$digest" ]; then
    printf '%s\n' "$out" | tail -5
    if [ "$latest" = "$before" ]; then refuse "imagetools create (exit $rc) left :latest as it was (${before:-none})"; return 1; fi
    RELEASE_COMMIT="$c" bash "$HERE/release-state.sh" record step4.publish FAIL "version=$v" "digest=$digest" "latest=${latest:-unreadable}" \
      "reason=:latest is ${latest:-unreadable}, not the staged $digest"
    echo "FAIL  $RELEASE_IMAGE_REPO:latest is ${latest:-unreadable}, not the staged $digest (it was ${before:-none}): look at the registry"
    echo "RELEASE_PUBLISH FAIL (recorded: version-check refuses a new release until :latest and the record agree)"
    return 1
  fi
  echo "PUBLISH  $RELEASE_IMAGE_REPO:latest = $digest (it was ${before:-none})"
  RELEASE_COMMIT="$c" bash "$HERE/release-state.sh" record step4.publish PASS "version=$v" "image=$RELEASE_IMAGE_REPO:latest" \
    "digest=$digest" "newest=newest/" "archive=$v/" "sha256=${sums# }" ||
    echo "FAIL  :latest and newest/ are published, but step4.publish could not be recorded: record it by hand"
  echo "MANUAL  not done by this job: the Docker Hub page, asbl/docker/push-dockerhub-readme.ps1 (on Windows, with its own Docker Hub token)"
  echo "MANUAL  not done by this job: the demos, Jenkins job dp-ci-release-demos (demo.datapallas.com installs this release)"
  echo "RELEASE_PUBLISH PASS $v: newest/ and $v/ = $folder, $RELEASE_IMAGE_REPO:latest = $digest"
}

cmd="${1:-}"; [ "$#" -gt 0 ] && shift
case "$cmd" in
  stage-files)
    v="${1:-}"; list=$(abs "${2:-}"); sdir=$(abs "${3:-}"); c="${RELEASE_COMMIT:-}"
    fail() {
      echo "FAIL  $1"
      [ -n "$c" ] && RELEASE_COMMIT="$c" bash "$HERE/release-state.sh" record step3.windows FAIL "version=${v:-?}" "reason=$1"
      echo "RELEASE_STAGE FAIL"; exit 1
    }
    printf '%s' "$v" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+$' || fail "stage-files: '$v' is not a version (x.y.z)"
    printf '%s' "$c" | grep -qE '^[0-9a-f]{40}$' || fail "stage-files: RELEASE_COMMIT must be a full commit hash (got '$c')"
    [ -s "$list" ] && [ -d "$sdir" ] || fail "usage: $0 stage-files <version> <list> <dir> (list or dir missing)"
    [ "$(sed -n 's/^commit   //p' "$list")" = "$c" ] || fail "the list $list is not of commit ${c:0:8}"
    [ "$(sed -n 's/^version  //p' "$list")" = "$v" ] || fail "the list $list is not of version $v"
    # a staged file = a 'sha256   <hash>  <length>  <name>' line with nothing after the name
    names=$(sed -n 's/^sha256   [0-9a-f]\{64\}  [0-9]*  \([A-Za-z0-9._-]*\)$/\1/p' "$list")
    [ -n "$names" ] || fail "the list $list names no file to stage"
    for n in $names; do
      want=$(sed -n "s/^sha256   \([0-9a-f]\{64\}\)  [0-9]*  $n\$/\1/p" "$list")
      [ -s "$sdir/$n" ] || fail "$n is not in $sdir"
      [ "$(sha_of "$sdir/$n")" = "$want" ] || fail "$n in $sdir is not the pack's (sha256 differs from the list)"
      echo "STAGE  $n  sha256 ${want:0:16}... as the list says"
    done
    creds || fail "no publish credentials (above)"
    folder="candidate/$v-${c:0:8}"
    sums=""
    for n in $names; do
      out=$(rclone copyto -q "$sdir/$n" "$RELEASE_RCLONE_REMOTE/$folder/$n" 2>&1) || {
        printf '%s\n' "$out" | tail -5; fail "rclone could not upload $n to $folder/"; }
      want=$(sha_of "$sdir/$n")
      got=$(sha_by_download "$RELEASE_DOWNLOAD_BASE/$folder/$n")
      [ "$got" = "$want" ] || fail "$n downloaded back from $RELEASE_DOWNLOAD_BASE/$folder/ is not the pack's (sha256 ${got:0:16}...)"
      echo "STAGE  $n  uploaded to $folder/, downloaded back: the same sha256"
      sums="$sums $n:$want"
    done
    RELEASE_COMMIT="$c" bash "$HERE/release-state.sh" record step3.windows PASS "version=$v" "candidate=$folder/" "sha256=${sums# }" ||
      fail "could not record step3.windows"
    echo "RELEASE_STAGE PASS $folder/"
    ;;
  stage-docker)
    c=""; v=""; digest=""
    fail() {
      echo "FAIL  $1"
      # a digest already pushed stays on the record (red or not): version-check then knows the tag is the release's own
      [ -n "$c" ] && RELEASE_COMMIT="$c" bash "$HERE/release-state.sh" record step2.docker-stage FAIL "version=${v:-?}" \
        ${digest:+"digest=$digest"} "reason=$1"
      echo "RELEASE_STAGE FAIL"; exit 1
    }
    out=$(mktemp) || exit 2
    bash asbl/ci/dp-ci.sh build-if-needed 2>&1 | tee "$out"; rc=${PIPESTATUS[0]}
    tag=$(sed -n 's/^BUILD_TAG=//p' "$out" | tail -1); rm -f "$out"
    [ "$rc" = 0 ] && [ -n "$tag" ] || fail "dp-ci.sh build-if-needed did not end with a build (exit $rc, above)"
    c=$(git rev-parse HEAD); v="${tag%%-*}"
    [ "${tag#*-}" = "$(git rev-parse --short HEAD)" ] || fail "the build $tag is not of this checkout (${c:0:8}, uncommitted changes?)"
    gate=$(bash "$HERE/release-state.sh" version-check); rc=$?
    printf '%s\n' "$gate"
    case "$rc" in
      0) [ "$(printf '%s\n' "$gate" | sed -n 's/^RELEASE_VERSION=\([^ ]*\) .*/\1/p')" = "$v" ] ||
           fail "the version gate's version is not the build's ($v)" ;;
      3) echo "RELEASE_STAGE NOTHING TO RELEASE: nothing pushed, nothing staged"; exit 3 ;;
      *) fail "refused by the version gate (above)" ;;
    esac
    RELEASE_COMMIT="$c" bash "$HERE/release-state.sh" require step1.docker-server-full step1.docker-server-auth ||
      fail "step 1's Docker lanes are not green on ${c:0:8}"
    zip=asbl/dist/datapallas-server-docker.zip
    [ -s "$zip" ] || fail "$zip is missing (the build's)"
    docker image inspect "$RELEASE_IMAGE_REPO:$tag" >/dev/null 2>&1 || fail "the build's image $RELEASE_IMAGE_REPO:$tag is not on this host"
    creds || fail "no publish credentials (above)"
    docker tag "$RELEASE_IMAGE_REPO:$tag" "$RELEASE_IMAGE_REPO:$v" || fail "docker tag $RELEASE_IMAGE_REPO:$v failed"
    # the registry of the image name (Docker Hub when the name has no host part)
    reg="${RELEASE_IMAGE_REPO%%/*}"; case "$reg" in *.*|*:*|localhost) ;; *) reg="" ;; esac
    DOCKER_CONFIG=$(mktemp -d) || exit 2; export DOCKER_CONFIG
    trap 'rm -rf "$DOCKER_CONFIG"' EXIT
    printf '%s' "${DOCKERHUB_TOKEN:-}" | docker login ${reg:+"$reg"} -u "${DOCKERHUB_USER:-}" --password-stdin >/dev/null 2>&1 ||
      fail "docker login refused the credentials of $RELEASE_PUBLISH_ENV"
    out=$(docker push "$RELEASE_IMAGE_REPO:$v" 2>&1); rc=$?
    printf '%s\n' "$out" | tail -3
    pushed=$(printf '%s\n' "$out" | sed -n 's/.*: digest: \(sha256:[0-9a-f]\{64\}\) .*/\1/p' | tail -1)
    [ "$rc" = 0 ] && [ -n "$pushed" ] || fail "docker push $RELEASE_IMAGE_REPO:$v failed"
    digest="$pushed"
    got=$(docker buildx imagetools inspect "$RELEASE_IMAGE_REPO:$v" 2>/dev/null | sed -n 's/^Digest: *\(sha256:[0-9a-f]\{64\}\)$/\1/p' | head -1)
    docker logout ${reg:+"$reg"} >/dev/null 2>&1; rm -rf "$DOCKER_CONFIG"
    [ "$got" = "$pushed" ] || fail "the registry's $RELEASE_IMAGE_REPO:$v is ${got:-unreadable}, not the pushed $pushed"
    echo "STAGE  $RELEASE_IMAGE_REPO:$v  pushed, the registry has it: $digest"
    folder="candidate/$v-${c:0:8}"
    upload_checked "$zip" "$folder" || fail "the docker zip was not staged in $folder/ (above)"
    RELEASE_COMMIT="$c" bash "$HERE/release-state.sh" record step2.docker-stage PASS "version=$v" \
      "image=$RELEASE_IMAGE_REPO:$v" "digest=$digest" "candidate=$folder/" "sha256=datapallas-server-docker.zip:$(sha_of "$zip")" ||
      fail "could not record step2.docker-stage"
    echo "RELEASE_STAGE PASS $RELEASE_IMAGE_REPO:$v $digest, $folder/"
    ;;
  promote)
    . "$HERE/marks.sh"
    mark_run promote
    ;;
  *)
    sed -n '2,39p' "$0"; exit 2 ;;
esac
