# Sourced, not run. Marks the parts of a run that does several (a build and an e2e, a pack and its checks, a lane's
# install and its tests): a START line and an END line with the time and how long the part took, so where the time
# goes can be read back from any log (owner, 2026-10-22: "so that we could have stats where time is going"):
#
#   grep -aE '^######## ' <log>
#   ######## JOB STEP 1/2 START  2026-10-22T10:00:00Z  :: the build of this commit, when there is none yet
#   ######## JOB STEP 1/2 END rc=0  2026-10-22T10:41:07Z  took=2467s (41m7s)  :: the build of this commit, when there is none yet
#
# Parts nest (a job step holds a lane, a lane holds its own steps): each END closes the part opened last.
#   mark_start <label> <what>   opens a part
#   mark_end [rc]               closes the part opened last
#   mark_next <label> <what>    closes the open part as rc=0 and opens the next one
#   mark_run <command...>       runs it, then closes, with its rc, every part it opened and left open (an early return)
MARK_LABEL=(); MARK_WHAT=(); MARK_T0=()
mark_start() {
  MARK_LABEL+=("$1"); MARK_WHAT+=("$2"); MARK_T0+=("$SECONDS")
  echo ""
  echo "######## $1 START  $(date -u +%Y-%m-%dT%H:%M:%SZ)  :: $2"
}
mark_end() {
  local i=$((${#MARK_LABEL[@]} - 1)) s
  [ "$i" -ge 0 ] || return 0
  s=$((SECONDS - MARK_T0[i]))
  echo "######## ${MARK_LABEL[i]} END rc=${1:-0}  $(date -u +%Y-%m-%dT%H:%M:%SZ)  took=${s}s ($((s / 60))m$((s % 60))s)  :: ${MARK_WHAT[i]}"
  unset 'MARK_LABEL[i]' 'MARK_WHAT[i]' 'MARK_T0[i]'
}
mark_next() { mark_end 0; mark_start "$@"; }
mark_run() {
  local depth=${#MARK_LABEL[@]} rc
  "$@"; rc=$?
  while [ "${#MARK_LABEL[@]}" -gt "$depth" ]; do mark_end "$rc"; done
  return "$rc"
}
