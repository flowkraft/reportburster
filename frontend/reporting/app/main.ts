import { app, BrowserWindow, shell, screen } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

import {
  setupTitlebar,
  attachTitlebarToWindow,
} from 'custom-electron-titlebar/main';
import Utilities from '../src/app/helpers/utilities';

// setup the titlebar main process
setupTitlebar();

//TODO - Pay CASS
//TODO - Do FlowKraft bookkeeping

//TODO - Generate HTML output reports

//TODO - Get SAMPLE 0 Working

//TODO - Fix https://github.com/sourcekraft/kraft-src-documentburster/issues/3
//TODO - Fix https://github.com/sourcekraft/kraft-src-documentburster/issues/2
//TODO - Fix https://github.com/sourcekraft/kraft-src-documentburster/issues/1

//TODO - LATER0 - e2e tests for Samples Working
//TODO - e2e tests for Request New Feature
//TODO - LATER0 - e2e tests for Extra Packages
//TODO - LATER0 - Implement 'Install Extra Packages' + provide status bar feedback while packages are installed
//TODO - LATER0 - Reuse the above 'Install Extra Packages' framework to provide status bar feedback while installing Java and/or Choco

let win: BrowserWindow = null;
const args = process.argv.slice(1),
  serve = args.some((val) => val === '--serve');

function createWindow(): BrowserWindow {
  /*
  const preloadPath = APP_CONFIG.production
    ? path.join(process.resourcesPath, '/app/preload.js') // <---- add your path
    : path.join(__dirname, '../preload.ts'); // <---- add your path
  */

  // Create the browser window.
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    useContentSize: true,
    center: true,
    resizable: false,
    titleBarStyle: process.env.PORTABLE_EXECUTABLE_DIR.includes('testground')
      ? 'default'
      : 'hidden',
    webPreferences: {
      ['enableRemoteModule' as any]: true,
      nodeIntegration: true,
      webSecurity: false,
      allowRunningInsecureContent: serve,
      contextIsolation: false,
      //preload: path.join(__dirname, '../app/preload.ts'),
    },
    //icon: path.join(__dirname, 'src/assets/icons/icon.ico'),
  });

  /*
  process.chdir(
    path.resolve(Utilities.slash(process.env.PORTABLE_EXECUTABLE_DIR))
  );
  */

  if (serve) {
    const debug = require('electron-debug');
    debug();

    require('electron-reloader')(module);
    win.loadURL('http://localhost:4200');
  } else {
    // Path when running electron executable
    let pathIndex = './index.html';

    if (fs.existsSync(path.join(__dirname, '../dist/index.html'))) {
      // Path when running electron in local folder
      pathIndex = '../dist/index.html';
    }

    const url = new URL(path.join('file:', __dirname, pathIndex));
    win.loadURL(url.href);

    // attach fullscreen(f11 and not 'maximized') && focus listeners
    attachTitlebarToWindow(win);
  }

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store window
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    // open url in a browser and prevent default
    shell.openExternal(url);
    return { action: 'deny' };
  });

  const electronRemote = require('@electron/remote/main');

  electronRemote.initialize();
  electronRemote.enable(win.webContents);

  return win;
}

try {
  app.commandLine.appendSwitch(
    'disable-features',
    'BlockInsecurePrivateNetworkRequests'
  );

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  // Added 400 ms to fix the black background issue while using transparent window. More detais at https://github.com/electron/electron/issues/15947
  app.on('ready', () => setTimeout(createWindow, 400));

  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
      createWindow();
    }
  });
} catch (e) {
  // Catch Error
  // throw e;
}
