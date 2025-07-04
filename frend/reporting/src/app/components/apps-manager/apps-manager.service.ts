import { Injectable } from '@angular/core';

export interface ManagedApp {
  id: string;
  name: string;
  description: string;
  type: 'docker' | 'local' | 'url';
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
        category: 'Database Management',
        type: 'docker',
        description: 'Web-based database manager.',
        url: 'http://localhost:8978',
        enabled: true,
      },
      {
        id: 'vanna-ai',
        name: 'Vanna.ai',
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
        name: 'Code',
        category: 'Developer Tools',
        type: 'local',
        description: 'Launch local installation of Visual Studio Code.',
        enabled: true,
      },
      {
        id: 'notepad++',
        name: 'Notepad++ (Local)',
        category: 'Developer Tools',
        type: 'local',
        description: 'Launch local installation of Notepad++.',
        enabled: false,
      },
    ],
  };

  constructor() {}

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
      url: appData.url,
    };
  }
  }
