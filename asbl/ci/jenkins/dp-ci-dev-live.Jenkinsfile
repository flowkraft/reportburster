// Job datapallas/dp-ci-dev-live. Brings up the hot-reloading dev server (dp-ci.sh dev --live, or --pinned <sha>) and prints its URL,
// or stops it. No e2e. The server is a detached container owned by the Docker daemon, so it keeps running after this build ends,
// until ACTION=stop. A diagnosis tool, never a verification: only dp-ci-e2e-loop and dp-ci-e2e-release may tick a TODO.
// The work is the plain script named below (dp-ci.sh dev), run on the host over SSH exactly as it is run by hand; this file only
// adds what a button needs: "already running" instead of a second start, a stop, and the wait until the site answers.
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
  }

  stages {
    stage('Run on the host') {
      steps {
        sh '''#!/bin/bash
set -o pipefail
ssh -o BatchMode=yes "$DP_HOST" bash -s -- "$ACTION" "$DEV_MODE" "$PINNED_SHA" "$DP_REPO" <<'HOST'
set -u
action=$1 mode=$2 sha=$3 repo=$4
case "$mode" in
  live)   c=datapallas-dev;    url=https://dp-dev-live.bkstg.flowkraft.com;   start=(dev --live) ;;
  pinned) c=datapallas-pinned; url=https://dp-dev-pinned.bkstg.flowkraft.com; start=(dev --pinned "$sha") ;;
  *) echo "FAIL  DEV_MODE must be live or pinned (got '$mode')"; exit 2 ;;
esac
running() { [ -n "$(docker ps -q --filter "name=^${c}$")" ]; }
case "$action" in
  stop)
    if running; then docker stop "$c" >/dev/null && echo "stopped: $c ($url)"; else echo "not running: $c, nothing to stop"; fi
    exit 0 ;;
  start) ;;
  *) echo "FAIL  ACTION must be start or stop (got '$action')"; exit 2 ;;
esac
if running; then
  at=$(docker inspect -f '{{range .Config.Env}}{{println .}}{{end}}' "$c" | sed -n 's/^SHA=//p')
  echo "already running at $url ($mode, ${at:-commit unknown}); nothing started. To start it again: ACTION=stop, then start."
  exit 0
fi
[ "$mode" = live ] || [ -n "$sha" ] || { echo "FAIL  DEV_MODE=pinned needs PINNED_SHA"; exit 2; }
# dp-ci.sh refuses here while a dp-ci run holds the server (the one-driver slot)
cd "$repo" && bash asbl/ci/dp-ci.sh "${start[@]}" || exit $?
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
