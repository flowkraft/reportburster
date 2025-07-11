import { Injectable } from '@angular/core';
import { ShellService } from '../../providers/shell.service';
import { ToastrMessagesService } from '../../providers/toastr-messages.service';

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
  state?: 'running' | 'stopped' | 'unknown';
  index?: number;
  value?: string;
  enabled?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AppsManagerService {
  // Simulated backend state for each app (by id)
  private appStates: { [id: string]: 'running' | 'stopped' | 'unknown' } = {};

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
        url: 'http://localhost:8080',
        enabled: true,
        entrypoint: 'docker-compose.yml',
        service_name: 'cms-webportal',
      },
      {
        id: 'cloudbeaver',
        name: 'DB Management (Cloudbeaver)',
        icon: 'fa fa-database',
        category: 'Database Management',
        type: 'docker',
        description: 'Web-based database manager.',
        url: 'http://localhost:8978',
        enabled: true,
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
        enabled: true,
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
        enabled: true,
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
        enabled: true,
        command: 'rundeckd start',
      },
      {
        id: 'vscode',
        name: 'VS Code',
        icon: 'fa fa-free-code-camp',
        category: 'Developer Tools',
        type: 'desktop',
        description: 'Launch local installation of Visual Studio Code.',
        enabled: true,
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
    private messagesService: ToastrMessagesService
  ) {}

  public async getAllApps(): Promise<ManagedApp[]> {
    return this.allAppsData.apps.map(app => ({
      ...app,
      type: app.type as 'docker' | 'local' | 'desktop' | 'url',
      state: this.appStates[app.id] ?? 'stopped',
    }));
  }

  public async getAppById(id: string): Promise<ManagedApp> {
    const appData = this.allAppsData.apps.find(app => app.id === id);
    if (!appData) return undefined;
    return {
      ...appData,
      type: appData.type as 'docker' | 'local' | 'desktop' | 'url',
      state: this.appStates[id] ?? 'stopped',
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

  // Start an app (simulate backend, update state, show message)
  private async startApp(app: ManagedApp): Promise<void> {
    let command: string[] = [];
    let successMessage = `App '${app.name}' launched successfully.`;

    switch (app.type) {
      case 'docker':
        command = [
          'docker-compose',
          '-f',
          app.entrypoint ? `"${app.entrypoint}"` : 'docker-compose.yml',
          'up',
          '-d',
          app.service_name || app.id,
        ];
        break;
      case 'local':
      case 'desktop':
        if (app.command) {
          command = app.command.split(' ');
        } else {
          this.messagesService.showError(`No command defined for '${app.name}'.`);
          this.appStates[app.id] = 'stopped';
          return;
        }
        break;
      case 'url':
        if (app.url) {
          // this.shellService.openExternal(app.url);
          this.messagesService.showSuccess(successMessage);
        } else {
          this.messagesService.showError(`No URL defined for '${app.name}'.`);
        }
        // URL type doesn't have a persistent "running" state
        return;
      default:
        this.messagesService.showError(`Unknown app type for '${app.name}'.`);
        return;
    }

    // this.shellService.runCommand(command, (result) => {
    //   if (result.success) {
    //     this.messagesService.showSuccess(successMessage);
    //     this.appStates[app.id] = 'running';
    //   } else {
    //     this.messagesService.showError(`Failed to start '${app.name}'. Error: ${result.error}`);
    //     this.appStates[app.id] = 'stopped';
    //   }
    // });

    // Simulate success for now
    this.messagesService.showSuccess(successMessage);
    this.appStates[app.id] = 'running';
  }

  // Stop an app (simulate backend, update state, show message)
  private async stopApp(app: ManagedApp): Promise<void> {
    let command: string[] = [];
    let successMessage = `App '${app.name}' stopped successfully.`;

    switch (app.type) {
      case 'docker':
        command = [
          'docker-compose',
          '-f',
          app.entrypoint ? `"${app.entrypoint}"` : 'docker-compose.yml',
          'stop',
          app.service_name || app.id,
        ];
        break;
      case 'local':
      case 'desktop':
        // Stopping local/desktop apps is not supported in this mock
        this.messagesService.showInfo(
          `Stopping local/desktop app '${app.name}' is not automatically supported. Please close it manually.`
        );
        this.appStates[app.id] = 'stopped';
        return;
      case 'url':
        // Cannot "stop" a URL
        return;
      default:
        this.messagesService.showError(`Unknown app type for '${app.name}'.`);
        return;
    }

    // this.shellService.runCommand(command, (result) => {
    //   if (result.success) {
    //     this.messagesService.showSuccess(successMessage);
    //     this.appStates[app.id] = 'stopped';
    //   } else {
    //     this.messagesService.showError(`Failed to stop '${app.name}'. Error: ${result.error}`);
    //     // State might still be 'running', but we'll assume it stopped on error for UI simplicity
    //     this.appStates[app.id] = 'running';
    //   }
    // });

    // Simulate success for now
    this.messagesService.showSuccess(successMessage);
    this.appStates[app.id] = 'stopped';
  }

  // For future: replace runCommand logic with REST API calls to backend
}