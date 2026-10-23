// Job datapallas/dp-ci-release-step3-release-windows-vm: the Windows release (dp-ci.sh win release). MODE=rehearsal (the default):
// packed once on the VM, tested by the Robot UAT, staged where users do not get it. MODE=public: a passed rehearsal of this version
// copied to the public places in minutes, or a rehearsal first when there is none.
// Its full description (what, when, order, needs, time, examples, log) is in asbl/ci/jenkins/seed.groovy, which makes the job;
// the guide is asbl/ci/jenkins/jenkins.md, section dp-ci-release-step3-release-windows-vm.
// E2E_APPROVAL (the owner's written decision to go on without step 1's four lanes; seed.groovy's parameter text says what it
// does) and the user who started the build (E2E_APPROVAL_USER) reach asbl/ci/release-state.sh through the environment.
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
    // the release's step log names its files <log>-step-...: the Robot results, the release files
    REPORT_PATHS = '@run/-step-robot @run/-step-release-files.txt'
  }

  stages {
    stage('Run on the host') {
      steps {
        script {
          // who started this build, for an E2E_APPROVAL (asbl/ci/release-state.sh writes it into the log and the release
          // record): read from the build's cause, no plugin needed. Never stops the build
          try {
            def u = currentBuild.getBuildCauses('hudson.model.Cause$UserIdCause')
            env.E2E_APPROVAL_USER = u ? u[0].userId : currentBuild.getBuildCauses()[0].shortDescription
          } catch (err) {
            env.E2E_APPROVAL_USER = "(not read: ${err})"
          }
        }
        // a red run is recorded here, not thrown, so that the Reports stage below still runs and shows its reports
        catchError(buildResult: 'FAILURE', stageResult: 'FAILURE') {
        sh '''#!/bin/bash
set -o pipefail
q() { printf '%q' "$1"; }
# the Windows lanes' launcher and its pid file: never two Windows runs at once. The job is one step; its parts are marked
# RELEASE STEP 1/3 .. 3/3 and WINDOWS PUBLIC inside, each START/END with the time it took (asbl/ci/marks.sh): grep '^######## '
# in the console. MODE, DRY_RUN, E2E_APPROVAL and E2E_APPROVAL_USER reach dp-ci.sh win release (and the release-state.sh it
# calls) through the environment. The output is kept in release-run.out for the stage that queues the seed job and for the
# build's label (post, below).
ssh -o BatchMode=yes "$DP_HOST" "cd $(q "$DP_REPO") && MODE=$(q "$MODE") DRY_RUN=$(q "$DRY_RUN") E2E_APPROVAL=$(q "$E2E_APPROVAL") E2E_APPROVAL_USER=$(q "$E2E_APPROVAL_USER") bash asbl/ci/jenkins/job-step.sh 'JOB STEP 1/1' 'the Windows release: dp-ci.sh win release' env FOLLOW_PIDFILE=/var/kraft-internalsystems/logs/datapallas-ci/win-e2e.pid bash asbl/ci/jenkins/follow-ci.sh run bash asbl/ci/jenkins/win-e2e.sh release" | tee release-run.out
'''
        }
      }
    }
    stage('Queue seed') {
      steps {
        script {
          // MODE=public that went through: the seed job runs again, so the jobs show the released version
          if (sh(script: "grep -q '^RELEASE_PUBLIC PASS ' release-run.out 2>/dev/null", returnStatus: true) == 0) {
            build job: '/seed', wait: false
          }
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
        // the sha256 of the files this run accepted and staged: the ones MODE=public copies
        archiveArtifacts artifacts: 'reports/release-files.txt', allowEmptyArchive: true
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
