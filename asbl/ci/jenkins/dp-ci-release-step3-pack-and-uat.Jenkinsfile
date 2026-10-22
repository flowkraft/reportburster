// Job datapallas/dp-ci-release-step3-pack-and-uat. Step 3 of 3 of a release, the last (after dp-ci-release-step1-package and a green dp-ci-release-step2-e2e-prerelease on the same commit): dp-ci.sh win release. On the Windows VM, asbl\pack-datapallas.bat builds the release files once, from clean; then the Robot Framework UAT (asbl\src\uat\run-tests.bat) and the Docker light set on Windows and on Linux test those very files the way a user meets them. Green only when all pass; the sha256 of the files that may be published are in the log and in the release-files report. Nothing is published.
// The work is the plain script named below, run on the host over SSH exactly as it is run by hand; this file
// only starts it and shows its log. The driver is a detached host process and the VM steps are scheduled tasks,
// so closing the browser or restarting Jenkins never stops it (see asbl/ci/jenkins/jenkins.md).
pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
    timeout(time: 36, unit: 'HOURS')
  }

  environment {
    DP_HOST = 'root@172.19.0.1'
    DP_REPO = '/var/kraft-internalsystems/projects/all-repos/src/products/reportburster'
    // the release's step log names its files <log>-step-...: the Robot results, the Playwright report of Docker on Windows, the release files
    REPORT_PATHS = '@run/-step-robot @run/-step-playwright.xml @run/-step-playwright-html @run/-step-release-files.txt'
  }

  stages {
    stage('Run on the host') {
      steps {
        // a red run is recorded here, not thrown, so that the Reports stage below still runs and shows its reports
        catchError(buildResult: 'FAILURE', stageResult: 'FAILURE') {
        sh '''#!/bin/bash
set -o pipefail
q() { printf '%q' "$1"; }
# the Windows lanes' launcher and its pid file: never two Windows runs at once
ssh -o BatchMode=yes "$DP_HOST" "cd $(q "$DP_REPO") && FOLLOW_PIDFILE=/var/kraft-internalsystems/logs/datapallas-ci/win-e2e.pid bash asbl/ci/jenkins/follow-ci.sh run bash asbl/ci/jenkins/win-e2e.sh release"
'''
        }
      }
    }
    stage('Reports') {
      steps {
        // Pulls the run's reports from the host into ./reports. Never fails the build (reports are shown, not enforced).
        sh '''#!/bin/bash
rm -rf reports; mkdir -p reports
q() { printf '%q' "$1"; }
LOGLINK=/var/kraft-internalsystems/logs/datapallas-ci/win-e2e-latest.log
ssh -o BatchMode=yes "$DP_HOST" "cd $(q "$DP_REPO") && set -f && CI_LOG_LINK=$(q "$LOGLINK") bash asbl/ci/jenkins/pull-reports.sh $REPORT_PATHS" | tar xzf - -C reports || echo "Reports: nothing pulled"
# the run's files are named after its log: give them the fixed names the publishers need
for f in reports/*-playwright.xml; do [ -e "$f" ] && mv "$f" reports/playwright.xml; done
for d in reports/*-playwright-html; do [ -e "$d" ] && rm -rf reports/playwright-html && mv "$d" reports/playwright-html; done
for d in reports/*-robot; do [ -e "$d" ] && rm -rf reports/robot && mv "$d" reports/robot; done
for f in reports/*-release-files.txt; do [ -e "$f" ] && mv "$f" reports/release-files.txt; done
exit 0
'''
        // Robot Framework UAT: pass/fail trend, links to its report and log. Thresholds 0 = never marks the build unstable (the run's own verdict decides).
        script {
          if (fileExists('reports/robot/output.xml')) {
            robot outputPath: 'reports/robot', outputFileName: 'output.xml', logFileName: 'log.html', reportFileName: 'report.html', passThreshold: 0.0, unstableThreshold: 0.0, otherFiles: '**/*.png'
          }
        }
        // Docker on Windows (the light set): test counts and the Playwright report. Docker on Linux keeps its report next to its own run log.
        junit testResults: 'reports/playwright.xml', allowEmptyResults: true, skipMarkingBuildUnstable: true
        publishHTML(target: [reportName: 'Playwright report', reportDir: 'reports/playwright-html', reportFiles: 'index.html', keepAll: false, allowMissing: true, alwaysLinkToLastBuild: true])
        // the sha256 of the files this run accepted: the ones that may be published
        archiveArtifacts artifacts: 'reports/release-files.txt', allowEmptyArchive: true
      }
    }
  }
}
