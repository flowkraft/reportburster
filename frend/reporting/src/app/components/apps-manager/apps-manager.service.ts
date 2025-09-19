import { Injectable } from '@angular/core';
import { ShellService } from '../../providers/shell.service';
import { ToastrMessagesService } from '../../providers/toastr-messages.service';
import { ApiService } from '../../providers/api.service';
import { StateStoreService } from '../../providers/state-store.service';

export interface ManagedApp {
  id: string;
  name: string;
  description: string;
  type: 'docker' | 'local' | 'desktop' | 'url';
  icon?: string;
  entrypoint?: string;
  service_name?: string;
  command?: string;
  url?: string;
  state?: 'running' | 'stopped' | 'unknown' | 'starting' | 'stopping' | 'error';
  index?: number;
  value?: string;
  enabled?: boolean;
  startCmd?: string;
  stopCmd?: string;
  lastOutput?: string;
  currentCommandValue?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AppsManagerService {
  // Simulated backend state for each app (by id)
  private appStates: { [id: string]: 'running' | 'stopped' | 'unknown' | 'starting' | 'stopping' | 'error' } = {};

  // Simulated last output for each app
  private appLastOutputs: { [id: string]: string } = {};

  // Simulated "backend" data (replace with REST call in future)
  private allAppsData = {
    apps: [
      {
        id: 'cms-webportal',
        name: 'WebPortal / Content Management CMS',
        icon: 'fa fa-wordpress',
        category: 'Web Portal',
        type: 'docker',
        description: 'Production-ready WebPortal / Content Management with admin features.',
        url: 'http://localhost:8080/wp-admin',
        enabled: true,
        entrypoint: 'cms-webportal-playground/docker-compose.yml',
        service_name: 'cms-webportal-playground',
        startCmd: 'service app start cms-webportal-playground 8080',
        stopCmd: 'service app stop cms-webportal-playground',
      },
      {
        id: 'cloudbeaver',
        name: 'DB Management (CloudBeaver)',
        icon: 'fa fa-database',
        category: 'Database Management',
        type: 'docker',
        description: 'Web-based database manager.',
        url: 'http://localhost:8978',
        enabled: false,
        entrypoint: 'docker-compose.yml',
        service_name: 'cloudbeaver',
      },
      {
        id: 'vanna-ai',
        name: 'Vanna.AI',
        category: 'Database Management',
        type: 'docker',
        description: 'AI-powered text-to-SQL agent.',
        url: 'http://localhost:8084',
        enabled: false,
        entrypoint: 'docker-compose.yml',
        service_name: 'vanna-ai',
      },
      {
        id: 'redash',
        name: 'Redash',
        category: 'BI & Visualization',
        type: 'docker',
        description: 'Query builder and dashboard tool.',
        url: 'http://localhost:5000',
        enabled: false,
        entrypoint: 'docker-compose.yml',
        service_name: 'redash',
      },
      {
        id: 'superset',
        name: 'Apache Superset',
        category: 'BI & Visualization',
        type: 'docker',
        description: 'Enterprise-ready data visualization platform.',
        url: 'http://localhost:8088',
        enabled: false,
        entrypoint: 'docker-compose.yml',
        service_name: 'superset',
      },
      {
        id: 'rundeck',
        name: 'Rundeck (Local)',
        category: 'Automation & Job Scheduling',
        type: 'local',
        description: 'Runbook automation installed directly on the host.',
        url: 'http://localhost:4440',
        enabled: false,
        command: 'rundeckd start',
      },
      {
        id: 'vscode',
        name: 'VS Code',
        icon: 'fa fa-free-code-camp',
        category: 'Developer Tools',
        type: 'desktop',
        description: 'Launch local installation of Visual Studio Code.',
        enabled: false,
        command: 'code',
      },
      {
        id: 'notepad++',
        name: 'Notepad++ (Local)',
        category: 'Developer Tools',
        type: 'desktop',
        description: 'Launch local installation of Notepad++.',
        enabled: false,
        command: 'notepad++',
      },
    ],
  };

  constructor(
    private shellService: ShellService,
    private messagesService: ToastrMessagesService,
    private apiService: ApiService,
    private stateStore: StateStoreService, 
  ) {}

  // Add method to fetch statuses from API
  public async refreshAllStatuses(): Promise<void> {
    try {
      const response = await this.apiService.get('/jobman/system/services/status');
      const statuses: any[] = response;  // Array of {name, status, ports}
      
      // Update app states based on API response
      for (const app of this.allAppsData.apps) {
        const service = statuses.find(s => s.name === app.service_name || s.name.includes(app.id));
        if (service) {
          this.appStates[app.id] = service.status === 'running' ? 'running' : 'stopped';

          if (app.id === 'cms-webportal' && this.appStates[app.id] === 'running') {
            this.stateStore.configSys.sysInfo.setup.portal.isProvisioned = true;
          }
       
        } else {
          this.appStates[app.id] = 'unknown';
        }
      }
    } catch (error) {
      console.error('Error refreshing statuses:', error);
      // Set to 'error' or leave as-is
    }
  }

  public async getAllApps(): Promise<ManagedApp[]> {
    return this.allAppsData.apps.map(app => ({
      ...app,
      type: app.type as 'docker' | 'local' | 'desktop' | 'url',
      state: this.appStates[app.id] ?? 'stopped',
      lastOutput: this.appLastOutputs[app.id] ?? '',
      currentCommandValue: (this.appStates[app.id] ?? 'stopped') === 'running' ? app.stopCmd : app.startCmd,
    }));
  }

  public async getAppById(id: string): Promise<ManagedApp> {
    const appData = this.allAppsData.apps.find(app => app.id === id);
    if (!appData) return undefined;
    return {
      ...appData,
      type: appData.type as 'docker' | 'local' | 'desktop' | 'url',
      state: this.appStates[id] ?? 'stopped',
      lastOutput: this.appLastOutputs[id] ?? '',
      currentCommandValue: (this.appStates[id] ?? 'stopped') === 'running' ? appData.stopCmd : appData.startCmd,
    };
  }

  // Toggle app state (start/stop)
  public async toggleApp(app: ManagedApp): Promise<void> {
    if ((this.appStates[app.id] ?? 'stopped') === 'running') {
      await this.stopApp(app);
    } else {
      await this.startApp(app);
    }
  }

  // Start an app
  private async startApp(app: ManagedApp): Promise<void> {
    let command: string[] = [];
    let successMessage = `App '${app.name}' started successfully.`;

    if (app.type === 'docker') {
      if (app.currentCommandValue) {
        command = app.currentCommandValue.split(' ');
      } else {
        this.messagesService.showError(`No command defined for '${app.name}'.`);
        return;
      }
    } else if (app.type === 'local' || app.type === 'desktop') {
      if (app.command) {
        command = app.command.split(' ');
      } else {
        this.messagesService.showError(`No command defined for '${app.name}'.`);
        return;
      }
    } else if (app.type === 'url') {
      if (app.url) {
        window.open(app.url, '_blank');
        this.messagesService.showSuccess(successMessage);
      } else {
        this.messagesService.showError(`No URL defined for '${app.name}'.`);
      }
      return;
    } else {
      this.messagesService.showError(`Unknown app type for '${app.name}'.`);
      return;
    }

    // Set instant feedback
    this.appStates[app.id] = 'starting';
    this.appLastOutputs[app.id] = 'Executing start...';

    return new Promise<void>((resolve, reject) => {
      this.shellService.runBatFile(command, `Starting ${app.name}`, async (result) => {
        //console.log('Callback fired for', app.name, 'result:', JSON.stringify(result));
        if (result && result.success) {
          this.appStates[app.id] = 'running';
          this.appLastOutputs[app.id] = result.output || `✓ ${app.name} started successfully.`;
          app.state = 'running';
          app.lastOutput = this.appLastOutputs[app.id];
          app.currentCommandValue = app.stopCmd;
        } else {
          this.appStates[app.id] = 'error';
          this.appLastOutputs[app.id] = (result && result.output) || `✗ Failed to start ${app.name}.`;
          app.state = 'error';
          app.lastOutput = this.appLastOutputs[app.id];
          app.currentCommandValue = app.startCmd;
        }
        await this.refreshAllStatuses();
        const apiState = this.appStates[app.id] ?? app.state;
        app.state = apiState;
        //console.log('After refresh, appStates:', JSON.stringify(this.appStates[app.id]));
        resolve();
      });
    });
  }

  // Stop an app
  private async stopApp(app: ManagedApp): Promise<void> {
    let command: string[] = [];
    let successMessage = `App '${app.name}' stopped successfully.`;

    if (app.type === 'docker') {
      if (app.currentCommandValue) {
        command = app.currentCommandValue.split(' ');
      } else {
        this.messagesService.showError(`No command defined for '${app.name}'.`);
        return;
      }
    } else if (app.type === 'local' || app.type === 'desktop') {
      if (app.command) {
        command = app.command.split(' ');
      } else {
        this.messagesService.showInfo(
          `Stopping local/desktop app '${app.name}' is not automatically supported. Please close it manually.`
        );
        this.appStates[app.id] = 'stopped';
        await this.refreshAllStatuses();
        return;
      }
    } else if (app.type === 'url') {
      // Cannot "stop" a URL
      return;
    } else {
      this.messagesService.showError(`Unknown app type for '${app.name}'.`);
      return;
    }

    // Set instant feedback
    this.appStates[app.id] = 'stopping';
    this.appLastOutputs[app.id] = 'Executing stop...';

    return new Promise<void>((resolve, reject) => {
      this.shellService.runBatFile(command, `Stopping ${app.name}`, async (result) => {
        if (result && result.success) {
          this.appStates[app.id] = 'stopped';
          this.appLastOutputs[app.id] = result.output || `✓ ${app.name} stopped successfully.`;
          try { app.state = 'stopped'; } catch (e) {}
          try { app.lastOutput = this.appLastOutputs[app.id]; } catch (e) {}
          try { app.currentCommandValue = app.startCmd; } catch (e) {}
        } else {
          this.appStates[app.id] = 'error';
          this.appLastOutputs[app.id] = (result && result.output) || `✗ Failed to stop ${app.name}.`;
          try { app.state = 'error'; } catch (e) {}
          try { app.lastOutput = this.appLastOutputs[app.id]; } catch (e) {}
        }
        // Automatic refresh after action to get authoritative state from API
        try {
          await this.refreshAllStatuses();
          const apiState = this.appStates[app.id] ?? app.state;
          try { app.state = apiState; } catch (e) {}
        } catch (e) {
          console.error('refreshAllStatuses failed after stop:', e);
        }
        resolve();
      });
    });
  }

}