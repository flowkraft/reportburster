// Job datapallas/dp-ci-release-step4-demo-public: step 4 of a release, after the Docker release's MODE=public: demo.datapallas.com
// installs the published release, nothing built (asbl/ci/jenkins/release-demos.sh with DEMO=demo.datapallas.com).
// Its full description (what, when, order, needs, time, examples, log) is in asbl/ci/jenkins/seed.groovy, which makes the job;
// the guide is asbl/ci/jenkins/jenkins.md, section dp-ci-release-step4-demo-public.
// The work is the plain script named below, run on the host over SSH exactly as it is run by hand; this file only starts it and
// shows its log.
pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
    timeout(time: 2, unit: 'HOURS')
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
# its parts are marked DEMOS STEP n/N, each START/END with the time it took (asbl/ci/marks.sh): grep '^######## ' in the console
ssh -o BatchMode=yes "$DP_HOST" "cd $(q "$DP_REPO") && DEMO=demo.datapallas.com RESET_DEMO_DATA=$(q "$RESET_DEMO_DATA") DRY_RUN=$(q "$DRY_RUN") bash asbl/ci/jenkins/release-demos.sh"
'''
      }
    }
  }
}
