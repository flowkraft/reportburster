import { app, BrowserWindow, shell, ipcMain } from 'electron';
import log from 'electron-log';
import * as path from 'path';
import * as fs from 'fs';

import { ChildProcessWithoutNullStreams, exec, spawn } from 'child_process';
import { promisify } from 'util';

import * as jetpack from 'fs-jetpack';

import {
  setupTitlebar,
  attachTitlebarToWindow,
} from 'custom-electron-titlebar/main';

// setup the titlebar main process
setupTitlebar();

let win: BrowserWindow = null;
const args = process.argv.slice(1),
  serve = args.some((val) => val === '--serve');

process.env.PORTABLE_EXECUTABLE_DIR = path
  .normalize(path.resolve(process.env.PORTABLE_EXECUTABLE_DIR))
  .replace(/\\/g, '/');

const electronLogFilePath = `${process.env.PORTABLE_EXECUTABLE_DIR}/logs/electron.log`;
fs.writeFileSync(electronLogFilePath, '');

log.transports.file.resolvePath = () => {
  return electronLogFilePath;
};

log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}] [{level}] - {text}';

log.info(
  `process.env.PORTABLE_EXECUTABLE_DIR: ${process.env.PORTABLE_EXECUTABLE_DIR}`,
);

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
    'BlockInsecurePrivateNetworkRequests',
  );

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  // Added 400 ms to fix the black background issue while using transparent window. More detais at https://github.com/electron/electron/issues/15947
  let serverProcess: ChildProcessWithoutNullStreams;

  app.on('ready', () => {
    //if "production"
    if (app.isPackaged) {
      log.info(
        `executing ${process.env.PORTABLE_EXECUTABLE_DIR}/tools/rbsj/startRbsjServer.bat`,
      );

      serverProcess = spawn('startRbsjServer.bat', {
        cwd: `${process.env.PORTABLE_EXECUTABLE_DIR}/tools/rbsj`,
      });

      serverProcess.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
        const dataStr = data.toString();
        if (dataStr.includes('Started ServerApplication in')) {
          log.info(dataStr);

          createWindow();
        }
      });

      serverProcess.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
      });

      serverProcess.on('close', (code) => {
        log.info(`Server process exited with code ${code}`);
      });
    } else {
      //if non-"production"
      setTimeout(() => {
        createWindow();

        console.log(
          `electron.main.ts.process.env.PORTABLE_EXECUTABLE_DIR = ${process.env.PORTABLE_EXECUTABLE_DIR}`,
        );
      }, 400);
    }
  });

  app.on('before-quit', () => {
    //stop the java server
    if (app.isPackaged) {
      if (serverProcess) {
        log.info(
          `executing ${process.env.PORTABLE_EXECUTABLE_DIR}/tools/rbsj/shutRbsjServer.bat`,
        );

        spawn('shutRbsjServer.bat', {
          cwd: `${process.env.PORTABLE_EXECUTABLE_DIR}/tools/rbsj`,
        });
      }
    }
  });

  app.on('will-quit', () => {
    if (app.isPackaged) {
      if (serverProcess && !serverProcess.killed) {
        //stop the java server
        spawn('shutRbsjServer.bat', {
          cwd: `${process.env.PORTABLE_EXECUTABLE_DIR}/tools/rbsj`,
        });
      }
    }
  });

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

ipcMain.handle('execNativeCommand', async (event, command) => {
  const execPromise = promisify(exec);
  return execPromise(command);
});

ipcMain.handle('getBackendUrl', async (event) => {
  //if non-"production"
  if (!app.isPackaged) return 'http://localhost:9090';

  const filePath = `${process.env.PORTABLE_EXECUTABLE_DIR}/config/_internal/settings.xml`;
  const fileContent = await fs.promises.readFile(filePath, 'utf-8');

  const match = fileContent.match(/<backendurl>(.*?)<\/backendurl>/);
  const backendUrl = match ? match[1] : null;

  //log.info(`getBackendUrl settings.xml: ${fileContent}`);

  log.info(`getBackendUrl backendUrl: ${backendUrl}`);

  return backendUrl;
});

ipcMain.handle(
  'jetpack.dirAsync',
  async (event, pathFolder, criteria = { empty: false, mode: undefined }) => {
    const mkdir = promisify(fs.mkdir);
    const readdir = promisify(fs.readdir);
    const unlink = promisify(fs.unlink);
    const chmod = promisify(fs.chmod);
    const stat = promisify(fs.stat);

    try {
      const stats = await stat(pathFolder);

      if (!stats.isDirectory()) {
        throw new Error(`Path ${pathFolder} exists but is not a directory`);
      }

      if (criteria.empty) {
        const files = await readdir(pathFolder);
        await Promise.all(
          files.map((file) => unlink(path.join(pathFolder, file))),
        );
      }

      if (criteria.mode !== undefined) {
        await chmod(pathFolder, criteria.mode);
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        await mkdir(pathFolder, { recursive: true, mode: criteria.mode });
      } else {
        throw error;
      }
    }
  },
);

ipcMain.handle(
  'jetpack.copyAsync',
  async (
    event,
    from,
    to,
    options: {
      overwrite?:
        | boolean
        | ((source: any, destination: any) => boolean | Promise<boolean>);
      matching?: string;
      ignoreCase?: boolean;
    },
  ) => {
    return await jetpack.copyAsync(from, to, options);
  },
);

ipcMain.handle(
  'jetpack.moveAsync',
  async (
    event,
    from,
    to,
    options: {
      overwrite?: false;
    },
  ) => {
    return await jetpack.moveAsync(from, to, options);
  },
);

ipcMain.handle('jetpack.existsAsync', async (event, filePath) => {
  return await jetpack.existsAsync(filePath);
});

ipcMain.handle('jetpack.removeAsync', async (event, filePath) => {
  return await jetpack.removeAsync(filePath);
});

ipcMain.handle('jetpack.writeAsync', async (event, filePath, content) => {
  return await jetpack.writeAsync(filePath, content);
});

ipcMain.handle('jetpack.readAsync', async (event, filePath) => {
  return await jetpack.readAsync(filePath);
});

ipcMain.handle('jetpack.findAsync', async (event, directory, options) => {
  return await jetpack.findAsync(directory, options);
});
