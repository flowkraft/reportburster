# Jenkins for DataPallas

Jenkins is a **window onto the scripts we already run**, not a second way of building. Every job starts the same
plain script from `asbl/ci/` that is run by hand (today `dp-ci.sh`), on the server, in the same CI container, and
shows its log. Nothing is installed on the host and no Jenkins agent is needed.

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

- **Same scripts, same container.** `dp-ci.sh` is unchanged. A job only sets its environment variables
  (`E2E_SPEC`, `E2E_GREP`, `JUNIT_MODULE`, ...) and calls it, exactly as one does by hand on the host.
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

All live in the folder `datapallas`, and are created by `seed.groovy`.

A release runs four jobs in order, and their names say it: `dp-ci-release-step1-e2e-prerelease` (the e2e lanes), then `dp-ci-release-step2-pack-and-uat-docker` (the Docker files, built once on Linux) and `dp-ci-release-step3-pack-and-uat-windows` (the Windows files) in either order, then `dp-ci-release-step4-publish` (the owner only). Each builds what it needs itself and refuses unless the step before it is green on the same commit; the order, the why and the owner's steps are in "The release, in order" below. `dp-ci-release-demos` publishes the demos: dp-demo.bkstg with its own build of `origin/main` at any time, demo.datapallas.com as a plain install of the published release after step 4; it is not a step of a release. The other jobs have no place in that order.

Where the time goes: every job that does several things marks each part with a START and an END line, the END with how long it took, in one format (`asbl/ci/marks.sh`): `######## JOB STEP 1/2 START <time> :: <what>` ... `######## JOB STEP 1/2 END rc=0 <time> took=2467s (41m7s) :: <what>`. Nested parts carry their own label (`DOCKER RELEASE STEP 4/6`, `RELEASE STEP 2/3`, `PUBLISH STEP 2/4`, `windows-vm-docker STEP 3/3`, `DEMOS STEP 2/5`), and the Linux run's own steps end with `took=` too (`<<< STEP 4 END rc=0 <time> took=...`). `grep -aE '^######## |^<<< STEP'` on a console log or a run log gives the times.

| Job | Runs | Parameters |
|---|---|---|
| `dp-ci-junit` | `dp-ci.sh junit`: the JUnit gate; no package, no e2e | `JUNIT_MODULE`, `JUNIT_TEST` |
| `dp-ci-quality` | `dp-ci.sh quality`: compiles the Java modules, installs the npm dependencies, runs the quality tools; no package, no tests, never gating | none |
| `dp-ci-e2e-loop` | `dp-ci.sh e2e-loop`: the fix-and-retry **loop**. One spec file, never rebuilds the package; not a release check. Speed: about 4 min fixed plus the spec | `E2E_SPEC` (required), `E2E_GREP`, `E2E_TARGET` (`web` or `electron-linux`), `E2E_PACKAGE`: `package-reuse-as-is` (default; run on the package exactly as it stands, for a fix to specs, helpers, Java or the Angular UI; instant), `package-rsync-simple-file-changes` (copy the plain db-template files changed since the package was built (commits, and new untracked files) into the package and the testground; stops with `use package-repackage` when a changed file is not a verbatim copy; seconds), `package-repackage` (package the content again on the built jars, `AssemblerTest#refreshContentForE2E`; about 3.5 min; not a full rebuild, that is `dp-ci.sh build`). `reuse` and `content` are refused, naming the new value. The log has the line `E2E_PACKAGE mode=... built_from=... commit_under_test=... files_copied=<n>` |
| `dp-ci-dev-live` | `dp-ci.sh dev --live` or `--pinned <sha>`: brings up the hot-reloading dev server and prints its URL (`dp-dev-live` / `dp-dev-pinned`), or stops it. No e2e: a diagnosis tool, never a verification. The server is a detached container, it keeps running after the build until `ACTION=stop`; a second start prints `already running at <URL>`; it refuses while a `dp-ci` run holds the server. A spec cannot run against it (an e2e cleans the testground the live server reads and starts its own server): use `dp-ci-e2e-loop` | `ACTION` (`start`, `stop`), `DEV_MODE` (`live`, `pinned`), `PINNED_SHA` (pinned only) |
| `dp-ci-release-step1-e2e-prerelease` | `dp-ci.sh e2e`, or `dp-ci.sh win e2e` for `windows-vm-electron`, `dp-ci.sh win docker-e2e` for `windows-vm-docker` and `dp-ci.sh win server-e2e` for `windows-vm-server`: **step 1 of 4 of a release**, the **real** e2e, the prerelease check. Speed: the slowest, it rebuilds a stale package first (about 26 min before the tests). It has no package parameter on purpose: it always runs on a package built from this exact commit and rebuilds it first when it is stale; it is the release check, so the package shortcuts exist only on `dp-ci-e2e-loop`. Needed before a release: four lanes green on one commit (OD5), `docker-server` full (empty `E2E_SPEC`) and auth (`E2E_SPEC` naming `auth-authorization-server`, which the full run leaves out), `windows-vm-electron` full, `windows-vm-server` light (empty `E2E_SPEC`). Each build records its verdict in the release record as `step1.<target>-<full|auth|light|targeted>` (a run with any other filter is `targeted` and never counts); its first line is `RELEASE_VERSION` (what a release would do now), and it runs anyway: it is also the everyday e2e job. The `docker-server`, `windows-vm-docker` and `windows-vm-server` targets install what `dp-ci.sh build` makes: the job runs `dp-ci.sh build-if-needed` first (JOB STEP 1/2: the server checkout on `origin/main`, which the VM tests too, built only when the newest successful build is not of that commit; about 40 min, once per commit), then the tests (JOB STEP 2/2); it also shows that build's Trivy table. One build at a time: a second one waits in the Jenkins queue, so the Windows targets (they share the VM; `win-e2e.sh` refuses a second driver too) can be started one after the other and run in turn | `E2E_SPEC` (one file, empty = the full suite), `E2E_TARGET` (`web`, `electron-linux`, `docker-server`, `windows-vm-electron`, `windows-vm-docker`: DataPallas Server in Docker Desktop on the VM, installed from `datapallas-server-docker.zip` as the self-host page says; empty `E2E_SPEC` there = a light set of five files, not the suite; `windows-vm-server`: DataPallas Server on the VM's own Java 17, installed from `datapallas-server.zip` as the installation page says, with the same light set by default), `E2E_ROTATION_DATE` (empty = today; the day's database rotation, e.g. 2026-09-22 = sqlserver) |
| `dp-ci-release-step2-pack-and-uat-docker` | `asbl/ci/jenkins/release-docker.sh`, **step 2 of 4 of a release, the Docker files**: only when step 1 is green on the same commit (every lane a release needs); before or after step 3, never at the same time (one VM). The version gate first (nothing to release = green, nothing built), then `dp-ci.sh build-if-needed`: Docker is built once, on Linux. Then `release-publish.sh stage-docker`: the image pushed as `flowkraft/datapallas-server:<version>` (never `:latest`) and `datapallas-server-docker.zip` uploaded to the candidate folder `candidate/<version>-<commit>/` on Backblaze, both checked. Then that very zip, from its download link (`E2E_DOCKER_FROM_URL`), installed as the self-host page says and tested: on this host the `docker-server` lane (the light set, then the one-command `docker run`), on the VM the `windows-vm-docker` lane in Docker Desktop (the light set); the running image must be the digest that was pushed. Both lanes always run; `DOCKER_RELEASE_RESULT` is the verdict, recorded as `step2.docker`. No public link moves. Its six parts are `DOCKER RELEASE STEP 1/6` .. `6/6`; it shows the build's Trivy table | `DRY_RUN` (`no`, `yes`: the gate, the guards and what each part would do; nothing built, pushed or installed) |
| `dp-ci-release-step3-pack-and-uat-windows` | `dp-ci.sh win release`, **step 3 of 4 of a release, the Windows files**: only when step 1 is green on the same commit; before or after step 2, never at the same time. The version gate first (nothing to release = green, no pack). On the Windows VM, `asbl/pack-datapallas.bat` builds the Windows release files once, from clean (`datapallas.zip` with DataPallas.exe, `datapallas-server.zip`, `datapallas-src.zip`; its Docker zip and image are not shipped, step 2 builds Docker on Linux), and those very files are tested as a user meets them by the Robot Framework UAT (`asbl/src/uat/run-tests.bat`, a bare step: the machine's own Java). Only when it is green, this host stages the three zips in the same candidate folder, checked by download (`release-publish.sh stage-files`; the VM never holds a credential). `RELEASE_RESULT` is the verdict, recorded as `step3.windows`; `RELEASE_FILE` the sha256 of the files (also `<log>-step-release-files.txt`). No public link moves. Slow: the pack alone takes hours; its three parts are `RELEASE STEP 1/3` .. `3/3` | none |
| `dp-ci-release-step4-publish` | `asbl/ci/release-publish.sh promote`, **step 4 of 4 of a release, the publish, the owner only**: only when steps 2 and 3 are green on the same commit, for the same version, staged in the same candidate folder. The version gate and the guards first (no publish recorded yet, `:<version>` on Docker Hub still the staged digest). Then the staged files copied on Backblaze to `newest/` (the links of the README, the Docker Hub page and the self-host page) and to `<version>/` (the archive), each `newest/` file checked by download; the Cloudflare cache of the `newest/` links purged; `:latest` pointed at the staged `:<version>` and checked; `step4.publish` recorded. Nothing is built or packed: what goes public is byte for byte what steps 2 and 3 tested. Printed at the end, by hand: the Docker Hub page (`asbl/docker/push-dockerhub-readme.ps1`) and `dp-ci-release-demos`. Its four parts are `PUBLISH STEP 1/4` .. `4/4` | `DRY_RUN` (`no`, `yes`: the gate and the guards, then what each part would do) |
| `dp-ci-release-demos` | `asbl/ci/jenkins/release-demos.sh`: **the demos, not a step of a release**. dp-demo.bkstg shows `origin/main`, the preview before a release: `dp-ci.sh build-if-needed` first (built only when `origin/main` is not built yet), then that very image published with `dp-ci.sh publish-demo-bkstg` (https://dp-demo.bkstg.flowkraft.com). demo.datapallas.com (the public demo that datapallas.com frames) is a plain install of the published release, nothing built (OD4): run it after step 4. `setup.sh` and `setup.sh --edge`, then `asbl/ci/demo-public/install-release.sh` (`newest/datapallas-server-docker.zip` unzipped into a folder of its own per version, with `asbl/ci/demo-public/docker-compose.override.yml`: no Docker socket, no host port, no MailHog; the data carried over from the running version; the previous version started again when the new one does not answer; nothing to do when it already runs the released version; its verdict is the `DEMO_INSTALL result=` line), then `setup.sh --check` and the demo links. Or both. Its parts are `DEMOS STEP n/N` in the log; the output is masked like the Rundeck job's. `DEMOS_RESULT` is the verdict | `DEMO` (`dp-demo.bkstg`, `demo.datapallas.com`, `both`), `RESET_DEMO_DATA` (`no`, `yes`: demo.datapallas.com only, a new release starts from the bundle's own data, the old data stays in the previous version's folder), `DRY_RUN` (`no`, `yes`: builds nothing, changes nothing) |

To add a step: make it a script in `asbl/ci/` that launches a detached run and prints a `log:` line, add a
`<name>.Jenkinsfile` here (copy `dp-ci-junit.Jenkinsfile`), add an entry to `seed.groovy`, push, run `seed`. A job that runs several
scripts wraps each in `job-step.sh "JOB STEP n/N" "<what>" <command...>`, so its log says where the time goes.

## The release, in order

```
step1 e2e-prerelease        (Linux + Windows VM, the e2e lanes; one Jenkins build per target)
   |  all required lanes PASS on commit C
   v
step2 pack-and-uat-docker   (Linux builds and stages; light set on Linux AND Windows from the public download)
step3 pack-and-uat-windows  (Windows VM packs + Robot UAT; Linux stages the zips)
   |  both PASS on commit C, same version V  (2 and 3 in either order, never at the same time: one VM)
   v
step4 publish               (Linux: candidate -> newest/, :V -> :latest, checked; owner only)
   v
release-demos               (installs the published release, see OD4)
```

Why this order:

- **Step 1 proves the code**: the real e2e on a package built from one commit. The lanes a release needs (owner decision OD5, 2026-10-22) are `docker-server` full and auth, `windows-vm-electron` full and `windows-vm-server` light.
- **Steps 2 and 3 make the files a user downloads, each once, and test those very files the way a user meets them.** Docker is built once, on Linux, and published from Linux; its light set runs on Linux and on Windows from the public download link, as the self-host page installs it. The Windows files are packed once on the VM and pass the Robot UAT. Both only stage (OD1): `:<version>` on Docker Hub and the zips in `candidate/<version>-<commit>/` on Backblaze. No public link moves before step 4.
- **Step 4 builds nothing**: it copies what steps 2 and 3 tested to `newest/` and `<version>/`, purges the Cloudflare cache of the `newest/` links (OD6) and points `:latest` at the staged digest, each checked. What goes public is byte for byte what passed.
- **One commit**: each step refuses unless the step before it is green on the same commit of `origin/main` (OD2): keep `main` still from the release commit to step 4.
- **demo.datapallas.com** installs the published release like any user (OD4); dp-demo.bkstg keeps showing builds of `origin/main`.

**The version gate.** Every release job starts with `bash asbl/ci/release-state.sh version-check`. The version is `<version>` in `bkend/reporting/src/main/external-resources/template/config/burst/settings.xml`, which the owner sets before a release (with the other version files: `bash asbl/ci/set-version.sh <version>`; `--versions` lists them, they must agree). The released version is the one Docker Hub's `:latest` has. The same: `NOTHING TO RELEASE`, the job ends green and does nothing. Greater: the release goes on. Lower, or already published: refused. Step 1 only prints the `RELEASE_VERSION` line and runs anyway, as the everyday e2e job.

**The release record.** Each step writes its verdict as a file under `/var/kraft-internalsystems/logs/datapallas-ci/release-state/<commit>/`, and the next step reads it. `bash asbl/ci/release-state.sh show [<commit>]` prints the table: where a release stands.

| Job | Needs, on the same commit | Writes | Records |
|---|---|---|---|
| step 1 `dp-ci-release-step1-e2e-prerelease` | nothing (one build per lane) | nothing | `step1.<target>-<mode>` |
| step 2 `dp-ci-release-step2-pack-and-uat-docker` | the four step 1 lanes; the credentials file | `flowkraft/datapallas-server:<version>`; `datapallas-server-docker.zip` in the candidate folder | `step2.docker-stage`, `step2.docker` |
| step 3 `dp-ci-release-step3-pack-and-uat-windows` | the four step 1 lanes; the credentials file | `datapallas.zip`, `datapallas-server.zip`, `datapallas-src.zip` in the candidate folder | `step3.windows` |
| step 4 `dp-ci-release-step4-publish` | `step2.docker` and `step3.windows` for this version, one candidate folder; the credentials file | `newest/` and `<version>/` on Backblaze, the Cloudflare purge, `:latest`: the public links | `step4.publish` |
| `dp-ci-release-demos` (demo.datapallas.com) | step 4 done (it installs `newest/`) | demo.datapallas.com | nothing |

**The credentials** (OD3) are one root-only file the owner writes, `/var/kraft-internalsystems/config/datapallas-ci/release-publish.env`, mode 600: `DOCKERHUB_USER`, `DOCKERHUB_TOKEN`, `RCLONE_CONFIG` (the path of an rclone config with the `backblaze` remote), `CLOUDFLARE_PURGE_TOKEN`, `CLOUDFLARE_ZONE_ID`. The jobs check that it is there and mode 600 and source it silently; nothing prints it, and the Windows VM never holds a credential (this host uploads).

The owner's steps for a release:

1. Once: approve `seed.groovy` (In-process Script Approval), run `seed`, and delete by hand the old jobs that the "Job renames and removals" sections below name (`seed` never deletes a job).
2. Once: write `release-publish.env`.
3. Set the new version in `settings.xml` and the other version files (`bash asbl/ci/set-version.sh <version>`), update the changelog and whatever else the release needs, commit (`release: x.y.z`), push, and keep `main` still until step 4. Until that commit, every release job says NOTHING TO RELEASE.
4. Run step 1 for each required lane, then steps 2 and 3 (either order), then step 4, then `dp-ci-release-demos`. Step 4 prints what stays by hand (the Docker Hub page: `asbl/docker/push-dockerhub-readme.ps1`).

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
| `<job>.Jenkinsfile` | one per job: starts its script on the host over SSH |
| `win-e2e.sh` | launcher for the Windows VM e2e: starts `dp-ci.sh win e2e` (or `win docker-e2e` / `win server-e2e` / `win release` with the argument `docker-e2e` / `server-e2e` / `release`) as a detached host process (pid in `win-e2e.pid`, shared by every Windows lane), log `<ts>-win-e2e-<sha>.log` (`-win-docker-e2e-`, `-win-server-e2e-`, `-win-release-`), ends with `PIPELINE_RESULT=`. The tests themselves run on the VM as a scheduled task; a reboot of the host kills only the driver (then `dp-ci.sh win poll e2e`). Before every run the VM's checkout is fast-forwarded to `origin/main` (`dp-ci.sh win sync`; stops on local changes), the commit tested is printed as `WIN_E2E_COMMIT`, and the VM's package is rebuilt with `asbl/pack-prepare-for-e2e.bat` unless it was built from that commit (`WIN_E2E_PACKAGE=`; `dp-ci.sh win prepare` does both without the tests) |
| `job-step.sh` | on the host: runs one part of a job between a `######## JOB STEP n/N START` and an `END ... took=` line (format: `asbl/ci/marks.sh`) |
| `release-docker.sh` | on the host: job `dp-ci-release-step2-pack-and-uat-docker`: the build, the stage (`asbl/ci/release-publish.sh stage-docker`), then the install from the download on Linux and on the VM |
| `release-demos.sh` | on the host: job `dp-ci-release-demos`: dp-demo.bkstg (`dp-ci.sh build-if-needed`, then the publish) and/or demo.datapallas.com (`asbl/ci/demo-public/install-release.sh`), masked |
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
job `dp-ci-release-step3-pack-and-uat-windows`, on the files the release pack has just made. The run copies `results/` to the host as
`<step log of the run, without .log>-robot`, and the job shows it with the Robot Framework plugin; the verdict is the run's own
`ROBOT_RESULT` line (from `output.xml`: `run-tests.bat` does not pass Robot's exit code on).

## Quality reports (one place to look)

Every tool below is **non-gating**: it shows a report on the build page and never changes a build's result. Nothing in this section has been run yet (the plan only configured it);
the first-run checklist is at the end. Jenkins folder `datapallas`, each job's build page: https://jenkins.bkstg.flowkraft.com/job/datapallas/.

| Tool | Job | Where to click on the build page |
|---|---|---|
| JUnit (Surefire XML of every Java module) | `dp-ci-junit` | "Test Result" (counts, failed tests, trend) |
| JaCoCo coverage | `dp-ci-junit` | "Coverage" (percentages, trend); "JaCoCo common / reporting / server" (HTML with the source of each class) |
| Error Prone + NullAway (javac warnings) | `dp-ci-junit` | "Error Prone" warnings table |
| Playwright | `dp-ci-release-step1-e2e-prerelease` | "Test Result" (JUnit XML) and "Playwright report" (HTML: steps, screenshots, trace) |
| Robot Framework UAT | `dp-ci-release-step3-pack-and-uat-windows` | "Robot Results"; the sha256 of the accepted files are the archived `release-files.txt` |
| springdoc OpenAPI + Swagger UI | `dp-ci-release-step1-e2e-prerelease` with `E2E_TARGET=docker-server` | "Swagger UI (OpenAPI)" and the archived `openapi.json` |
| Trivy (image CVEs, HIGH and CRITICAL)  | `dp-ci-release-step1-e2e-prerelease` (`docker-server`, `windows-vm-docker`, `windows-vm-server`), `dp-ci-release-step2-pack-and-uat-docker` and `dp-ci-release-demos` | "Trivy" warnings table of the newest build; the same table is in that build's own log |
| Javadoc | `dp-ci-quality` | "Javadoc" |
| Compodoc | `dp-ci-quality` | "Compodoc" |
| ESLint (Angular, AI Hub) | `dp-ci-quality` | "ESLint Angular", "ESLint AI Hub" |
| Prettier (Angular, AI Hub) | `dp-ci-quality` | "Prettier Angular", "Prettier AI Hub" tables; the full file list is in the console and `QUALITY_RESULT` (`unformatted-<app>=N`) |
| SpotBugs + find-sec-bugs | `dp-ci-quality` | "SpotBugs" |
| Spotless | `dp-ci-quality` | "Spotless" (table per Java file; the raw output is an archived artifact) |
| PMD complexity, CPD | `dp-ci-quality` | "PMD complexity", "Duplicated code" |
| ESLint complexity (Angular, AI Hub) | `dp-ci-quality` | "Complexity Angular", "Complexity AI Hub" |
| Dependabot, CodeQL | GitHub, not Jenkins | see "GitHub: Dependabot and CodeQL" |

`dp-ci-quality` ends its console log with a `QUALITY_RESULT` line: how many tools ran, which ended with a non-zero code (`<tool>=rcN`) and some counts.

### First-run checklist for the owner

1. The one-time Jenkins steps below, in order: install the plugins, relax the CSP, restart Jenkins, run `seed` (and approve the new `seed.groovy`).
2. Run **`dp-ci-junit`** first: JaCoCo and Error Prone change the Java compile, so this is where a mistake shows first. If the compile breaks, remove the block marked "Error Prone + NullAway" in the poms.
3. Run **`dp-ci-quality`**, then **`dp-ci-release-step1-e2e-prerelease`** (Playwright; with `E2E_TARGET=docker-server` it builds first, so it also shows Trivy and the OpenAPI page).
4. Open each table above once. An empty table next to a fine console log means the parser does not fit that tool's output: the raw output is archived or in the console, tell an agent which.

### The least certain changes (never run)

- **Error Prone + NullAway**: touches every Java compile (Linux and the Windows package build); the `-J` flags, the forked javac of the server and the Maven-console parser are all unproven.
- **The Spotless converter** (`spotless-to-checkstyle.py`): written from the documented message format, tried only on a hand-written sample.
- **The AI Hub ESLint flat configs** (lint, Prettier, complexity) and the checkstyle formatter installed in the CI scratch copy; also the `sonarjs` plugin version in each app.
- **Trivy**: the install in the CI image and the Warnings Next Generation `trivy` parser fit the JSON.
- **The Robot pull**: no UAT step produces the report yet (W9); only the Jenkins side exists.
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
4. **Run `seed`** (see "The seed job") once the quality plan has added the job `dp-ci-quality` to `seed.groovy`, and approve the new `seed.groovy` in In-process Script Approval.

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
- **The build runs on the working tree as it is**, like `dp-ci.sh` always did. Jenkins does not check out its
  own copy.

## What an agent does

For a long step or a gate it starts the same job (or `dp-ci.sh`), reads the same log, fixes the cause when it
fails and runs it again. The owner reads the same console in Jenkins.

## Job renames and removals (2026-10-08)

`dp-ci-build` is now `dp-ci-package`; `dp-ci-attach` is gone; `dp-ci-e2e-dev` is new. The seed job creates and updates jobs but never deletes one (`removedJobAction` IGNORE), so the old jobs `datapallas/dp-ci-build` and `datapallas/dp-ci-attach` stay in Jenkins until someone deletes them there; neither had a build history worth keeping.

## Job renames and removals (2026-10-22)

The jobs a release runs in order carry their step in their name, and each builds what it needs itself: `dp-ci-e2e-release` is now `dp-ci-release-step1-e2e-prerelease`, and `dp-ci-release-step2-pack-and-uat` (`dp-ci.sh win release`) is new. `dp-ci-package` is gone: step 1 and the new `dp-ci-release-demos` run `dp-ci.sh build-if-needed`, and `dp-ci.sh build` still runs by hand. The seed job leaves the two old jobs in Jenkins with their build history (`removedJobAction` IGNORE) until they are deleted there by hand.

## Job renames and removals (2026-10-22, later)

The release has four steps: Docker is built once on Linux by its own job, and nothing goes public before the last one. `dp-ci-release-step2-pack-and-uat` is now `dp-ci-release-step3-pack-and-uat-windows` (the Windows files only: the pack, the Robot UAT, the zips staged from this host); `dp-ci-release-step2-pack-and-uat-docker` (the Docker release) and `dp-ci-release-step4-publish` (the publish) are new. `dp-ci-release-demos` installs the published release on demo.datapallas.com instead of building it. The seed job leaves the old job in Jenkins with its build history until it is deleted there by hand.

## Job renames (2026-10-11)

The two e2e jobs are named for what they prove: `dp-ci-e2e` is now `dp-ci-e2e-release` and `dp-ci-e2e-dev` is now `dp-ci-e2e-loop`; `dp-ci.sh e2e-dev` is now `dp-ci.sh e2e-loop`; `E2E_PACKAGE` `reuse` and `content` are now `package-reuse-as-is` and `package-repackage`, and `package-rsync-simple-file-changes` is new. The old names are refused with the new one, and the old jobs were deleted in Jenkins after `seed` had created the new ones (their build history went with them).
