import { ipcRenderer } from 'electron';

import * as jetpack from 'fs-jetpack';

export default class UtilitiesElectron {
  static async getBackendUrl(): Promise<string> {
    if (UtilitiesElectron.isIpcRendererAvailable()) {
      return ipcRenderer.invoke('getBackendUrl');
    } else {
      return 'http://localhost:9090';
    }
  }

  static async dirAsync(
    path: string,
    criteria: { empty?: boolean; mode?: number | string } = { empty: false },
  ): Promise<void> {
    if (UtilitiesElectron.isIpcRendererAvailable()) {
      await ipcRenderer.invoke('jetpack.dirAsync', path, criteria);
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
    if (UtilitiesElectron.isIpcRendererAvailable()) {
      return ipcRenderer.invoke('jetpack.copyAsync', from, to, options);
    } else return jetpack.copyAsync(from, to, options);
  }

  static async moveAsync(
    from: string,
    to: string,
    options?: {
      overwrite?: false;
    },
  ): Promise<void> {
    if (UtilitiesElectron.isIpcRendererAvailable()) {
      return ipcRenderer.invoke('jetpack.moveAsync', from, to, options);
    } else return jetpack.moveAsync(from, to, options);
  }

  static async removeAsync(path: string): Promise<void> {
    if (path) {
      if (UtilitiesElectron.isIpcRendererAvailable()) {
        return ipcRenderer.invoke('jetpack.removeAsync', path);
      } else return jetpack.removeAsync(path);
    }
  }

  static async existsAsync(filePath: string): Promise<any> {
    if (UtilitiesElectron.isIpcRendererAvailable()) {
      return ipcRenderer.invoke('jetpack.existsAsync', filePath);
    } else return jetpack.existsAsync(filePath);
  }

  static async readAsync(filePath: string): Promise<string> {
    if (UtilitiesElectron.isIpcRendererAvailable()) {
      return await ipcRenderer.invoke('jetpack.readAsync', filePath);
    } else return jetpack.readAsync(filePath);
  }

  static async writeAsync(filePath: string, content: string): Promise<void> {
    if (UtilitiesElectron.isIpcRendererAvailable()) {
      return ipcRenderer.invoke('jetpack.writeAsync', filePath, content);
    } else return jetpack.writeAsync(filePath, content);
  }

  static async findAsync(directory: string, options: {}): Promise<string[]> {
    if (UtilitiesElectron.isIpcRendererAvailable()) {
      return await ipcRenderer.invoke('jetpack.findAsync', directory, options);
    } else return jetpack.findAsync(directory, options);
  }

  static async checkUrl(url: string): Promise<boolean> {
    if (UtilitiesElectron.isIpcRendererAvailable())
      return ipcRenderer.invoke('checkUrl', url);

    return false;
  }

  static async execNativeCommand(
    command: string,
  ): Promise<{ stdout: string; stderr: string }> {
    const { stdout, stderr } = await ipcRenderer.invoke(
      'execNativeCommand',
      command,
    );
    //console.log(`stdout: ${stdout}`);
    //console.log(`stderr: ${stderr}`);
    return { stdout, stderr };
  }

  static isIpcRendererAvailable(): boolean {
    if (ipcRenderer) return true;

    return false;
  }
}
