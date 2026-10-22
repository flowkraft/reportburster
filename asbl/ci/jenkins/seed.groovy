// Job DSL: creates every Jenkins job of this project from the repository, so the Jenkins can be rebuilt and
// no job is made by clicking. Run by the one hand-made job `seed` (see jenkins.md, "Seed job").
//
// One job per step the owner starts on its own. Each job loads its Jenkinsfile from this repository, and the
// Jenkinsfile runs a plain script from asbl/ci on the host over SSH: the very scripts that are run by hand,
// in the very same CI container. No secrets in here: the repository is public.

def repoUrl    = 'https://github.com/flowkraft/datapallas.git'
def repoBranch = '*/main'

folder('datapallas') {
  description('DataPallas CI. The jobs are defined in asbl/ci/jenkins/seed.groovy: change them there, not here.')
}

// How to read a Playwright run's log, the same for both e2e jobs. The lines are dp-ci.sh's and Playwright's: keep this in step with them.
def playwrightLog = '\n\nIts log (Playwright). Search the whole log with a regular expression, not only its end: a run waiting for a database (DB2) fills the end with thousands of "attempting JDBC connection" lines while its results sit further up. Every finished test attempt prints one line: \u2713  394 specs/features/reporting.spec.ts:810:31 \u203a <title> (2.2m) passed, \u2718 failed, - skipped, (retry #1) a second try of the same test; the number after the mark counts the attempts finished so far. On Windows (windows-vm-electron) the same line reads ok 394 specs\\features\\reporting.spec.ts:810:31 > <title>: ok for \u2713, x for \u2718, backslashes in the path, > for \u203a; the patterns below match both.' +
  '\nHow many tests and how far: Running [0-9]+ tests, then the newest (\u2713|ok|\u2718|x|-) +[0-9]+ specs[/\\\\].' +
  '\nRunning tally, counting the matches: (\u2713|ok) +[0-9]+ specs[/\\\\] passed, (\u2718|x) +[0-9]+ specs[/\\\\] failed,  - +[0-9]+ specs[/\\\\] skipped.' +
  '\nWhich failed, and the retries: (\u2718|x) +[0-9]+ specs[/\\\\] and retry #[0-9]+ (a pass on a retry = flaky, a fail on a retry = really red). One test: its file and line, for example reporting\\.spec\\.ts:390, with 20 lines of context. Waiting for a database: attempting JDBC.' +
  '\nThe official end result, once the run has finished: E2E_RESULT|\\] (stdout: +)?[0-9]+ (passed|failed|flaky|skipped|did not run).' +
  '\nCounts during the run are attempts, not tests, and provisional: a test that failed and then passed on its retry shows once in each count. The official totals are Playwright\'s summary line (361 passed, 16 failed, 1 flaky), the E2E_RESULT line and the JSON report, written when the run ends.'

// name -> [Jenkinsfile, what it is, parameters]. Add an entry to add a job.
def jobs = [
  'dp-ci-quality': [
    about: 'The quality tools (lint, bug finder, format check, documentation) of the working tree on the server (dp-ci.sh quality). No package, no tests, no e2e; never gating.' +
      '\n\nIts log: what each tool reported, and the summary line (QUALITY_RESULT tools=N ok=N failed=N ...): quality: |QUALITY_RESULT.',
    params: [:],
  ],
  'dp-ci-junit': [
    about: 'The JUnit gate (dp-ci.sh junit): one module and test pattern, or everything when both are empty. No package, no e2e.' +
      '\n\nIts log: the total of each module, one line per module: TOTAL classes:; the test classes with failures or errors: Tests run:.*(Failures: [1-9]|Errors: [1-9]), with 5 lines of context.',
    params: [
      JUNIT_MODULE: [choices: ['', 'bkend/server', 'bkend/common', 'bkend/reporting'], text: 'WHICH MODULE: the Maven module whose tests run. EMPTY (the default) = all three modules: the full gate, about 25 min.\nUse it: after you changed Java code, narrow the run to the module you changed.\nPair it with JUNIT_TEST below to run only the class you touched.'],
      JUNIT_TEST  : [text: 'WHICH TESTS inside the module (a Maven Surefire -Dtest pattern). Empty = every test of the module (slow).\nUse it: nearly every time, to run only the class or method you touched.\nExamples:\n  ReportsServiceTest   -> one test class\n  ReportsServiceTest#method   -> one test method of it\n  Jasper*Test   -> every class that starts with Jasper and ends with Test\n  FooTest,BarTest   -> two classes'],
    ],
  ],
  'dp-ci-e2e-loop': [
    about: 'The fix-and-retry loop (dp-ci.sh e2e-loop): ONE spec file, on the web or the electron-linux target. Speed: about 4 min fixed plus the spec. Never rebuilds the package: E2E_PACKAGE says what happens to it (as it is, a few changed files copied in, or the content packaged again). Not a release check: that is dp-ci-release-step1-e2e-prerelease.' + playwrightLog,
    params: [
      E2E_SPEC  : [text: 'WHICH FILE to run. REQUIRED. A regex on the path of the spec file; end it with $ so that it matches one file only.\nUse it: every run (there is no default: it is a different file each time).\nExamples:\n  /areas/cube-stories\\.spec\\.ts$\n  /features/samples\\.spec\\.ts$\n  /areas/connections\\.spec\\.ts$\n  /features/explore-data-visualizations\\.spec\\.ts$\nSeveral files at once (slower, the exception): /features/explore-data-   -> every explore-data-*.spec.ts.\nThe files are under frend/reporting/e2e/specs/. Leave E2E_GREP empty to run the whole file (the normal case).'],
      E2E_GREP  : [text: 'WHICH TESTS inside that file. Optional. A regex on the test titles. Empty = every test of the file (the normal case).\nUse it: to re-run only the test or tests that failed after a fix. Run the whole file again (empty) before you call the file green.\nExamples:\n  Show Me   -> the tests whose title contains Show Me\n  refus|SQL vendor   -> the tests whose title contains either text (| means or)\n  \\[duckdb\\] Database Schema   -> + ( ) [ ] . ? * and | have a meaning in a regex: put a backslash before them to match them as written. Same for palette \\+ default config\nTip: copy a piece of the title from the failure line of the run log or from the Playwright report.\nCareful: in a serial file (cube-stories, dashboard-demos, auth-authorization-server) a test depends on the ones before it, so a filtered run can fail for that reason alone.'],
      E2E_TARGET: [choices: ['web', 'electron-linux'], text: 'WHAT the tests run against.\nweb (default, the everyday one): the server and the Angular UI built from this tree, in a browser.\nelectron-linux: the desktop application on Linux (for the specs that only run there, for example let-me-update-migrate-configuration).\ndocker-server and windows-vm-electron are release checks: use dp-ci-release-step1-e2e-prerelease for them.'],
      E2E_PACKAGE: [choices: ['package-reuse-as-is', 'package-rsync-simple-file-changes', 'package-repackage'], text: 'WHAT HAPPENS TO THE PACKAGE before the run. The package holds the content the tests start from (sample apps, db-template, config, samples, scripts, sample databases). The jars and the Angular UI are always built from the tree, so a fix to Java, the UI, specs or helpers needs nothing more.\npackage-reuse-as-is (default): run on the package exactly as it stands. COST: instant. Use it for almost every run.\npackage-rsync-simple-file-changes: copy the plain db-template files changed since the package was built (commits, and new untracked files) into the package and the testground. COST: very fast, a few seconds. Use it after a small fix under db-template (for example a sample or the AI Hub app). If a changed file is not a plain copy in the package (generated, transformed or checked by the assembler), the run stops with: use package-repackage. With nothing changed it copies 0 files.\npackage-repackage: package the content again on the jars already built (AssemblerTest#refreshContentForE2E). COST: slow, about 3.5 min. Use it after a fix to config, samples or scripts that the rsync mode refuses. It is not a full rebuild: that is dp-ci.sh build (about 40 min).\nIf you forget the package after a content fix, the run tests the OLD content and its result is wrong. The log says which package ran: the line E2E_PACKAGE mode=... built_from=... commit_under_test=... files_copied=<n>.\nIf there is no package yet, one is built first (26 to 40 min).'],
    ],
  ],
  'dp-ci-dev-live': [
    about: 'Brings up the hot-reloading dev server and prints its URL, or stops it (dp-ci.sh dev). No e2e. live = this checkout, whatever is saved in it right now: a saved change shows in seconds (https://dp-dev-live.bkstg.flowkraft.com). pinned = a separate clone parked at one commit (https://dp-dev-pinned.bkstg.flowkraft.com). The server keeps running after the build ends, until ACTION=stop (a build, junit or e2e run stops the live one for its length and starts it again afterwards). A second start prints already running at <URL> and starts nothing; it refuses while a dp-ci run holds the server. A diagnosis tool, never a verification: only dp-ci-e2e-loop and dp-ci-release-step1-e2e-prerelease may tick a TODO. To run a spec use dp-ci-e2e-loop: an e2e cannot run against this server (it cleans the testground the server reads and starts its own).',
    params: [
      ACTION    : [choices: ['start', 'stop'], text: 'WHAT to do.\nstart (default): bring the server up and print its URL; when it is already running, only print the URL.\nstop: stop it (nothing to do when it is not running).'],
      DEV_MODE  : [choices: ['live', 'pinned'], text: 'WHICH dev site.\nlive (default): this checkout as it is saved right now, hot-reloading (Java in about 10 s, the UI at once, content files mirrored).\npinned: a separate clone parked at the commit in PINNED_SHA, so nothing committed meanwhile changes it; it does not hot-reload.'],
      PINNED_SHA: [text: 'Only for DEV_MODE=pinned, and only for start: the commit to park the pinned site at (a sha, e.g. 6820786e). Ignored for live.\nA pinned site that is already running stays at its commit: stop it first to pin another one.'],
    ],
  ],
  'dp-ci-release-step1-e2e-prerelease': [
    about: 'STEP 1 OF 4 OF A RELEASE (then dp-ci-release-step2-pack-and-uat-docker and dp-ci-release-step3-pack-and-uat-windows, in either order, then dp-ci-release-step4-publish; asbl/ci/jenkins/jenkins.md, "The release, in order"). A release needs four lanes green on one commit of origin/main (owner decision OD5): docker-server with E2E_SPEC empty (the full suite), docker-server with E2E_SPEC naming auth-authorization-server (the full run leaves it out), windows-vm-electron with E2E_SPEC empty, windows-vm-server with E2E_SPEC empty (its light set). Each build records its verdict in the release record (bash asbl/ci/release-state.sh show); a run with any other filter is recorded as targeted and never counts. The RELEASE_VERSION line at the start says what a release would do now (settings.xml against the released version); this job runs anyway, it is also the everyday e2e job. The real end-to-end tests (dp-ci.sh e2e), the prerelease check. Speed: the slowest, it rebuilds a stale package first (about 26 min before the tests). It has no package parameter on purpose: it always runs on a package built from this exact commit and rebuilds it first when it is stale; it is the release check, so the package shortcuts exist only on dp-ci-e2e-loop. Needed before a release. The docker-server, windows-vm-docker and windows-vm-server targets install what dp-ci.sh build makes: this job builds origin/main first when it is not built yet (dp-ci.sh build-if-needed, about 40 min, once per commit), then tests. Its parts are marked JOB STEP 1/2 and 2/2 in the log, each START and END with the time it took. One build at a time: a second one waits in the Jenkins queue until the first ends, so the Windows targets (they share the VM) can be started one after the other and run in turn. For the fix-and-retry loop use dp-ci-e2e-loop.' + playwrightLog +
      '\nWhere the time goes: ^######## (every part of the job and of a Windows lane, START and END, took=<seconds>), ^(>>>|<<<) STEP (the steps of the Linux run).' +
      '\nThe release record: RELEASE_VERSION|RELEASE_STATE (the version line first, the verdict recorded last).',
    params: [
      E2E_SPEC  : [text: 'WHICH FILE(S) to run. WARNING: LEFT EMPTY THIS STARTS THE FULL SUITE, ABOUT 10 TO 11 HOURS, AND THE CI SERVER DOES NOTHING ELSE UNTIL IT ENDS. Type a file unless you mean the full suite.\nA regex on the path of the spec file; end it with $ for one file.\nUse it: with a file, to confirm that file on a package built from this exact commit; empty, before a release.\nExamples:\n  /areas/cube-stories\\.spec\\.ts$\n  /features/samples\\.spec\\.ts$\n  /features/   -> every spec file of the features folder\nThe full run leaves out auth-authorization-server and let-me-update-migrate-configuration (they run on their own); name them in the regex to run them. For a quick fix-and-retry loop use dp-ci-e2e-loop instead.\nOn windows-vm-docker and windows-vm-server, empty is NOT the full suite: it is the light set of five files of those targets, about an hour.'],
      E2E_TARGET: [choices: ['web', 'electron-linux', 'docker-server', 'windows-vm-electron', 'windows-vm-docker', 'windows-vm-server'], text: 'WHAT the tests run against.\nweb (default, the everyday one): the server and the Angular UI built from this tree, in a browser.\nelectron-linux: the desktop application on Linux.\ndocker-server: the shipped server bundle and its Docker image (built first when origin/main is not built yet).\nwindows-vm-electron: the real Windows desktop of the VM (slow, for release checks).\nwindows-vm-docker: the docker-server bundle (datapallas-server-docker.zip) installed in Docker Desktop on the Windows VM the way the self-host page says, tested in a browser on the VM. Left empty, E2E_SPEC runs a light set of five files (quick-start, configuration, log-files-viewer-separate-tabs, cubes-definitions, apps-ai-hub): the code of the server is proven by docker-server, this checks where it meets Windows. Built first when origin/main (what the VM tests) is not built yet.\nwindows-vm-server: DataPallas Server without Docker (datapallas-server.zip) on the VM own Java 17, installed the way the installation page says (extract, startServer.bat, http://localhost:9090), and the same light set of five files. Built first when origin/main (what the VM tests) is not built yet.\nDay to day: web. The other five are for release checks.'],
      E2E_ROTATION_DATE: [text: 'Optional, rarely needed. Some specs test a different app or database vendor depending on the day (the choice is seeded from the date, so two days in a row cover every combination). Empty = today, UTC.\nUse it only to repeat the variant of another day, for example the day a run failed.\nFormat YYYY-MM-DD. Example: 2026-09-22 (that day: sqlserver and duckdb).'],
      E2E_RETRIES: [text: 'HOW MANY TIMES a failed test is run again. Optional. EMPTY (the default) = what dp-ci.sh does today: 2 for the full suite, 0 for a named file.\nUse it: 1 = a failed test is run once more; passing on the retry is reported as flaky, failing twice as failed. 0 shows each failure as it is.\nThe run goes on to the end whatever fails.'],
    ],
  ],
  'dp-ci-release-step2-pack-and-uat-docker': [
    about: 'STEP 2 OF 4 OF A RELEASE, THE DOCKER FILES: run it only when dp-ci-release-step1-e2e-prerelease is green on the same commit (origin/main; every lane a release needs, see step 1; the job checks the release record and refuses otherwise). It may run before or after step 3 (dp-ci-release-step3-pack-and-uat-windows), never at the same time: both use the VM. asbl/ci/jenkins/release-docker.sh: first the version gate (settings.xml against the released version; nothing to release = green, nothing built). Then the build of origin/main, only when there is none yet (dp-ci.sh build-if-needed, about 40 min): Docker is built once, on Linux. It needs the publish credentials file /var/kraft-internalsystems/config/datapallas-ci/release-publish.env (root only, mode 600, written by the owner). It publishes the image as :<version> on Docker Hub (never :latest) and stages datapallas-server-docker.zip in the release\'s candidate folder on Backblaze, both checked (asbl/ci/release-publish.sh stage-docker); then installs that very zip from its download link the way a user does it (datapallas.com/docs/server/self-host): on this host (the docker-server lane, the light set, then the one-command docker run) and in the Windows VM\'s Docker Desktop (the windows-vm-docker lane, the light set). No public link moves: step 4 (dp-ci-release-step4-publish) publishes. Green only when all of it is. One Windows run at a time: it waits for nothing, its Windows part refuses to start while another Windows run is going.' +
      '\n\nIts log: the six parts (DOCKER RELEASE STEP 1/6 .. 6/6, each START and END with the time it took) and the verdict: ^######## |RELEASE_VERSION=|NOTHING TO RELEASE|BUILD:|BUILD_TAG=|RELEASE_STATE|RELEASE_STAGE|DOCKER_SERVER_IMAGE|DOCKER_ONE_COMMAND|E2E_RESULT|PIPELINE_RESULT|DOCKER_RELEASE_RESULT|DOCKER_RELEASE=.',
    params: [
      DRY_RUN: [choices: ['no', 'yes'], text: 'yes = build, push and install nothing: the version gate, whether a build is needed, the guards, and what each part would do. no (default) = do it.'],
    ],
  ],
  'dp-ci-release-step3-pack-and-uat-windows': [
    about: 'STEP 3 OF 4 OF A RELEASE, THE WINDOWS FILES: run it only when dp-ci-release-step1-e2e-prerelease is green on the same commit (origin/main, which the Windows VM tests; the job checks the release record and refuses otherwise). It may run before or after step 2 (dp-ci-release-step2-pack-and-uat-docker), never at the same time: both use the VM. dp-ci.sh win release: first the version gate (settings.xml against the released version; nothing to release = green, no pack); then, on the Windows VM, asbl/pack-datapallas.bat builds the Windows release files once, from clean (datapallas.zip with DataPallas.exe, datapallas-server.zip, datapallas-src.zip; its Docker zip and image are not shipped, step 2 builds Docker on Linux), and those very files are tested the way a user meets them by the Robot Framework UAT (asbl/src/uat/run-tests.bat: Java and Chocolatey removed and installed, the exe, the command line, the server and its Windows service). Only when the UAT is green, the three zips are staged: uploaded to the release\'s candidate folder on Backblaze and checked by download (asbl/ci/release-publish.sh stage-files). No public link moves: step 4 (dp-ci-release-step4-publish) publishes. Green only when all of it is. Slow: the pack alone takes hours on the VM. No parameters. One Windows run at a time: it waits for nothing, it refuses to start while another Windows run is going.' +
      '\n\nIts log: the three parts (RELEASE STEP 1/3 .. 3/3, each START and END with the time it took) and the verdict: ^######## |RELEASE_VERSION=|RELEASE_STATE|RELEASE_RESULT|ROBOT_RESULT|RELEASE_STAGE; the files: RELEASE_FILE|^STAGE .',
    params: [:],
  ],
  'dp-ci-release-step4-publish': [
    about: 'STEP 4 OF 4 OF A RELEASE, THE PUBLISH: THE OWNER ONLY. Run it only when step 2 (dp-ci-release-step2-pack-and-uat-docker) and step 3 (dp-ci-release-step3-pack-and-uat-windows) are both green on the same commit (origin/main, kept still since step 1); the job checks the release record and refuses otherwise. asbl/ci/release-publish.sh promote: first the version gate (settings.xml against the released version; nothing to release = green, nothing done), then the guards (steps 2 and 3 for this very version, staged in the same candidate folder, not published yet, the registry\'s :<version> still the staged image). Then: the staged files copied on Backblaze to newest/ (the links of the README, the Docker Hub page and the self-host page) and to <version>/ (the archive), each newest/ file checked by download; the Cloudflare cache of the four newest/ links purged; flowkraft/datapallas-server:latest pointed at the staged :<version> and checked; step4.publish recorded. It needs the publish credentials file /var/kraft-internalsystems/config/datapallas-ci/release-publish.env (root only, mode 600, written by the owner). Not done by it, printed at the end: the Docker Hub page (asbl/docker/push-dockerhub-readme.ps1, its own token) and the demos (dp-ci-release-demos).' +
      '\n\nIts log: the four parts (PUBLISH STEP 1/4 .. 4/4, each START and END with the time it took) and the verdict: ^######## |RELEASE_VERSION=|NOTHING TO RELEASE|RELEASE_STATE|^FAIL |^PUBLISH |^MANUAL |RELEASE_PUBLISH.',
    params: [
      DRY_RUN: [choices: ['no', 'yes'], text: 'yes = copy, purge and retag nothing: the version gate and the guards, then what each part would do. no (default) = publish.'],
    ],
  ],
  'dp-ci-release-demos': [
    about: 'THE DEMOS (asbl/ci/jenkins/release-demos.sh). dp-demo.bkstg (https://dp-demo.bkstg.flowkraft.com) shows origin/main, the preview before a release: its own build first, only when origin/main is not built yet (dp-ci.sh build-if-needed, about 40 min), then that very image published (dp-ci.sh publish-demo-bkstg); run it whenever it should show origin/main, best after dp-ci-release-step1-e2e-prerelease is green on it. demo.datapallas.com (the public demo that datapallas.com frames) is a plain install of the published release, nothing built: run it after step 4 (dp-ci-release-step4-publish). setup.sh and setup.sh --edge (its folders and its two vhosts), then asbl/ci/demo-public/install-release.sh: newest/datapallas-server-docker.zip unzipped into a folder of its own per version, with docker-compose.override.yml (no Docker socket, no host port, no MailHog), the data carried over from the running version, the previous folder started again when the new one does not answer; nothing to do when it already runs the released version; then setup.sh --check and the demo links. The output is masked (share-link tokens, passwords).' +
      '\n\nIts log: the parts (DEMOS STEP n/N, each START and END with the time it took) and the verdict: ^######## |DEMOS_RESULT|PIPELINE_RESULT|BUILD:|BUILD_TAG=|DEMO_INSTALL result|DEMO_SETUP result.',
    params: [
      DEMO: [choices: ['dp-demo.bkstg', 'demo.datapallas.com', 'both'], text: 'WHERE to publish.\ndp-demo.bkstg (default): https://dp-demo.bkstg.flowkraft.com.\ndemo.datapallas.com: the public demo that datapallas.com shows.\nboth: dp-demo.bkstg first, then demo.datapallas.com.'],
      RESET_DEMO_DATA: [choices: ['no', 'yes'], text: 'demo.datapallas.com only, when it installs a new release. no (default) = the data of the running version is carried over. yes = the new version starts from the bundle\'s own data (what visitors created stays in the previous version\'s folder); use it when the release changed the dashboards.'],
      DRY_RUN: [choices: ['no', 'yes'], text: 'yes = build, install and change nothing: say whether a build is needed and print what each part would do. no (default) = do it.'],
    ],
  ],
]

jobs.each { name, job ->
  pipelineJob("datapallas/${name}") {
    description(job.about)
    parameters {
      job.params.each { pname, p ->
        if (p.choices) {
          choiceParam(pname, p.choices, p.text)
        } else {
          stringParam(pname, p.default ?: '', p.text)
        }
      }
    }
    definition {
      cpsScm {
        scm {
          git {
            remote { url(repoUrl) }
            branch(repoBranch)
          }
        }
        scriptPath("asbl/ci/jenkins/${name}.Jenkinsfile")
        lightweight(true)
      }
    }
    logRotator { numToKeep(200) }
  }
}
