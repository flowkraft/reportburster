import { Injectable } from '@angular/core';
import { ShellService } from '../../providers/shell.service';
import { ToastrMessagesService } from '../../providers/toastr-messages.service';
import { ApiService } from '../../providers/api.service';
import { StateStoreService } from '../../providers/state-store.service';

export interface ManagedApp {
  id: string;
  name: string;
  description: string;
  category?: string;
  type: 'docker' | 'local' | 'desktop' | 'url';
  icon?: string;
  entrypoint?: string;
  service_name?: string;
  command?: string;
  url?: string;
  state?: 'running' | 'stopped' | 'unknown' | 'starting' | 'stopping' | 'error';
  index?: number;
  value?: string;
  startCmd?: string;
  stopCmd?: string;
  lastOutput?: string;
  currentCommandValue?: string;
  tags?: string[];
  visible?: boolean;
  launch?: boolean; // Set to false to hide Launch button (e.g., for headless/API-only apps)
  // Build flags for Flowkraft apps
  buildOnStart?: boolean;
  noCacheOnStart?: boolean;
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
        name: 'WebPortal / Customer Portal',
        icon: 'fa fa-users',
        category: 'Web Portal',
        type: 'docker',
        description: 'Launch your customer portal in minutes <a href="https://www.reportburster.com/docs/web-portal-cms" target="_blank"><i class="fa fa-book"></i>&nbsp;see how</a>',
        url: 'http://localhost:8080/wp-admin',
        entrypoint: 'cms-webportal-playground/docker-compose.yml',
        service_name: 'cms-webportal-playground',
        startCmd: 'service app start cms-webportal-playground 8080',
        stopCmd: 'service app stop cms-webportal-playground',
        tags: ['cms', 'webportal', 'admin-panel', 'customer-portal', 'cms', 'wordpress'],
        visible: true,
      },
      {
        id: 'flowkraft-frend-grails',
        name: 'Flowkraft\'s Frontend App (Dashboards & Portals)',
        icon: 'fa fa-cube',
        category: 'Frontend Tools',
        type: 'docker',
        description: 'Build reporting dashboards and customer portals quickly',
        url: 'http://localhost:8481',
        entrypoint: 'flowkraft/docker-compose.yml',
        service_name: 'frend-grails-playground',
        startCmd: 'service app start frend-grails-playground 8481',
        stopCmd: 'service app stop frend-grails-playground',
        tags: ['flowkraft', 'dashboards', 'customer-portal'],
        visible: true,
      },
      {
        id: 'flowkraft-admin-grails',
        name: 'Flowkraft\'s Admin Panel App',
        icon: 'fa fa-cube',
        category: 'Admin Tools',
        type: 'docker',
        description: 'Build admin user interfaces on top of your business data',
        url: 'http://localhost:8482',
        entrypoint: 'flowkraft/docker-compose.yml',
        service_name: 'admin-grails-playground',
        startCmd: 'service app start admin-grails-playground 8482',
        stopCmd: 'service app stop admin-grails-playground',
        tags: ['flowkraft', 'admin-panel', 'cms'],
        visible: true,
      },
      {
        id: 'flowkraft-bkend-boot-groovy',
        name: 'Flowkraft\'s Backend App (Automation & Job Scheduling)',
        icon: 'fa fa-cogs',
        category: 'Backend Services',
        type: 'docker',
        description: 'Quickly deploy / run automation flows across your business systems',
        url: 'http://localhost:8483',
        entrypoint: 'flowkraft/docker-compose.yml',
        service_name: 'bkend-boot-groovy-playground',
        startCmd: 'service app start bkend-boot-groovy-playground 8483',
        stopCmd: 'service app stop bkend-boot-groovy-playground',
        tags: ['flowkraft', 'backend', 'automation', 'job-scheduling'],
        visible: true,
        launch: false, // No UI - API/automation only
      },
       {
        id: 'rundeck',
        name: 'Rundeck (Automation & Job Scheduling)',
        icon: 'fa fa-cogs',
        category: 'Automation & Job Scheduling',
        type: 'docker',
        description: 'Runbook automation service with a web console, command line tools and a WebAPI. It lets you easily standardize tasks to improve operational quality by deploying automation across your organization.',
        url: 'http://localhost:4440',
        entrypoint: 'rundeck/docker-compose.yml',
        service_name: 'rundeck',
        startCmd: 'service app start rundeck 4440',
        stopCmd: 'service app stop rundeck',
        tags: ['automation', 'job-scheduling'],
        visible: true,
      },
      {
        id: 'cloudbeaver',
        name: 'CloudBeaver (Database Manager)',
        icon: 'fa fa-database',
        category: 'Database Management',
        type: 'docker',
        description: 'The professional data management software trusted by experts.',
        url: 'http://localhost:8978',
        entrypoint: 'cloudbeaver/docker-compose.yml',
        service_name: 'cloudbeaver',
        startCmd: 'service app start cloudbeaver 8978',
        stopCmd: 'service app stop cloudbeaver',
        tags: ['database-management'],
        visible: true,
      },
      {
        id: 'matomo',
        name: 'Matomo (Web Analytics)',
        icon: 'fa fa-bar-chart',
        category: 'Analytics & Tracking',
        type: 'docker',
        description: 'Open-source web analytics platform, a privacy-friendly alternative to Google Analytics.',
        url: 'http://localhost:8081',
        entrypoint: 'matomo/docker-compose.yml',
        service_name: 'matomo',
        startCmd: 'service app start matomo 8081',
        stopCmd: 'service app stop matomo',
        tags: ['analytics', 'web-analytics'],
        visible: true,
      },
      {
        id: 'docuseal',
        name: 'Docuseal (Document Signing)',
        icon: 'fa fa-file-signature',
        category: 'Document Management',
        type: 'docker',
        description: 'Self-hosted document signing platform with secure workflows and audit trails.',
        url: 'http://localhost:3001',
        entrypoint: 'docuseal/docker-compose.yml',
        service_name: 'docuseal',
        startCmd: 'service app start docuseal 3001',
        stopCmd: 'service app stop docuseal',
        tags: ['document-signing', 'security'],
        visible: true,
      },
      {
        id: 'metabase',
        name: 'Metabase',
        icon: 'fa fa-line-chart',
        category: 'BI & Visualization',
        type: 'docker',
        description: 'Open Source business intelligence and analytics platform.',
        url: 'http://localhost:3000',
        entrypoint: 'metabase/docker-compose.yml',
        service_name: 'metabase',
        startCmd: 'service app start metabase 3000',
        stopCmd: 'service app stop metabase',
        tags: ['bi', 'analytics', 'visualization'],
        visible: true,
      },
      {
        id: 'clickhouse',
        name: 'ClickHouse (OLAP Database)',
        icon: 'fa fa-database',
        category: 'Databases & Analytics',
        type: 'docker',
        description: 'High-performance columnar OLAP (real-time) database for analytics and reporting workloads.',
        url: 'http://localhost:8123',
        entrypoint: 'clickhouse/docker-compose.yml',
        service_name: 'clickhouse',
        startCmd: 'service app start clickhouse 8123',
        stopCmd: 'service app stop clickhouse',
        tags: ['database', 'olap', 'analytics'],
        visible: true,
        launch: false, // No UI - API/database server only
      },
      {
        id: 'vanna-ai',
        name: 'Vanna.AI',
        category: 'Database Management',
        type: 'docker',
        description: 'AI-powered text-to-SQL agent.',
        url: 'http://localhost:8084',

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

        entrypoint: 'docker-compose.yml',
        service_name: 'superset',
      },
      {
        id: 'vscode',
        name: 'VS Code',
        icon: 'fa fa-free-code-camp',
        category: 'Developer Tools',
        type: 'desktop',
        description: 'Launch local installation of Visual Studio Code.',

        command: 'code',
        visible: false,
      },
      {
        id: 'notepad++',
        name: 'Notepad++ (Local)',
        category: 'Developer Tools',
        type: 'desktop',
        description: 'Launch local installation of Notepad++.',

        command: 'notepad++',
      },
    ],
  };

  constructor(
    private shellService: ShellService,
    private messagesService: ToastrMessagesService,
    private apiService: ApiService,
    private stateStore: StateStoreService,
  ) { }

  // Add method to fetch statuses from API
  public async refreshAllStatuses(): Promise<void> {
    try {
      const response = await this.apiService.get('/jobman/system/services/status');
      const statuses: any[] = response;  // Array of {name, status, ports}

      // Update app states based on API response
      for (const app of this.allAppsData.apps) {
        // Match by: exact service_name, container name contains service_name, or container name contains app.id
        const service = statuses.find(s => 
          s.name === app.service_name || 
          s.name.includes(app.service_name) ||
          s.name.includes(app.id) ||
          (app.service_name && s.name.includes(app.service_name.replace(/-playground$/, '')))
        );
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
    const appsToReturn = this.allAppsData.apps.filter(app => app.visible === true);
    return appsToReturn.map(app => ({
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
          try { app.state = 'stopped'; } catch (e) { }
          try { app.lastOutput = this.appLastOutputs[app.id]; } catch (e) { }
          try { app.currentCommandValue = app.startCmd; } catch (e) { }
        } else {
          this.appStates[app.id] = 'error';
          this.appLastOutputs[app.id] = (result && result.output) || `✗ Failed to stop ${app.name}.`;
          try { app.state = 'error'; } catch (e) { }
          try { app.lastOutput = this.appLastOutputs[app.id]; } catch (e) { }
        }
        // Automatic refresh after action to get authoritative state from API
        try {
          await this.refreshAllStatuses();
          const apiState = this.appStates[app.id] ?? app.state;
          try { app.state = apiState; } catch (e) { }
        } catch (e) {
          console.error('refreshAllStatuses failed after stop:', e);
        }
        resolve();
      });
    });
  }

}