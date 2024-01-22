import { Injectable } from '@angular/core';

// If you import a module but never use any of the imported values other than as TypeScript types,
// the resulting javascript file will look as if you never imported the module at all.

import { ipcRenderer, webFrame, app, dialog } from 'electron';
import * as childProcess from 'child_process';
import { promises as fs } from 'fs';
import * as util from 'util';

// start DB's nodejs required depedencies
import * as tail from 'tail';
import * as uniqueFilename from 'unique-filename';
import * as path from 'path';
import * as os from 'os';

import * as process from 'process';
import * as ElectronLog from 'electron-log';
import * as StackUtils from 'stack-utils';
import Utilities from '../../../helpers/utilities';
//import { spawn, exec } from 'child_process';

import * as CustomElectronTitlebar from 'custom-electron-titlebar/dist';
import { FSJetpack } from 'fs-jetpack/types';

//const execPromisified = util.promisify(childProcess.exec as Function);

// end DB's nodejs required depedencies

@Injectable({
  providedIn: 'root',
})
export class ElectronService {
  ipcRenderer: typeof ipcRenderer;
  webFrame: typeof webFrame;

  childProcess: typeof childProcess;
  fs: typeof fs;

  // start DB's nodejs required depedencies
  app: typeof app;
  dialog: typeof dialog;

  static tail: typeof tail;
  jetpack: FSJetpack;
  path: typeof path;
  uniqueFilename: typeof uniqueFilename;
  log: typeof ElectronLog;
  stackUtils: InstanceType<typeof StackUtils>;
  util: typeof util;
  exec: typeof childProcess.exec;
  checkLockFilePromisified: Function;
  spawn: typeof childProcess.spawn;
  process: typeof process;
  PORTABLE_EXECUTABLE_DIR: string;
  SHOULD_SEND_STATS: boolean;
  RUNNING_IN_E2E: boolean;
  ENABLE_DEVELOPMENT_FEATURES: boolean = false;

  cet: typeof CustomElectronTitlebar;
  os: typeof os;
  // end DB's nodejs required depedencies

  constructor() {
    // Conditional imports
    if (this.isElectron) {
      this.ipcRenderer = window.require('electron').ipcRenderer;
      this.webFrame = window.require('electron').webFrame;

      this.fs = window.require('fs/promises');

      this.childProcess = window.require('child_process');
      this.childProcess.exec('node -v', (error, stdout, stderr) => {
        if (error) {
          console.error(`error: ${error.message}`);
          return;
        }
        if (stderr) {
          console.error(`stderr: ${stderr}`);
          return;
        }
        //console.log(`node -v stdout:\n${stdout}`);
      });

      // start DB's nodejs required depedencies
      this.os = window.require('os');

      this.app = window.require('electron').app;

      this.dialog = window.require('@electron/remote').dialog;

      this.cet = window.require('custom-electron-titlebar');
      ElectronService.tail = window.require('tail');

      this.path = window.require('path');
      this.process = window.require('process');
      this.SHOULD_SEND_STATS = new Boolean(
        this.process.env.SHOULD_SEND_STATS
      ).valueOf();

      this.RUNNING_IN_E2E = new Boolean(
        this.process.env.RUNNING_IN_E2E
      ).valueOf();

      if (this.process.env.ENABLE_DEVELOPMENT_FEATURES != null) {
        this.ENABLE_DEVELOPMENT_FEATURES = new Boolean(
          this.process.env.ENABLE_DEVELOPMENT_FEATURES
        ).valueOf();
      }

      this.PORTABLE_EXECUTABLE_DIR = this.path.resolve(
        Utilities.slash(this.process.env.PORTABLE_EXECUTABLE_DIR)
      );

      // this.PORTABLE_EXECUTABLE_DIR = Utilities.slash(
      //   this.process.env.PORTABLE_EXECUTABLE_DIR
      // );

      this.jetpack = window.require('fs-jetpack');

      /*
      console.log(
        `electronService - this.PORTABLE_EXECUTABLE_DIR: ${this.PORTABLE_EXECUTABLE_DIR}`
      );
      */

      this.uniqueFilename = window.require('unique-filename');
      this.log = window.require('electron-log');
      // eslint-disable-next-line @typescript-eslint/naming-convention
      this.util = window.require('util');

      const StackUtils = window.require('stack-utils');
      this.stackUtils = new StackUtils({
        cwd: window.process.cwd(),
        internals: StackUtils.nodeInternals(),
      });

      this.exec = this.childProcess.exec;
      //this.checkLockFilePromisified = Utilities.promisify(lockfile.check);
      this.spawn = this.childProcess.spawn;
      // end DB's nodejs-required depedencies

      // Notes :
      // * A NodeJS's dependency imported with 'require' MUST BE present in `dependencies` of both `app/package.json`
      // and `package.json (root folder)` in order to make it work here in Electron's Renderer process (src folder)
      // because it will loaded at runtime by Electron.
      // * A NodeJS's dependency imported with TS module import (ex: import { Dropbox } from 'dropbox') CAN only be present
      // in `dependencies` of `package.json (root folder)` because it is loaded during build phase and does not need to be
      // in the final bundle. Reminder : only if not used in Electron's Main process (app folder)

      // If you want to use a NodeJS 3rd party deps in Renderer process,
      // ipcRenderer.invoke can serve many common use cases.
      // https://www.electronjs.org/docs/latest/api/ipc-renderer#ipcrendererinvokechannel-args
    }
  }

  get isElectron(): boolean {
    return !!(window && window.process && window.process.type);
  }

  clock(start?: [number, number]): [number, number] {
    if (!start) return window.process.hrtime();
    var end = window.process.hrtime(start);
    return [Math.round(end[0] * 1000 + end[1] / 1000000), 0];
  }
}
