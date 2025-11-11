import { app, BrowserWindow, shell, ipcMain, dialog } from 'electron';
import log from 'electron-log';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

import { ChildProcessWithoutNullStreams, exec as _execSync, spawn as _spawnSync } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(_execSync);

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
const rbsjExeLogFilePath = `${process.env.PORTABLE_EXECUTABLE_DIR}/logs/rbsj-exe.log`;
const portalSageComposerLockFilePath = `${process.env.PORTABLE_EXECUTABLE_DIR}/_apps/cms-webportal-playground/wp-themes/reportburster-sage/composer.lock`;

log.transports.file.resolvePath = () => {
  return electronLogFilePath;
};

log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}] [{level}] - {text}';

//console.log(
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

let serverProcess: ChildProcessWithoutNullStreams;

try {
  app.commandLine.appendSwitch(
    'disable-features',
    'BlockInsecurePrivateNetworkRequests',
  );

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  // Added 400 ms to fix the black background issue while using transparent window. More detais at https://github.com/electron/electron/issues/15947

  app.on('ready', () => {
    //if "production"
    if (app.isPackaged) {
      log.info(
        `executing ${process.env.PORTABLE_EXECUTABLE_DIR}/tools/rbsj/startRbsjServer.bat`,
      );

      serverProcess = _spawnSync('startRbsjServer.bat', [], {
        cwd: `${process.env.PORTABLE_EXECUTABLE_DIR}/tools/rbsj`,
        env: { ...process.env, ELECTRON_PID: process.pid.toString() },
      });

      serverProcess.stdout.on('data', (data) => handleServerOutput(data, false));
      serverProcess.stderr.on('data', (data) => handleServerOutput(data, true));

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
    log.info(`before-quit: serverProcess exists? ${!!serverProcess}`);

    //stop the java server
    if (app.isPackaged) {
      if (serverProcess) {
        //log.info(
        //  `executing ${process.env.PORTABLE_EXECUTABLE_DIR}/tools/rbsj/shutRbsjServer.bat`,
        //);
        await _shutServer();
      }
    }
  });

  app.on('will-quit', async () => {
    log.info(`will-quit: serverProcess exists? ${!!serverProcess}`);

    if (app.isPackaged) {
      if (serverProcess) {
        //stop the java server
        await _shutServer();
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

let windowCreated = false;
let unifiedBuffer = '';

function handleServerOutput(data: Buffer | string, isError = false) {
  unifiedBuffer += data.toString();
  let lines = unifiedBuffer.split(/\r?\n/);
  unifiedBuffer = lines.pop() || '';
  for (const line of lines) {
    log.info(line);

    if (!windowCreated) {
      // Success patterns - server started successfully
      if (
        /started\s+serverapplication/i.test(line) ||
        /starting\s+protocolhandler/i.test(line) ||
        /initializing\s+spring\s+dispatcherservlet/i.test(line)
      ) {
        log.info(`main:createWindow() because of successful server start: ${line}`);
        windowCreated = true;
        createWindow();
      }

      // Java error patterns - comprehensive check across platforms
      else if (
        // Windows errors
        line.includes("'java' is not recognized") ||
        line.includes("java is not recognized") ||
        line.includes("The system cannot find the path specified") ||

        // Unix/Linux errors
        line.includes("java: command not found") ||
        line.includes("bash: java:") ||
        line.includes("/bin/sh: java: not found") ||

        // General Java errors
        line.includes("Error: JAVA_HOME is not defined") ||
        line.includes("No Java runtime present") ||
        /could not find (.*) java/i.test(line) ||

        // Other variations
        line.includes("Unable to locate a Java Runtime") ||
        line.includes("no java installation found") ||
        line.includes("Error: Could not find java.exe") ||

        // File errors that might indicate Java issues
        (line.includes("Could not find or load main class") &&
          line.includes("LoggingSystem"))
      ) {
        log.info(`main:createWindow() because of Java error: ${line}`);
        windowCreated = true;
        createWindow();
      }
    }
  }
}

ipcMain.handle('dialog.show-save', async (event, options) => {
  const result = await dialog.showSaveDialog(options);
  return result;
});

ipcMain.handle('dialog.show-open', async (event, options) => {
  const result = await dialog.showOpenDialog(options);
  return result;
});

ipcMain.handle('child_process.exec', async (event, command) => {
  const execPromise = promisify(_execSync);
  return execPromise(command);
});

ipcMain.handle(
  'child_process.spawn',
  async (event, command, args?, options?) => {
    const spawnPromise = promisify(_spawnSync);
    return spawnPromise(command, args, options);
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

// Handle opening HTML in browser
ipcMain.on('open-html-in-browser', (event, args) => {
  try {
    // Create a more unique filename with template name
    const tempName = args.title
      ? args.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()
      : 'template';

    const tempPath = path.join(os.tmpdir(), `${tempName}-${Date.now()}.html`);
    fs.writeFileSync(tempPath, args.html, 'utf8');

    // Use shell.openExternal which is more reliable
    shell.openExternal(`file://${tempPath}`);
  } catch (error) {
    console.error('Error opening HTML in browser:', error);
    event.sender.send('open-html-in-browser-error', { error: error.message });
  }
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

  //log.info(`getBackendUrl settings.xml: ${internalSettingsXmlFileContent}`);

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
  serverProcess = null;
  _spawnSync('shutRbsjServer.bat', {
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
  docker: {
    isDockerOk: boolean;
    version: string;
  };
  portal: {
    isProvisioned: boolean;
  };
  env: {
    PATH: string;
    JAVA_HOME: string;
    JRE_HOME: string;
  };
}> {
  let dockerIsInstalled = true;
  let chocoIsInstalled = true;

  const electronLogFileContent = await fs.promises.readFile(
    electronLogFilePath,
    'utf8',
  );

  let rbsjExeLogFileContent = await readLogFileSmart(rbsjExeLogFilePath);

  // keep existing English-based quick checks (harmless on English systems)
  if (electronLogFileContent.includes("'choco' is not recognized")) {
    chocoIsInstalled = false;
  }

  // robust presence probe (Windows: where, Unix: which)
  if (chocoIsInstalled)
    chocoIsInstalled =
      process.platform === 'win32'
        ? await commandExistsWindows('choco')
        : await execAsync('which choco')
            .then(() => true)
            .catch(() => false);

  if (electronLogFileContent.includes("'docker' is not recognized")) {
    dockerIsInstalled = false;
  }

  if (dockerIsInstalled)
    dockerIsInstalled =
      process.platform === 'win32'
        ? await commandExistsWindows('docker')
        : await execAsync('which docker')
            .then(() => true)
            .catch(() => false);

  // Prepare log lines once (safer splitting for CRLF)
  const logLines = electronLogFileContent.split(/\r?\n/).map((l) => l.trim());
  const firstNonEmptyLine = logLines.find((l) => l.length > 0) || '';

  // Extract Chocolatey version (probe first, fallback to log search)
  let chocoVersion = '';
  if (chocoIsInstalled) {
    const v = await getVersionFromCommand(
      'choco',
      process.platform === 'win32' ? '-v' : '--version',
    );
    if (v) {
      chocoVersion = v;
    } else {
      // search the whole log for a numeric token on a line referencing choco/chocolatey
      const chocoLine =
        logLines.find((l) => /choco|chocolatey/i.test(l)) || firstNonEmptyLine;
      const m = chocoLine.match(/(\d+(?:\.\d+){0,})/);
      chocoVersion = m ? m[1] : '';
    }
  } else {
    chocoVersion = '';
  }

  // Extract Docker version (probe first, fallback to log search across all lines)
  let dockerVersion = '';
  if (dockerIsInstalled) {
    const v = await getVersionFromCommand('docker', '--version');
    if (v) {
      dockerVersion = v;
    } else {
      // look for common Docker patterns anywhere in the log
      const dockerFullMatch =
        electronLogFileContent.match(/Docker version\s*([\d\.]+)/i) ||
        electronLogFileContent.match(/docker[^\d\n]*?(\d+(?:\.\d+){0,})/i);
      dockerVersion = dockerFullMatch ? dockerFullMatch[1] : '';
    }
  } else {
    dockerVersion = '';
  }

  // Extract Java version and decide compliance
  // prefer probing 'java -version' (captures stdout+stderr), fallback to rbsj-exe.log
  const javaVersionFromCmd = await getJavaVersionFromCommand();
  const javaVersion = javaVersionFromCmd || detectJavaVersion(rbsjExeLogFileContent);
  const javaMajor = parseJavaMajor(javaVersion);
  const isJavaOk = !Number.isNaN(javaMajor) && javaMajor >= 17;

  let isPortalProvisioned = false;
  try {
    await fs.promises.access(portalSageComposerLockFilePath);
    isPortalProvisioned = true;
  } catch {
    isPortalProvisioned = false;
  }

  const sysInfo = {
    chocolatey: {
      isChocoOk: chocoIsInstalled,
      version: chocoIsInstalled ? chocoVersion : '',
    },
    java: {
      isJavaOk: isJavaOk,
      version: isJavaOk ? javaVersion : '',
    },
    docker: {
      isDockerOk: dockerIsInstalled,
      version: dockerIsInstalled ? dockerVersion : '',
    },
    portal: {
      isProvisioned: isPortalProvisioned,
    },
    env: {
      PATH: process.env.PATH || '',
      JAVA_HOME: process.env.JAVA_HOME || '',
      JRE_HOME: process.env.JRE_HOME || '',
    },
  };

  console.log(`_getSystemInfo: ${JSON.stringify(sysInfo)}`);

  return sysInfo;
}

function parseJavaMajor(version: string): number {
  if (!version) return NaN;
  // examples handled:
  // "17.0.8" -> 17
  // "11.0.12" -> 11
  // "1.8.0_261" -> 8 (legacy format)
  const cleaned = version.trim();
  if (cleaned.startsWith('1.')) {
    // legacy "1.x.y" => major = second token
    const parts = cleaned.split(/[._-]/);
    return parseInt(parts[1], 10);
  } else {
    const parts = cleaned.split(/[._-]/);
    return parseInt(parts[0], 10);
  }
}

// add near other helpers in the same file
async function getJavaVersionFromCommand(): Promise<string> {
  try {
    const { stdout, stderr } = await execAsync('java -version');
    const out = `${stdout || ''}\n${stderr || ''}`;
    // try the robust detector first (handles full phrases), then fallback to numeric token
    const v = detectJavaVersion(out);
    if (v) return v;
    const m = out.match(/(\d+(?:\.\d+){0,})/);
    return m ? m[1] : '';
  } catch {
    return '';
  }
}

// rename parameter for clarity (update any call sites above accordingly)
function detectJavaVersion(outputContent: string): string {
  let match = outputContent.match(/using Java ([\w\.]+)/i);
  if (match) return match[1].trim();

  match = outputContent.match(/(?:openjdk|java|adoptopenjdk|temurin)[^\n]*version\s+"([\d._]+)"/i);
  if (match) return match[1].trim();

  match = outputContent.match(/java version\s+"([\d._]+)"/i);
  if (match) return match[1].trim();

  match = outputContent.match(/version\s+"([\d._]+)"/i);
  if (match) return match[1].trim();

  match = outputContent.match(/openjdk\s+([\d._]+)/i);
  if (match) return match[1].trim();

  match = outputContent.match(/temurin-([\d._]+)/i);
  if (match) return match[1].trim();

  return '';
}

async function commandExistsWindows(cmd: string): Promise<boolean> {
  try {
    await execAsync(`where ${cmd}`);
    return true;
  } catch {
    return false;
  }
}

async function getVersionFromCommand(cmd: string, args = '--version'): Promise<string> {
  try {
    const { stdout, stderr } = await execAsync(`${cmd} ${args}`);
    const out = `${stdout || ''}\n${stderr || ''}`;
    const m = out.match(/(\d+(?:\.\d+){0,})/); // first numeric token
    return m ? m[1] : out.split(/\r?\n/)[0].trim();
  } catch {
    return '';
  }
}

async function readLogFileSmart(filePath: string): Promise<string> {
  const encodings: BufferEncoding[] = ['utf8', 'utf16le', 'latin1'];
  for (const encoding of encodings) {
    try {
      const content = await fs.promises.readFile(filePath, { encoding });
      // If content is not empty and does not contain too many replacement chars, return it
      const replacementCharCount = (content.match(/\uFFFD/g) || []).length;
      if (content.trim().length > 0 && replacementCharCount < 3) {
        return content;
      }
    } catch (err) {
      // Try next encoding
    }
  }
  return '';
}