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
  // This state is managed at runtime by the component
  state?: 'running' | 'stopped' | 'unknown';
  index?: number;
  value?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AppsManagerService {
  
    // Data would be loaded from an external source in a real app
  private allAppsData = {
    apps: [
      {
        id: 'cms-webportal',
        name: 'CMS & WebPortal (Production)',
        category: 'Web Portal',
        type: 'docker',
        description: 'Production-ready CMS & WebPortal with admin features.',
        url: 'http://localhost:8080',
        enabled: true,
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
      },
      {
        id: 'vanna-ai',
        name: 'Vanna.AI',
        category: 'Database Management',
        type: 'docker',
        description: 'AI-powered text-to-SQL agent.',
        url: 'http://localhost:8084',
        enabled: true,
      },
      {
        id: 'redash',
        name: 'Redash',
        category: 'BI & Visualization',
        type: 'docker',
        description: 'Query builder and dashboard tool.',
        url: 'http://localhost:5000',
        enabled: true,
      },
      {
        id: 'superset',
        name: 'Apache Superset',
        category: 'BI & Visualization',
        type: 'docker',
        description: 'Enterprise-ready data visualization platform.',
        url: 'http://localhost:8088',
        enabled: false,
      },
      {
        id: 'rundeck',
        name: 'Rundeck (Local)',
        category: 'Automation & Job Scheduling',
        type: 'local',
        description: 'Runbook automation installed directly on the host.',
        url: 'http://localhost:4440',
        enabled: true,
      },
      {
        id: 'vscode',
        name: 'VS Code',
        icon: 'fa fa-free-code-camp',
        category: 'Developer Tools',
        type: 'desktop',
        description: 'Launch local installation of Visual Studio Code.',
        enabled: true,
      },
      {
        id: 'notepad++',
        name: 'Notepad++ (Local)',
        category: 'Developer Tools',
        type: 'desktop',
        description: 'Launch local installation of Notepad++.',
        enabled: false,
      },
    ],
  };

  constructor(private shellService: ShellService,
    private messagesService: ToastrMessagesService) { }

   public getAppById(id: string): ManagedApp | undefined {
    const appData = this.allAppsData.apps.find((app) => app.id === id);

    if (!appData) {
      return undefined;
    }

    // Map to the ManagedApp interface
    return {
      id: appData.id,
      name: appData.name,
      description: appData.description,
      type: appData.type as 'local' | 'docker' | 'url',
      icon: appData.icon,
      url: appData.url,
    };
  }

  toggleApp(app: ManagedApp): void {
    if (app.state === 'running') {
      this.stopApp(app);
    } else {
      this.startApp(app);
    }
  }

  private startApp(app: ManagedApp): void {
    let command: string[] = [];
    let successMessage = `App '${app.name}' launched successfully.`;

    switch (app.type) {
      case 'docker':
        command = ['docker-compose', '-f', `"${app.entrypoint}"`, 'up', '-d', app.service_name];
        break;
      case 'local':
        // Assuming command is a single string that can be split
        command = app.command.split(' ');
        break;
      case 'url':
        this.shellService.openExternal(app.url);
        this.messagesService.showSuccess(successMessage);
        // URL type doesn't have a persistent "running" state
        return;
    }

    this.shellService.runCommand(command, (result) => {
      if (result.success) {
        this.messagesService.showSuccess(successMessage);
        app.state = 'running';
      } else {
        this.messagesService.showError(`Failed to start '${app.name}'. Error: ${result.error}`);
        app.state = 'stopped';
      }
    });
  }

  private stopApp(app: ManagedApp): void {
    let command: string[] = [];
    let successMessage = `App '${app.name}' stopped successfully.`;

    switch (app.type) {
      case 'docker':
        command = ['docker-compose', '-f', `"${app.entrypoint}"`, 'stop', app.service_name];
        break;
      case 'local':
        // Stopping local apps is complex and often requires process management (e.g., finding PID and killing)
        // This is a simplification. The actual command might need to be defined in apps.json.
        this.messagesService.showInfo(`Stopping local app '${app.name}' is not automatically supported. Please close it manually.`);
        app.state = 'stopped'; // Manually update state
        return;
      case 'url':
        // Cannot "stop" a URL
        return;
    }

     this.shellService.runCommand(command, (result) => {
      if (result.success) {
        this.messagesService.showSuccess(successMessage);
        app.state = 'stopped';
      } else {
        this.messagesService.showError(`Failed to stop '${app.name}'. Error: ${result.error}`);
        // State might still be 'running', but we'll assume it stopped on error for UI simplicity
        app.state = 'running';
      }
    });
  }
  }
