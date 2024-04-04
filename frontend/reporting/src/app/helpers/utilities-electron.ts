import { ChildProcessWithoutNullStreams } from 'child_process';
import * as jetpack from 'fs-jetpack';

export default class UtilitiesElectron {
  static renderer: Electron.IpcRenderer;

  static async appRelaunch() {
    if (await UtilitiesElectron.isIpcRendererAvailable()) {
      return UtilitiesElectron.renderer.invoke('app.relaunch');
    }
  }

  static async appShutServer() {
    if (await UtilitiesElectron.isIpcRendererAvailable()) {
      return UtilitiesElectron.renderer.invoke('app.shutserver');
    }
  }

  static async getSystemInfo(): Promise<{
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
    if (await UtilitiesElectron.isIpcRendererAvailable()) {
      return UtilitiesElectron.renderer.invoke('getSystemInfo');
    }
  }

  static async getBackendUrl(): Promise<string> {
    if (await UtilitiesElectron.isIpcRendererAvailable()) {
      return UtilitiesElectron.renderer.invoke('getBackendUrl');
    } else {
      return 'http://localhost:9090';
    }
  }

  static async dirAsync(
    path: string,
    criteria: { empty?: boolean; mode?: number | string } = { empty: false },
  ): Promise<void> {
    if (await UtilitiesElectron.isIpcRendererAvailable()) {
      await UtilitiesElectron.renderer.invoke(
        'jetpack.dirAsync',
        path,
        criteria,
      );
    } else {
      await jetpack.dirAsync(path, criteria);
    }
  }

  static async copyAsync(
    from: string,
    to: string,
    options?: {
      overwrite?:
        | boolean
        | ((source: any, destination: any) => boolean | Promise<boolean>);
      matching?: string[];
      ignoreCase?: boolean;
    },
  ): Promise<void> {
    if (await UtilitiesElectron.isIpcRendererAvailable()) {
      return UtilitiesElectron.renderer.invoke(
        'jetpack.copyAsync',
        from,
        to,
        options,
      );
    } else return jetpack.copyAsync(from, to, options);
  }

  static async moveAsync(
    from: string,
    to: string,
    options?: {
      overwrite?: false;
    },
  ): Promise<void> {
    if (await UtilitiesElectron.isIpcRendererAvailable()) {
      return UtilitiesElectron.renderer.invoke(
        'jetpack.moveAsync',
        from,
        to,
        options,
      );
    } else return jetpack.moveAsync(from, to, options);
  }

  static async removeAsync(path: string): Promise<void> {
    if (path) {
      if (await UtilitiesElectron.isIpcRendererAvailable()) {
        return UtilitiesElectron.renderer.invoke('jetpack.removeAsync', path);
      } else return jetpack.removeAsync(path);
    }
  }

  static async existsAsync(filePath: string): Promise<any> {
    if (await UtilitiesElectron.isIpcRendererAvailable()) {
      return UtilitiesElectron.renderer.invoke('jetpack.existsAsync', filePath);
    } else return jetpack.existsAsync(filePath);
  }

  static async readAsync(filePath: string): Promise<string> {
    if (await UtilitiesElectron.isIpcRendererAvailable()) {
      return await UtilitiesElectron.renderer.invoke(
        'jetpack.readAsync',
        filePath,
      );
    } else return jetpack.readAsync(filePath);
  }

  static async writeAsync(filePath: string, content: string): Promise<void> {
    if (await UtilitiesElectron.isIpcRendererAvailable()) {
      return UtilitiesElectron.renderer.invoke(
        'jetpack.writeAsync',
        filePath,
        content,
      );
    } else return jetpack.writeAsync(filePath, content);
  }

  static async logInfoAsync(message: string): Promise<void> {
    if (await UtilitiesElectron.isIpcRendererAvailable()) {
      return UtilitiesElectron.renderer.invoke('log', 'info', message);
    }
  }

  static async logWarnAsync(message: string): Promise<void> {
    if (await UtilitiesElectron.isIpcRendererAvailable()) {
      return UtilitiesElectron.renderer.invoke('log', 'warn', message);
    }
  }

  static async logErrorAsync(message: string): Promise<void> {
    if (await UtilitiesElectron.isIpcRendererAvailable()) {
      return UtilitiesElectron.renderer.invoke('log', 'error', message);
    }
  }

  static async findAsync(directory: string, options: {}): Promise<string[]> {
    if (await UtilitiesElectron.isIpcRendererAvailable()) {
      return await UtilitiesElectron.renderer.invoke(
        'jetpack.findAsync',
        directory,
        options,
      );
    } else return jetpack.findAsync(directory, options);
  }

  static async checkUrl(url: string): Promise<boolean> {
    if (await UtilitiesElectron.isIpcRendererAvailable())
      return UtilitiesElectron.renderer.invoke('checkUrl', url);

    return false;
  }

  static async childProcessExec(
    command: string,
  ): Promise<{ stdout: string; stderr: string }> {
    if (await UtilitiesElectron.isIpcRendererAvailable()) {
      const { stdout, stderr } = await UtilitiesElectron.renderer.invoke(
        'child_process.exec',
        command,
      );
      //console.log(`stdout: ${stdout}`);
      //console.log(`stderr: ${stderr}`);
      return { stdout, stderr };
    }
  }

  static async childProcessSpawn(
    command: string,
    args?: string[],
    options?: {},
  ): Promise<ChildProcessWithoutNullStreams> {
    if (await UtilitiesElectron.isIpcRendererAvailable()) {
      return UtilitiesElectron.renderer.invoke(
        'child_process.spawn',
        command,
        args,
        options,
      );
    }
  }

  static async getEnvVariable(envVariableName: string): Promise<string> {
    if (await UtilitiesElectron.isIpcRendererAvailable()) {
      return UtilitiesElectron.renderer.invoke('process.env', envVariableName);
    } else {
      return '';
    }
  }

  static async isIpcRendererAvailable(): Promise<boolean> {
    //console.log(`UtilitiesElectron.renderer = ${UtilitiesElectron.renderer}`);

    if (UtilitiesElectron.renderer) {
      return true;
    } else {
      const { ipcRenderer } = await import('electron');
      //console.log(`ipcRenderer = ${ipcRenderer}`);

      if (ipcRenderer) {
        UtilitiesElectron.renderer = ipcRenderer;
        return true;
      }
      return false;
    }
  }
}
