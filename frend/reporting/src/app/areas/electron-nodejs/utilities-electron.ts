import { ChildProcess } from 'child_process';

let ipcRenderer;
if (window.require) {
  ipcRenderer = window.require('electron').ipcRenderer;
}

export default class UtilitiesElectron {
  static isRunningInsideElectron(): boolean {
    return typeof window.require !== 'undefined';
  }

  static async showOpenDialog(
    options: Electron.OpenDialogOptions,
  ): Promise<Electron.OpenDialogReturnValue> {
    if (UtilitiesElectron.isIpcRendererAvailable()) {
      return ipcRenderer.invoke('dialog.show-open', options);
    }
  }

  static async showSaveDialog(
    options: Electron.SaveDialogOptions,
  ): Promise<Electron.SaveDialogReturnValue> {
    if (UtilitiesElectron.isIpcRendererAvailable()) {
      return ipcRenderer.invoke('dialog.show-save', options);
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
    docker: {
      isDockerOk: boolean;
      version: string;
    };
    env: {
      PATH: string;
      JAVA_HOME: string;
      JRE_HOME: string;
    };
  }> {
    if (UtilitiesElectron.isIpcRendererAvailable()) {
      return ipcRenderer.invoke('getSystemInfo');
    }
  }

  static async getBackendUrl(): Promise<string> {
    if (UtilitiesElectron.isIpcRendererAvailable()) {
      return ipcRenderer.invoke('getBackendUrl');
    } else {
      return 'http://localhost:9090';
    }
  }

  static async logAsync(message: string, level: string): Promise<void> {
    if (UtilitiesElectron.isIpcRendererAvailable()) {
      return ipcRenderer.invoke('log', level, message);
    }
  }

  static async getEnvVariableValue(envVariableName: string): Promise<string> {
    if (UtilitiesElectron.isIpcRendererAvailable()) {
      return ipcRenderer.invoke(envVariableName);
    } else {
      return '';
    }
  }

  static async childProcessExec(
    command: string,
  ): Promise<{ stdout: string; stderr: string }> {
    const { stdout, stderr } = await ipcRenderer.invoke(
      'child_process.exec',
      command,
    );
    //console.log(`stdout: ${stdout}`);
    //console.log(`stderr: ${stderr}`);
    return { stdout, stderr };
  }

  static async childProcessSpawn(
    command: string,
    args?: string[],
    options?: {},
  ): Promise<ChildProcess> {
    return ipcRenderer.invoke('child_process.spawn', command, args, options);
  }

  static isIpcRendererAvailable(): boolean {
    if (ipcRenderer) return true;

    return false;
  }
}
