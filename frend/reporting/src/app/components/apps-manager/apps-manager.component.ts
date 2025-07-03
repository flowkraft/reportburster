import { Component, Input, OnInit } from '@angular/core';
import { ShellService } from '../../providers/shell.service';
import { ToastrMessagesService } from '../../providers/toastr-messages.service';

// This interface should be defined in a shared models file
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
  state: 'running' | 'stopped' | 'unknown';
}

@Component({
  selector: 'dburst-apps-manager',
  templateUrl: './apps-manager.component.html',
})
export class AppsManager implements OnInit {
  @Input() apps: ManagedApp[] = [];
  @Input() displayMode: 'dropUp' | 'dropDown' | 'expandedList' = 'dropDown';

  // We can add more specific inputs if needed, e.g., for single-app display
  // @Input() appId: string;

  constructor(
    private shellService: ShellService,
    private messagesService: ToastrMessagesService
  ) {}

  ngOnInit(): void {
    // Initialize app states, perhaps by checking their status if possible
    // For now, we'll default them to 'unknown' or 'stopped'
    this.apps.forEach(app => app.state = 'stopped');
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