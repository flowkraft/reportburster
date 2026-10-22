#!/bin/bash
# One step of a Jenkins job that runs several, marked START and END with the time and how long it took (asbl/ci/marks.sh).
# Runs on the host, where the Jenkinsfile's ssh lands:
#
#   bash asbl/ci/jenkins/job-step.sh "JOB STEP 1/2" "<what it does>" <command...>
#
# Exit: the command's own.
set -uo pipefail
[ "$#" -ge 3 ] || { echo "usage: $0 <label> <what> <command...>" >&2; exit 2; }
. "$(dirname "$0")/../marks.sh"
mark_start "$1" "$2"
shift 2
"$@"; rc=$?
mark_end "$rc"
exit "$rc"
