let ipcRenderer;
if (window.require) {
  ipcRenderer = window.require('electron').ipcRenderer;
}

export default class UtilitiesElectron {
  static isRunningInsideElectron(): boolean {
    return typeof window.require !== 'undefined';
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

  static async logInfoAsync(message: string): Promise<void> {
    if (UtilitiesElectron.isIpcRendererAvailable()) {
      return ipcRenderer.invoke('log', 'info', message);
    }
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
      'child_process.exec',
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
