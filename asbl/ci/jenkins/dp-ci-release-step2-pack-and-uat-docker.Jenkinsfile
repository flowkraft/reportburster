// Job datapallas/dp-ci-release-step2-pack-and-uat-docker. Step 2 of 4 of a release (after dp-ci-release-step1-e2e-prerelease is green on the same commit; before or after step 3, never at the same time): asbl/ci/jenkins/release-docker.sh. First the version gate (nothing to release = green, nothing built). Then the build of origin/main when there is none yet, built once on Linux; its image pushed as :<version> (never :latest) and datapallas-server-docker.zip staged in the release's candidate folder, both checked; then that very zip downloaded and installed the way a user does it, on Linux and in the Windows VM's Docker Desktop, the light set on each, and on Linux the one-command docker run of the self-host page. No public link moves: step 4 publishes.
// The work is the plain script named below, run on the host over SSH exactly as it is run by hand; this file
// only starts it and shows its log. The e2e runs are detached (a container, the Windows driver), so closing the
// browser or restarting Jenkins never stops them (see asbl/ci/jenkins/jenkins.md).
pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
    timeout(time: 12, unit: 'HOURS')
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
# its parts are marked DOCKER RELEASE STEP 1/6 .. 6/6, each START/END with the time it took (asbl/ci/marks.sh): grep '^######## ' in the console
ssh -o BatchMode=yes "$DP_HOST" "cd $(q "$DP_REPO") && DRY_RUN=$(q "$DRY_RUN") bash asbl/ci/jenkins/release-docker.sh"
'''
        }
      }
    }
    stage('Reports') {
      steps {
        // The image scan of the newest build (the one staged, when this run built it or found it built). Never fails the build.
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
