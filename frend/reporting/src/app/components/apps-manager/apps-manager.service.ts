import { Injectable } from '@angular/core';
import { ShellService } from '../../providers/shell.service';
import { ToastrMessagesService } from '../../providers/toastr-messages.service';
import { ApiService } from '../../providers/api.service';
import { StateStoreService } from '../../providers/state-store.service';
import { PollingHelper } from '../../providers/polling.helper';

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
  website?: string;
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
  // Demo login info HTML (shown when app is running)
  demoInfo?: string;
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
  private allAppsData: { apps: ManagedApp[] } = {
    apps: [
      {
        id: 'cms-webportal',
        name: 'WebPortal / Customer Portal',
        icon: 'fa fa-users',
        category: 'Web Portal',
        type: 'docker',
        description: 'The fastest way to build your <em>You Name It</em> <strong>Web Portal</strong> - could be Employee Portal, Customer Portal, Partner Portal, Student Portal or any other Self-Service Portal <a href="https://www.reportburster.com/docs/web-portal-cms" target="_blank"><i class="fa fa-book"></i>&nbsp;see how</a>',
        url: 'http://localhost:8080/wp-admin',
        demoInfo: `
          <div style="margin-top: 18px; padding: 14px 16px; background: #f0f7fa; border: 1px solid #d0e4ed; border-radius: 6px; font-size: 0.88em; color: #333;">
            <div style="margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #d0e4ed; color: #555;">
              <i class="fa fa-key" style="color: #5a9bb8; margin-right: 6px;"></i>Try the demo logins
            </div>
            <div style="line-height: 1.85;">
              <div style="margin-bottom: 8px;">
                <span style="color: #666;">Admin:</span>
                <span style="font-weight: 600; color: #2c5282; margin-left: 8px; background: #fff; padding: 2px 8px; border-radius: 3px; border: 1px solid #d0e4ed;">u2changeme</span>
                <span style="color: #bbb; margin: 0 6px;">/</span>
                <span style="font-weight: 600; color: #2c5282; background: #fff; padding: 2px 8px; border-radius: 3px; border: 1px solid #d0e4ed;">p2changeme123!</span>
                <a href="http://localhost:8080/wp-admin" target="_blank" style="color: #5a9bb8;">admin area</a>
                <span style="color: #ddd; margin: 0 6px;">•</span>
                <a href="http://localhost:8080/my-documents" target="_blank" style="color: #5a9bb8;">frontend</a>
              </div>
              <div>
                <span style="color: #666;">Employee:</span>
                <span style="font-weight: 600; color: #2c5282; margin-left: 8px; background: #fff; padding: 2px 8px; border-radius: 3px; border: 1px solid #d0e4ed;">clyde.grew</span>
                <span style="color: #bbb; margin: 0 6px;">/</span>
                <span style="font-weight: 600; color: #2c5282; background: #fff; padding: 2px 8px; border-radius: 3px; border: 1px solid #d0e4ed;">demo1234</span>
                <a href="http://localhost:8080/my-documents" target="_blank" style="color: #5a9bb8;">frontend</a>
                <span style="color: #888; margin-left: 12px;">— sees only own docs</span>
              </div>
            </div>
            <div style="margin-top: 12px; font-size: 0.85em; color: #999;">
              Other employees: kyle.butford, alfreda.waldback (password: demo1234)
            </div>
          </div>
        `,

        entrypoint: 'cms-webportal-playground/docker-compose.yml',
        service_name: 'cms-webportal-playground',
        startCmd: 'service app start cms-webportal-playground 8080',
        stopCmd: 'service app stop cms-webportal-playground',
        tags: ['cms', 'webportal', 'backend', 'frontend', 'admin-panel', 'customer-portal', 'cms', 'wordpress', 'ReportBurster\'s App'],
        visible: true,
      },
      {
        id: 'flowkraft-frend-next',
        name: 'Flowkraft\'s Frontend App (Dashboards & Portals)',
        icon: 'fa fa-cube',
        category: 'Frontend Tools',
        type: 'docker',
        description: 'Bring your reports to the <strong>frontend</strong>: dashboards, portals, anywhere your users need them. Use our \'quick to get things done\' (highly capable and fully customizable) portal, or <strong>embed ReportBurster reports</strong> directly into your existing web applications and portals — responsive, secure, and themeable to match your look and feel. <br/><br/>Wondering if it\'s hard? Not at all!&nbsp;<a href="https://www.reportburster.com/docs/dashboards-self-service-portal" target="_blank"><i class="fa fa-book"></i>&nbsp;learn more</a>',
        url: 'http://localhost:8481',
        entrypoint: 'flowkraft/docker-compose.yml',
        service_name: 'frend-next-playground',
        startCmd: 'service app start frend-next-playground 8481',
        stopCmd: 'service app stop frend-next-playground',
        tags: ['flowkraft', 'frontend', 'dashboards', 'customer-portal', 'next.js', 'react', 'ReportBurster\'s App'],
        visible: true,
      },
      {
        id: 'flowkraft-admin-grails',
        name: 'Flowkraft\'s Admin Panel App',
        icon: 'fa fa-cube',
        category: 'Admin Tools',
        type: 'docker',
        description: 'Easily build admin user interfaces on top of your business data',
        url: 'http://localhost:8482',
        entrypoint: 'flowkraft/docker-compose.yml',
        service_name: 'admin-grails-playground',
        startCmd: 'service app start admin-grails-playground 8482',
        stopCmd: 'service app stop admin-grails-playground',
        tags: ['flowkraft', 'admin-panel', 'backend', 'cms', 'ReportBurster\'s App'],
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
        tags: ['flowkraft', 'backend', 'automation', 'job-scheduling', 'ReportBurster\'s App'],
        visible: true,
        launch: false, // No UI - API/automation only
      },
      {
        id: 'flowkraft-ai-crew',
        name: 'FlowKraft AI Crew (Agent Management)',
        icon: 'fa fa-robot',
        category: 'AI & Agents',
        type: 'docker',
        description: 'AI Agent Management Dashboard powered by Letta. Provision and manage Greek advisor agents (Athena, Hephaestus, Hermes) for data modeling, ETL/automation, and UI guidance.',
        url: 'http://localhost:8484',
        entrypoint: 'flowkraft/_ai-crew/docker-compose.yml',
        service_name: 'ai-crew-frontend',
        startCmd: 'service app start ai-crew-frontend 8484',
        stopCmd: 'service app stop ai-crew-frontend',
        tags: ['flowkraft', 'ai-agents'],
        visible: true,
        launch: true,
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
        website: 'https://www.rundeck.com/',
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
        website: 'https://cloudbeaver.io/',
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
        website: 'https://matomo.org/',
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
        website: 'https://docuseal.com/',
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
        website: 'https://www.metabase.com/',
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
        website: 'https://clickhouse.com/',
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
        state: 'stopped' as ManagedApp['state'],
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
        state: 'stopped' as ManagedApp['state'],
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
        state: 'stopped' as ManagedApp['state'],
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
        state: 'stopped' as ManagedApp['state'],
      },
      {
        id: 'notepad++',
        name: 'Notepad++ (Local)',
        category: 'Developer Tools',
        type: 'desktop',
        description: 'Launch local installation of Notepad++.',

        command: 'notepad++',
        state: 'stopped' as ManagedApp['state'],
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
  public async refreshAllStatuses(skipProbe: boolean = false): Promise<void> {
    try {
      // Refresh system info (docker status) along with service statuses
      await this.refreshSystemInfo();

      const response = await this.apiService.get('/jobman/system/services/status', { skipProbe });
      const statuses: any[] = response;  // Array of {name, status, ports, health}

      // Use debug-level logging to avoid noisy console output in normal operation
      console.debug('[AppsManager] API response statuses:', statuses);

      // Update app states based on API response
      for (const app of this.allAppsData.apps) {
        // Match by: exact service_name, container name contains service_name, or container name contains app.id
        // Prefer exact/endsWith matches to avoid matching sibling containers like -db or -cli
        const service = statuses.find(s => {
          const name = (s.name || '').toLowerCase();
          const svc = (app.service_name || '').toLowerCase();
          const id = (app.id || '').toLowerCase();
          if (!svc && !id) return false;
          if (svc && (name === svc || name === `rb-${svc}` || name.endsWith(`-${svc}`) || name.endsWith(`/${svc}`))) return true;
          if (id && (name === id || name === `rb-${id}` || name.endsWith(`-${id}`) || name.endsWith(`/${id}`))) return true;
          return false;
        });

        // Debug-level output so it only appears when debug logging is enabled
        console.debug(`[AppsManager] App ${app.id}: service_name=${app.service_name}, matched service=`, service);

        if (service) {
          // Use shared helper to map backend status to UI state (handles healthcheck states)
          this.appStates[app.id] = PollingHelper.mapBackendStatusToUiState(service.status);

          // If app has no `url`, derive one from the container's exposed ports (use first host-mapped port)
          try {
            if (!app.url && service.ports) {
              // Example of service.ports: "0.0.0.0:8080->80/tcp, [::]:8080->80/tcp"
              const portMatch = (service.ports || '').match(/:(\d+)->/);
              if (portMatch && portMatch[1]) {
                app.url = `http://localhost:${portMatch[1]}`;
                console.log(`[AppsManager] Derived URL for app ${app.id}: ${app.url}`);
              }
            }
          } catch (e) {
            console.warn('[AppsManager] Failed to derive app.url from service.ports', e);
          }

          // Track provisioned state for cms-webportal
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

  // Fetch authoritative system info (Docker status) from backend
  private async refreshSystemInfo(): Promise<void> {
    try {
      const backendSystemInfo = await this.apiService.get('/jobman/system/info');
      if (backendSystemInfo) {
        const dockerSetup = this.stateStore.configSys.sysInfo.setup.docker;
        dockerSetup.isDockerInstalled = backendSystemInfo.isDockerInstalled;
        dockerSetup.isDockerDaemonRunning = backendSystemInfo.isDockerDaemonRunning;

        // Calculate isDockerOk based on authoritative backend status
        dockerSetup.isDockerOk = backendSystemInfo.isDockerInstalled && backendSystemInfo.isDockerDaemonRunning;

        if (backendSystemInfo.dockerVersion && backendSystemInfo.dockerVersion !== 'DOCKER_NOT_INSTALLED') {
          dockerSetup.version = backendSystemInfo.dockerVersion;
        }
      }
    } catch (e) {
      console.warn('[AppsManager] Failed to fetch backend system info', e);
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
          // Don't immediately set to 'running' - keep as 'starting' until healthcheck passes
          // The refreshAllStatuses() will set the correct state based on Docker's health status
          this.appStates[app.id] = 'starting';
          this.appLastOutputs[app.id] = result.output || `✓ ${app.name} container started, waiting for health check...`;
          app.state = 'starting';
          app.lastOutput = this.appLastOutputs[app.id];
        } else {
          this.appStates[app.id] = 'error';
          this.appLastOutputs[app.id] = (result && result.output) || `✗ Failed to start ${app.name}.`;
          app.state = 'error';
          app.lastOutput = this.appLastOutputs[app.id];
          app.currentCommandValue = app.startCmd;
        }
        await this.refreshAllStatuses(PollingHelper.hasTransitionalItems(this.allAppsData.apps));
        const apiState = this.appStates[app.id] ?? app.state;
        app.state = apiState;
        // Always sync currentCommandValue with actual state after refresh
        app.currentCommandValue = (apiState === 'running' || apiState === 'starting') ? app.stopCmd : app.startCmd;
        //console.log('After refresh, appStates:', JSON.stringify(this.appStates[app.id]));
        resolve();
      });
    });
  }

  // Reprovision action for WordPress CMS. Executes startCmd with --reprovision (alias to rebuild-theme)
  public async reprovision(app: ManagedApp): Promise<void> {
    if (app.type !== 'docker') {
      this.messagesService.showError(`Reprovision is only supported for Docker apps`);
      return;
    }
    if (!app.startCmd) {
      this.messagesService.showError(`No start command defined for '${app.name}'.`);
      return;
    }

    const cmdParts = app.startCmd.split(' ');
    if (!cmdParts.includes('--reprovision')) cmdParts.push('--reprovision');

    this.appStates[app.id] = 'starting';
    this.appLastOutputs[app.id] = 'Starting theme rebuild...';

    return new Promise<void>((resolve) => {
      this.shellService.runBatFile(cmdParts, `Rebuilding theme for ${app.name}`, async (result) => {
        if (result && result.success) {
          this.appStates[app.id] = 'starting';
          this.appLastOutputs[app.id] = result.output || `✓ Reprovision started for ${app.name}`;
          app.state = 'starting';
          app.lastOutput = this.appLastOutputs[app.id];
        } else {
          this.appStates[app.id] = 'error';
          this.appLastOutputs[app.id] = (result && result.output) || `✗ Failed to reprovision ${app.name}.`;
          app.state = 'error';
          app.lastOutput = this.appLastOutputs[app.id];
        }
        await this.refreshAllStatuses(PollingHelper.hasTransitionalItems(this.allAppsData.apps));
        const apiState = this.appStates[app.id] ?? app.state;
        app.state = apiState;
        app.currentCommandValue = (apiState === 'running' || apiState === 'starting') ? app.stopCmd : app.startCmd;
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
          await this.refreshAllStatuses(PollingHelper.hasTransitionalItems(this.allAppsData.apps));
          const apiState = this.appStates[app.id] ?? app.state;
          try { app.state = apiState; } catch (e) { }
          // Always sync currentCommandValue with actual state after refresh
          try { app.currentCommandValue = apiState === 'running' ? app.stopCmd : app.startCmd; } catch (e) { }
        } catch (e) {
          console.error('refreshAllStatuses failed after stop:', e);
        }
        resolve();
      });
    });
  }
}