const gulp = require("gulp");
const jetpack = require("fs-jetpack");
const { childProcess, spawn } = require("child_process");
const kill = require("tree-kill");

const argv = require("minimist")(process.argv);

const through = require("through2");
const PluginError = require("plugin-error");

const getUrls = require("get-urls");
const syncHTTPRequest = require("sync-request");

const FRONTEND_PLAYGROUND_FOLDER_PATH = "./testground";

exports.getEnvName = () => {
  return argv.env || "development";
};

exports.beepSound = () => {
  process.stdout.write("\u0007");
};

gulp.task("utils:start-server-and-ui-both", () => {
  _startServerAndDoX("_custom:start-ui-both");
});

gulp.task("utils:start-server-and-ui-web", () => {
  _startServerAndDoX("_custom:start-ui-web");
});

gulp.task("utils:start-server-and-ui-electron", () => {
  _startServerAndDoX("_custom:start-ui-electron");
});

gulp.task("utils:start-server-and-e2e-electron", () => {
  _startServerAndDoX("_custom:playwright-scripts-electron");
});

gulp.task("utils:start-server-and-e2e-web", () => {
  _startServerAndDoX("_custom:playwright-scripts-web");
});

gulp.task("utils:start-javano-chocono-and-ui", () => {
  const chocoStatus = "not-installed";
  _startJavaNoAndUI(chocoStatus);
});

gulp.task("utils:start-javano-chocoyes-and-ui", () => {
  const chocoStatus = "installed";
  _startJavaNoAndUI(chocoStatus);
});

gulp.task("utils:start-java8-chocoyes-and-ui", () => {
  const javaVersion = "1.8.0_412";
  const chocoStatus = "installed";
  _startJavaYesAndUI(javaVersion, chocoStatus);
});

gulp.task("utils:start-java8-chocono-and-ui", () => {
  const javaVersion = "1.8.0_412";
  const chocoStatus = "not-installed";
  _startJavaYesAndUI(javaVersion, chocoStatus);
});

gulp.task("utils:start-java11-chocoyes-and-ui", () => {
  const javaVersion = "11.2.0_233";
  const chocoStatus = "installed";
  _startJavaYesAndUI(javaVersion, chocoStatus);
});

gulp.task("utils:start-java11-chocono-and-ui", () => {
  const javaVersion = "11.2.0_233";
  const chocoStatus = "not-installed";
  _startJavaYesAndUI(javaVersion, chocoStatus);
});

gulp.task("utils:show-stats-memory", () => {
  const maxHeapSz = require("v8").getHeapStatistics().heap_size_limit;
  const maxHeapSz_GB = (maxHeapSz / 1024 ** 3).toFixed(1);

  console.log("--------------------------");
  console.log(`${maxHeapSz_GB}GB`);

  return Promise.resolve(`${maxHeapSz_GB}GB`);
});

gulp.task("utils:check-broken-links", () => {
  return gulp.src("src/**/*.html").pipe(_checkBrokenLinks());
});

_startJavaYesAndUI = async (javaVersion, chocoStatus) => {
  const rbsjExeLogPath = "testground/e2e/logs/rbsj-exe.log";
  await jetpack.writeAsync(rbsjExeLogPath, "");
  const javaLogMessage = `bla bla\nv10.2.0 using Java ${javaVersion} on`;
  await jetpack.writeAsync(rbsjExeLogPath, javaLogMessage);

  const electronLogPath = "testground/e2e/logs/electron.log";
  await jetpack.writeAsync(electronLogPath, "");
  let chocoLogMessage = "bla bla\n'choco' is not recognized";
  if (chocoStatus != "not-installed") chocoLogMessage = "0.11.2\nbla bla";

  await jetpack.writeAsync(electronLogPath, chocoLogMessage);

  const electronProcess = spawn("npm", ["run", "_custom:start-ui-electron"], {
    stdio: "inherit",  // Changed from "pipe" to "inherit" to show output
    shell: true,
  });

  electronProcess.stdout.on('data', (data) => {
    console.log(`Electron: ${data}`);
  });

  electronProcess.stderr.on('data', (data) => {
    console.error(`Electron Error: ${data}`);
  });
};

_startJavaNoAndUI = async (chocoStatus) => {
  const rbsjExeLogPath = "testground/e2e/logs/rbsj-exe.log";
  await jetpack.writeAsync(rbsjExeLogPath, "");
  const javaLogMessage = "bla bla\n'java' is not recognized";
  await jetpack.writeAsync(rbsjExeLogPath, javaLogMessage);

  const electronLogPath = "testground/e2e/logs/electron.log";
  await jetpack.writeAsync(electronLogPath, "");
  let chocoLogMessage = "bla bla\n'choco' is not recognized";
  if (chocoStatus != "not-installed")
    chocoLogMessage = "bla bla\nchoco version: 0.11.2";

  await jetpack.writeAsync(electronLogPath, chocoLogMessage);

  try {
    const electronProcess = spawn("npm", ["run", "_custom:start-ui-electron"], {
      stdio: "inherit",
      shell: true,
      env: {
        ...process.env,
        DEBUG: "true",
        NODE_OPTIONS: "--inspect=9230"  // Changed to port 9230
      }
    });

    if (electronProcess) {
      electronProcess.stdout?.on('data', (data) => {
        console.log(`Electron: ${data}`);
      });

      electronProcess.stderr?.on('data', (data) => {
        console.error(`Electron Error: ${data}`);
      });
    } else {
      console.error('Failed to start electron process');
    }
  } catch (error) {
    console.error('Error starting electron process:', error);
  }
};

_startServerAndDoX = (npm_x_script) => {
  const server = spawn("npm", ["run", "_custom:start-server"], {
    stdio: "pipe",
    shell: true,
  });

  server.stdout.on("data", (data) => {
    console.log(`stdout: ${data}`);
    if (data.includes("Started ServerApplication in")) {
      console.log(
        `stdout: ${data} !!!!!! ====>>>>> starting 'npm run "${npm_x_script}"'`,
      );

      const npmXScriptSpawned = spawn("npm", ["run", npm_x_script], {
        stdio: "pipe",
        shell: true,
      });
      npmXScriptSpawned.stdout.on("data", (data) => {
        console.log(`stdout: ${data}`);
      });
      npmXScriptSpawned.stderr.on("data", (data) => {
        console.error(`stderr: ${data}`);
      });
      npmXScriptSpawned.on("close", (code) => {
        console.log(`npmXScriptSpawned exited with code ${code}`);
        kill(server.pid, () => {
          console.error(`DONE: SpringBoot Server was killed`);
        });
      });
    }
  });

  server.stderr.on("data", (data) => {
    console.error(`stderr: ${data}`);
  });

  server.on("close", (code) => {
    console.log(`server exited with code ${code}`);
  });
};

_checkBrokenLinks = () => {
  const shouldWorkUrlsButCuriouslyTheyDont = [
    "https://www.joomla.org",
    "https://www.drupal.org",
    "http://www.sharepoint.com",
  ];

  const excludeUrls = [
    "https://portal.pdfburst.com/wp-json/pods/invoices",
    "http://www.example.com/",
    "https://sharepointserver.com/reports",
    "http://example.com",
    "https://s3.amazonaws.com/documentburster/newest/documentburster.zip",
  ];

  var stream = through.obj(function (file, enc, callback) {
    if (file.isStream()) {
      throw new PluginError(
        "gulp-check-broken-links",
        "streams not implemented",
      );
    } else if (file.isBuffer()) {
      var contents = String(file.contents);

      var urls = getUrls(contents, {
        normalizeProtocol: false,
        stripWWW: false,
      });

      if (urls) {
        urls.forEach(function (externalUrl) {
          if (
            externalUrl.startsWith("http") &&
            excludeUrls.indexOf(externalUrl) == -1 &&
            shouldWorkUrlsButCuriouslyTheyDont.indexOf(externalUrl) == -1
          ) {
            console.log(
              "externalUrl : " + externalUrl + ", file : " + file.relative,
            );

            var res = syncHTTPRequest("GET", externalUrl);
            console.log(res.statusCode);
            if (res.statusCode >= 400)
              throw new PluginError(
                "gulp-check-broken-links",
                "Found broken link: " +
                  externalUrl +
                  " in file: " +
                  file.relative,
              );
          }
        });
      }
    }

    this.push(file);
    return callback();
  });

  return stream;
};

gulp.task("utils:generate-icons-if-needed", async () => {
  // Finds existing icon
  var iconExist = await jetpack.existsAsync(
    `${FRONTEND_PLAYGROUND_FOLDER_PATH}/icons/win/icon.ico`,
  );

  //if-needed
  if (iconExist === false) {
    return childProcess
      .spawn("cmd.exe", ["/c", "npm run npm run custom:icons-iconmaker"], {
        stdio: "inherit",
      })
      .on("close", () => {
        process.exit();
      });
  }

  return Promise.resolve(
    "utils:generate-icons-if-needed- Nothing to do, Icons stuff already present.",
  );
});
