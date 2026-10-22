#!/bin/bash
# The release record: which step of a release passed on which commit, and whether there is a version to release at all.
# Plain files on this host, one folder per commit, so that each release job can refuse to start when the step before it
# is not green on the same commit, and so that `show` tells at any time where a release stands. Run on the host (the
# Jenkins jobs call it over SSH, it also runs by hand):
#
#   bash asbl/ci/release-state.sh record <step.lane> PASS|FAIL [key=value ...]   write one verdict
#   bash asbl/ci/release-state.sh record-step1 <e2e target> <rc>                  the verdict of one step-1 lane (its job calls it;
#                                                                                 RELEASE_STEP_START = when the lane started, epoch s)
#   bash asbl/ci/release-state.sh require <step.lane|step1>...                   exit 1 unless every one is PASS
#   bash asbl/ci/release-state.sh get <step.lane> <key>                          print one recorded value
#   bash asbl/ci/release-state.sh show [<commit>]                                the table of one commit
#   bash asbl/ci/release-state.sh version-check [--print]                        is there a version to release (below)
#
# The commit is RELEASE_COMMIT when set (any form git knows: full, short), else this checkout's HEAD; folders use the full
# hash. A verdict is the file <RELEASE_STATE_DIR>/<commit>/<step.lane>, key=value lines: result, version (settings.xml of
# this checkout unless given), time, log (RELEASE_LOG when set), then whatever the caller adds (digest=, sha256 lists).
# Recording again replaces the verdict: the last run of a step is the one that counts.
#
# Verdict names (the jobs, in order):
#   step1.<target>-<mode>   dp-ci-release-step1-e2e-prerelease, one per target and mode (full | auth | light | targeted)
#   step2.docker-stage      dp-ci-release-step2-pack-and-uat-docker: the image pushed as :<version> (digest=) and the zip staged
#   step2.docker            dp-ci-release-step2-pack-and-uat-docker: the whole step
#   step3.windows           dp-ci-release-step3-pack-and-uat-windows
#   step4.publish           dp-ci-release-step4-publish
# `require step1` = the step-1 lanes a release needs (owner decision OD5, 2026-10-22): the list below.
# A `targeted` run (own E2E_SPEC/E2E_GREP) is recorded for the table but never counts for a release.
#
# version-check (owner, 2026-10-22: the release takes its version from settings.xml; the same as the released version =
# do nothing, greater = release). Every release job runs it before any work:
#   - the version to release is <version> in bkend/reporting/src/main/external-resources/template/config/burst/settings.xml;
#   - the other files that declare it (asbl/ci/set-version.sh --versions) must say the same: dp-ci.sh tags the image from
#     pom.xml, DockerAssembler pins the zip's image tag from settings.xml;
#   - the released version is the x.y.z tag whose digest is the one :latest has on Docker Hub (public API, no login);
#     the release record's last publish, when there is one, must agree;
#   - equal: "NOTHING TO RELEASE", exit 3 (the jobs end green, nothing done); lower: refused, exit 1;
#     greater: exit 0, unless :<version> is already on Docker Hub and no release step staged it (pushed by hand), or the
#     record says it was published: refused, exit 1. Docker Hub not answering: exit 2.
#   --print (step 1, which is also the everyday e2e job and never skips): one RELEASE_VERSION line, always exit 0.
# DOCKERHUB_API and RELEASE_IMAGE_REPO are variables so a test can point them at a local fixture.
set -uo pipefail
SELF="$(cd "$(dirname "$0")" && pwd)/$(basename "$0")"
cd "$(dirname "$0")/../.." || exit 2

RELEASE_STATE_DIR="${RELEASE_STATE_DIR:-/var/kraft-internalsystems/logs/datapallas-ci/release-state}"
REQUIRED_STEP1="step1.docker-server-full step1.docker-server-auth step1.windows-vm-electron-full step1.windows-vm-server-light"
SETTINGS_XML=bkend/reporting/src/main/external-resources/template/config/burst/settings.xml
DOCKERHUB_API="${DOCKERHUB_API:-https://hub.docker.com/v2/repositories}"
RELEASE_IMAGE_REPO="${RELEASE_IMAGE_REPO:-flowkraft/datapallas-server}"
LOG_DIR="${LOG_DIR:-/var/kraft-internalsystems/logs/datapallas-ci}"

commit_of() {  # the full hash of RELEASE_COMMIT or HEAD; the given text itself when git does not know it
  local c="${RELEASE_COMMIT:-HEAD}" full
  full=$(git rev-parse --verify -q "$c^{commit}" 2>/dev/null) && { echo "$full"; return 0; }
  [ "$c" != HEAD ] && echo "$c"
}
tree_version() { grep -m1 -oP '(?<=<version>)[^<]+' "$SETTINGS_XML" 2>/dev/null; }
valid_name() { printf '%s' "$1" | grep -qE '^step[1-4]\.[a-z0-9-]+$'; }
field() { sed -n "s/^$2=//p" "$1" 2>/dev/null | head -1; }  # field <file> <key>

hub_get() {  # hub_get <path under tags/> -> its JSON; rc 0 found, 1 no such tag (404), 2 Docker Hub not answering
  local out code
  out=$(mktemp) || return 2
  code=$(curl -sS -o "$out" -w '%{http_code}' --max-time 30 "$DOCKERHUB_API/$RELEASE_IMAGE_REPO/tags/$1" 2>/dev/null)
  case "$code" in
    200) cat "$out"; rm -f "$out"; return 0 ;;
    404) rm -f "$out"; return 1 ;;
    *)   rm -f "$out"; return 2 ;;
  esac
}
json_digest() { python3 -c 'import json,sys; print(json.load(sys.stdin).get("digest") or "")'; }

released_version() {  # the x.y.z tag :latest points to ('' = nothing released yet); rc 2 when Docker Hub does not answer
  local j d
  j=$(hub_get latest); case $? in 0) ;; 1) echo ""; return 0 ;; *) return 2 ;; esac
  d=$(printf '%s' "$j" | json_digest)
  j=$(hub_get '?page_size=100') || return 2
  printf '%s' "$j" | D="$d" python3 -c '
import json, os, re, sys
d = os.environ["D"]
names = [r["name"] for r in json.load(sys.stdin).get("results", [])
         if d and r.get("digest") == d and re.fullmatch(r"\d+\.\d+\.\d+", r["name"])]
names.sort(key=lambda v: [int(x) for x in v.split(".")])
print(names[-1] if names else "")'
}

VC_VERSION=""; VC_RELEASED="?"
version_check() {  # prints why; rc 0 GO, 3 nothing to release, 1 refused, 2 cannot check
  local v r bad j d pub
  v=$(tree_version); VC_VERSION="$v"
  [ -n "$v" ] || { echo "REFUSED  cannot read <version> from $SETTINGS_XML"; return 1; }
  printf '%s' "$v" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+$' || { echo "REFUSED  $SETTINGS_XML says '$v', not x.y.z"; return 1; }
  bad=$(bash asbl/ci/set-version.sh --versions | awk -v v="$v" '$1 != v')
  if [ -n "$bad" ]; then
    echo "REFUSED  $SETTINGS_XML says $v, these files say otherwise:"
    printf '%s\n' "$bad" | sed 's/^/           /'
    echo "         one version everywhere: bash asbl/ci/set-version.sh $v changes all of them at once (run it while they"
    echo "         still agree on the old one), then commit"
    return 1
  fi
  r=$(released_version) || { echo "CANNOT CHECK  Docker Hub did not answer ($DOCKERHUB_API/$RELEASE_IMAGE_REPO)"; return 2; }
  VC_RELEASED="${r:-none}"
  pub=$(sed -n 's/^version=//p' "$RELEASE_STATE_DIR"/*/step4.publish 2>/dev/null | sort -V | tail -1)
  if [ -n "$pub" ] && [ "$pub" != "$r" ]; then
    echo "REFUSED  Docker Hub's :latest is '${r:-none}', the release record's last publish is $pub: look at both before releasing"
    return 1
  fi
  if [ -n "$r" ] && [ "$v" = "$r" ]; then
    echo "NOTHING TO RELEASE: settings.xml says $v, $v is already released"
    return 3
  fi
  if [ -n "$r" ] && [ "$(printf '%s\n%s\n' "$v" "$r" | sort -V | tail -1)" != "$v" ]; then
    echo "REFUSED  settings.xml says $v, lower than the released $r"
    return 1
  fi
  if grep -qx "version=$v" "$RELEASE_STATE_DIR"/*/step4.publish 2>/dev/null; then
    echo "REFUSED  the release record says $v was already published: raise the version in settings.xml"
    return 1
  fi
  j=$(hub_get "$v")
  case $? in
    1) ;;
    0) d=$(printf '%s' "$j" | json_digest)
       if ! grep -qx "digest=$d" "$RELEASE_STATE_DIR"/*/step2.docker-stage 2>/dev/null; then
         echo "REFUSED  $RELEASE_IMAGE_REPO:$v is already on Docker Hub ($d) and no release step staged it (pushed by hand?):"
         echo "         raise the version in settings.xml"
         return 1
       fi
       echo "note: $RELEASE_IMAGE_REPO:$v is on Docker Hub, staged by an earlier step 2 and never promoted: it may be staged again" ;;
    *) echo "CANNOT CHECK  Docker Hub did not answer ($DOCKERHUB_API/$RELEASE_IMAGE_REPO)"; return 2 ;;
  esac
  echo "RELEASE_VERSION=$v RELEASED=${r:-none} GO"
  return 0
}

cmd="${1:-}"; [ "$#" -gt 0 ] && shift
case "$cmd" in
  record|require|get|show)
    commit=$(commit_of) || true
    [ -n "$commit" ] || { echo "FAIL  cannot tell which commit (RELEASE_COMMIT='${RELEASE_COMMIT:-}', HEAD)"; exit 2; }
    dir="$RELEASE_STATE_DIR/$commit" ;;
esac

case "$cmd" in
  record)
    name="${1:-}"; result="${2:-}"
    valid_name "$name" || { echo "FAIL  record: '$name' is not a verdict name (step<1-4>.<lane>)"; exit 2; }
    case "$result" in PASS|FAIL) ;; *) echo "FAIL  record: the result must be PASS or FAIL (got '$result')"; exit 2 ;; esac
    shift 2
    mkdir -p "$dir" || exit 2
    tmp=$(mktemp "$dir/.$name.XXXXXX") || exit 2
    {
      echo "result=$result"
      echo "commit=$commit"
      printf '%s\n' "$@" | grep -q '^version=' || echo "version=$(tree_version)"
      echo "time=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
      [ -n "${RELEASE_LOG:-}" ] && echo "log=$RELEASE_LOG"
      for kv in "$@"; do
        printf '%s' "$kv" | grep -qE '^[a-z0-9_]+=' || { echo "FAIL  record: '$kv' is not key=value" >&2; rm -f "$tmp"; exit 2; }
        printf '%s\n' "$kv"
      done
    } > "$tmp" || { rm -f "$tmp"; exit 2; }
    mv -f "$tmp" "$dir/$name" || exit 2
    echo "RELEASE_STATE recorded $name=$result commit=${commit:0:8}"
    ;;
  record-step1)
    # The lane's commit and log come from the run's own log (the Linux e2e prints E2E_COMMIT=, the Windows lanes
    # WIN_E2E_COMMIT=, the VM's commit): a Windows lane may test a commit this host has not pulled yet. A log older than
    # RELEASE_STEP_START is an earlier run's (this one failed before it started its own, e.g. in its build): not used.
    target="${1:-}"; rc="${2:-}"
    printf '%s' "$target" | grep -qE '^[a-z0-9-]+$' || { echo "FAIL  record-step1: bad target '$target'"; exit 2; }
    printf '%s' "$rc" | grep -qE '^[0-9]+$' || { echo "FAIL  record-step1: bad rc '$rc'"; exit 2; }
    spec="${E2E_SPEC:-}"; gexp="${E2E_GREP:-}"
    if [ -z "$spec" ] && [ -z "$gexp" ]; then
      case "$target" in windows-vm-docker|windows-vm-server) mode=light ;; *) mode=full ;; esac
    elif [ -z "$gexp" ] && case "$spec" in *'|'*|*'(?'*) false ;; *auth-authorization-server*) true ;; *) false ;; esac; then
      mode=auth
    else
      mode=targeted
    fi
    case "$target" in windows-vm-*) link="$LOG_DIR/win-e2e-latest.log"; key=WIN_E2E_COMMIT ;; *) link="$LOG_DIR/latest.log"; key=E2E_COMMIT ;; esac
    log=$(readlink -f "$link" 2>/dev/null)
    [ -n "$log" ] && [ "$(stat -c %Y "$log" 2>/dev/null || echo 0)" -lt "${RELEASE_STEP_START:-0}" ] && log=""
    c=$(grep -aoP "^$key=\K\S+" "$log" 2>/dev/null | tail -1)
    if [ -z "$c" ]; then
      c=$(git rev-parse HEAD)
      echo "note: no $key= line in ${log:-$link} (the lane did not get that far): recording this checkout's $(git rev-parse --short HEAD)"
    fi
    git rev-parse --verify -q "$c^{commit}" >/dev/null 2>&1 || git fetch -q origin 2>/dev/null
    [ "$rc" = 0 ] && res=PASS || res=FAIL
    RELEASE_COMMIT="$c" RELEASE_LOG="$log" bash "$SELF" record "step1.$target-$mode" "$res" "rc=$rc"
    ;;
  require)
    [ "$#" -gt 0 ] || { echo "usage: $0 require <step.lane|step1>..."; exit 2; }
    names=""
    for n in "$@"; do [ "$n" = step1 ] && names="$names $REQUIRED_STEP1" || names="$names $n"; done
    bad=0
    for n in $names; do
      f="$dir/$n"; r=$(field "$f" result)
      case "$r" in
        PASS) echo "  ok       $n  (version $(field "$f" version), $(field "$f" time))" ;;
        FAIL) echo "  RED      $n  (version $(field "$f" version), $(field "$f" time)$(l=$(field "$f" log); [ -n "$l" ] && echo ", log $l"))"; bad=1 ;;
        *)    echo "  MISSING  $n  (never run on this commit)"; bad=1 ;;
      esac
    done
    if [ "$bad" = 0 ]; then echo "RELEASE_STATE require OK commit=${commit:0:8}"; exit 0; fi
    echo "RELEASE_STATE require FAILED commit=${commit:0:8}: run the steps above on this commit first"
    exit 1
    ;;
  get)
    f="$dir/${1:-}"; [ -n "${2:-}" ] || { echo "usage: $0 get <step.lane> <key>"; exit 2; }
    [ -f "$f" ] || exit 1
    v=$(field "$f" "$2"); [ -n "$v" ] || exit 1
    printf '%s\n' "$v"
    ;;
  show)
    [ -n "${1:-}" ] && { RELEASE_COMMIT="$1"; commit=$(commit_of); dir="$RELEASE_STATE_DIR/$commit"; }
    echo "release record of commit ${commit:0:8} ($dir)"
    printf '%-34s %-6s %-10s %-21s %s\n' VERDICT RESULT VERSION TIME MORE
    found=0
    for f in "$dir"/step*; do
      [ -f "$f" ] || continue; found=1
      printf '%-34s %-6s %-10s %-21s %s\n' "$(basename "$f")" "$(field "$f" result)" "$(field "$f" version)" "$(field "$f" time)" \
        "$(grep -vE '^(result|commit|version|time)=' "$f" | tr '\n' ' ' | cut -c1-120)"
    done
    [ "$found" = 1 ] || echo "(nothing recorded for this commit)"
    for n in $REQUIRED_STEP1; do [ "$(field "$dir/$n" result)" = PASS ] || { echo "step 1 for a release: NOT complete (needs $REQUIRED_STEP1)"; exit 0; }; done
    echo "step 1 for a release: complete"
    ;;
  version-check)
    if [ "${1:-}" = --print ]; then
      out=$(mktemp); version_check > "$out"; rc=$?
      case "$rc" in
        0) what="would release" ;;
        3) what="nothing to release" ;;
        1) what="a release would be refused: $(head -1 "$out" | sed 's/^REFUSED  //')" ;;
        *) what="cannot check (Docker Hub did not answer)" ;;
      esac
      rm -f "$out"
      echo "RELEASE_VERSION settings.xml=${VC_VERSION:-?} released=$VC_RELEASED: $what"
      exit 0
    fi
    version_check
    ;;
  *)
    sed -n '2,42p' "$0"; exit 2 ;;
esac
