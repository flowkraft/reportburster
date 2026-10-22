// Job datapallas/dp-ci-release-demos. The demos on the code of origin/main: asbl/ci/jenkins/release-demos.sh builds it first
// when it is not built yet (dp-ci.sh build-if-needed), then publishes that image to dp-demo.bkstg, demo.datapallas.com or both.
// Not a step of a release: run it whenever a demo should show origin/main, best after dp-ci-release-step1-e2e-prerelease is green on it.
// The work is the plain script named below, run on the host over SSH exactly as it is run by hand; this file
// only starts it and shows its log (see asbl/ci/jenkins/jenkins.md).
pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
    timeout(time: 4, unit: 'HOURS')
  }

  environment {
    DP_HOST = 'root@172.19.0.1'
    DP_REPO = '/var/kraft-internalsystems/projects/all-repos/src/products/reportburster'
  }

  stages {
    stage('Run on the host') {
      steps {
        // a red run is recorded here, not thrown, so that the Reports stage below still runs and shows its reports
        catchError(buildResult: 'FAILURE', stageResult: 'FAILURE') {
        sh '''#!/bin/bash
set -o pipefail
q() { printf '%q' "$1"; }
# its parts are marked DEMOS STEP n/N, each START/END with the time it took (asbl/ci/marks.sh): grep '^######## ' in the console
ssh -o BatchMode=yes "$DP_HOST" "cd $(q "$DP_REPO") && DEMO=$(q "$DEMO") RESET_DEMO_DATA=$(q "$RESET_DEMO_DATA") DRY_RUN=$(q "$DRY_RUN") bash asbl/ci/jenkins/release-demos.sh"
'''
        }
      }
    }
    stage('Reports') {
      steps {
        // The image scan of the newest build (the one published, when this run built it or found it built). Never fails the build.
        sh '''#!/bin/bash
rm -rf reports; mkdir -p reports
q() { printf '%q' "$1"; }
ssh -o BatchMode=yes "$DP_HOST" "cd $(q "$DP_REPO") && T=\\$(ls -1dt /var/kraft-internalsystems/logs/datapallas-ci/*-build-*-trivy 2>/dev/null | head -1) && set -f && bash asbl/ci/jenkins/pull-reports.sh \\$T" | tar xzf - -C reports || echo "Reports: nothing pulled"
for d in reports/*-trivy; do [ -e "$d" ] && rm -rf reports/trivy && mv "$d" reports/trivy; done
exit 0
'''
        recordIssues(tool: trivy(pattern: 'reports/trivy/trivy.json', id: 'trivy', name: 'Trivy'), enabledForFailure: true, skipBlames: true)
        archiveArtifacts artifacts: 'reports/trivy/trivy.json', allowEmptyArchive: true
      }
    }
  }
}
