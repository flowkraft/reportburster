// Job datapallas/dp-ci-dev-server: starts, restarts or stops a dev web server (dp-ci.sh dev --live, --pinned <sha>, or dev in
// Kate's clone) and prints its URL.
// The server is a detached container owned by the Docker daemon, so it keeps running after this build ends, until ACTION=stop.
// For looking, never a proof: only the e2e jobs prove. The work is the plain script named below (dp-ci.sh dev), run on the host
// over SSH exactly as it is run by hand; this file only adds what a button needs: "already running" instead of a second start,
// a restart, a stop, and the wait until the site answers.
// Its full description (what, when, order, needs, time, examples, log) is in asbl/ci/jenkins/seed.groovy, which makes the job;
// the guide is asbl/ci/jenkins/jenkins.md, section dp-ci-dev-server.
pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
    timeout(time: 1, unit: 'HOURS')
  }

  environment {
    DP_HOST = 'root@172.19.0.1'
    DP_REPO = '/var/kraft-internalsystems/projects/all-repos/src/products/reportburster'
    DP_KATE_REPO = '/var/kraft-internalsystems/projects/all-repos/coordination-project-files/agents-headquarter/office-kate/projects/src/products/reportburster'
  }

  stages {
    stage('Run on the host') {
      steps {
        sh '''#!/bin/bash
set -o pipefail
q() { printf '%q' "$1"; }
# ssh joins its arguments into one command line: each is quoted, so an empty PINNED_SHA stays an argument
ssh -o BatchMode=yes "$DP_HOST" "bash -s -- $(q "$ACTION") $(q "$DEV_MODE") $(q "$PINNED_SHA") $(q "$DP_REPO") $(q "$DP_KATE_REPO")" <<'HOST'
set -u
action=$1 mode=$2 sha=$3 repo=$4 kate_repo=$5
envs=()
case "$mode" in
  live)   c=datapallas-dev;    url=https://dp-dev-live.bkstg.flowkraft.com;   start=(dev --live) ;;
  pinned) c=datapallas-pinned; url=https://dp-dev-pinned.bkstg.flowkraft.com; start=(dev --pinned "$sha") ;;
  kate)   c=datapallas-dev-kate; url=https://dp-kate.bkstg.flowkraft.com;     start=(dev)
          # Kate's own clone, with Kate's own container, URL and Maven cache (dp-ci.sh's header names them). The clone belongs
          # to Kate's own user: git (in dp-ci.sh, as root) is told it is safe, for this command only
          repo=$kate_repo
          envs=(DP_DEV_CONTAINER="$c" DP_DEV_URL="$url" DP_DEV_M2=dp-kate-m2 GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=safe.directory GIT_CONFIG_VALUE_0="$repo") ;;
  *) echo "FAIL  DEV_MODE must be live, pinned or kate (got '$mode')"; exit 2 ;;
esac
running() { [ -n "$(docker ps -q --filter "name=^${c}$")" ]; }
case "$action" in
  stop)
    if running; then docker stop "$c" >/dev/null && echo "stopped: $c ($url)"; else echo "not running: $c, nothing to stop"; fi
    exit 0 ;;
  start|restart) ;;
  *) echo "FAIL  ACTION must be start, restart or stop (got '$action')"; exit 2 ;;
esac
if [ "$action" = start ] && running; then
  at=$(docker inspect -f '{{range .Config.Env}}{{println .}}{{end}}' "$c" | sed -n 's/^SHA=//p')
  echo "already running at $url ($mode, ${at:-commit unknown}); nothing started. To start it again: ACTION=restart."
  exit 0
fi
[ "$mode" != pinned ] || [ -n "$sha" ] || { echo "FAIL  DEV_MODE=pinned needs PINNED_SHA"; exit 2; }
[ "$action" = restart ] && running && echo "restart: $c is running; dp-ci.sh dev removes it and starts it again"
# dp-ci.sh refuses here while a dp-ci run holds the server (the one-driver slot)
cd "$repo" && env "${envs[@]}" bash asbl/ci/dp-ci.sh "${start[@]}" || exit $?
# the public URL sits behind the sign-in proxy (it answers 302 whether the site is up or not): ask inside the container
echo "waiting for $url (the backend and the UI compile first)..."
for i in $(seq 1 180); do
  running || { echo "FAIL  $c stopped while starting: see its log, named above"; exit 1; }
  if [ "$(docker exec "$c" curl -s -o /dev/null -m 5 -w '%{http_code}' http://localhost:14201/ 2>/dev/null)" = 200 ]; then
    echo "ready: $url  (after $(( i * 10 )) s)"; exit 0
  fi
  sleep 10
done
echo "FAIL  $c did not answer within 30 min: see its log, named above"; exit 1
HOST
'''
      }
    }
  }
}
