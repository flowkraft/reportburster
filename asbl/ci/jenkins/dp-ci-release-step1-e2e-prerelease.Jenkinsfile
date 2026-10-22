// Job datapallas/dp-ci-release-step1-e2e-prerelease. Step 1 of 2 of a release (then, when every target is green, dp-ci-release-step2-pack-and-uat). The REAL end-to-end tests, the prerelease check: dp-ci.sh e2e, on a package built from this exact commit (rebuilt first when it is not). docker-server, windows-vm-docker and windows-vm-server first build origin/main when it is not built yet (dp-ci.sh build-if-needed, JOB STEP 1/2). Slow. E2E_SPEC narrows it to one file (a regex on the path); empty = the full suite. No title filter: it runs a file start to end. For the fix-and-retry loop use dp-ci-e2e-loop.
// The work is the plain script named below, run on the host over SSH exactly as it is run by hand; this file
// only starts it and shows its log. The run is a detached container owned by the Docker daemon, so closing
// the browser or restarting Jenkins never stops it (see asbl/ci/jenkins/jenkins.md).
pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
    timeout(time: 72, unit: 'HOURS')
  }

  environment {
    DP_HOST = 'root@172.19.0.1'
    DP_REPO = '/var/kraft-internalsystems/projects/all-repos/src/products/reportburster'
    // space-separated paths (globs allowed), relative to DP_REPO, pulled into ./reports by the Reports stage; see jenkins.md, "Reports"
    REPORT_PATHS = '@run/-playwright.xml @run/-playwright-html @run/-openapi'
  }

  stages {
    stage('Run on the host') {
      steps {
        // a red run is recorded here, not thrown, so that the Reports stage below still runs and shows its reports
        catchError(buildResult: 'FAILURE', stageResult: 'FAILURE') {
        sh '''#!/bin/bash
set -o pipefail
q() { printf '%q' "$1"; }
case "$E2E_TARGET" in
  windows-vm-electron)
    # the Windows VM lane: dp-ci.sh win e2e, started by win-e2e.sh and followed by its pid
    RUN="env FOLLOW_PIDFILE=/var/kraft-internalsystems/logs/datapallas-ci/win-e2e.pid bash asbl/ci/jenkins/follow-ci.sh run bash asbl/ci/jenkins/win-e2e.sh" ;;
  windows-vm-docker)
    # DataPallas Server in the VM's Docker Desktop: dp-ci.sh win docker-e2e, same launcher, same pid file
    RUN="env FOLLOW_PIDFILE=/var/kraft-internalsystems/logs/datapallas-ci/win-e2e.pid bash asbl/ci/jenkins/follow-ci.sh run bash asbl/ci/jenkins/win-e2e.sh docker-e2e" ;;
  windows-vm-server)
    # DataPallas Server on the VM's own Java 17: dp-ci.sh win server-e2e, same launcher, same pid file
    RUN="env FOLLOW_PIDFILE=/var/kraft-internalsystems/logs/datapallas-ci/win-e2e.pid bash asbl/ci/jenkins/follow-ci.sh run bash asbl/ci/jenkins/win-e2e.sh server-e2e" ;;
  electron-windows-vm|docker-windows-vm|server-windows-vm)
    # the names before 2026-10-22, still in the parameters of older builds: refused here, not sent to the Linux e2e below
    echo "FAIL  E2E_TARGET $E2E_TARGET was renamed: windows-vm-electron, windows-vm-docker, windows-vm-server"; exit 2 ;;
  electron-linux)
    RUN="env E2E_TARGET=electron bash asbl/ci/jenkins/follow-ci.sh run bash asbl/ci/dp-ci.sh e2e" ;;
  *)
    RUN="env E2E_TARGET=$(q "$E2E_TARGET") bash asbl/ci/jenkins/follow-ci.sh run bash asbl/ci/dp-ci.sh e2e" ;;
esac
# Each part of the job is marked START/END with the time it took (asbl/ci/marks.sh): grep '^######## ' in the console.
# The three targets that install what `dp-ci.sh build` makes build origin/main first, only when it is not built yet.
JS="bash asbl/ci/jenkins/job-step.sh"
case "$E2E_TARGET" in
  docker-server|windows-vm-docker|windows-vm-server)
    STEPS="$JS 'JOB STEP 1/2' 'the build of origin/main, only when there is none yet (dp-ci.sh build-if-needed)' bash asbl/ci/dp-ci.sh build-if-needed && $JS 'JOB STEP 2/2' 'e2e $E2E_TARGET' $RUN" ;;
  *)
    STEPS="$JS 'JOB STEP 1/1' 'e2e $E2E_TARGET' $RUN" ;;
esac
ssh -o BatchMode=yes "$DP_HOST" "cd $(q "$DP_REPO") && export E2E_SPEC=$(q "$E2E_SPEC") E2E_ROTATION_DATE=$(q "$E2E_ROTATION_DATE") E2E_RETRIES=$(q "$E2E_RETRIES") && $STEPS"
'''
        }
      }
    }
    stage('Reports') {
      steps {
        // Pulls the run's reports from the host into ./reports. Never fails the build (reports are shown, not enforced).
        // The publisher steps (junit, coverage, warnings, HTML) are added below by the quality plan, one tool at a time.
        sh '''#!/bin/bash
rm -rf reports; mkdir -p reports
q() { printf '%q' "$1"; }
# the Windows lanes have their own newest-log link, and their step log (dp-ci.sh win e2e / docker-e2e) names the files <log>-step-playwright...
LOGDIR=/var/kraft-internalsystems/logs/datapallas-ci; LOGLINK=$LOGDIR/latest.log; RP="$REPORT_PATHS"
if [ "$E2E_TARGET" = windows-vm-electron ] || [ "$E2E_TARGET" = windows-vm-docker ] || [ "$E2E_TARGET" = windows-vm-server ]; then LOGLINK=$LOGDIR/win-e2e-latest.log; RP="@run/-step-playwright.xml @run/-step-playwright-html @run/-step-robot"; fi
# the targets that may have built first: the image scan of the build (dp-ci.sh build writes it next to its own log)
TRIVY=""
case "$E2E_TARGET" in docker-server|windows-vm-docker|windows-vm-server) TRIVY='$(ls -1dt '"$LOGDIR"'/*-build-*-trivy 2>/dev/null | head -1)' ;; esac
ssh -o BatchMode=yes "$DP_HOST" "cd $(q "$DP_REPO") && T=$TRIVY && set -f && CI_LOG_LINK=$(q "$LOGLINK") bash asbl/ci/jenkins/pull-reports.sh $RP \\$T" | tar xzf - -C reports || echo "Reports: nothing pulled"
# the run's files are named after its log (<ts>-e2e-<sha>-playwright...): give them the fixed names the publishers need
for f in reports/*-playwright.xml; do [ -e "$f" ] && mv "$f" reports/playwright.xml; done
for d in reports/*-playwright-html; do [ -e "$d" ] && rm -rf reports/playwright-html && mv "$d" reports/playwright-html; done
for d in reports/*-openapi; do [ -e "$d" ] && rm -rf reports/openapi && mv "$d" reports/openapi; done
for d in reports/*-robot; do [ -e "$d" ] && rm -rf reports/robot && mv "$d" reports/robot; done
for d in reports/*-trivy; do [ -e "$d" ] && rm -rf reports/trivy && mv "$d" reports/trivy; done
exit 0
'''
        // Playwright (J1): the JUnit XML = test counts and trend; the HTML report = every test with its steps, screenshots and trace.
        // Non-gating: neither step changes the result. keepAll false keeps only the latest report (traces are large).
        junit testResults: 'reports/playwright.xml', allowEmptyResults: true, skipMarkingBuildUnstable: true
        // Robot Framework UAT (J10), Windows lane: a UAT step of the lane (W9, not there yet) leaves asbl/src/uat/results (output.xml, log.html, report.html)
        // as <step log>-robot next to its log; it is then shown with the Robot plugin: pass/fail trend, links to the report and the log.
        // Nothing is shown (and nothing fails) while no run has produced it. Thresholds 0 = never marks the build unstable.
        script {
          if (fileExists('reports/robot/output.xml')) {
            robot outputPath: 'reports/robot', outputFileName: 'output.xml', logFileName: 'log.html', reportFileName: 'report.html', passThreshold: 0.0, unstableThreshold: 0.0, otherFiles: '**/*.png'
          }
        }
        // springdoc OpenAPI + Swagger UI (J11): saved by dp-ci.sh e2e at the end of a docker-server run (the shipped server is up); the static Swagger UI page
        // reads the openapi.json next to it. Nothing is shown while no run has produced it. Needs the CSP relaxation of jenkins.md (it runs a script).
        publishHTML(target: [reportName: 'Swagger UI (OpenAPI)', reportDir: 'reports/openapi', reportFiles: 'index.html', keepAll: false, allowMissing: true, alwaysLinkToLastBuild: true])
        archiveArtifacts artifacts: 'reports/openapi/openapi.json', allowEmptyArchive: true
        // Trivy (J15), when this job built first: the HIGH and CRITICAL CVEs of the image, as a Warnings Next Generation table.
        recordIssues(tool: trivy(pattern: 'reports/trivy/trivy.json', id: 'trivy', name: 'Trivy'), enabledForFailure: true, skipBlames: true)
        archiveArtifacts artifacts: 'reports/trivy/trivy.json', allowEmptyArchive: true
        publishHTML(target: [reportName: 'Playwright report', reportDir: 'reports/playwright-html', reportFiles: 'index.html', keepAll: false, allowMissing: true, alwaysLinkToLastBuild: true])
      }
    }
  }
}
