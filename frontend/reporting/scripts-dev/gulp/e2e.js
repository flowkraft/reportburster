const jetpack = require("fs-jetpack");
const fse = require("fs-extra");

const slash = require("slash");
const path = require("path");

const replace = require("replace-in-file");

const childProcess = require("child_process");
const gulp = require("gulp");

const FRONTEND_PLAYGROUND_FOLDER_PATH = "./testground";

const e2eRuntimeDir = jetpack.cwd(`${FRONTEND_PLAYGROUND_FOLDER_PATH}/e2e`);
const e2eUpdateRuntimeDir = jetpack.cwd(
  `${FRONTEND_PLAYGROUND_FOLDER_PATH}/e2e-update`,
);

//const helpers = require("../../frontend/reporting/e2e/upgrade/updater.helpers");
//const PATHS = require("../../frontend/reporting/e2e/utils/paths");

const VERIFIED_DB_NOEXE_ASSEMBLY_PATH =
  "../../assembly/target/package/verified-db-noexe";

const VERIFIED_DB_ASSEMBLY_PATH = "../../assembly/target/package/verified-db";

const semver = require("semver");

gulp.task("e2e-package-javastuff-if-needed", async () => {
  // Finds existing javaStuffFiles files inside 'e2eRuntimeDir' directory WITHOUT subdirectories
  let javaStuffFilesInE2eDirExists = fse.pathExistsSync(
    e2eRuntimeDir.path() + "/reportburster.bat",
  );

  //if-needed
  if (!javaStuffFilesInE2eDirExists) {
    console.log(
      "e2e-package-javastuff-if-needed: DID NOT FIND javaStuffFilesInE2EDir",
    );

    let verifiedDbNoExeDirExists = fse.pathExistsSync(
      VERIFIED_DB_NOEXE_ASSEMBLY_PATH,
    );

    if (!verifiedDbNoExeDirExists) {
      console.log(
        "e2e-package-javastuff-if-needed: DID NOT FIND verifiedDbNoExeDir",
      );

      childProcess.spawnSync(
        "cmd.exe",
        [
          "/c",
          "mvn test -Dtest=AssemblerTest#prepareForE2E -X > pack-prepare-for-e2e.log",
        ],
        {
          stdio: "inherit",
          cwd: "../assembly-documentburster",
        },
      );
    }

    // empty e2eRuntimeDir
    fse.emptyDirSync(e2eRuntimeDir.path());

    //find the DocumentBurster-8.6 folder location
    let verifiedDbFolder = await jetpack.findAsync(
      VERIFIED_DB_NOEXE_ASSEMBLY_PATH,
      {
        matching: "ReportBurster*",
        files: false,
        directories: true,
        recursive: false,
      },
    );

    console.log(`verifiedDbFolder[0] = ${verifiedDbFolder[0]}`);

    // Copy javaStuffFiles built files inside 'e2eRuntimeDir'
    fse.copySync(verifiedDbFolder[0], e2eRuntimeDir.path());

    fse.writeFileSync(
      `${e2eRuntimeDir.path()}/logs/rbsj-exe.log`,
      "Starting ServerApplication v10.2.0 using Java 11.0.23 on",
    );

    console.log(
      "e2e-package-javastuff-if-needed: Java stuff was generated / copied and it is now ready in the 'playground/e2e' folder.",
    );
  } else
    console.log(
      "e2e-package-javastuff-if-needed: Nothing to do, Java stuff is already present in the 'playground/e2e' folder",
    );

  return Promise.resolve();
});

gulp.task("e2e-file-replacements", async () => {
  return jetpack.copyAsync(
    "src/environments/environment.e2e.ts",
    "src/environments/environment.ts",
    {
      overwrite: true,
    },
  );
});

gulp.task("e2e-generate-autoupdate-baseline", async () => {
  return _generateAutoupdateBaseline(
    "../assembly-documentburster/target/package/verified-db-noexe",
  );
});

gulp.task("e2e-generate-autoupdate-baseline-server", async () => {
  return _generateAutoupdateBaseline(
    "../assembly-documentburster/target/package/verified-db-server",
  );
});

gulp.task("e2e-generate-autoupdate-newer-version", async () => {
  return _generateAutoupdateNewerVersion(
    "e2e/_resources/upgrade/db-baseline-8.7.2.zip",
    "9.9.9",
  );
});

gulp.task("e2e-generate-autoupdate-newer-version-server", async () => {
  return _generateAutoupdateNewerVersion(
    "e2e/_resources/upgrade/db-server-baseline-8.7.2.zip",
    "9.9.9",
  );
});

gulp.task("e2e-copy-dbexe-to-letme-baseline", async () => {
  _copyDbExe2FolderPath("baseline");
});

gulp.task("e2e-copy-dbexe-to-e2e", async () => {
  _copyDbExe2FolderPath("e2e");
});

gulp.task("e2e-copy-updatejar-to-e2e", async () => {
  let ujf = await jetpack.findAsync(VERIFIED_DB_ASSEMBLY_PATH, {
    matching: "ReportBurster/lib/burst/update-*.jar",
  });

  let ujfp = ujf[0];

  if (ujfp) {
    ujfp = slash(path.resolve(ujfp));
    console.log(`${e2eRuntimeDir.path()}/lib/burst/${path.basename(ujfp)}`);
    jetpack.copy(
      ujfp,
      `${e2eRuntimeDir.path()}/lib/burst/${path.basename(ujfp)}`,
      {
        overwrite: true,
      },
    );
  }
});

gulp.task("e2e-prepare-updatenow-for-manual-testing", async () => {
  const settingsXmlFilePath = `${e2eRuntimeDir.path()}/config/burst/settings.xml`;

  const settingsFileContent = await jetpack.readAsync(settingsXmlFilePath);

  const latestVersion = settingsFileContent.substring(
    settingsFileContent.lastIndexOf("<version>") + 9,
    settingsFileContent.lastIndexOf("</version>"),
  );

  const fromLatestVersion = `<version>${latestVersion}</version>`;

  let options = {
    files: settingsXmlFilePath,
    from: fromLatestVersion,
    to: "<version>8.1</version>",
  };

  await replace.replaceInFile(options);

  //Step6 - in the 8.7.2 tmp generate a sample license file with content to test that
  //the license is correctly copied when the configuration to copy is enabled.
  await jetpack.copyAsync(
    `e2e/_resources/license/license-active.xml`,
    `${e2eRuntimeDir.path()}/config/burst/internal/license.xml`,
    { overwrite: true },
  );

  options = {
    files: `${e2eRuntimeDir.path()}/config/burst/internal/license.xml`,
    from: "<latestversion>8.1</latestversion>",
    to: `<latestversion>${latestVersion}</latestversion>`,
  };

  await replace.replaceInFile(options);

  //Step3 - copy all the "config" XML files to  8.7.2 baseline dir
  await jetpack.copyAsync(
    `e2e/_resources/upgrade/files-to-migrate/config`,
    `${e2eRuntimeDir.path()}/config/burst`,
    { matching: ["*.xml", "!settings.xml"], overwrite: true },
  );

  await jetpack.copyAsync(
    `e2e/_resources/upgrade/files-to-migrate/config-cuna`,
    `${e2eRuntimeDir.path()}/config/burst`,
    { matching: ["*.xml", "!settings.xml"], overwrite: true },
  );

  //Step4 - copy all the "scripts" groovy files to 8.7.2 baseline dir with a version stamp
  let dbVersions = [
    "5.1",
    "5.8.1",
    "6.1",
    "6.2",
    "6.4.1",
    "7.1",
    "7.5",
    "8.1",
    "8.7.1",
    "8.7.2",
  ];

  for (let version of dbVersions) {
    let scriptFilePaths = await jetpack.findAsync(
      `e2e/_resources/upgrade/files-to-migrate/scripts/samples/${version}`,
      { matching: "*.groovy" },
    );

    for (let scriptFilePath of scriptFilePaths) {
      let scriptFileName = path.basename(scriptFilePath);

      await jetpack.copyAsync(
        scriptFilePath,
        `${e2eRuntimeDir.path()}/scripts/burst/${version}-${scriptFileName}`,
      );
    }
  }

  //Step5 - in the 8.7.2 have an custom "html templates" sample folder with content to test that
  //the folder is correctly copied when the configuration to copy is enabled.
  await jetpack.copyAsync(
    `${e2eRuntimeDir.path()}/templates/html-basic-example`,
    `${e2eRuntimeDir.path()}/templates/html-custom-example`,
  );

  //Step7 - same as above but for the Output files
  await jetpack.copyAsync(
    `e2e/_resources/upgrade/files-to-migrate/output`,
    `${e2eRuntimeDir.path()}/output`,
    { overwrite: true },
  );

  //Step8 - same as above but for the Log files
  await jetpack.copyAsync(
    `e2e/_resources/upgrade/files-to-migrate/logs`,
    `${e2eRuntimeDir.path()}/logs`,
    { overwrite: true },
  );

  //Step9 - same as above but for the Quarantine files
  await jetpack.copyAsync(
    `e2e/_resources/upgrade/files-to-migrate/quarantine`,
    `${e2eRuntimeDir.path()}/quarantine`,
    { overwrite: true },
  );

  //Step10 - same as above but for the Backup files
  await jetpack.copyAsync(
    `e2e/_resources/upgrade/files-to-migrate/backup`,
    `${e2eRuntimeDir.path()}/backup`,
    { overwrite: true },
  );

  _copyDbExe2FolderPath("e2e");
});

gulp.task("e2e-generate-keepachangelog-com", async () => {
  const { Changelog, Release } = require("keep-a-changelog");

  const originalChangelogFilePath = `${e2eRuntimeDir.path()}/changelog.txt`;
  const keepAChangelogFilePath = `${e2eRuntimeDir.path()}/CHANGELOG-generated-from-legacy.md`;

  console.log(originalChangelogFilePath);

  const originalChangelogContent = await jetpack.readAsync(
    originalChangelogFilePath,
  );

  const allRawLines = originalChangelogContent.split(/\r\n|\n/);

  function _zeroFill(number, width) {
    width -= number.toString().length;
    if (width > 0) {
      return new Array(width + (/\./.test(number) ? 2 : 1)).join("0") + number;
    }
    return number + ""; // always return a string
  }

  function _isStartChangeLine(line) {
    let startChangeExpression = "- ";

    if (line.startsWith(startChangeExpression)) return startChangeExpression;

    const firstChar = line.charAt(0);
    if (isNaN(firstChar)) return false;

    for (let i = 0; i < 99; i++) {
      startChangeExpression = i + ". ";
      if (line.startsWith(startChangeExpression)) {
        return startChangeExpression;
      } else {
        startChangeExpression = _zeroFill(i, 2) + ". ";
        if (line.startsWith(startChangeExpression)) {
          return startChangeExpression;
        }
      }
    }

    return false;
  }

  function _getChangePayload(allLines, i, startChangeLine) {
    let payload = allLines[i].replace(startChangeLine, "");
    let _isNextChangeLine, _isEndReleaseLine, _isEndOfFile;
    let _index = i + 1;

    do {
      const _line = allLines[_index];

      console.log(_line);
      _isNextChangeLine = _isStartChangeLine(_line);

      _isEndReleaseLine = _line.includes(
        "==============================================",
      );
      _isEndOfFile = _line.includes("Support for FTP Sender.");

      if (!_isNextChangeLine && !_isEndReleaseLine)
        payload = `${payload}\n${_line}`;

      _index++;
    } while (!_isNextChangeLine && !_isEndReleaseLine && !_isEndOfFile);

    return payload;
  }

  let allLines = [];

  // Reading line by line
  allRawLines.forEach((line) => {
    line = line.trim();
    if (line) allLines.push(line);
  });

  // Reading line by line
  let i = 0;

  let currentRelease;
  const allReleases = [];

  while (i < allLines.length) {
    const line = allLines[i];

    const isStartReleaseLine =
      line.startsWith("ReportBurster ") && line.endsWith(")");

    if (isStartReleaseLine) {
      let releaseInfo = line.split(" ");

      let releaseVersion = releaseInfo[1];
      if (!semver.valid(releaseVersion))
        releaseVersion = semver.coerce(releaseVersion);

      // get it as (20-01-2008)
      let releaseDate = releaseInfo[2];

      // get it as 20-01-2008
      releaseDate = releaseDate.substring(1, releaseDate.length - 1);

      currentRelease = new Release(releaseVersion, releaseDate);
    }

    const isEndReleaseLine = line.includes(
      "==============================================",
    );
    const isEndOfFile = line.includes("Support for FTP Sender.");

    const startChangeLine = _isStartChangeLine(line);
    if (startChangeLine && !isEndOfFile) {
      const change = _getChangePayload(allLines, i, startChangeLine);
      currentRelease.added(change);
    } else if (isEndOfFile) currentRelease.added("Support for FTP Sender.");

    if (isEndReleaseLine || isEndOfFile) allReleases.push(currentRelease);

    i++;
  }

  const changelog = new Changelog("ReportBurster");
  allReleases.forEach((release) => changelog.addRelease(release));

  console.log(changelog.toString());
  jetpack.write(keepAChangelogFilePath, changelog.toString());
});

gulp.task("e2e-generate-letmeupdate-baseline", async () => {
  _generateLetmeUpdateBaseline();
});

async function _copyDbExe2FolderPath(where) {
  let verifiedDbDirExists = await jetpack.existsAsync(
    VERIFIED_DB_ASSEMBLY_PATH,
  );

  if (!verifiedDbDirExists)
    console.log(
      "e2e-copy-dbexe-to-letme-baseline: DID NOT FIND verifiedDbDirExists",
    );

  //find the DocumentBurster-8.6 folder location
  let verifiedDbFolder = await jetpack.findAsync(VERIFIED_DB_ASSEMBLY_PATH, {
    matching: "ReportBurster*",
    files: false,
    directories: true,
    recursive: false,
  });

  console.log(`${verifiedDbFolder[0]}/ReportBurster.exe`);

  let isServerVersion = await jetpack.existsAsync(
    `${FRONTEND_PLAYGROUND_FOLDER_PATH}/upgrade/baseline/DocumentBurster/server`,
  );

  let destinationExePath;

  if (where != "e2e") {
    destinationExePath = `${FRONTEND_PLAYGROUND_FOLDER_PATH}/upgrade/baseline/DocumentBurster/ReportBurster.exe`;
    if (isServerVersion == "dir")
      destinationExePath = `${FRONTEND_PLAYGROUND_FOLDER_PATH}/upgrade/baseline/DocumentBurster/server/ReportBurster.exe`;
  } else {
    destinationExePath = `${FRONTEND_PLAYGROUND_FOLDER_PATH}/e2e/ReportBurster.exe`;
    if (isServerVersion == "dir")
      destinationExePath = `${FRONTEND_PLAYGROUND_FOLDER_PATH}/e2e/server/ReportBurster.exe`;
  }

  console.log(destinationExePath);

  jetpack.copy(`${verifiedDbFolder[0]}/ReportBurster.exe`, destinationExePath, {
    overwrite: true,
  });
}

async function _generateAutoupdateNewerVersion(zipFilePath, newVersion) {
  let isServer = false;

  if (zipFilePath.includes("-server-")) isServer = true;

  let e2eUpdateRuntimePath = e2eUpdateRuntimeDir.path();

  await jetpack.dirAsync(e2eUpdateRuntimePath, { empty: true });

  let DOCUMENTBURSTER_NEWER_VERSION = newVersion.split(".").join("");

  const tmpFolderPath = `${e2eUpdateRuntimePath}\\tmp`;
  const decompress = require("decompress");

  await decompress(zipFilePath, tmpFolderPath);

  //const DB_TMP_PATH = `${tmpFolderPath}/DocumentBurster`;

  let verifiedDbFolder = path.resolve(
    jetpack.find(tmpFolderPath, {
      matching: "ReportBurster*",
      files: false,
      directories: true,
      recursive: false,
    })[0],
  );

  let allDocumentBursterFolders = await jetpack.findAsync(tmpFolderPath, {
    matching: "!*ReportBurster*",
    files: false,
    directories: true,
  });

  const MAX_NUMBER_OF_FILES_IN_EACH_FOLDER = 5;

  let folderCount = 0;
  let addedFolderPaths = [];

  if (!isServer)
    addedFolderPaths = [
      `${tmpFolderPath}\\DocumentBurster\\extra-db1`,
      `${tmpFolderPath}\\DocumentBurster\\extra-db2`,
      `${tmpFolderPath}\\DocumentBurster\\scripts\\extra-db3`,
    ];
  else
    addedFolderPaths = [
      `${tmpFolderPath}\\DocumentBurster\\server\\extra-db1`,
      `${tmpFolderPath}\\DocumentBurster\\server\\extra-db2`,
      `${tmpFolderPath}\\DocumentBurster\\server\\scripts\\extra-db3`,
      `${tmpFolderPath}\\DocumentBurster\\web-console\\extra-db4`,
      `${tmpFolderPath}\\DocumentBurster\\web-console\\console\\extra-db5`,
      `${tmpFolderPath}\\DocumentBurster\\web-console\\console\\webapps\\extra-db6`,
    ];

  allDocumentBursterFolders =
    allDocumentBursterFolders.concat(addedFolderPaths);

  if (!isServer)
    allDocumentBursterFolders = allDocumentBursterFolders.filter(
      (e) => !e.includes("ReportBurster\\tools"),
    );
  else
    allDocumentBursterFolders = allDocumentBursterFolders.filter(
      (e) => !e.includes("ReportBurster\\server\\tools"),
    );

  for (let folderEntry of allDocumentBursterFolders) {
    let fullFolderPath = path.resolve(folderEntry);
    let folderName = fullFolderPath.replace(`${verifiedDbFolder}\\`, "");

    console.log(folderName); // 1, "string", false
    console.log(path.resolve(folderEntry)); // 1, "string", false

    let numberOfFiles =
      Math.floor(Math.random() * MAX_NUMBER_OF_FILES_IN_EACH_FOLDER) + 1;

    for (i = 0; i < numberOfFiles; i++) {
      let fileIndex = i + 1;
      let fileName = `file-${fileIndex}.txt`;
      let fileContent = `file-${DOCUMENTBURSTER_NEWER_VERSION}-${fileIndex}.txt`;

      await jetpack.writeAsync(
        `${e2eUpdateRuntimePath}/DocumentBurster/${folderName}/${fileName}`,
        fileContent,
      );
    }

    console.log(numberOfFiles);

    folderCount++;
  }

  //generate the files for the top folder also
  let numberOfFiles =
    Math.floor(Math.random() * MAX_NUMBER_OF_FILES_IN_EACH_FOLDER) + 1;
  for (i = 0; i < numberOfFiles; i++) {
    let fileIndex = i + 1;
    let fileName = `file-${fileIndex}.txt`;
    let fileContent = `file-${DOCUMENTBURSTER_NEWER_VERSION}-${fileIndex}.txt`;

    await jetpack.writeAsync(
      `${e2eUpdateRuntimePath}/DocumentBurster/${fileName}`,
      fileContent,
    );
  }

  console.log(`${tmpFolderPath}\\DocumentBurster\\extra-db1`);

  return Promise.resolve(folderCount);
}

async function _generateAutoupdateBaseline(verifiedFolderPath) {
  let e2eUpdateRuntimePath = e2eUpdateRuntimeDir.path();

  await jetpack.dirAsync(e2eUpdateRuntimePath, { empty: true });
  await jetpack.dirAsync(`${e2eUpdateRuntimePath}/DocumentBurster`, {
    empty: true,
  });

  //the baseline should always be generated starting from 8.7.2, the first version when auto-update was introduced
  //the baseline can be generated once and then can be source-controlled / storred on git
  let DOCUMENTBURSTER_BASELINE_VERSION = "8.7.2".split(".").join("");

  //should always point to an "extracted zip" of version 8.7.2 (see above why)
  const VERIFIED_DB872_NOEXE_ASSEMBLY_PATH = verifiedFolderPath;

  let verifiedDbFolder = path.resolve(
    jetpack.find(VERIFIED_DB872_NOEXE_ASSEMBLY_PATH, {
      matching: "ReportBurster*",
      files: false,
      directories: true,
      recursive: false,
    })[0],
  );

  console.log(verifiedDbFolder);

  const allDocumentBursterFolders = await jetpack.findAsync(
    VERIFIED_DB872_NOEXE_ASSEMBLY_PATH,
    { matching: "!*ReportBurster*", files: false, directories: true },
  );

  const MAX_NUMBER_OF_FILES_IN_EACH_FOLDER = 5;

  let folderCount = 0;

  for (let folderEntry of allDocumentBursterFolders) {
    let fullFolderPath = path.resolve(folderEntry);
    let folderName = fullFolderPath.replace(`${verifiedDbFolder}\\`, "");

    console.log(folderName); // 1, "string", false
    console.log(path.resolve(folderEntry)); // 1, "string", false

    let numberOfFiles =
      Math.floor(Math.random() * MAX_NUMBER_OF_FILES_IN_EACH_FOLDER) + 1;

    for (i = 0; i < numberOfFiles; i++) {
      let fileIndex = i + 1;
      let fileName = `file-${fileIndex}.txt`;
      let fileContent = `file-${DOCUMENTBURSTER_BASELINE_VERSION}-${fileIndex}.txt`;

      await jetpack.writeAsync(
        `${e2eUpdateRuntimePath}/DocumentBurster/${folderName}/${fileName}`,
        fileContent,
      );
    }

    console.log(numberOfFiles);

    folderCount++;
  }

  //generate the files for the top folder also
  let numberOfFiles =
    Math.floor(Math.random() * MAX_NUMBER_OF_FILES_IN_EACH_FOLDER) + 1;
  for (i = 0; i < numberOfFiles; i++) {
    let fileIndex = i + 1;
    let fileName = `file-${fileIndex}.txt`;
    let fileContent = `file-${DOCUMENTBURSTER_BASELINE_VERSION}-${fileIndex}.txt`;

    await jetpack.writeAsync(
      `${e2eUpdateRuntimePath}/DocumentBurster/${fileName}`,
      fileContent,
    );
  }

  return Promise.resolve(folderCount);
}

/*
async function _generateLetmeUpdateBaseline() {
  //the baseline should always be generated starting from 8.7.2, the first version when auto-update was introduced
  //the baseline can be generated once and then can be source-controlled / storred on git
  let DOCUMENTBURSTER_BASELINE_VERSION = "8.7.2".split(".").join("");

  const UPGRADE_DIR = "testground/upgrade";

  await jetpack.dirAsync(UPGRADE_DIR, { empty: true });

  const baselineVersionFilePath = `${PATHS.E2E_RESOURCES_PATH}/upgrade/_baseline/db-baseline-8.7.2.zip`;
  console.log(`baselineVersionFilePath = ${baselineVersionFilePath}`);
  await helpers._extractBaseLineAndCopyCustomConfigAndScriptFiles(
    UPGRADE_DIR,
    baselineVersionFilePath,
  );
}
*/
