# Jenkins for DataPallas

Jenkins is a **window onto the scripts we already run**, not a second way of building. Every job starts the same
plain script from `asbl/ci/` that is run by hand (today `dp-ci.sh`), on the server, in the same CI container, and
shows its log. Nothing is installed on the host and no Jenkins agent is needed.

## Which job when

The jobs are in the Jenkins folder `datapallas` (https://jenkins.bkstg.flowkraft.com/job/datapallas/). The name says the moment: `dp-ci-dev-...` = any time while developing, `dp-ci-release-stepN-...` = a release, in that order. Each job's own description in Jenkins says the same as its section below (what, when, order, needs, time, examples, log).

| Situation | Job | Values |
|---|---|---|
| Re-run one failed e2e test after a fix | `dp-ci-dev-e2e-one-spec` | `E2E_SPEC=/features/samples\.spec\.ts$`, `E2E_GREP=<a piece of the test's title>`; then `E2E_GREP` empty for the whole file |
| Confirm one spec file on a package built from this exact commit | `dp-ci-release-step1-e2e-prerelease` | `E2E_TARGET=web`, `E2E_SPEC=/features/samples\.spec\.ts$` (recorded as `targeted`) |
| Run one JUnit class or method | `dp-ci-dev-junit` | `JUNIT_MODULE=bkend/server`, `JUNIT_TEST=ReportsServiceTest#aFolderHoldingOnlyOneTemplateNeedsNoInference` (a class: `JUNIT_TEST=ReportsServiceTest`) |
| See a saved change in a browser | `dp-ci-dev-server` | `ACTION=start` (`DEV_MODE=live`): https://dp-dev-live.bkstg.flowkraft.com |
| See one commit that nothing can move | `dp-ci-dev-server` | `ACTION=start`, `DEV_MODE=pinned`, `PINNED_SHA=<sha>`: https://dp-dev-pinned.bkstg.flowkraft.com |
| Stop a dev server | `dp-ci-dev-server` | `ACTION=stop` (with `DEV_MODE=pinned` for the pinned one) |
| The whole trunk on Linux | `dp-ci-release-step1-e2e-prerelease` | `E2E_TARGET=web`, `E2E_SPEC` and `E2E_GREP` empty (about 10.5 to 15 h) |
| The whole trunk on Windows | `dp-ci-release-step1-e2e-prerelease` | `E2E_TARGET=windows-vm-electron`, `E2E_SPEC` and `E2E_GREP` empty (about 25 h) |
| One Windows test by its title | `dp-ci-release-step1-e2e-prerelease` | `E2E_TARGET=windows-vm-electron`, `E2E_SPEC=[\\/]samples\.spec\.ts$` (Windows paths have backslashes), `E2E_GREP=<a piece of its title>` |
| A release, start to end (e.g. 16.6.0) | steps 0 to 4 | step 0 `RELEASE_VERSION=16.6.0`; step 1's four lanes; steps 2 and 3 `MODE=rehearsal`, a look, then `MODE=public` one after the other; step 4. See "The release, in order" |
| Make a version public after its rehearsal passed | `dp-ci-release-step2-release-docker` and `dp-ci-release-step3-release-windows-vm` | `MODE=public` (one after the other): the passed rehearsal copied in minutes |
| Make a version public directly, no rehearsal run before | the same two jobs | `MODE=public`: it finds no passed rehearsal of the version, says `rehearsing first`, rehearses, and copies only when that is green |
| The preview demo should show `origin/main` | `dp-ci-dev-demo-preview-bkstg` | nothing to change (`DRY_RUN=yes` only looks) |
| The public demo, after a release went public | `dp-ci-release-step4-demo-public` | nothing to change; `RESET_DEMO_DATA=yes` when the release changed the dashboards |
| The public demo with an image that is not a release | Rundeck `servers` > `ops/change/demo-publish`, not a Jenkins job | its own options (it runs `dp-ci.sh publish-demo-datapallas.com`) |
| The code-quality report | `dp-ci-dev-quality-report` | no parameters |
| A job says `PREREQUISITES MISSING` | the same job, again, once fixed | each `MISSING <what>: <what to do>` line says what to do; nothing was started. Lists: "What each job needs before it starts" and "Before the first release"; by hand: `bash asbl/ci/dp-ci.sh prereq <check...>`, `bash asbl/ci/release-publish.sh preflight docker\|files [public]` |

## What it gives

1. **Start a step on demand** from the Jenkins UI (build, JUnit gate, e2e with an optional spec or grep).
2. **Watch it live**: the console of the build *is* the log of the run.
3. **It keeps running** whatever is closed: browser, SSH session, a chat, or Jenkins itself.

## How it works

```
Jenkins UI  ->  job (Jenkinsfile)  ->  ssh root@host  ->  follow-ci.sh run bash asbl/ci/dp-ci.sh <mode>
                                                                |
                                  dp-ci.sh starts a DETACHED container (dp-ci) from the datapallas-ci image,
                                  owned by the Docker daemon, logging to a file under the CI log folder
                                                                |
                                  follow-ci.sh tails that log until it ends -> the build's console and result
```

- **Same scripts, same container.** A job only sets the script's environment variables (`E2E_SPEC`,
  `E2E_GREP`, `JUNIT_MODULE`, ...) and calls it: the same command as by hand on the host.
- **SSH exactly as agents do it.** The Jenkins container has an `ssh` client and its own key
  (`/var/jenkins_home/.ssh`, mode 600, outside the repository). The matching public key is in the host's
  `/root/.ssh/authorized_keys`. Jobs reach the host at `172.19.0.1`, the gateway of the Docker network.
- **One run at a time.** The run's container has a fixed name (`dp-ci`), so a second launch fails instead of
  colliding; Jenkins also limits each job to one build at a time.

## Persistence

The work is a detached container owned by the Docker daemon. It is not a child of Jenkins, of the SSH
session or of any chat.

| What happens | The run | The Jenkins build |
|---|---|---|
| Browser, SSH session or chat closed | keeps running | keeps following |
| Jenkins container restarts | **keeps running** | its console stops and the build shows as aborted; follow the same run again by hand on the host: `bash asbl/ci/jenkins/follow-ci.sh attach` |
| Someone presses Abort on the build | **keeps running** (only the following stops); stop it with `docker stop dp-ci` | aborted |
| The host reboots | lost: rerun it | aborted |

So the work cannot be lost by closing or restarting anything except the host. What a Jenkins restart takes
away is the live view of that build, and `follow-ci.sh attach` (on the host) brings it back.

## Jobs

All live in the folder `datapallas`, and are created by `seed.groovy`, which also holds each job's full description and parameter texts (what Jenkins shows). Jenkins lists them alphabetically, which is the order below. Steps 0, 2 and 3 label each build in the job's build list with what happened (`16.5.1 rehearsal passed`, `nothing to release: ...`, `16.5.1 FAILED: see the log`; `asbl/ci/jenkins/release-label.sh`, read from the run's own result lines, a red build too).

Where the time goes: every job that does several things marks each part with a START and an END line, the END with how long it took, in one format (`asbl/ci/marks.sh`): `######## JOB STEP 1/2 START <time> :: <what>` ... `######## JOB STEP 1/2 END rc=0 <time> took=2467s (41m7s) :: <what>`. Nested parts carry their own label (`DOCKER RELEASE STEP 4/6`, `RELEASE STEP 2/3`, `PUBLIC STEP 2/4`, `windows-vm-docker STEP 3/3`, `DEMOS STEP 2/3`), and the Linux run's own steps end with `took=` too (`<<< STEP 4 END rc=0 <time> took=...`). `grep -aE '^######## |^<<< STEP'` on a console log or a run log gives the times.

The times below are measured from the CI logs and Jenkins' build durations, unless they say "not measured yet".

### dp-ci-dev-demo-preview-bkstg

- **What:** https://dp-demo.bkstg.flowkraft.com shows `origin/main`: `asbl/ci/jenkins/release-demos.sh` with `DEMO=dp-demo.bkstg`: the build of `origin/main` first, only when there is none yet (`dp-ci.sh build-if-needed`), then that very image published (`dp-ci.sh publish-demo-bkstg`: the image switched, a smoke test, the previous image back when it fails). It shows the build's Trivy table. Not a step of a release.
- **When:** any time, best after step 1 is green on that commit. The public demo is `dp-ci-release-step4-demo-public`; an image that is not a release goes there only by Rundeck (`servers` > `ops/change/demo-publish`).
- **Parameters:** `DRY_RUN` (`no`; `yes` = build and publish nothing: the prerequisites, whether a build is needed, what each part would do; while origin/main is not built yet, the dry publish checks the newest earlier build's image instead, and fails when that image is gone).
- **Needs:** this host's Docker engine and the site's publish target (`dp-ci.sh prereq docker publish-target publish-demo-bkstg`), before the build.
- **Time:** about a minute when `origin/main` is built already; about 40 min more when it builds first.
- **Log:** `DEMOS STEP 1/2` (the build), `2/2` (the publish); `DEMOS_RESULT` is the verdict.

### dp-ci-dev-e2e-one-spec

- **What:** the fix-and-retry loop, `dp-ci.sh e2e-loop`: one spec file, or some of its tests, on `web` or `electron-linux`, retries 0. The jars and the Angular UI are built from the tree on every run; the package (the content the tests start from) is never rebuilt, `E2E_PACKAGE` says what happens to it (built first only when there is none). It never counts for a release.
- **When:** after a fix: the failed tests, then the whole file. A file on a package of this exact commit, or a Windows or Docker test: step 1 instead. Commit the fix first: the run puts this checkout on `origin/main` (a fast-forward) and stops on local changes to tracked files; commits not pushed yet are tested as they are.
- **Parameters:**
  - `E2E_SPEC`: a regex on the spec file's path, ending in `$` for one file; needed unless `E2E_GREP` is set. E.g. `/features/samples\.spec\.ts$`, `/areas/cube-stories\.spec\.ts$`.
  - `E2E_GREP`: a regex on the test titles; empty = the whole file. E.g. `02_dashboard_demos`, `Show Me`, `refus|SQL vendor`.
  - `E2E_TARGET`: `web` (default) or `electron-linux` (the desktop-only specs, e.g. let-me-update-migrate-configuration).
  - `E2E_PACKAGE`: `package-reuse-as-is` (default; for a fix to specs, helpers, Java or the UI; instant), `package-rsync-simple-file-changes` (the plain db-template files changed since the package was built, copied in; seconds; stops with `use package-repackage` when a changed file is not a verbatim copy), `package-repackage` (the content packaged again on the built jars, `AssemblerTest#refreshContentForE2E`; about 3.5 min; not a full rebuild). `reuse` and `content` are refused, naming the new value.
- **Examples:** one failed test after a fix: `E2E_SPEC=/features/samples\.spec\.ts$ E2E_GREP=02_dashboard_demos`; after a fix to a db-template sample: add `E2E_PACKAGE=package-rsync-simple-file-changes`; a desktop-only spec: `E2E_SPEC=/features/let-me-update-migrate-configuration\.spec\.ts$ E2E_TARGET=electron-linux`.
- **Needs:** this host's Docker engine; no other `dp-ci` run (one at a time).
- **Time:** about 4 min of setup, then the tests: one test about 5 min in all; the last 40 runs: median 16 min, seconds up to 4.8 h (several big files at once).
- **Log:** the Playwright lines (the job's description lists the patterns); `E2E_PACKAGE mode=... built_from=... commit_under_test=... files_copied=<n>` says which package ran.

### dp-ci-dev-junit

- **What:** the Java unit tests, `dp-ci.sh junit`, on the checkout as it is: one module and test pattern, or all three modules when both are empty. It shows the test results, JaCoCo and the Error Prone warnings (reports only).
- **When:** after a Java change.
- **Parameters:** `JUNIT_MODULE` (empty = all three, `bkend/server`, `bkend/common`, `bkend/reporting`), `JUNIT_TEST` (a Surefire `-Dtest` pattern: `ReportsServiceTest`, `ReportsServiceTest#aFolderHoldingOnlyOneTemplateNeedsNoInference`, `Jasper*Test`; empty = every test of the module).
- **Needs:** this host's Docker engine; no other `dp-ci` run.
- **Time:** one class 1 to 4 min; everything about 24 min.
- **Log:** `TOTAL classes:` per module; `Tests run:.*(Failures: [1-9]|Errors: [1-9])` for the failing classes.

### dp-ci-dev-quality-report

- **What:** the quality tools, `dp-ci.sh quality` (lint, bug finder, format, complexity, documentation; see "Quality reports"). Never gating.
- **When:** any time. **Parameters:** none. **Needs:** this host's Docker engine; no other `dp-ci` run.
- **Time:** not measured yet (it has not run yet).
- **Log:** `QUALITY_RESULT tools=N ok=N failed=N ...`.

### dp-ci-dev-server

- **What:** starts or stops a dev web server, `dp-ci.sh dev --live` or `--pinned <sha>`, and prints its URL. `live` = the checkout as it is saved, hot-reloading (Java in about 10 s, the UI at once): https://dp-dev-live.bkstg.flowkraft.com (`dp-dev` is an alias). `pinned` = a separate clone parked at one commit, no hot reload: https://dp-dev-pinned.bkstg.flowkraft.com. It keeps running after the build until `ACTION=stop`; build, JUnit and e2e runs stop the live one for their length and start it again. A second start prints `already running at <URL>`; it refuses while a `dp-ci` run holds the server.
- **When:** to look at a change. Never a proof: only the e2e jobs prove, and no e2e runs against it (an e2e cleans the testground it reads and starts its own server).
- **Parameters:** `ACTION` (`start`, `stop`), `DEV_MODE` (`live`, `pinned`), `PINNED_SHA` (a pinned start only; a commit this checkout has). In `live`, an edited db-template file reaches the site at once; a new sample or dataset needs `dp-ci.sh dev --refresh-content` (by hand, about 3 min).
- **Needs:** this host's Docker engine (at a start); `live` also this checkout's Linux package (`asbl/target/package/verified-db-noexe`, which an e2e run builds when there is none): not checked, and without it the start fails after the backend build. **Time:** a start about 3.5 min until the site answers (a pinned commit's first start is longer: not measured yet); a stop seconds.
- **Log:** `ready: <URL>`, `already running at`, `stopped:`, `FAIL`.

### dp-ci-release-step0-set-version

- **What:** step 0 of a release, the version: `asbl/ci/jenkins/release-set-version.sh`. `RELEASE_VERSION` comes pre-filled with the current release (the higher of the two channels' released versions, read by `seed.groovy` when it generates the jobs; Docker Hub not answering: `settings.xml` on `origin/main`, and the field's text says so). Left as it is, or lower: `NOTHING DONE`, green. Not `x.y.z`: refused. Bigger: the released versions read again (`release-state.sh released`), then in a throwaway `git worktree` of `origin/main` (never the shared checkout) `asbl/ci/set-version.sh <version>`, a check that all 7 version files say it and that exactly those changed, one commit `release <version>: the version in the 7 version files` pushed to `main`, `RELEASE_COMMIT=<sha>` and the next step. `origin/main` already saying it: nothing committed. `main` moved meanwhile: the push is rejected and the job fails, saying so (it never retries).
- **When:** a release starts here. The release notes are the owner's: a `## <version> - <date>` heading in `asbl/src/main/external-resources/db-template/CHANGELOG.md`, committed first, at the latest before step 1 (the job warns, never fails, when there is none).
- **Parameters:** `RELEASE_VERSION` (pre-filled with the current release), `DRY_RUN` (`no`; `yes` = the 7 edits and the commit it would make, nothing written or pushed).
- **Needs:** nothing to provide. **Time:** seconds. **Log:** `SET_VERSION_RESULT` is the verdict.

### dp-ci-release-step1-e2e-prerelease

- **What:** the real e2e on a package built from this exact commit of `origin/main` (rebuilt first when it is not): `dp-ci.sh e2e` on Linux, `dp-ci.sh win e2e` (`windows-vm-electron`), `win docker-e2e` (`windows-vm-docker`), `win server-e2e` (`windows-vm-server`) on the Windows VM. Two roles: a release's four lanes, and the everyday full e2e of the trunk; it never needs step 0 and never skips. The `docker-server`, `windows-vm-docker` and `windows-vm-server` targets install what `dp-ci.sh build` makes: the job first runs `dp-ci.sh build-if-needed` (JOB STEP 1/2: built only when the newest successful build is not of `origin/main`; about 40 min, once per commit), then the tests (JOB STEP 2/2); it also shows that build's Trivy table. It has no package parameter on purpose: the package shortcuts exist only on `dp-ci-dev-e2e-one-spec`. One build at a time: a second one waits in the Jenkins queue, so the Windows targets (they share the VM; `win-e2e.sh` refuses a second driver too) can be started one after the other and run in turn.
- **The release record:** each build records its verdict as `step1.<target>-<full|auth|light|targeted>`; a run with any other filter is `targeted` and never counts. A release needs four lanes green on one commit (OD5): `docker-server` full (`E2E_SPEC` empty), `docker-server` auth (`E2E_SPEC=/features/auth-authorization-server\.spec\.ts$`, which every full run leaves out), `windows-vm-electron` full, `windows-vm-server` light (`E2E_SPEC` empty = its light set). Step 1 runs made before step 0's version commit do not count for that release; after it, any step 1 run on the commit being released does. Its first line is `RELEASE_VERSION` (what a release would do now).
- **Parameters:**
  - `E2E_SPEC`: a regex on the spec file's path; empty with `E2E_GREP` empty = the full suite (on `windows-vm-docker` and `windows-vm-server`: their light set of five files, about an hour). A full run leaves out `auth-authorization-server` everywhere, and on Linux also `let-me-update-migrate-configuration`, which `windows-vm-electron` keeps. On the `windows-vm` targets the path has backslashes: write the separator as `[\\/]`.
  - `E2E_GREP`: a regex on the test titles; set, the run is recorded `targeted`.
  - `E2E_TARGET`: `web` (default), `electron-linux`, `docker-server`, `windows-vm-electron`, `windows-vm-docker` (DataPallas Server in Docker Desktop on the VM, from `datapallas-server-docker.zip`, as the self-host page says), `windows-vm-server` (DataPallas Server on the VM's own Java 17, from `datapallas-server.zip`, as the installation page says).
  - `E2E_ROTATION_DATE`: empty = today; the day's database rotation, e.g. 2026-09-22 = sqlserver and duckdb.
  - `E2E_RETRIES`: empty = the lane's own: a full run 2 on Linux, 1 on `windows-vm-electron`; the light set of `windows-vm-docker` and `windows-vm-server` 1; any filter 0.
- **Examples:** the four release lanes above; the trunk: `E2E_TARGET=web` or `windows-vm-electron`, `E2E_SPEC` empty; one Windows test: `E2E_TARGET=windows-vm-electron E2E_SPEC=[\\/]samples\.spec\.ts$ E2E_GREP=02_dashboard_demos`.
- **Needs:** each target first checks what it needs, within seconds ("What each job needs before it starts", below).
- **Time:** a full run about 10.5 h on Linux (`docker-server`; a `web` full run took 15.4 h) and about 25 h on `windows-vm-electron`; the Windows light sets about an hour (not measured yet); one file minutes to 2 h; first, when needed, the package (Linux about 30 min, the VM about 1 to 1.5 h) and the build (about 40 min).
- **Log:** the Playwright lines, `^########` and `^(>>>|<<<) STEP` for the times, `RELEASE_VERSION|RELEASE_STATE` for the release record.

### dp-ci-release-step2-release-docker

- **What:** the Docker release, `asbl/ci/jenkins/release-docker.sh`, `MODE=rehearsal` (the default) or `MODE=public`. Both modes start with the Docker channel's version gate (nothing to release = green, nothing done), then check the prerequisites within seconds (`release-publish.sh preflight docker`; "Before the first release", below): anything missing stops the job before anything is built, each named with what to provide (`MISSING <what>: <what to provide>`, then `PREREQUISITES MISSING (<n>)`; the build list says `prerequisites missing: see the log`).
  - `MODE=rehearsal`: only when step 1 is green on `origin/main` (otherwise, within seconds, `REFUSED: step 1 is not green on <commit>: <lanes>. Run dp-ci-release-step1-e2e-prerelease first.`), then `dp-ci.sh build-if-needed`: Docker is built once, on Linux. Then `release-publish.sh stage-docker`: the Docker zips of earlier rehearsals deleted from `rehearsal/`, the image pushed as `flowkraft/datapallas-server:<version>` (never `:latest`) and `datapallas-server-docker.zip` uploaded to `rehearsal/<version>-<commit>/` on Backblaze, both checked. Then that very zip, from its download link (`E2E_DOCKER_FROM_URL`), installed as the self-host page says and tested: on this host the `docker-server` lane (the light set, then the one-command `docker run`), on the VM the `windows-vm-docker` lane in Docker Desktop (the light set); the running image must be the digest that was pushed. Both lanes always run; `DOCKER_RELEASE_RESULT` is the verdict, recorded as `rehearsal.docker`. Nothing users get changes.
  - `MODE=public` (the owner only): the newest passed rehearsal of this version, on whichever commit (`REHEARSED <commit> <time>`), copied in minutes (`release-publish.sh publish docker`): its zip checked by download against the tested sha256 and `:<version>` against the rehearsed digest, the outgoing release's zip archived (copied from `newest/` to its own `<old version>/` when missing there, checked by download), then copied to `newest/` (the links of the README, the Docker Hub page and the self-host page) and to `<version>/` (the archive), each `newest/` file checked by download, the Cloudflare cache purged, `:latest` pointed at the rehearsed `:<version>` and checked, `newest/docker-version.txt` written, `public.docker` recorded, the copied rehearsal's zip deleted from `rehearsal/`, then `seed` queued. With no passed rehearsal: `no passed rehearsal of <version> on the docker channel: rehearsing first`, the rehearsal on `origin/main`, and the copy only when it is green. It never copies anything that did not pass. Printed at the end, by hand: the Docker Hub page (`asbl/docker/push-dockerhub-readme.ps1`, on Windows, with its own Docker Hub token) and `dp-ci-release-step4-demo-public`.
- **When and order:** after step 1; before or after step 3, never at the same time (one VM). The owner's way: `MODE=rehearsal`, a look, then `MODE=public`; once trusted, `MODE=public` directly. The two public runs (steps 2 and 3) one after the other.
- **Parameters:** `MODE` (`rehearsal`, `public`), `DRY_RUN` (`no`, `yes`: the gate, the prerequisites (the bucket listed, not written), the guards, which rehearsal it would copy or that it would rehearse first, and what each part would do; nothing built, pushed, installed or copied).
- **Time:** a rehearsal: the build (about 40 min, when there is none) plus the stage and two light sets (not measured yet); a public copy: minutes (not measured yet).
- **Log:** `DOCKER RELEASE STEP 1/6` .. `6/6` and `DOCKER PUBLIC` (`PUBLIC STEP 1/4` .. `4/4`); the build's Trivy table on the build page.

### dp-ci-release-step3-release-windows-vm

- **What:** the Windows release, `dp-ci.sh win release`, `MODE=rehearsal` (the default) or `MODE=public`. Both modes start with the Windows channel's version gate (nothing to release = green, nothing done), then check the prerequisites within seconds (`release-publish.sh preflight files`, as the Docker job does; then, unless it only copies, the Windows VM answering over SSH: `dp-ci.sh prereq vm`): anything missing stops the job before the pack.
  - `MODE=rehearsal`: only when step 1 is green on `origin/main` (otherwise REFUSED within seconds, as above). On the Windows VM, `asbl/pack-datapallas.bat` builds the Windows release files once, from clean (`datapallas.zip` with DataPallas.exe, `datapallas-server.zip`, `datapallas-src.zip`; it builds no Docker image, the Docker job builds Docker on Linux), and those very files are tested as a user meets them by the Robot Framework UAT (`asbl/src/uat/run-tests.bat`, a bare step: the machine's own Java). Only when it is green, this host deletes the Windows zips of earlier rehearsals from `rehearsal/` and stages the three zips in `rehearsal/<version>-<commit>/`, checked by download (`release-publish.sh stage-files`; the VM never holds a credential), recorded as `rehearsal.windows`. `RELEASE_RESULT` is the verdict; `RELEASE_FILE` the sha256 of the files (also `<log>-step-release-files.txt`). Nothing users get changes.
  - `MODE=public` (the owner only): the newest passed rehearsal of this version copied in minutes, the VM untouched (`release-publish.sh publish windows`): checked by download, the outgoing release's zips archived as for Docker, copied to `newest/` and `<version>/`, checked again, the Cloudflare cache purged, `newest/windows-version.txt` written, `public.windows` recorded, the copied rehearsal's zips deleted, `seed` queued; with none, it rehearses first, as the Docker job does. It never copies anything that did not pass.
- **When and order:** as the Docker job; before or after it, never at the same time.
- **Parameters:** `MODE` (`rehearsal`, `public`), `DRY_RUN` (`no`, `yes`: the VM untouched, only asked whether it answers; the gate, the prerequisites (the bucket listed, not written), the guard, which rehearsal it would copy or that it would rehearse first, and what each part would do).
- **Time:** a rehearsal: the pack (capped at 8 h, `RELEASE_PACK_TIMEOUT`) and the Robot UAT (capped at 6 h, `RELEASE_ROBOT_TIMEOUT`), not measured yet; a public copy: minutes: its own work took 8 s against local stand-ins (2026-10-22); a real copy also downloads the three zips (about 1.7 GB) twice to check them and copies them on the bucket, so the download speed decides.
- **Log:** `RELEASE STEP 1/3` .. `3/3` and `WINDOWS PUBLIC` (`PUBLIC STEP 1/3` .. `3/3`); the Robot report on the build page ("Robot UAT reports", below).

### dp-ci-release-step4-demo-public

- **What:** step 4 of a release: demo.datapallas.com (the public demo that datapallas.com frames) installs the published release, nothing built (OD4): `asbl/ci/jenkins/release-demos.sh` with `DEMO=demo.datapallas.com`: `setup.sh` and `setup.sh --edge`, then `asbl/ci/demo-public/install-release.sh` (`newest/datapallas-server-docker.zip` unzipped into a folder of its own per version, with `asbl/ci/demo-public/docker-compose.override.yml`: no Docker socket, no host port, no MailHog; the data carried over from the running version; the previous version started again when the new one does not answer; nothing to do when it already runs the released version; its verdict is the `DEMO_INSTALL result=` line), then `setup.sh --check` and the demo links. The output is masked like the Rundeck job's.
- **When:** after step 2's `MODE=public`. An image that is not a release: Rundeck `servers` > `ops/change/demo-publish`.
- **Parameters:** `RESET_DEMO_DATA` (`no`; `yes` = the new version starts from the bundle's own data, the old data stays in the previous version's folder; for a release that changed the dashboards), `DRY_RUN` (`no`, `yes`: changes nothing).
- **Needs:** the Docker release public; the demo's two root-only settings files, written when it was set up (`demo-datapallas-com.env` and `demo-public-storefront.env` in `/var/kraft-internalsystems/config/datapallas-ci/`, named in `asbl/ci/demo-public/setup.sh`). **Time:** minutes (not measured yet). **Log:** `DEMOS STEP 1/3` .. `3/3`; `DEMOS_RESULT` is the verdict.

To add a step: make it a script in `asbl/ci/` that launches a detached run and prints a `log:` line, add a
`<name>.Jenkinsfile` here (copy `dp-ci-dev-junit.Jenkinsfile`), add an entry to `seed.groovy`, push, run `seed`. A job that runs several
scripts wraps each in `job-step.sh "JOB STEP n/N" "<what>" <command...>`, so its log says where the time goes.

**What each job needs before it starts.** Each job checks it first, within seconds, before anything slow: one line per check, `OK <what>` or `MISSING <what>: <what to do>`, then `PREREQUISITES OK` or `PREREQUISITES MISSING (<n>): nothing was started. Fix what is listed above, then run the job again.` By hand, on this host: `bash asbl/ci/dp-ci.sh prereq <check...>` (`docker`, `vm`, `vm-docker`, `vm-java`, `vm-mvn`, `vm-free`, `publish-target <task>`) or `bash asbl/ci/dp-ci.sh win prereq e2e|docker-e2e|server-e2e|release` (a Windows lane's set). The checks only read. The jobs with a build label (steps 0, 2 and 3) then show `prerequisites missing: see the log`.

- Every job that runs `dp-ci.sh` on this host (`dp-ci-dev-junit`, `dp-ci-dev-quality-report`, `dp-ci-dev-e2e-one-spec`, `dp-ci-dev-server`, step 1's `web`, `electron-linux` and `docker-server`, the builds in steps 1 and 2 and in `dp-ci-dev-demo-preview-bkstg`): the Docker engine on this host (`docker`): `MISSING a running Docker engine on this host: start it (systemctl start docker), then run the job again`.
- Step 1, the Windows targets, at the start of the lane (before the VM's sync and package rebuild); `windows-vm-docker` and `windows-vm-server` also before their build, with no other Windows run going (`vm-free`: `MISSING a free Windows VM: another Windows run is going ...`):
  - all three: the VM (`vm`): `MISSING WIN_HOST, ... in <win-ci.env>: the Windows VM's settings ...` or `MISSING an answer from the Windows VM over SSH ...: start the VM, or repair its SSH, ...`; its Docker Desktop (`vm-docker`): `MISSING Docker Desktop running on the Windows VM: start it in the VM's desktop session, wait until docker info answers, ...`;
  - `windows-vm-electron`: Java 17 and Maven on the VM's PATH as the registry has it, the test gulp makes before it starts the server (`vm-java`, `vm-mvn`): `MISSING Java 17 on the Windows VM: ...`, `MISSING Maven (mvn) on the Windows VM: ...` (without them gulp tests the Install screen instead of the app);
  - `windows-vm-docker`: also the Docker engine on this host, which its image is copied from (not when a release's download is tested);
  - `windows-vm-server`: also the machine's Java 17 (`vm-java`), which `startServer.bat` runs on.
- `dp-ci-release-step2-release-docker` and `dp-ci-release-step3-release-windows-vm`: "Before the first release", below; step 3 also the VM answering over SSH (`vm`), unless it only copies.
- `dp-ci-dev-demo-preview-bkstg`, before its build: the Docker engine on this host and the site's publish target (`publish-target publish-demo-bkstg`: its settings and `docker-compose.yml`): `MISSING a ready publish target for publish-demo-bkstg: <why>; set it up ..., then run the job again`.
- `dp-ci-release-step4-demo-public` builds nothing and has no check of its own: a part that fails stops it with `FAILED` and why.

## The release, in order

```
step0 set-version                         (RELEASE_VERSION bigger than the current release: the 7 version files, one commit on main)
   |  the version commit, or a later one (the changelog)
   v
step1 e2e-prerelease                      (Linux + Windows VM, the e2e lanes; one Jenkins build per target)
   |  all required lanes PASS on commit C
   v
step2 release-docker      MODE=rehearsal  (Linux builds, stages in rehearsal/; light set on Linux AND Windows from that download)
step3 release-windows-vm  MODE=rehearsal  (Windows VM packs + Robot UAT; Linux stages the zips in rehearsal/)
   |  each PASS on commit C, version V  (in either order, never at the same time: one VM)
   v
step2 release-docker      MODE=public     (rehearsal/V-C -> newest/ and V/, :V -> :latest, checked; owner only)
step3 release-windows-vm  MODE=public     (rehearsal/V-C -> newest/ and V/, checked; owner only; right after step 2's)
   v
step4 demo-public                         (demo.datapallas.com installs the published release, see OD4)
```

Why this order:

- **Step 0 sets the version**, the one thing a release changes in the code: one commit on `main` with the 7 version files, made from `origin/main` in a throwaway worktree. Left as it is, the job does nothing, so a click by mistake changes nothing. The release notes (`CHANGELOG.md`) stay the owner's, committed before step 1.
- **Step 1 proves the code**: the real e2e on a package built from one commit. The lanes a release needs (owner decision OD5, 2026-10-22) are `docker-server` full and auth, `windows-vm-electron` full and `windows-vm-server` light.
- **The rehearsals make the files a user downloads, each once, and test those very files the way a user meets them.** Docker is built once, on Linux, and published from Linux; its light set runs on Linux and on Windows from the download link, as the self-host page installs it. The Windows files are packed once on the VM and pass the Robot UAT. Both only stage (OD1): `:<version>` on Docker Hub and the zips in `rehearsal/<version>-<commit>/` on Backblaze. Nothing users get changes.
- **`MODE=public` builds nothing**: it copies what a rehearsal tested to `newest/` and `<version>/`, purges the Cloudflare cache of the `newest/` links (OD6) and, for Docker, points `:latest` at the rehearsed digest, each checked. What goes public is byte for byte what passed. It never replaces public files with files that did not pass a rehearsal: run directly, with no passed rehearsal of the version, it rehearses first and copies only when that is green. So: rehearse, look, then public; once trusted, public directly.
- **Old releases stay, rehearsals do not.** Before `newest/` is replaced, the outgoing release's files are copied to its own `<version>/` when they are not there yet (so the first job release archives the hand release 16.5.0 too). After the copy, the rehearsal it copied is deleted; a new rehearsal first deletes its channel's earlier rehearsal files (red, abandoned or never made public), each marked removed in the release record. Only `rehearsal/` is ever cleaned, with a hard delete that frees the space at once; `newest/` and `<version>/` never. `DRY_RUN=yes` prints what it would archive and delete.
- **One commit per rehearsal**: a rehearsal refuses unless step 1 is green on its commit of `origin/main`: keep `main` still from step 1 until both rehearsals are green. `MODE=public` copies the rehearsed commit's files even when `main` has moved since.
- **Each channel is released on its own**, with its own released version and its own public run. Between the two public runs, `newest/` holds one channel's new files next to the other's old ones: run the two public runs one after the other.
- **Step 4, demo.datapallas.com**, installs the published release like any user (OD4); dp-demo.bkstg keeps showing builds of `origin/main` (`dp-ci-dev-demo-preview-bkstg`).

**The version gate.** Every release job starts with `bash asbl/ci/release-state.sh version-check docker|windows`. The version is `<version>` in `bkend/reporting/src/main/external-resources/template/config/burst/settings.xml`, which step 0 sets (`dp-ci-release-step0-set-version`: `asbl/ci/set-version.sh <version>` on `origin/main`, with the other version files; `--versions` lists them, they must agree). Each channel has its released version: Docker's is the one Docker Hub's `:latest` has; Windows' is the `version=` line of `newest/windows-version.txt`, read by its download link, and until the first Windows `MODE=public` writes that file, 16.5.0, the last version both channels were released together by hand (a constant in `release-state.sh`). The same: `NOTHING TO RELEASE: ... For a new release, run dp-ci-release-step0-set-version with a bigger version (...)`, the job ends green and does nothing. Greater: the release goes on. Lower, or already published: refused. Step 1 only prints the `RELEASE_VERSION` line and runs anyway, as the everyday e2e job. `release-state.sh released` prints each channel's released version and the current release (the higher one): step 0 compares with it.

**The release record.** Each job writes its verdict as a file under `/var/kraft-internalsystems/logs/datapallas-ci/release-state/<commit>/`, and the jobs after it read it. `bash asbl/ci/release-state.sh show [<commit>]` prints the table: where a release stands; `release-state.sh rehearsed docker|windows <version>` names the newest passed rehearsal of a version whose files are still in `rehearsal/`.

| Job | Needs | Writes | Records |
|---|---|---|---|
| step 0 `dp-ci-release-step0-set-version` | nothing | the version commit on `main` | nothing |
| step 1 `dp-ci-release-step1-e2e-prerelease` | nothing (one build per lane) | nothing | `step1.<target>-<mode>` |
| `dp-ci-release-step2-release-docker`, `MODE=rehearsal` | the four step 1 lanes on its commit; the prerequisites below | `flowkraft/datapallas-server:<version>`; `datapallas-server-docker.zip` in `rehearsal/<version>-<commit>/` (the earlier Docker rehearsal zips deleted) | `rehearsal.docker-stage`, `rehearsal.docker` |
| `dp-ci-release-step3-release-windows-vm`, `MODE=rehearsal` | the four step 1 lanes on its commit; the prerequisites below | `datapallas.zip`, `datapallas-server.zip`, `datapallas-src.zip` in `rehearsal/<version>-<commit>/` (the earlier Windows rehearsal zips deleted) | `rehearsal.windows` |
| either job, `MODE=public` | a passed rehearsal of this version on its channel (else it rehearses first); the prerequisites below | the outgoing release in its `<version>/`, `newest/` and `<version>/` on Backblaze (the copied rehearsal deleted), the Cloudflare purge, `newest/<channel>-version.txt`; Docker also `:latest`: the public links | `public.docker` or `public.windows`, on the rehearsed commit |
| step 4 `dp-ci-release-step4-demo-public` | the Docker job's `MODE=public` done (it installs `newest/`) | demo.datapallas.com | nothing |

**The credentials** (OD3) are one root-only file the owner writes, `/var/kraft-internalsystems/config/datapallas-ci/release-publish.env`, mode 600: `DOCKERHUB_USER`, `DOCKERHUB_TOKEN`, `RCLONE_CONFIG` (the path of an rclone config with the `backblaze` remote), `CLOUDFLARE_PURGE_TOKEN`, `CLOUDFLARE_ZONE_ID`. The jobs check it first (the list below) and source it silently; nothing prints it, and the Windows VM never holds a credential (this host uploads).

**Before the first release**, what the owner provides. The release jobs check it right after the version gate, within seconds, before anything slow, and name what is missing with these words (`bash asbl/ci/release-publish.sh preflight docker|files [public]` runs the same check by hand; "nothing to release" ends green before it, so a missing key never turns a no-op run red):

- both release jobs, `dp-ci-release-step2-release-docker` and `dp-ci-release-step3-release-windows-vm`:
  - `rclone`, `curl` and `sha256sum` on this host;
  - `release-publish.env` owned by root, mode 600 (`chmod 600`; not read otherwise), with the keys below;
  - `RCLONE_CONFIG` in it: the path of an rclone config whose `backblaze` remote is an rclone b2 remote with a Backblaze application key that can write and delete in the `datapallas` bucket (the check writes a few bytes to `rehearsal/_preflight/`, downloads them back from the download site and removes them; `DRY_RUN=yes` only lists `rehearsal/`);
  - the download site (`downloads.datapallas.com`) answering: every upload is checked by download.
- `dp-ci-release-step2-release-docker` also:
  - the Docker engine and `docker buildx` on this host;
  - `DOCKERHUB_USER` and `DOCKERHUB_TOKEN`: a Docker Hub access token of that user with Read & Write on `flowkraft/datapallas-server` (the check logs in with a throwaway Docker config and asks Docker Hub's token service for the push right; nothing is pushed);
  - unless it only copies a passed rehearsal: the Windows VM answering over SSH, its Docker Desktop running, and no other Windows run going (`dp-ci.sh win prereq docker-e2e`).
- `MODE=public`, either job, also: `CLOUDFLARE_PURGE_TOKEN`, a Cloudflare API token with Cache Purge on the download site's zone (checked with Cloudflare's read-only token check; nothing is purged), and `CLOUDFLARE_ZONE_ID`.

The owner's steps for a release:

1. Done on 2026-10-22: `seed.groovy` approved (In-process Script Approval), `seed` run, the old jobs archived and deleted. Again after every change to `seed.groovy`: approve its new text and run `seed`; it never deletes a job, so a job it no longer defines is deleted by hand, archived first.
2. Once: write `release-publish.env` and provide the rest of "Before the first release" above; `bash asbl/ci/release-publish.sh preflight docker public` and `... preflight files public`, run on this host, list what is still missing.
3. Commit the changelog (`asbl/src/main/external-resources/db-template/CHANGELOG.md`, a `## <version> - <date>` heading) and whatever else the release needs, then run `dp-ci-release-step0-set-version` with the new version (`DRY_RUN=yes` first shows the 7 edits): it commits the version files and pushes them to `main`. Keep `main` still from then until both rehearsals are green. Until that commit, every release job says NOTHING TO RELEASE.
4. Run step 1 for each required lane, then both release jobs with `MODE=rehearsal` (either order), look at them, then both with `MODE=public`, one after the other, then step 4, `dp-ci-release-step4-demo-public`. The Docker job's `MODE=public` prints what stays by hand (the Docker Hub page: `asbl/docker/push-dockerhub-readme.ps1`).

## The seed job (hidden from the dashboard)

`seed` is the one job made by hand. It reads `asbl/ci/jenkins/seed.groovy` from GitHub `main` and creates or
updates every job in the folder `datapallas`. **It is not automatic**: nothing triggers it. It runs only when it
is started, by the owner or by an agent, and only needs to run when `seed.groovy` has changed.

It is kept out of sight on purpose. The default dashboard view is `DataPallas`, which lists only the folder
`datapallas`; the built-in `All` view was removed. The job itself is untouched and still there.

- **Open it:** `https://jenkins.bkstg.flowkraft.com/job/seed/` (type the address; the dashboard does not list it).
- **Run it:** the **Build Now** button on that page, or by the API as below.
- **When:** after any change to `seed.groovy` (a job added or removed, a parameter or description changed).
  Not needed when a `Jenkinsfile` or a script changes: those are read at the start of every build.
- **Safe to repeat:** running it again with nothing changed creates nothing and deletes nothing; the build
  history of the jobs is kept. It rewrites each job's definition to what `seed.groovy` says, so a change made to
  a job in the UI is undone. It never deletes a job: one removed from `seed.groovy` stays until it is deleted
  in the UI.
- **Approval:** every new version of `seed.groovy` must be approved once, in *Manage Jenkins -> In-process
  Script Approval*, otherwise the build fails with "script not yet approved for use". Approve, run it again.
- **Rebuilding Jenkins from nothing:** create `seed` first (freestyle job, source = this repository, branch
  `main`, sparse checkout `asbl/ci/jenkins`, one build step "Process Job DSLs" with
  `asbl/ci/jenkins/seed.groovy`), approve the script, run it. That restores every job.

**By the API (what an agent does).** The service user is `ci-agent`; its token is in the root-only file
`/root/jenkins-ci.env` on the host (never in the repository, never printed). From the host, with `curl` run
inside the Jenkins container (`docker exec ints-jenkins curl ...`, user and token from that file given through
a root-only curl config file), fetch a crumb from `/crumbIssuer/api/json` and POST to `/job/seed/build`.
Poll `/job/seed/lastBuild/api/json` for `building` and `result`; the log is `/job/seed/lastBuild/consoleText`.

**Bring the `All` view back** (if the owner wants every job listed again): the `+` next to the view tabs on the
dashboard, a *List View* that includes all jobs, or `seed` appears again in any view that matches it.

## Files in this folder

| File | What it is |
|---|---|
| `jenkins.md` | this document |
| `seed.groovy` | Job DSL: creates the folder and every job. The source of truth for the jobs |
| `<job>.Jenkinsfile` | one per job, named as the job: starts its script on the host over SSH |
| `win-e2e.sh` | launcher for the Windows VM e2e: starts `dp-ci.sh win e2e` (or `win docker-e2e` / `win server-e2e` / `win release` with the argument `docker-e2e` / `server-e2e` / `release`) as a detached host process (pid in `win-e2e.pid`, shared by every Windows lane), log `<ts>-win-e2e-<sha>.log` (`-win-docker-e2e-`, `-win-server-e2e-`, `-win-release-`), ends with `PIPELINE_RESULT=`. The tests themselves run on the VM as a scheduled task; a reboot of the host kills only the driver (then `dp-ci.sh win poll e2e`). Before every run the VM's checkout is fast-forwarded to `origin/main` (`dp-ci.sh win sync`; stops on local changes), the commit tested is printed as `WIN_E2E_COMMIT`, and the VM's package is rebuilt with `asbl/pack-prepare-for-e2e.bat` unless it was built from that commit (`WIN_E2E_PACKAGE=`; `dp-ci.sh win prepare` does both without the tests) |
| `job-step.sh` | on the host: runs one part of a job between a `######## JOB STEP n/N START` and an `END ... took=` line (format: `asbl/ci/marks.sh`) |
| `release-docker.sh` | on the host: job `dp-ci-release-step2-release-docker`. `MODE=rehearsal`: the build, the stage (`asbl/ci/release-publish.sh stage-docker`), then the install from the download on Linux and on the VM. `MODE=public`: the copy of a passed rehearsal (`asbl/ci/release-publish.sh publish docker`) |
| `release-set-version.sh` | on the host: job `dp-ci-release-step0-set-version`: a bigger version written into the version files of `origin/main` (`asbl/ci/set-version.sh`, in a throwaway worktree), checked, committed and pushed to `main` |
| `release-label.sh` | on the host: the label of a step 0, 2 or 3 build in the build list, read from the run's output (`release-run.out` in the job's workspace), set by the Jenkinsfile's `post { always }` |
| `release-demos.sh` | on the host: jobs `dp-ci-dev-demo-preview-bkstg` (`DEMO=dp-demo.bkstg`: `dp-ci.sh build-if-needed`, then the publish) and `dp-ci-release-step4-demo-public` (`DEMO=demo.datapallas.com`: `asbl/ci/demo-public/install-release.sh`), masked |
| `follow-ci.sh` | on the host: runs a launcher and follows its log until the run ends (`run`), or follows the current one (`attach`) |
| `plugins.txt` | the plugins needed beyond a standard install: `job-dsl`, and the report publishers of the quality plan (`htmlpublisher`, `coverage`, `warnings-ng`, `robot`) |
| `pull-reports.sh` | on the host: streams the report files of a run as a tar.gz, which the `Reports` stage of a Jenkinsfile unpacks into the build's workspace (see "Reports") |

Nothing is kept for Jenkins in the server folders: `apps/program-files/custom-jenkins` only holds the compose
file, and `apps/cvs/custom-jenkins/home` is Jenkins' live data (credentials included), never edited by hand.

## Reports

The CI runs on the host in a detached container, so its reports (test XML, coverage, lint results, HTML sites) are files on the host.
A Jenkins build only has its own workspace, so every job that has reports ends with a `Reports` stage:

1. `Run on the host` runs the script as before. A red run is recorded (`catchError`), not thrown, so the next stage still runs.
2. `Reports` runs `pull-reports.sh` on the host over the same SSH as the run and unpacks the stream into `reports/` in the workspace.
   The paths come from `REPORT_PATHS` in the Jenkinsfile (space-separated, globs allowed, relative to the repository root, e.g. `bkend/*/target/surefire-reports`).
   A missing path is skipped. It never fails the build. Two more forms: an absolute path is packed flat under its own name, and `@run/<suffix>` is the file
   `<newest run log without .log><suffix>` in the log folder (the e2e's `@run/-playwright.xml` is the JUnit XML named after that run's log).
3. The publisher steps of the tools (`junit`, Coverage, Warnings Next Generation, HTML Publisher, Robot Framework) read from `reports/`.
   They are added one tool at a time by the quality-tools work. Every tool is non-gating: it shows a report, it never fails a build.

The plugins are listed in `plugins.txt`. `pull-reports.sh` is read from the host checkout like `dp-ci.sh`, so a change to it needs no Jenkins step; a change to `seed.groovy` needs `seed`.

### Robot UAT reports (Windows lane)

The Robot UAT (`asbl/src/uat/run-tests.bat`, results in `asbl/src/uat/results/`: `output.xml`, `log.html`, `report.html`) runs in `dp-ci.sh win release`,
job `dp-ci-release-step3-release-windows-vm` (`MODE=rehearsal`), on the files the release pack has just made. The run copies `results/` to the host as
`<step log of the run, without .log>-robot`, and the job shows it with the Robot Framework plugin; the verdict is the run's own
`ROBOT_RESULT` line (from `output.xml`: `run-tests.bat` does not pass Robot's exit code on).

## Quality reports (one place to look)

Every tool below is **non-gating**: it shows a report on the build page and never changes a build's result. Nothing in this section has been run yet (the plan only configured it);
the first-run checklist is at the end. Jenkins folder `datapallas`, each job's build page: https://jenkins.bkstg.flowkraft.com/job/datapallas/.

| Tool | Job | Where to click on the build page |
|---|---|---|
| JUnit (Surefire XML of every Java module) | `dp-ci-dev-junit` | "Test Result" (counts, failed tests, trend) |
| JaCoCo coverage | `dp-ci-dev-junit` | "Coverage" (percentages, trend); "JaCoCo common / reporting / server" (HTML with the source of each class) |
| Error Prone + NullAway (javac warnings) | `dp-ci-dev-junit` | "Error Prone" warnings table |
| Playwright | `dp-ci-release-step1-e2e-prerelease` | "Test Result" (JUnit XML) and "Playwright report" (HTML: steps, screenshots, trace) |
| Robot Framework UAT | `dp-ci-release-step3-release-windows-vm` | "Robot Results"; the sha256 of the accepted files are the archived `release-files.txt` |
| springdoc OpenAPI + Swagger UI | `dp-ci-release-step1-e2e-prerelease` with `E2E_TARGET=docker-server` | "Swagger UI (OpenAPI)" and the archived `openapi.json` |
| Trivy (image CVEs, HIGH and CRITICAL)  | `dp-ci-release-step1-e2e-prerelease` (`docker-server`, `windows-vm-docker`, `windows-vm-server`), `dp-ci-release-step2-release-docker` and `dp-ci-dev-demo-preview-bkstg` | "Trivy" warnings table of the newest build; the same table is in that build's own log |
| Javadoc | `dp-ci-dev-quality-report` | "Javadoc" |
| Compodoc | `dp-ci-dev-quality-report` | "Compodoc" |
| ESLint (Angular, AI Hub) | `dp-ci-dev-quality-report` | "ESLint Angular", "ESLint AI Hub" |
| Prettier (Angular, AI Hub) | `dp-ci-dev-quality-report` | "Prettier Angular", "Prettier AI Hub" tables; the full file list is in the console and `QUALITY_RESULT` (`unformatted-<app>=N`) |
| SpotBugs + find-sec-bugs | `dp-ci-dev-quality-report` | "SpotBugs" |
| Spotless | `dp-ci-dev-quality-report` | "Spotless" (table per Java file; the raw output is an archived artifact) |
| PMD complexity, CPD | `dp-ci-dev-quality-report` | "PMD complexity", "Duplicated code" |
| ESLint complexity (Angular, AI Hub) | `dp-ci-dev-quality-report` | "Complexity Angular", "Complexity AI Hub" |
| Dependabot, CodeQL | GitHub, not Jenkins | see "GitHub: Dependabot and CodeQL" |

`dp-ci-dev-quality-report` ends its console log with a `QUALITY_RESULT` line: how many tools ran, which ended with a non-zero code (`<tool>=rcN`) and some counts.

### First-run checklist for the owner

1. The one-time Jenkins steps below, in order: install the plugins, relax the CSP, restart Jenkins, run `seed` (and approve the new `seed.groovy`).
2. Run **`dp-ci-dev-junit`** first: JaCoCo and Error Prone change the Java compile, so this is where a mistake shows first. If the compile breaks, remove the block marked "Error Prone + NullAway" in the poms.
3. Run **`dp-ci-dev-quality-report`**, then **`dp-ci-release-step1-e2e-prerelease`** (Playwright; with `E2E_TARGET=docker-server` it builds first, so it also shows Trivy and the OpenAPI page).
4. Open each table above once. An empty table next to a fine console log means the parser does not fit that tool's output: the raw output is archived or in the console, tell an agent which.

### The least certain changes (never run)

- **Error Prone + NullAway**: touches every Java compile (Linux and the Windows package build); the `-J` flags, the forked javac of the server and the Maven-console parser are all unproven.
- **The Spotless converter** (`spotless-to-checkstyle.py`): written from the documented message format, tried only on a hand-written sample.
- **The AI Hub ESLint flat configs** (lint, Prettier, complexity) and the checkstyle formatter installed in the CI scratch copy; also the `sonarjs` plugin version in each app.
- **Trivy**: the install in the CI image and the Warnings Next Generation `trivy` parser fit the JSON.
- **The Robot pull**: `dp-ci.sh win release` copies the UAT results to the host and step 3 shows them; no release rehearsal has run yet, so it is unproven.
- **The PMD plugin version** (3.26.0, PMD 7) and the rule names, and the CPD parser.
- **OpenAPI / Swagger UI**: `/v3/api-docs` may need a login on the secured backend; the page needs the CSP relaxation, and the Playwright trace viewer may not open from Jenkins.

## One-time steps for the owner (Jenkins side of the quality plan)

The quality plan only writes files in the repository. These steps change the running Jenkins and are done by the owner, once, in this order,
at a moment when no build is running or queued:

1. **Install the plugins** listed at the end of `plugins.txt`: Manage Jenkins -> Plugins -> Available -> `htmlpublisher` (HTML Publisher), `coverage` (Coverage),
   `warnings-ng` (Warnings Next Generation), `robot` (Robot Framework). (By command line instead:
   `docker cp asbl/ci/jenkins/plugins.txt ints-jenkins:/tmp/plugins.txt && docker exec ints-jenkins jenkins-plugin-cli --plugin-file /tmp/plugins.txt --plugin-download-directory /var/jenkins_home/plugins`.)
2. **Let Jenkins show JavaScript in published HTML reports.** By default Jenkins serves workspace and published HTML with a strict Content-Security-Policy that blocks scripts, which breaks
   the Playwright report, the Javadoc and Compodoc sites and Swagger UI. Decision (an agent's design, the owner may change it): relax the policy for the whole Jenkins, because it sits behind Authelia and
   every report is produced by our own CI. In `/var/kraft-internalsystems/apps/program-files/custom-jenkins/docker-compose.yml` add to the Jenkins `JAVA_OPTS` (or create it under `environment`):
   `-Dhudson.model.DirectoryBrowserSupport.CSP="default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; worker-src 'self' blob:"`.
   Instead of this, the reports could be served as static files by nginx behind Authelia; that is more work and not needed to start. Not verified: the Playwright *trace viewer* may still not open from a Jenkins-served
   report, because it needs a service worker; the report itself, the screenshots and the error text do.
3. **Restart Jenkins** (this applies steps 1 and 2): `docker compose up -d --force-recreate` in the folder of that compose file, or Manage Jenkins -> Restart safely.
4. **Run `seed`** (see "The seed job"; it creates `dp-ci-dev-quality-report` with the other jobs), and approve the new `seed.groovy` in In-process Script Approval.

## GitHub: Dependabot and CodeQL

Two tools of the quality plan run on GitHub, not in Jenkins; their files are in the repository and their results are read on GitHub:

| Tool | File | Where to look |
|---|---|---|
| Dependabot (weekly update pull requests: Maven, the Angular app, the AI Hub app, the CI image, GitHub Actions) | `.github/dependabot.yml` | https://github.com/flowkraft/datapallas/network/updates and the pull requests labelled `dependencies` |
| CodeQL (Java and TypeScript/JavaScript code scanning, on push to `main`, on pull requests and weekly) | `.github/workflows/codeql.yml` | https://github.com/flowkraft/datapallas/security/code-scanning |

Both are report only: nothing here gates a merge or a Jenkins build.

## Setting it up

1. **Job DSL plugin** installed (done 2026-10-03).
2. **Service user and API token**: user `ci-agent`; its token is in the root-only file `/root/jenkins-ci.env`
   on the host (done).
3. **SSH key for Jenkins**: generated into the Jenkins home, public half added to the host's
   `authorized_keys` (done 2026-10-03).
4. **Seed job** (see "The seed job" below): the only job made by hand. Freestyle, named `seed`, source = this repository, branch `main`,
   one build step "Process Job DSLs" with `asbl/ci/jenkins/seed.groovy`. Run it after any change to the jobs.
5. **Executors**: one on the built-in node, so only one build runs at a time.

## An e2e always tests the commit it names

The e2e does not run the tree as it is: its testground is a copy of the package `asbl/target/package/verified-db-noexe`
(the AI Hub apps, `db-template`, config, scripts); only the Java jars and the Angular UI are rebuilt from source on every
run. A package from an older commit therefore tests old code under a new commit's name (found 2026-10-03: a 22 Sep package
on the Windows VM was still sending `LIMIT 500` to SQL Server). So the package carries a stamp,
`asbl/target/package/.built-from`, with the commit it was built from, and both lanes rebuild it before the tests unless the
stamp is exactly the commit under test (a tree with uncommitted changes always rebuilds):

| Lane | Rebuild step | Log line |
|---|---|---|
| Linux (`dp-ci.sh e2e`) | `prepare_package`: `mvn clean install -pl asbl -am -DskipTests` + `AssemblerTest#prepareForE2E` (= `pack-prepare-for-e2e.bat`, no JUnit, no image) | `package: built from ...` |
| Windows VM (`dp-ci.sh win e2e`) | `win_prepare_package`: runs `asbl\pack-prepare-for-e2e.bat` unchanged on the desktop | `WIN_E2E_PACKAGE=current/stale/built` |

`dp-ci.sh build` writes the same stamp after it assembles, so an e2e straight after a build does not rebuild again.

## Rules

- **No secrets in the repository** (it is public): keys, tokens and passwords stay on the server.
- **One codebase, no OS guards.** A step that exists as a `.bat` gets a `.sh` twin next to it.
- **API access** only through the dedicated service user, never a person's account.
- **Jenkins does not check out its own copy**: the jobs run the host's checkout. `junit`, `quality`, `dev --live` and
  `build` run on it as it is; `e2e`, `e2e-loop` and `build-if-needed` first fast-forward it to `origin/main`, and so do
  the release jobs (`dev --pinned` uses a clone of its own).

## What an agent does

For a long step or a gate it starts the same job (or `dp-ci.sh`), reads the same log, fixes the cause when it
fails and runs it again. The owner reads the same console in Jenkins.

## Job renames and removals (2026-10-08)

`dp-ci-build` is now `dp-ci-package`; `dp-ci-attach` is gone; `dp-ci-e2e-dev` is new. The seed job creates and updates jobs but never deletes one (`removedJobAction` IGNORE), so the old jobs `datapallas/dp-ci-build` and `datapallas/dp-ci-attach` stay in Jenkins until someone deletes them there; neither had a build history worth keeping.

## Job renames (2026-10-11)

The two e2e jobs are named for what they prove: `dp-ci-e2e` is now `dp-ci-e2e-release` and `dp-ci-e2e-dev` is now `dp-ci-e2e-loop`; `dp-ci.sh e2e-dev` is now `dp-ci.sh e2e-loop`; `E2E_PACKAGE` `reuse` and `content` are now `package-reuse-as-is` and `package-repackage`, and `package-rsync-simple-file-changes` is new. The old names are refused with the new one, and the old jobs were deleted in Jenkins after `seed` had created the new ones (their build history went with them).

## Job renames and removals (2026-10-22)

The jobs a release runs in order carry their step in their name, and each builds what it needs itself: `dp-ci-e2e-release` is now `dp-ci-release-step1-e2e-prerelease`, and `dp-ci-release-step2-pack-and-uat` (`dp-ci.sh win release`) is new. `dp-ci-package` is gone: step 1 and the new `dp-ci-release-demos` run `dp-ci.sh build-if-needed`, and `dp-ci.sh build` still runs by hand. The seed job leaves the two old jobs in Jenkins with their build history (`removedJobAction` IGNORE) until they are deleted there by hand.

## Job renames and removals (2026-10-22, later)

The release has four steps: Docker is built once on Linux by its own job, and nothing goes public before the last one. `dp-ci-release-step2-pack-and-uat` is now `dp-ci-release-step3-pack-and-uat-windows` (the Windows files only: the pack, the Robot UAT, the zips staged from this host); `dp-ci-release-step2-pack-and-uat-docker` (the Docker release) and `dp-ci-release-step4-publish` (the publish) are new. `dp-ci-release-demos` installs the published release on demo.datapallas.com instead of building it. The seed job leaves the old job in Jenkins with its build history until it is deleted there by hand.

## Job renames and removals (2026-10-22, run D)

Each channel is released by one job with two modes: `dp-ci-release-step2-pack-and-uat-docker` is now `dp-ci-release-step2-release-docker` and `dp-ci-release-step3-pack-and-uat-windows` is now `dp-ci-release-step3-release-windows-vm`, each with `MODE=rehearsal` (what they did before, staged in `rehearsal/` instead of `candidate/`) and `MODE=public` (what `dp-ci-release-step4-publish` did, per channel). `dp-ci-release-step4-publish` and `release-publish.sh promote` are gone. The release records are renamed (`step2.docker` and `step2.docker-stage` are `rehearsal.docker` and `rehearsal.docker-stage`, `step3.windows` is `rehearsal.windows`, `step4.publish` is `public.docker` and `public.windows`); none had been recorded for real. The three old jobs were never created in Jenkins (the seed of `c3d1c29c` was not applied).

New: `dp-ci-release-step0-set-version`, step 0 of a release, sets the version (before, the owner ran `asbl/ci/set-version.sh` and committed by hand). `NOTHING TO RELEASE` and the version gate's refusals now name it. Steps 0, 2 and 3 label their builds (`release-label.sh`).

## Job renames and removals (2026-10-22, the CI explains itself)

The name says the moment: `dp-ci-dev-...` any time while developing, `dp-ci-release-stepN-...` a release, in that order. `dp-ci-dev-live` is now `dp-ci-dev-server`, `dp-ci-e2e-loop` is now `dp-ci-dev-e2e-one-spec`, `dp-ci-junit` is now `dp-ci-dev-junit`, `dp-ci-quality` is now `dp-ci-dev-quality-report`. `dp-ci-release-demos` is now two jobs: `dp-ci-dev-demo-preview-bkstg` (dp-demo.bkstg) and `dp-ci-release-step4-demo-public` (demo.datapallas.com, step 4 of a release); `DEMO=both` is gone. The `dp-ci.sh` subcommands keep their names. Every job's description in Jenkins now has the same blocks (what, when, order, needs, time, examples, log, more). `seed` never deletes a job: once it had created the new ones, the six old jobs still in Jenkins (`dp-ci-dev-live`, `dp-ci-e2e-loop`, `dp-ci-junit`, `dp-ci-quality`, and `dp-ci-e2e-release` and `dp-ci-package` of the first renames that day) were deleted there by hand on 2026-10-22, each archived first with its build history (`/var/kraft-internalsystems/logs/datapallas-ci/deleted-jenkins-jobs/`). `dp-ci-release-demos` and the other names of `c3d1c29c` were never created (its seed was not applied).
