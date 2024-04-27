//TODO assemblerspringboot

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

log.transports.file.resolvePath = () => {
  return electronLogFilePath;
};

log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}] [{level}] - {text}';

//log.info(
//  `process.env.PORTABLE_EXECUTABLE_DIR: ${process.env.PORTABLE_EXECUTABLE_DIR}`,
//);

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

      serverProcess = spawn('startRbsjServer.bat', [], {
        cwd: `${process.env.PORTABLE_EXECUTABLE_DIR}/tools/rbsj`,
        env: { ...process.env, ELECTRON_PID: process.pid.toString() },
      });
      let windowCreated = false;

      serverProcess.stdout.on('data', (data) => {
        //console.log(`stdout: ${data}`);
        const dataStr = data.toString();

        //if (
        //  dataStr.includes('choco') ||
        //  dataStr.includes('embedded.tomcat.') ||
        //  dataStr.includes('flowkraft.ServerApplication')
        //)
        log.info(dataStr);

        //createWindow() main application window in both situations
        //if java is installed 'Started ServerApplication in' or java is not installed 'process exited with code 1'
        if (
          !windowCreated &&
          dataStr.includes('Started ServerApplication in')
        ) {
          windowCreated = true;
          createWindow();
        }
      });

      serverProcess.stderr.on('data', (data) => {
        const dataStr = data.toString();
        log.error(dataStr);
        if (!windowCreated && dataStr.includes("'java' is not recognized")) {
          windowCreated = true;
          createWindow();
        }
      });

      serverProcess.on('close', (code) => {
        //log.info(`Server process exited with code ${code}`);
      });
    } else {
      //if non-"production"
      log.info(`starting Electron App (Development)`);

      setTimeout(() => {
        createWindow();

        //console.log(
        //  `electron.main.ts.process.env.PORTABLE_EXECUTABLE_DIR = ${process.env.PORTABLE_EXECUTABLE_DIR}`,
        //);
      }, 400);
    }
  });

  app.on('before-quit', async () => {
    //stop the java server
    if (app.isPackaged) {
      if (serverProcess) {
        //log.info(
        //  `executing ${process.env.PORTABLE_EXECUTABLE_DIR}/tools/rbsj/shutRbsjServer.bat`,
        //);
        //await _shutServer();
      }
    }
  });

  app.on('will-quit', async () => {
    if (app.isPackaged) {
      if (serverProcess && !serverProcess.killed) {
        //stop the java server
        //await _shutServer();
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

ipcMain.handle('child_process.exec', async (event, command) => {
  const execPromise = promisify(exec);
  return execPromise(command);
});

ipcMain.handle(
  'child_process.spawn',
  async (event, command, args?, options?) => {
    return spawn(command, args, options);
  },
);

ipcMain.handle('process.env', async (event, envVariableName) => {
  return process.env[envVariableName];
});

ipcMain.handle('log', async (event, level, message) => {
  switch (level) {
    case 'info':
      log.info(message);
      break;
    case 'warn':
      log.warn(message);
      break;
    case 'error':
      log.error(message);
      break;
    case 'debug':
      log.debug(message);
      break;
    default:
      log.info(message);
      break;
  }
});

ipcMain.handle('getSystemInfo', async (event) => {
  return _getSystemInfo();
});

ipcMain.handle('app.relaunch', async (event) => {
  app.relaunch();
  app.exit(0);
});

ipcMain.handle('app.shutserver', async (event) => {
  return _shutServer();
});

ipcMain.on('restart_app', () => {
  app.relaunch();
  app.exit(0);
});

ipcMain.handle('getBackendUrl', async (event) => {
  //if non-"production"
  if (!app.isPackaged) return 'http://localhost:9090/api';

  const internalSettingsXmlFilePath = `${process.env.PORTABLE_EXECUTABLE_DIR}/config/_internal/settings.xml`;
  const internalSettingsXmlFileContent = await fs.promises.readFile(
    internalSettingsXmlFilePath,
    'utf-8',
  );

  const match = internalSettingsXmlFileContent.match(
    /<backendurl>(.*?)<\/backendurl>/,
  );
  const backendUrl = match ? match[1] : null;

  //log.info(`getBackendUrl settings.xml: ${fileContent}`);

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

async function _shutServer() {
  spawn('shutRbsjServer.bat', {
    cwd: `${process.env.PORTABLE_EXECUTABLE_DIR}/tools/rbsj`,
  });
  await sleep(1000);
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function _getSystemInfo(): Promise<{
  chocolatey: {
    isChocoOk: boolean;
    version: string;
  };
  java: {
    isJavaOk: boolean;
    version: string;
  };
  env: {
    PATH: string;
    JAVA_HOME: string;
    JRE_HOME: string;
  };
}> {
  let javaIsInstalled = true;
  let chocoIsInstalled = true;

  const electronLogFileContent = await fs.promises.readFile(
    electronLogFilePath,
    'utf-8',
  );

  if (electronLogFileContent.includes("'java' is not recognized")) {
    javaIsInstalled = false;
  }

  if (electronLogFileContent.includes("'choco' is not recognized")) {
    chocoIsInstalled = false;
  }

  // Extract Chocolatey version
  let chocoVersionMatch = electronLogFileContent.match(
    /choco version: (\d+\.\d+\.\d+)/,
  );
  let chocoVersion = chocoVersionMatch ? chocoVersionMatch[1] : '';

  // Extract Java version
  let javaVersionMatch = electronLogFileContent.match(
    /using Java (\d+\.\d+\.\d+)/,
  );
  let javaVersion = javaVersionMatch ? javaVersionMatch[1] : '';

  const sysInfo = {
    chocolatey: {
      isChocoOk: chocoIsInstalled,
      version: chocoVersion,
    },
    java: {
      isJavaOk: javaIsInstalled,
      version: javaVersion,
    },
    env: {
      PATH: process.env.PATH || '',
      JAVA_HOME: process.env.JAVA_HOME || '',
      JRE_HOME: process.env.JRE_HOME || '',
    },
  };

  //console.log(`_getSystemInfo: ${JSON.stringify(sysInfo)}`);

  return sysInfo;
}
