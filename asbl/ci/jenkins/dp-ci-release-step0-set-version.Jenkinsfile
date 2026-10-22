// Job datapallas/dp-ci-release-step0-set-version: step 0 of a release, the version (asbl/ci/jenkins/release-set-version.sh).
// RELEASE_VERSION bigger than the current release: written into the 7 version files of origin/main, checked, committed and pushed
// to main; left as it is (pre-filled with the current release) or lower: nothing done, green.
// Its full description (what, when, order, needs, time, examples, log) is in asbl/ci/jenkins/seed.groovy, which makes the job;
// the guide is asbl/ci/jenkins/jenkins.md, section dp-ci-release-step0-set-version.
// The work is the plain script named below, run on the host over SSH exactly as it is run by hand; this file
// only starts it and shows its log. It takes seconds.
pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
    timeout(time: 30, unit: 'MINUTES')
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
q() { printf '%q' "$1"; }
# the output is kept in release-run.out for the build's label (post, below)
ssh -o BatchMode=yes "$DP_HOST" "cd $(q "$DP_REPO") && RELEASE_VERSION=$(q "$RELEASE_VERSION") DRY_RUN=$(q "$DRY_RUN") bash asbl/ci/jenkins/release-set-version.sh" | tee release-run.out
'''
      }
    }
  }

  post {
    always {
      script {
        // the build list says what happened without opening the log: the label is read from the run's output by
        // asbl/ci/jenkins/release-label.sh. Never turns a build red.
        try {
          def label = sh(returnStdout: true, script: '''#!/bin/bash
q() { printf '%q' "$1"; }
[ -f release-run.out ] || exit 0
ssh -o BatchMode=yes "$DP_HOST" "cd $(q "$DP_REPO") && bash asbl/ci/jenkins/release-label.sh" < release-run.out
''').trim()
          if (label) {
            currentBuild.description = label
          }
        } catch (err) {
          echo "The build label was not set: ${err}"
        }
      }
    }
  }
}
