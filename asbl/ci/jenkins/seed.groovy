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
def playwrightLog = '\n\nIts log (Playwright). Search the whole log with a regular expression, not only its end: a run waiting for a database (DB2) fills the end with thousands of "attempting JDBC connection" lines while its results sit further up. Every finished test attempt prints one line: \u2713  394 specs/features/reporting.spec.ts:810:31 \u203a <title> (2.2m) passed, \u2718 failed, - skipped, (retry #1) a second try of the same test; the number after the mark counts the attempts finished so far. On Windows (electron-windows-vm) the same line reads ok 394 specs\\features\\reporting.spec.ts:810:31 > <title>: ok for \u2713, x for \u2718, backslashes in the path, > for \u203a; the patterns below match both.' +
  '\nHow many tests and how far: Running [0-9]+ tests, then the newest (\u2713|ok|\u2718|x|-) +[0-9]+ specs[/\\\\].' +
  '\nRunning tally, counting the matches: (\u2713|ok) +[0-9]+ specs[/\\\\] passed, (\u2718|x) +[0-9]+ specs[/\\\\] failed,  - +[0-9]+ specs[/\\\\] skipped.' +
  '\nWhich failed, and the retries: (\u2718|x) +[0-9]+ specs[/\\\\] and retry #[0-9]+ (a pass on a retry = flaky, a fail on a retry = really red). One test: its file and line, for example reporting\\.spec\\.ts:390, with 20 lines of context. Waiting for a database: attempting JDBC.' +
  '\nThe official end result, once the run has finished: E2E_RESULT|\\] (stdout: +)?[0-9]+ (passed|failed|flaky|skipped|did not run).' +
  '\nCounts during the run are attempts, not tests, and provisional: a test that failed and then passed on its retry shows once in each count. The official totals are Playwright\'s summary line (361 passed, 16 failed, 1 flaky), the E2E_RESULT line and the JSON report, written when the run ends.'

// name -> [Jenkinsfile, what it is, parameters]. Add an entry to add a job.
def jobs = [
  'dp-ci-package': [
    about: 'Builds what ships: compile (no unit tests), the distribution packages, the Docker image and its Trivy scan of the working tree on the server (dp-ci.sh build, about 40 min). Needed before a docker-server run of dp-ci-e2e-release and before publishing a demo; the real e2e (dp-ci-e2e-release) is needed before a release. Unit tests are dp-ci-junit.' +
      '\n\nIts log: the end result and the Maven errors: PIPELINE_RESULT|\\[ERROR\\]|BUILD (SUCCESS|FAILURE); the image scan totals (HIGH and CRITICAL findings): Total: [0-9]+ \\(HIGH.',
    params: [:],
  ],
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
    about: 'The fix-and-retry loop (dp-ci.sh e2e-loop): ONE spec file, on the web or the electron-linux target. Speed: about 4 min fixed plus the spec. Never rebuilds the package: E2E_PACKAGE says what happens to it (as it is, a few changed files copied in, or the content packaged again). Not a release check: that is dp-ci-e2e-release.' + playwrightLog,
    params: [
      E2E_SPEC  : [text: 'WHICH FILE to run. REQUIRED. A regex on the path of the spec file; end it with $ so that it matches one file only.\nUse it: every run (there is no default: it is a different file each time).\nExamples:\n  /areas/cube-stories\\.spec\\.ts$\n  /features/samples\\.spec\\.ts$\n  /areas/connections\\.spec\\.ts$\n  /features/explore-data-visualizations\\.spec\\.ts$\nSeveral files at once (slower, the exception): /features/explore-data-   -> every explore-data-*.spec.ts.\nThe files are under frend/reporting/e2e/specs/. Leave E2E_GREP empty to run the whole file (the normal case).'],
      E2E_GREP  : [text: 'WHICH TESTS inside that file. Optional. A regex on the test titles. Empty = every test of the file (the normal case).\nUse it: to re-run only the test or tests that failed after a fix. Run the whole file again (empty) before you call the file green.\nExamples:\n  Show Me   -> the tests whose title contains Show Me\n  refus|SQL vendor   -> the tests whose title contains either text (| means or)\n  \\[duckdb\\] Database Schema   -> + ( ) [ ] . ? * and | have a meaning in a regex: put a backslash before them to match them as written. Same for palette \\+ default config\nTip: copy a piece of the title from the failure line of the run log or from the Playwright report.\nCareful: in a serial file (cube-stories, dashboard-demos, auth-authorization-server) a test depends on the ones before it, so a filtered run can fail for that reason alone.'],
      E2E_TARGET: [choices: ['web', 'electron-linux'], text: 'WHAT the tests run against.\nweb (default, the everyday one): the server and the Angular UI built from this tree, in a browser.\nelectron-linux: the desktop application on Linux (for the specs that only run there, for example let-me-update-migrate-configuration).\ndocker-server and electron-windows-vm are release checks: use dp-ci-e2e-release for them.'],
      E2E_PACKAGE: [choices: ['package-reuse-as-is', 'package-rsync-simple-file-changes', 'package-repackage'], text: 'WHAT HAPPENS TO THE PACKAGE before the run. The package holds the content the tests start from (sample apps, db-template, config, samples, scripts, sample databases). The jars and the Angular UI are always built from the tree, so a fix to Java, the UI, specs or helpers needs nothing more.\npackage-reuse-as-is (default): run on the package exactly as it stands. COST: instant. Use it for almost every run.\npackage-rsync-simple-file-changes: copy the plain db-template files changed since the package was built (commits, and new untracked files) into the package and the testground. COST: very fast, a few seconds. Use it after a small fix under db-template (for example a sample or the AI Hub app). If a changed file is not a plain copy in the package (generated, transformed or checked by the assembler), the run stops with: use package-repackage. With nothing changed it copies 0 files.\npackage-repackage: package the content again on the jars already built (AssemblerTest#refreshContentForE2E). COST: slow, about 3.5 min. Use it after a fix to config, samples or scripts that the rsync mode refuses. It is not a full rebuild: that is dp-ci-package (about 40 min).\nIf you forget the package after a content fix, the run tests the OLD content and its result is wrong. The log says which package ran: the line E2E_PACKAGE mode=... built_from=... commit_under_test=... files_copied=<n>.\nIf there is no package yet, one is built first (26 to 40 min).'],
    ],
  ],
  'dp-ci-dev-live': [
    about: 'Brings up the hot-reloading dev server and prints its URL, or stops it (dp-ci.sh dev). No e2e. live = this checkout, whatever is saved in it right now: a saved change shows in seconds (https://dp-dev-live.bkstg.flowkraft.com). pinned = a separate clone parked at one commit (https://dp-dev-pinned.bkstg.flowkraft.com). The server keeps running after the build ends, until ACTION=stop (a build, junit or e2e run stops the live one for its length and starts it again afterwards). A second start prints already running at <URL> and starts nothing; it refuses while a dp-ci run holds the server. A diagnosis tool, never a verification: only dp-ci-e2e-loop and dp-ci-e2e-release may tick a TODO. To run a spec use dp-ci-e2e-loop: an e2e cannot run against this server (it cleans the testground the server reads and starts its own).',
    params: [
      ACTION    : [choices: ['start', 'stop'], text: 'WHAT to do.\nstart (default): bring the server up and print its URL; when it is already running, only print the URL.\nstop: stop it (nothing to do when it is not running).'],
      DEV_MODE  : [choices: ['live', 'pinned'], text: 'WHICH dev site.\nlive (default): this checkout as it is saved right now, hot-reloading (Java in about 10 s, the UI at once, content files mirrored).\npinned: a separate clone parked at the commit in PINNED_SHA, so nothing committed meanwhile changes it; it does not hot-reload.'],
      PINNED_SHA: [text: 'Only for DEV_MODE=pinned, and only for start: the commit to park the pinned site at (a sha, e.g. 6820786e). Ignored for live.\nA pinned site that is already running stays at its commit: stop it first to pin another one.'],
    ],
  ],
  'dp-ci-e2e-release': [
    about: 'The real end-to-end tests (dp-ci.sh e2e), the release check. Speed: the slowest, it rebuilds a stale package first (about 26 min before the tests). It has no package parameter on purpose: it always runs on a package built from this exact commit and rebuilds it first when it is stale; it is the release check, so the package shortcuts exist only on dp-ci-e2e-loop. Needed before a release; run dp-ci-package first for the docker-server and docker-windows-vm targets. For the fix-and-retry loop use dp-ci-e2e-loop.' + playwrightLog,
    params: [
      E2E_SPEC  : [text: 'WHICH FILE(S) to run. WARNING: LEFT EMPTY THIS STARTS THE FULL SUITE, ABOUT 10 TO 11 HOURS, AND THE CI SERVER DOES NOTHING ELSE UNTIL IT ENDS. Type a file unless you mean the full suite.\nA regex on the path of the spec file; end it with $ for one file.\nUse it: with a file, to confirm that file on a package built from this exact commit; empty, before a release.\nExamples:\n  /areas/cube-stories\\.spec\\.ts$\n  /features/samples\\.spec\\.ts$\n  /features/   -> every spec file of the features folder\nThe full run leaves out auth-authorization-server and let-me-update-migrate-configuration (they run on their own); name them in the regex to run them. For a quick fix-and-retry loop use dp-ci-e2e-loop instead.\nOn docker-windows-vm, empty is NOT the full suite: it is the light set of five files of that target, about an hour.'],
      E2E_TARGET: [choices: ['web', 'electron-linux', 'electron-windows-vm', 'docker-server', 'docker-windows-vm'], text: 'WHAT the tests run against.\nweb (default, the everyday one): the server and the Angular UI built from this tree, in a browser.\nelectron-linux: the desktop application on Linux.\nelectron-windows-vm: the real Windows desktop of the VM (slow, for release checks).\ndocker-server: the shipped server bundle and its Docker image; run dp-ci-package on the SAME commit first.\ndocker-windows-vm: the same bundle (datapallas-server-docker.zip) installed in Docker Desktop on the Windows VM the way the self-host page says, tested in a browser on the VM. Left empty, E2E_SPEC runs a light set of five files (quick-start, configuration, log-files-viewer-separate-tabs, cubes-definitions, apps-ai-hub): the code of the server is proven by docker-server, this checks where it meets Windows. Run dp-ci-package on the SAME commit (the VM tests origin/main) first.\nDay to day: web. The other four are for release checks.'],
      E2E_ROTATION_DATE: [text: 'Optional, rarely needed. Some specs test a different app or database vendor depending on the day (the choice is seeded from the date, so two days in a row cover every combination). Empty = today, UTC.\nUse it only to repeat the variant of another day, for example the day a run failed.\nFormat YYYY-MM-DD. Example: 2026-09-22 (that day: sqlserver and duckdb).'],
      E2E_RETRIES: [text: 'HOW MANY TIMES a failed test is run again. Optional. EMPTY (the default) = what dp-ci.sh does today: 2 for the full suite, 0 for a named file.\nUse it: 1 = a failed test is run once more; passing on the retry is reported as flaky, failing twice as failed. 0 shows each failure as it is.\nThe run goes on to the end whatever fails.'],
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
