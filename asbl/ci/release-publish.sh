#!/bin/bash
# The release's uploads, on Backblaze (downloads.datapallas.com) and Docker Hub: what a rehearsal stages where users do not
# get it, and what MODE=public then copies to the public places. Run on the host, by the release jobs
# (asbl/ci/jenkins/release-docker.sh, and asbl/ci/dp-ci.sh win release); the Windows VM never holds a credential. Each
# upload is checked by downloading it back the way a user gets it, and each verdict goes to the release record
# (asbl/ci/release-state.sh):
#
#   bash asbl/ci/release-publish.sh stage-files <version> <list> <dir>
#       The Windows rehearsal's files (job dp-ci-release-step3-release-windows-vm): those of <list> (the pack's sha256 list,
#       <log>-step-release-files.txt: 'commit', 'version' and 'sha256' lines; a line with a note after the name is not
#       staged), taken from <dir>: each checked against its sha256, uploaded to backblaze:datapallas/rehearsal/<version>-<commit>/,
#       downloaded back from downloads.datapallas.com and checked again. Records rehearsal.windows (PASS with rehearsal= and
#       sha256=, or FAIL with reason=). Nothing outside rehearsal/ is written. Before it uploads, the Windows files an earlier
#       rehearsal left anywhere under rehearsal/ are deleted (the cleanup, below).
#
#   bash asbl/ci/release-publish.sh stage-docker
#       The Docker rehearsal's upload (job dp-ci-release-step2-release-docker), built once on this host: this checkout on
#       origin/main and built (dp-ci.sh build-if-needed, which builds only when there is no build of it yet), the version
#       gate (release-state.sh version-check docker, whose version must be the build's), step 1's Docker lanes green on this
#       commit; then the build's image <repo>:<version>-<commit> tagged and pushed as <repo>:<version> (never :latest;
#       logged in with a throwaway DOCKER_CONFIG, so this host's own docker login is never touched) and the registry's
#       digest read back; then asbl/dist/datapallas-server-docker.zip, the zip whose compose pins that tag, uploaded to
#       rehearsal/<version>-<commit>/ and checked by download. Records rehearsal.docker-stage (digest=, which version-check
#       accepts as staged by a rehearsal, rehearsal=, sha256=). Exit 3 = nothing to release (nothing pushed). Before it
#       pushes, the docker zips an earlier rehearsal left anywhere under rehearsal/ are deleted (the cleanup, below).
#
#   DRY_RUN=no|yes  bash asbl/ci/release-publish.sh publish docker|windows <version> <commit>
#       MODE=public's copy, minutes, parts marked PUBLIC STEP n/N: the version gate of the channel (nothing to release:
#       green, nothing done), the passed rehearsal of <version> on <commit> (rehearsal.<channel>; its folder
#       rehearsal/<version>-<commit>/, not removed), each of its files downloaded and checked against the sha256 that was
#       tested, and for docker the registry's :<version> still the rehearsed digest. Then the outgoing release archived: each
#       file of the channel in newest/ that the folder of the channel's released version lacks (release-state.sh released
#       <channel>) copied there server side and checked by download, so the hand-made 16.5.0 gets its 16.5.0/ at the first
#       public release of each channel. Then the files copied server side to newest/ and to <version>/ (the archive), each
#       newest/ file checked by download, the Cloudflare cache of those links purged; docker: :latest pointed at :<version>
#       (no pull, no push of layers) and checked; then newest/<channel>-version.txt (version, commit, sha256s) written,
#       checked and purged, public.<channel> recorded, and the copied rehearsal's files deleted (the cleanup, below; a failed
#       delete is a WARN line, the release is public all the same). A failure before anything public changes records nothing
#       (run it again once fixed); :latest moved to anything but the rehearsed digest records public.docker FAIL, and
#       version-check then refuses until a person looks. DRY_RUN=yes: the checks (no download), then what each part would
#       do (archive, copy, delete): nothing archived, copied or deleted.
#
#   DRY_RUN=no|yes  bash asbl/ci/release-publish.sh preflight docker|files [public] [copy]
#       What a release job needs, checked within seconds before anything slow (the jobs run it right after the version
#       gate; nothing to release ends green before it). One line per check, OK <what> or MISSING <what>: <what to
#       provide>, every check run even after one fails (NOT CHECKED: it needs something listed as MISSING above); then
#       PREREQUISITES OK, exit 0, or PREREQUISITES MISSING (<n>): ..., exit 1. Names only, never a value of the file.
#       Both: rclone, curl and sha256sum; the credentials file (present, root's, mode 600; not read otherwise);
#       RCLONE_CONFIG with the remote RELEASE_RCLONE_REMOTE names; the key can write (a few bytes to
#       rehearsal/_preflight/, downloaded back and deleted; DRY_RUN=yes: a listing of rehearsal/ only); the download
#       site answers. docker: the Docker engine and buildx; DOCKERHUB_USER and DOCKERHUB_TOKEN accepted by docker login
#       (a throwaway DOCKER_CONFIG); the token may push RELEASE_IMAGE_REPO (Docker Hub's token service, nothing pushed;
#       skipped for another registry); the Windows VM of the rehearsal's part 6 (dp-ci.sh win prereq docker-e2e).
#       public: also CLOUDFLARE_ZONE_ID and the purge token (Cloudflare's read-only token check, nothing purged).
#       copy: a MODE=public run that only copies a passed rehearsal: the VM is not needed, not checked.
#
#   The cleanup (owner 2026-10-22: no old rehearsal stays in the bucket): moment 1, publish deletes the rehearsal it copied
#   (its channel's files) once the public files are checked and recorded; moment 2, a new rehearsal (stage-files,
#   stage-docker) first deletes every file of its channel left anywhere under rehearsal/ (red, abandoned, or passed and never
#   made public), one CLEAN line per file. Each rehearsal whose files go is marked removed in the release record
#   (release-state.sh removed), so it is never copied. Per channel: windows = datapallas.zip, datapallas-server.zip,
#   datapallas-src.zip; docker = datapallas-server-docker.zip. Both stage into the same rehearsal/<version>-<commit>/, so one
#   channel never deletes the other's files; nothing outside rehearsal/ is ever deleted. The deletes are hard (rclone
#   --b2-hard-delete): a plain delete stays in the bucket as a hidden file for 90 days.
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
REHEARSAL_FOLDER=rehearsal   # where a rehearsal stages, <version>-<commit>/ inside; users never get it (before 2026-10-22: candidate)

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
EMPTY_SHA=$(printf '' | sha256sum | cut -d' ' -f1)   # what sha_by_download gives when nothing came
channel_files() { case "$1" in docker) echo datapallas-server-docker.zip ;; windows) echo datapallas.zip datapallas-server.zip datapallas-src.zip ;; esac; }
# hard_delete <path in the bucket>: one file, gone at once (a plain delete stays in the bucket as a hidden file for 90 days)
hard_delete() { rclone deletefile -q --b2-hard-delete "$RELEASE_RCLONE_REMOTE/$1" 2>&1; }
# the sha256 of a published file as a user downloads it; the query string only gets past the CDN's cache
sha_by_download() { curl -fsSL --max-time 3600 "$1?check=$(date +%s)-$RANDOM" 2>/dev/null | sha256sum | cut -d' ' -f1; }
upload_checked() {  # upload_checked <file> <folder> [<name>]: rclone it to <folder>/, download it back, compare the sha256
  local n want got out
  n=${3:-$(basename "$1")}; want=$(sha_of "$1")
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
purge() {  # purge <url>...: the Cloudflare cache of those links; the token goes to curl on stdin (-K -), never on its command line
  local files="" u out
  for u in "$@"; do files="$files\"$u\","; done
  out=$(printf 'header = "Authorization: Bearer %s"\n' "${CLOUDFLARE_PURGE_TOKEN:-}" |
    curl -sS --max-time 60 -K - -H 'Content-Type: application/json' -X POST \
      "$RELEASE_CLOUDFLARE_API/zones/${CLOUDFLARE_ZONE_ID:-}/purge_cache" --data "{\"files\":[${files%,}]}" 2>&1)
  printf '%s' "$out" | python3 -c 'import json,sys; sys.exit(0 if json.load(sys.stdin).get("success") is True else 1)' 2>/dev/null ||
    { printf '%s\n' "$out" | head -c 600; echo; return 1; }
  echo "PUBLIC  Cloudflare purged ${files%,}"
}

# clean_rehearsals docker|windows: the cleanup's moment 2 (top of this file), before a new rehearsal uploads
clean_rehearsals() {
  local ch="$1" list p d n out folders="" left=0
  if ! list=$(rclone lsf -q -R --files-only --max-depth 2 "$RELEASE_RCLONE_REMOTE/$REHEARSAL_FOLDER/" 2>&1); then
    case "$list" in
      *"directory not found"*) list="" ;;
      *) printf '%s\n' "$list" | tail -3; echo "WARN  $REHEARSAL_FOLDER/ could not be listed: no leftover $ch rehearsal deleted"; return 0 ;;
    esac
  fi
  for p in $list; do
    d=${p%/*}; n=${p##*/}
    [ "$d" != "$p" ] && [ "$d" != _preflight ] || continue
    case " $(channel_files "$ch") " in *" $n "*) ;; *) continue ;; esac
    if out=$(hard_delete "$REHEARSAL_FOLDER/$p"); then
      echo "CLEAN  $REHEARSAL_FOLDER/$p  left by an earlier $ch rehearsal: deleted"
    else
      printf '%s\n' "$out" | tail -2; echo "WARN  $REHEARSAL_FOLDER/$p could not be deleted: it stays"; left=$((left + 1))
    fi
    case " $folders " in *" $d "*) ;; *) folders="$folders $d" ;; esac
  done
  for d in $folders; do bash "$HERE/release-state.sh" removed "$ch" "$REHEARSAL_FOLDER/$d/"; done
  [ -n "$folders" ] || echo "CLEAN  no $ch rehearsal file left in $REHEARSAL_FOLDER/"
  [ "$left" = 0 ] || echo "WARN  $left leftover $ch rehearsal file(s) could not be deleted: the next rehearsal tries again"
}

# archive_outgoing <channel> <dry 0|1>: before newest/ is replaced, each file of the channel in newest/ that the folder of the
# channel's released version lacks, copied there server side and checked by download; rc 1 = not archived (nothing public changed)
archive_outgoing() {
  local ch="$1" dry="$2" r rv have inv n out h s
  r=$(bash "$HERE/release-state.sh" released "$ch") || { printf '%s\n' "$r"; echo "FAIL  the released $ch version cannot be read"; return 1; }
  rv=$(printf '%s\n' "$r" | sed -n "s/^RELEASED $ch=//p")
  case "$rv" in ""|none) echo "ARCHIVE  nothing to archive: no $ch release yet"; return 0 ;; esac
  have=$(rclone lsf -q --files-only "$RELEASE_RCLONE_REMOTE/newest/" 2>&1) || {
    printf '%s\n' "$have" | tail -3; echo "FAIL  newest/ could not be listed"; return 1; }
  inv=$(rclone lsf -q --files-only "$RELEASE_RCLONE_REMOTE/$rv/" 2>/dev/null)   # no such folder yet = nothing in it
  for n in $(channel_files "$ch"); do
    printf '%s\n' "$have" | grep -qxF "$n" || continue
    if printf '%s\n' "$inv" | grep -qxF "$n"; then echo "ARCHIVE  $rv/$n is there already"; continue; fi
    if [ "$dry" = 1 ]; then echo "dry run: would archive newest/$n (the outgoing $rv) in $rv/ and check it by download"; continue; fi
    out=$(rclone copyto -q "$RELEASE_RCLONE_REMOTE/newest/$n" "$RELEASE_RCLONE_REMOTE/$rv/$n" 2>&1) || {
      printf '%s\n' "$out" | tail -5; echo "FAIL  rclone could not copy newest/$n to $rv/"; return 1; }
    h=$(sha_by_download "$RELEASE_DOWNLOAD_BASE/newest/$n"); s=$(sha_by_download "$RELEASE_DOWNLOAD_BASE/$rv/$n")
    [ "$h" != "$EMPTY_SHA" ] && [ "$s" = "$h" ] || { echo "FAIL  $rv/$n as downloaded is not newest/$n (sha256 ${s:0:16}..., newest/ ${h:0:16}...)"; return 1; }
    echo "ARCHIVE  newest/$n (the outgoing $rv) copied to $rv/, downloaded: the same sha256 ${h:0:16}..."
  done
}

# publish <channel> <version> <commit>: MODE=public's copy, in minutes. The rehearsal of <version> that passed on <commit>
# (release-state.sh rehearsed finds it) goes to the public places as it is: nothing is built, packed or tested again.
publish() {
  local ch="$1" v="$2" c="$3" dry=0 n_parts=3 rc out c8 folder digest="" sums p n h s files before latest vfile part
  case "${DRY_RUN:-no}" in no) ;; yes) dry=1 ;; *) echo "FAIL  DRY_RUN must be no or yes (got '$DRY_RUN')"; return 2 ;; esac
  case "$ch" in docker) n_parts=4 ;; windows) ;; *) echo "usage: $0 publish docker|windows <version> <commit>"; return 2 ;; esac
  c=$(git rev-parse --verify -q "${c:-none}^{commit}" 2>/dev/null) || { echo "FAIL  publish: '$3' is not a commit git knows"; return 2; }
  c8=${c:0:8}
  rec() { RELEASE_COMMIT="$c" bash "$HERE/release-state.sh" get "$@" 2>/dev/null; }
  # before anything public changes nothing is recorded: the same run can simply be started again
  refuse() { echo "FAIL  $1"; echo "RELEASE_PUBLIC FAIL $ch $v (nothing recorded, the public files as they were: run it again once fixed)"; }

  mark_start "PUBLIC STEP 1/$n_parts" "the rehearsal of $v on $c8 ($ch): its record, the version gate, its files still the ones tested"
  out=$(bash "$HERE/release-state.sh" version-check "$ch"); rc=$?
  printf '%s\n' "$out"
  case "$rc" in
    0) [ "$(printf '%s\n' "$out" | sed -n 's/^RELEASE_VERSION=\([^ ]*\) .*/\1/p')" = "$v" ] ||
         { refuse "the version gate's version is not $v"; return 1; } ;;
    3) echo "RELEASE_PUBLIC NOTHING TO RELEASE: nothing copied"; return 0 ;;
    *) refuse "refused by the version gate (above)"; return 1 ;;
  esac
  [ "$(rec "rehearsal.$ch" result)" = PASS ] && [ "$(rec "rehearsal.$ch" version)" = "$v" ] ||
    { refuse "rehearsal.$ch on $c8 is not a passed rehearsal of $v: bash asbl/ci/release-state.sh show $c8"; return 1; }
  if [ "$ch" = docker ]; then
    [ "$(rec rehearsal.docker-stage result)" = PASS ] && [ "$(rec rehearsal.docker-stage version)" = "$v" ] ||
      { refuse "rehearsal.docker-stage on $c8 is not a PASS of $v"; return 1; }
    [ "$(rec rehearsal.docker-stage image)" = "$RELEASE_IMAGE_REPO:$v" ] ||
      { refuse "the rehearsal staged '$(rec rehearsal.docker-stage image)', not $RELEASE_IMAGE_REPO:$v"; return 1; }
    digest=$(rec rehearsal.docker-stage digest)
    folder=$(rec rehearsal.docker-stage rehearsal); sums=$(rec rehearsal.docker-stage sha256)
  else
    folder=$(rec rehearsal.windows rehearsal); sums=$(rec rehearsal.windows sha256)
  fi
  [ "$folder" = "$REHEARSAL_FOLDER/$v-$c8/" ] || { refuse "the rehearsal staged in '$folder', not $REHEARSAL_FOLDER/$v-$c8/"; return 1; }
  [ -z "$(rec "rehearsal.$([ "$ch" = docker ] && echo docker-stage || echo windows)" removed)" ] ||
    { refuse "the files of the rehearsal in $folder were deleted (a later rehearsal cleaned them up): rehearse again"; return 1; }
  [ -n "$sums" ] || { refuse "the rehearsal's record has no sha256 list"; return 1; }
  for p in $sums; do
    printf '%s' "$p" | grep -qE '^[A-Za-z0-9._-]+:[0-9a-f]{64}$' || { refuse "the record's sha256 list has '$p'"; return 1; }
  done
  if [ "$ch" = docker ]; then
    before=$(digest_of "$RELEASE_IMAGE_REPO:$v")
    [ -n "$digest" ] && [ "$before" = "$digest" ] ||
      { refuse "the registry's $RELEASE_IMAGE_REPO:$v is ${before:-unreadable}, not the rehearsed ${digest:-?}"; return 1; }
    echo "ok: $RELEASE_IMAGE_REPO:$v is still the rehearsed $digest"
  fi
  if [ "$dry" = 1 ]; then
    for p in $sums; do echo "dry run: would check $folder${p%%:*} by download: sha256 ${p#*:}"; done
  else
    for p in $sums; do
      n=${p%%:*}; h=${p#*:}
      s=$(sha_by_download "$RELEASE_DOWNLOAD_BASE/$folder$n")
      [ "$s" = "$h" ] || { refuse "$folder$n as downloaded is not the file the rehearsal tested (sha256 ${s:0:16}..., tested ${h:0:16}...)"; return 1; }
      echo "PUBLIC  $folder$n  downloaded: the tested sha256 ${h:0:16}..."
    done
  fi
  [ -f "$RELEASE_PUBLISH_ENV" ] && [ "$(stat -c %a "$RELEASE_PUBLISH_ENV")" = 600 ] ||
    { refuse "$RELEASE_PUBLISH_ENV is missing or not mode 600: the owner writes it (OD3)"; return 1; }
  echo "ok: the rehearsal of $v on $c8, $folder: $(printf '%s\n' $sums | sed 's/:.*//' | tr '\n' ' ')"

  vfile=$(mktemp) || return 2
  { echo "version=$v"; echo "commit=$c"; echo "time=$(date -u +%Y-%m-%dT%H:%M:%SZ)"; echo "rehearsal=$folder"; echo "sha256=$sums"
    [ "$ch" = docker ] && { echo "image=$RELEASE_IMAGE_REPO:$v"; echo "digest=$digest"; }; } > "$vfile"
  if [ "$dry" = 1 ]; then
    mark_next "PUBLIC STEP 2/$n_parts" "the files (dry run)"
    if creds >/dev/null 2>&1; then archive_outgoing "$ch" 1 || echo "dry run: (the archive above would refuse: nothing would be copied)"
    else echo "dry run: would archive the outgoing release's $ch files of newest/ in its version's folder (not listed: no credentials)"; fi
    for p in $sums; do echo "dry run: would copy $folder${p%%:*} to newest/ and $v/, check newest/${p%%:*} by download and purge its Cloudflare cache"; done
    [ "$ch" = docker ] && { mark_next "PUBLIC STEP 3/4" ":latest (dry run)"; echo "dry run: would point $RELEASE_IMAGE_REPO:latest at :$v ($digest)"; }
    mark_next "PUBLIC STEP $n_parts/$n_parts" "newest/$ch-version.txt (dry run)"
    echo "dry run: would write newest/$ch-version.txt, check it by download, purge it, record public.$ch:"; sed 's/^/  /' "$vfile"
    for p in $sums; do echo "dry run: then would delete $folder${p%%:*} (the copied rehearsal) and mark it removed in the release record"; done
    rm -f "$vfile"
    echo "RELEASE_PUBLIC DRY RUN $ch $v: nothing archived, copied, purged, retagged or deleted"
    return 0
  fi
  creds || { rm -f "$vfile"; refuse "no publish credentials (above)"; return 1; }

  mark_next "PUBLIC STEP 2/$n_parts" "the files: the outgoing release archived, $folder copied to newest/ and $v/, each newest/ file checked by download, its Cloudflare cache purged"
  archive_outgoing "$ch" 0 || { rm -f "$vfile"; refuse "the outgoing release was not archived (above), so newest/ was left as it is"; return 1; }
  for p in $sums; do
    n=${p%%:*}
    for s in "$v" newest; do
      out=$(rclone copyto -q "$RELEASE_RCLONE_REMOTE/$folder$n" "$RELEASE_RCLONE_REMOTE/$s/$n" 2>&1) ||
        { printf '%s\n' "$out" | tail -5; rm -f "$vfile"; refuse "rclone could not copy $folder$n to $s/"; return 1; }
    done
    echo "PUBLIC  $n  copied to newest/ and $v/"
  done
  for p in $sums; do
    n=${p%%:*}; h=${p#*:}
    s=$(sha_by_download "$RELEASE_DOWNLOAD_BASE/newest/$n")
    [ "$s" = "$h" ] || { rm -f "$vfile"; refuse "newest/$n as downloaded is not the rehearsed file (sha256 ${s:0:16}..., rehearsed ${h:0:16}...): newest/ needs a look"; return 1; }
    echo "PUBLIC  newest/$n  downloaded: the rehearsed sha256 ${h:0:16}..."
  done
  files=""; for p in $sums; do files="$files $RELEASE_DOWNLOAD_BASE/newest/${p%%:*}"; done
  purge $files || { rm -f "$vfile"; refuse "Cloudflare did not purge the newest/ links (above)"; return 1; }

  if [ "$ch" = docker ]; then
    mark_next "PUBLIC STEP 3/4" "$RELEASE_IMAGE_REPO:latest pointed at :$v ($digest), checked"
    registry_login || { registry_logout; rm -f "$vfile"; refuse "docker login refused the credentials of $RELEASE_PUBLISH_ENV"; return 1; }
    before=$(digest_of "$RELEASE_IMAGE_REPO:latest")
    # --prefer-index=false: a copy of the staged manifest, so :latest has its very digest (the default wraps it in a new index)
    out=$(docker buildx imagetools create --prefer-index=false -t "$RELEASE_IMAGE_REPO:latest" "$RELEASE_IMAGE_REPO:$v" 2>&1); rc=$?
    latest=$(digest_of "$RELEASE_IMAGE_REPO:latest")
    registry_logout
    if [ "$latest" != "$digest" ]; then
      printf '%s\n' "$out" | tail -5; rm -f "$vfile"
      if [ "$latest" = "$before" ]; then refuse "imagetools create (exit $rc) left :latest as it was (${before:-none})"; return 1; fi
      RELEASE_COMMIT="$c" bash "$HERE/release-state.sh" record public.docker FAIL "version=$v" "digest=$digest" "latest=${latest:-unreadable}" \
        "reason=:latest is ${latest:-unreadable}, not the rehearsed $digest"
      echo "FAIL  $RELEASE_IMAGE_REPO:latest is ${latest:-unreadable}, not the rehearsed $digest (it was ${before:-none}): look at the registry"
      echo "RELEASE_PUBLIC FAIL docker $v (recorded: version-check refuses a new release until :latest and the record agree)"
      return 1
    fi
    echo "PUBLIC  $RELEASE_IMAGE_REPO:latest = $digest (it was ${before:-none})"
  fi

  part="newest/$ch-version.txt written, checked by download and purged; public.$ch recorded"
  mark_next "PUBLIC STEP $n_parts/$n_parts" "$part"
  upload_checked "$vfile" newest "$ch-version.txt" || { rm -f "$vfile"; refuse "newest/$ch-version.txt was not written (above)"; return 1; }
  rm -f "$vfile"
  purge "$RELEASE_DOWNLOAD_BASE/newest/$ch-version.txt" ||
    echo "WARN  Cloudflare did not purge newest/$ch-version.txt: its cache expires by itself (the version gate reads past the cache)"
  if [ "$ch" = docker ]; then
    RELEASE_COMMIT="$c" bash "$HERE/release-state.sh" record public.docker PASS "version=$v" "image=$RELEASE_IMAGE_REPO:latest" \
      "digest=$digest" "rehearsal=$folder" "newest=newest/" "archive=$v/" "sha256=$sums"
  else
    RELEASE_COMMIT="$c" bash "$HERE/release-state.sh" record public.windows PASS "version=$v" \
      "rehearsal=$folder" "newest=newest/" "archive=$v/" "sha256=$sums"
  fi || echo "FAIL  the files are public, but public.$ch could not be recorded: record it by hand"
  for p in $sums; do   # the cleanup's moment 1: the copied rehearsal (top of this file)
    if out=$(hard_delete "$folder${p%%:*}"); then echo "CLEAN  $folder${p%%:*}  the copied rehearsal: deleted"
    else printf '%s\n' "$out" | tail -2; echo "WARN  $folder${p%%:*} could not be deleted (the release is public all the same): the next $ch rehearsal deletes it"; fi
  done
  bash "$HERE/release-state.sh" removed "$ch" "$folder"
  if [ "$ch" = docker ]; then
    echo "MANUAL  not done by this job: the Docker Hub page, asbl/docker/push-dockerhub-readme.ps1 (on Windows, with its own Docker Hub token)"
    echo "MANUAL  not done by this job: the public demo, Jenkins job dp-ci-release-step4-demo-public (it installs this release)"
  fi
  echo "RELEASE_PUBLIC PASS $ch $v: newest/ and $v/ = $folder (the rehearsal of $c8)$([ "$ch" = docker ] && echo ", $RELEASE_IMAGE_REPO:latest = $digest")"
}

# preflight docker|files [public] [copy]: see the top of this file
preflight() {
  local what="${1:-}" public=0 copy=0 dry=0 miss=0 a t f="$RELEASE_PUBLISH_ENV" have=0 names="" n remote out code tmp name got reg
  case "$what" in docker|files) ;; *) echo "usage: $0 preflight docker|files [public] [copy]"; return 2 ;; esac
  shift
  for a in "$@"; do case "$a" in public) public=1 ;; copy) copy=1 ;; *) echo "usage: $0 preflight docker|files [public] [copy]"; return 2 ;; esac; done
  case "${DRY_RUN:-no}" in no) ;; yes) dry=1 ;; *) echo "FAIL  DRY_RUN must be no or yes (got '$DRY_RUN')"; return 2 ;; esac
  ok() { echo "OK $1"; }
  missing() { echo "MISSING $1"; miss=$((miss + 1)); }
  echo "PREREQUISITES of the $([ "$what" = docker ] && echo "Docker release" || echo "Windows release files"), $([ "$public" = 1 ] && echo "MODE=public" || echo "MODE=rehearsal")$([ "$copy" = 1 ] && echo ", the copy of a passed rehearsal only"):"

  for t in rclone curl sha256sum; do
    command -v "$t" >/dev/null 2>&1 && ok "$t on this host" || missing "$t on this host: install it (the uploads and their checks use it)"
  done
  # the keys this job reads from the file
  [ "$what" = docker ] && names="DOCKERHUB_USER DOCKERHUB_TOKEN"
  names="$names RCLONE_CONFIG"
  [ "$public" = 1 ] && names="$names CLOUDFLARE_PURGE_TOKEN CLOUDFLARE_ZONE_ID"
  names=$(echo $names)
  if [ ! -f "$f" ]; then
    missing "the publish credentials file $f: the owner writes it, owned by root, mode 600 (chmod 600), with ${names// /, }"
  elif [ "$(stat -c %U "$f")" != root ] || [ "$(stat -c %a "$f")" != 600 ]; then
    missing "a root-only $f (it is $(stat -c %U "$f")'s, mode $(stat -c %a "$f")): chown root and chmod 600 it; it is not read until then"
  else
    ok "the publish credentials file $f (root's, mode 600)"
    set -a; . "$f" >/dev/null 2>&1; set +a
    have=1
  fi
  if [ "$have" = 0 ]; then
    echo "NOT CHECKED the keys of the file above (${names// /, }) and what they open: the file was not read"
  else
    for n in $names; do
      if [ -n "${!n:-}" ]; then ok "$n in $f"; continue; fi
      case "$n" in
        DOCKERHUB_USER) missing "DOCKERHUB_USER in $f: the Docker Hub user that pushes ${RELEASE_IMAGE_REPO}" ;;
        DOCKERHUB_TOKEN) missing "DOCKERHUB_TOKEN in $f: a Docker Hub access token of DOCKERHUB_USER with Read & Write on ${RELEASE_IMAGE_REPO}" ;;
        RCLONE_CONFIG) missing "RCLONE_CONFIG in $f: the path of an rclone config whose '${RELEASE_RCLONE_REMOTE%%:*}' remote can write the bucket" ;;
        CLOUDFLARE_PURGE_TOKEN) missing "CLOUDFLARE_PURGE_TOKEN in $f: a Cloudflare API token with Cache Purge on the zone of the download site" ;;
        CLOUDFLARE_ZONE_ID) missing "CLOUDFLARE_ZONE_ID in $f: the id of the Cloudflare zone of the download site" ;;
      esac
    done
    remote="${RELEASE_RCLONE_REMOTE%%:*}"
    if [ -z "${RCLONE_CONFIG:-}" ]; then
      echo "NOT CHECKED the '$remote' remote and its write access: RCLONE_CONFIG is missing above"
    elif [ ! -f "$RCLONE_CONFIG" ]; then
      missing "the rclone config that RCLONE_CONFIG in $f names (no such file): write it, with the '$remote' remote (an rclone b2 remote whose Backblaze application key can write the bucket)"
    elif ! rclone --config "$RCLONE_CONFIG" listremotes 2>/dev/null | grep -qx "$remote:"; then
      missing "the '$remote' remote in RCLONE_CONFIG: an rclone b2 remote whose Backblaze application key can write the bucket"
    elif [ "$dry" = 1 ]; then
      if rclone --config "$RCLONE_CONFIG" lsf -q --max-depth 1 "$RELEASE_RCLONE_REMOTE/$REHEARSAL_FOLDER/" >/dev/null 2>&1; then
        ok "the '$remote' key can list $REHEARSAL_FOLDER/ (dry run: the write was not tried)"
      else
        missing "read access with the '$remote' key (rclone could not list $REHEARSAL_FOLDER/): the Backblaze application key must read and write the bucket"
      fi
    else
      tmp=$(mktemp) && name="$(hostname -s)-$(date -u +%Y%m%dT%H%M%SZ)-$$.txt" && echo "datapallas release preflight $name" > "$tmp"
      if ! rclone --config "$RCLONE_CONFIG" copyto -q "$tmp" "$RELEASE_RCLONE_REMOTE/$REHEARSAL_FOLDER/_preflight/$name" >/dev/null 2>&1; then
        missing "write access with the '$remote' key (rclone could not write $REHEARSAL_FOLDER/_preflight/): the Backblaze application key must be allowed to write and delete in the bucket"
      else
        got=$(curl -fsS --max-time 60 "$RELEASE_DOWNLOAD_BASE/$REHEARSAL_FOLDER/_preflight/$name?check=$(date +%s)-$RANDOM" 2>/dev/null)
        if [ "$got" = "$(cat "$tmp")" ]; then
          ok "the '$remote' key can write: a test file written to $REHEARSAL_FOLDER/_preflight/, downloaded back, removed"
        else
          missing "the test file written to $REHEARSAL_FOLDER/_preflight/, by download from $RELEASE_DOWNLOAD_BASE (it did not come back): every upload is checked by download, so the bucket must be the one the download site serves"
        fi
        rclone --config "$RCLONE_CONFIG" deletefile -q --b2-hard-delete "$RELEASE_RCLONE_REMOTE/$REHEARSAL_FOLDER/_preflight/$name" >/dev/null 2>&1 ||
          echo "WARN  the test file $REHEARSAL_FOLDER/_preflight/$name could not be removed: remove it by hand"
      fi
      rm -f "$tmp"
    fi
  fi
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 30 "$RELEASE_DOWNLOAD_BASE/newest/windows-version.txt?check=$(date +%s)-$RANDOM" 2>/dev/null)
  case "$code" in
    2??|3??|404) ok "the download site $RELEASE_DOWNLOAD_BASE answers (every upload is checked by download)" ;;
    *) missing "an answer from the download site $RELEASE_DOWNLOAD_BASE (HTTP ${code:-none}): every upload is checked by download; run the job again when it answers" ;;
  esac

  if [ "$what" = docker ]; then
    docker info >/dev/null 2>&1 && ok "the Docker engine on this host" ||
      missing "a running Docker engine on this host: start it (systemctl start docker), then run the job again"
    docker buildx version >/dev/null 2>&1 && ok "docker buildx (the digest read-back and :latest use imagetools)" ||
      missing "docker buildx on this host: install the docker-buildx plugin (the digest read-back and :latest use imagetools)"
    if [ "$have" = 1 ] && [ -n "${DOCKERHUB_USER:-}" ] && [ -n "${DOCKERHUB_TOKEN:-}" ]; then
      reg="${RELEASE_IMAGE_REPO%%/*}"; case "$reg" in *.*|*:*|localhost) ;; *) reg="" ;; esac
      tmp=$(mktemp -d)
      if printf '%s' "$DOCKERHUB_TOKEN" | DOCKER_CONFIG="$tmp" docker login ${reg:+"$reg"} -u "$DOCKERHUB_USER" --password-stdin >/dev/null 2>&1; then
        ok "docker login accepts DOCKERHUB_USER and DOCKERHUB_TOKEN (${reg:-Docker Hub}; logged out again)"
        DOCKER_CONFIG="$tmp" docker logout ${reg:+"$reg"} >/dev/null 2>&1
      else
        missing "a docker login with DOCKERHUB_USER and DOCKERHUB_TOKEN of $f (refused): a valid access token of that Docker Hub user"
      fi
      rm -rf "$tmp"
      if [ -n "$reg" ]; then
        echo "NOTE the push right on $RELEASE_IMAGE_REPO is not asked: it names another registry than Docker Hub ($reg)"
      else
        # the token service grants only the actions the token may do; the credentials go to curl on stdin, never on its command line
        out=$(printf 'user = "%s:%s"\n' "$DOCKERHUB_USER" "$DOCKERHUB_TOKEN" |
          curl -sS --max-time 30 -K - "https://auth.docker.io/token?service=registry.docker.io&scope=repository:$RELEASE_IMAGE_REPO:pull,push" 2>/dev/null)
        if printf '%s' "$out" | R="$RELEASE_IMAGE_REPO" python3 -c '
import base64, json, os, sys
t = json.load(sys.stdin).get("token", "")
p = t.split(".")[1]
claims = json.loads(base64.urlsafe_b64decode(p + "=" * (-len(p) % 4)))
sys.exit(0 if any(a.get("name") == os.environ["R"] and "push" in a.get("actions", []) for a in claims.get("access", [])) else 1)' 2>/dev/null; then
          ok "DOCKERHUB_TOKEN may push $RELEASE_IMAGE_REPO (asked of Docker Hub's token service; nothing pushed)"
        else
          missing "the push right on $RELEASE_IMAGE_REPO for DOCKERHUB_TOKEN: give the token Read & Write (Docker Hub, Account settings, Personal access tokens) and make DOCKERHUB_USER a member who may push that repository"
        fi
      fi
    else
      echo "NOT CHECKED docker login and the push right on $RELEASE_IMAGE_REPO: they need DOCKERHUB_USER and DOCKERHUB_TOKEN above"
    fi
    if [ "$copy" = 1 ]; then
      echo "NOTE the Windows VM is not checked: the copy does not use it"
    else
      # the rehearsal's part 6 (windows-vm-docker): the same checks the lane makes, from dp-ci.sh; its line on this host's
      # Docker engine is left out, checked above already
      out=$(bash asbl/ci/dp-ci.sh win prereq docker-e2e 2>&1 | grep -v -e '^PREREQUISITES' -e ' Docker engine on this host')
      printf '%s\n' "$out"
      miss=$((miss + $(printf '%s\n' "$out" | grep -c '^MISSING')))
    fi
  fi

  if [ "$public" = 1 ]; then
    if [ "$have" = 1 ] && [ -n "${CLOUDFLARE_PURGE_TOKEN:-}" ]; then
      out=$(printf 'header = "Authorization: Bearer %s"\n' "$CLOUDFLARE_PURGE_TOKEN" | curl -sS --max-time 30 -K - "$RELEASE_CLOUDFLARE_API/user/tokens/verify" 2>/dev/null)
      if printf '%s' "$out" | python3 -c 'import json,sys; d = json.load(sys.stdin); sys.exit(0 if d.get("success") is True and (d.get("result") or {}).get("status") == "active" else 1)' 2>/dev/null; then
        ok "CLOUDFLARE_PURGE_TOKEN is active (Cloudflare's token check; nothing purged)"
      else
        missing "an active CLOUDFLARE_PURGE_TOKEN: Cloudflare's token check refused it; a Cloudflare API token with Cache Purge on the download site's zone"
      fi
    else
      echo "NOT CHECKED the Cloudflare token: it needs CLOUDFLARE_PURGE_TOKEN above"
    fi
  fi

  if [ "$miss" = 0 ]; then echo "PREREQUISITES OK"; return 0; fi
  echo "PREREQUISITES MISSING ($miss): nothing was built or uploaded. Provide what is listed above, then run the job again."
  return 1
}

cmd="${1:-}"; [ "$#" -gt 0 ] && shift
case "$cmd" in
  preflight)
    preflight "$@"; exit $?
    ;;
  stage-files)
    v="${1:-}"; list=$(abs "${2:-}"); sdir=$(abs "${3:-}"); c="${RELEASE_COMMIT:-}"
    fail() {
      echo "FAIL  $1"
      [ -n "$c" ] && RELEASE_COMMIT="$c" bash "$HERE/release-state.sh" record rehearsal.windows FAIL "version=${v:-?}" "reason=$1"
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
    clean_rehearsals windows
    folder="$REHEARSAL_FOLDER/$v-${c:0:8}"
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
    RELEASE_COMMIT="$c" bash "$HERE/release-state.sh" record rehearsal.windows PASS "version=$v" "rehearsal=$folder/" "sha256=${sums# }" ||
      fail "could not record rehearsal.windows"
    echo "RELEASE_STAGE PASS $folder/"
    ;;
  stage-docker)
    c=""; v=""; digest=""
    fail() {
      echo "FAIL  $1"
      # a digest already pushed stays on the record (red or not): version-check then knows the tag is the release's own
      [ -n "$c" ] && RELEASE_COMMIT="$c" bash "$HERE/release-state.sh" record rehearsal.docker-stage FAIL "version=${v:-?}" \
        ${digest:+"digest=$digest"} "reason=$1"
      echo "RELEASE_STAGE FAIL"; exit 1
    }
    out=$(mktemp) || exit 2
    bash asbl/ci/dp-ci.sh build-if-needed 2>&1 | tee "$out"; rc=${PIPESTATUS[0]}
    tag=$(sed -n 's/^BUILD_TAG=//p' "$out" | tail -1); rm -f "$out"
    [ "$rc" = 0 ] && [ -n "$tag" ] || fail "dp-ci.sh build-if-needed did not end with a build (exit $rc, above)"
    c=$(git rev-parse HEAD); v="${tag%%-*}"
    [ "${tag#*-}" = "$(git rev-parse --short HEAD)" ] || fail "the build $tag is not of this checkout (${c:0:8}, uncommitted changes?)"
    gate=$(bash "$HERE/release-state.sh" version-check docker); rc=$?
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
    clean_rehearsals docker
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
    folder="$REHEARSAL_FOLDER/$v-${c:0:8}"
    upload_checked "$zip" "$folder" || fail "the docker zip was not staged in $folder/ (above)"
    RELEASE_COMMIT="$c" bash "$HERE/release-state.sh" record rehearsal.docker-stage PASS "version=$v" \
      "image=$RELEASE_IMAGE_REPO:$v" "digest=$digest" "rehearsal=$folder/" "sha256=datapallas-server-docker.zip:$(sha_of "$zip")" ||
      fail "could not record rehearsal.docker-stage"
    echo "RELEASE_STAGE PASS $RELEASE_IMAGE_REPO:$v $digest, $folder/"
    ;;
  publish)
    . "$HERE/marks.sh"
    mark_run publish "$@"
    ;;
  *)
    sed -n '2,70p' "$0"; exit 2 ;;
esac
