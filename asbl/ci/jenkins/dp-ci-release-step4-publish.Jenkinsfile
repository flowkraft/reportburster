// Job datapallas/dp-ci-release-step4-publish. Step 4 of 4 of a release, the owner only (after steps 2 and 3 are green on the same commit): asbl/ci/release-publish.sh promote. First the version gate (nothing to release = green, nothing done) and the guards (step2.docker and step3.windows PASS on this commit for this version, no step4.publish yet, the registry's :<version> still the staged digest). Then the staged files copied to newest/ and to <version>/ on Backblaze, each newest/ file checked by download; the Cloudflare cache of the newest/ links purged; :latest pointed at the staged :<version>, checked; step4.publish recorded. The public links move here and only here.
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
        sh '''#!/bin/bash
set -o pipefail
q() { printf '%q' "$1"; }
# its parts are marked PUBLISH STEP 1/4 .. 4/4, each START/END with the time it took (asbl/ci/marks.sh): grep '^######## ' in the console
ssh -o BatchMode=yes "$DP_HOST" "cd $(q "$DP_REPO") && DRY_RUN=$(q "$DRY_RUN") bash asbl/ci/release-publish.sh promote"
'''
      }
    }
  }
}
