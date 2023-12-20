import * as jetpack from 'fs-jetpack';
import * as path from 'path';

import { spawnSync } from 'child_process';

import * as _ from 'lodash';

import * as PATHS from './paths';
import { Constants } from './constants';

import { ElectronApplication, _electron as electron } from '@playwright/test';

const findProcess = require('find-process');
const kill = require('tree-kill');
const slash = require('slash');

export class Helpers {
  static killHangingJavaProcesses = async () => {
    //kill "hanging" java processes
    let javaProcesses = await findProcess('name', 'java');

    if (!javaProcesses || javaProcesses.length == 0)
      javaProcesses = await findProcess('name', 'openjdk');

    if (javaProcesses && javaProcesses.length > 0) {
      //console.log(`Killing ${javaProcesses.length} Java Processes`);

      for (const javaProc of javaProcesses) {
        //console.log(`KILLED ${javaProc.name} with proc.pid ${javaProc.pid}`);
        await kill(javaProc.pid);
      }
    }
  };

  static deActivateLicenseKey = async () => {
    // de-activate the test license so that all tests will start from a 'demo' license
    await jetpack.copyAsync(
      PATHS.E2E_RESOURCES_PATH + '/license/license-active.xml',
      process.env.PORTABLE_EXECUTABLE_DIR +
        PATHS.CONFIG_PATH +
        '/_internal/license.xml',
      { overwrite: true }
    );

    spawnSync('documentburster.bat', ['-dl', '/c'], {
      cwd: path.join(process.env.PORTABLE_EXECUTABLE_DIR),
      shell: true,
    });
  };

  static electronAppLaunch = async (
    relativePath: string
  ): Promise<ElectronApplication> => {
    const electronApp = await electron.launch({
      args: [
        path.join(__dirname, `${relativePath}/app/main.js`),
        path.join(__dirname, `${relativePath}/app/package.json`),
      ],
      env: {
        PORTABLE_EXECUTABLE_DIR: process.env.PORTABLE_EXECUTABLE_DIR,
        RUNNING_IN_E2E: 'true',
        SHOULD_SEND_STATS: 'false',
      },
    });
    electronApp.context().tracing.start({
      screenshots: true,
      snapshots: true,
    });
    const firstPage = await electronApp.firstWindow();
    await firstPage.waitForLoadState('domcontentloaded');

    return electronApp;
  };

  static electronAppClose = async (electronApp: ElectronApplication) => {
    await electronApp.context().tracing.stop({ path: 'e2e/tracing/trace.zip' });
    await electronApp.close();
  };

  static restoreDocumentBursterCleanState = async (
    shouldDeactivateLicense: boolean
  ) => {
    // stop Test Email Server
    spawnSync('shutTestEmailServer.bat', ['/c'], {
      cwd: path.resolve(
        process.env.PORTABLE_EXECUTABLE_DIR + '/tools/test-email-server'
      ),
      shell: true,
    });

    /*
    console.log(
      `PATHS.E2E_ASSEMBLY_FOLDER_PATH: ${path.resolve(
        PATHS.E2E_ASSEMBLY_FOLDER_PATH
      )}`
    );
    */

    // empty and refresh config
    const verifiedDbFolder = await jetpack.findAsync(
      path.resolve(PATHS.E2E_ASSEMBLY_FOLDER_PATH),
      {
        matching: 'DocumentBurster*',
        files: false,
        directories: true,
        recursive: false,
      }
    );

    await jetpack.removeAsync(
      process.env.PORTABLE_EXECUTABLE_DIR + PATHS.CONFIG_PATH
    );
    await jetpack.copyAsync(
      verifiedDbFolder[0] + '/config',
      process.env.PORTABLE_EXECUTABLE_DIR + PATHS.CONFIG_PATH
    );

    //copy back the default documentburster.bat file
    await jetpack.copyAsync(
      PATHS.E2E_RESOURCES_PATH +
        '/java-versions/documentburster-java-default.bat',
      process.env.PORTABLE_EXECUTABLE_DIR + '/documentburster.bat',
      { overwrite: true }
    );

    if (shouldDeactivateLicense) {
      await this.deActivateLicenseKey();
    }

    //await this.killHangingJavaProcesses();

    let allCleared = false;
    do {
      try {
        // empty output
        await jetpack.dirAsync(
          process.env.PORTABLE_EXECUTABLE_DIR + '/output',
          {
            empty: true,
          }
        );

        // empty backup
        await jetpack.dirAsync(
          process.env.PORTABLE_EXECUTABLE_DIR + '/backup',
          {
            empty: true,
          }
        );

        // empty quarantine
        await jetpack.dirAsync(
          process.env.PORTABLE_EXECUTABLE_DIR + PATHS.QUARANTINE_PATH,
          { empty: true }
        );

        // empty temp
        await jetpack.dirAsync(
          process.env.PORTABLE_EXECUTABLE_DIR + PATHS.TEMP_PATH,
          {
            empty: true,
          }
        );

        // empty logs
        await jetpack.dirAsync(
          process.env.PORTABLE_EXECUTABLE_DIR + PATHS.LOGS_PATH,
          {
            empty: true,
          }
        );

        allCleared = true;
      } catch (err) {
        allCleared = false;
        await new Promise((resolve) =>
          setTimeout(resolve, Constants.DELAY_ONE_SECOND)
        );
      }
    } while (!allCleared);
  };

  static arrayEquals = (a: any[], b: any[]) => {
    return (
      Array.isArray(a) &&
      Array.isArray(b) &&
      a.length === b.length &&
      a.every((val, index) => val === b[index])
    );
  };

  static arrayRemoveDuplicates = (a: any[], condition) => {
    return a.filter((e, i) => a.findIndex((e2) => condition(e, e2)) === i);
  };

  static delay = (ms: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  };

  static generateRandomLogFiles = async () => {
    const howManyFiles = Math.random() * (3 - 1) + 1;

    const randomLogFiles = _.sampleSize(
      ['errors.log', 'info.log', 'warnings.log'],
      howManyFiles
    );

    randomLogFiles.forEach(async (logFile) => {
      if (logFile.includes('errors')) {
        await jetpack.copyAsync(
          PATHS.E2E_RESOURCES_PATH + '/logs/errors-with-data.log',
          path.resolve(
            slash(
              process.env.PORTABLE_EXECUTABLE_DIR +
                PATHS.LOGS_PATH +
                '/errors.log'
            )
          )
        );
      }
      if (logFile.includes('info')) {
        await jetpack.copyAsync(
          PATHS.E2E_RESOURCES_PATH + '/logs/info-with-data.log',
          path.resolve(
            slash(
              process.env.PORTABLE_EXECUTABLE_DIR +
                PATHS.LOGS_PATH +
                '/info.log'
            )
          )
        );
      }
      if (logFile.includes('warnings')) {
        await jetpack.copyAsync(
          PATHS.E2E_RESOURCES_PATH + '/logs/warnings-with-data.log',
          path.resolve(
            slash(
              process.env.PORTABLE_EXECUTABLE_DIR +
                PATHS.LOGS_PATH +
                '/warnings.log'
            )
          )
        );
      }
    });

    return randomLogFiles;
  };
}
