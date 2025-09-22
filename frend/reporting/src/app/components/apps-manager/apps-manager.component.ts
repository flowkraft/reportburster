import { Component, Input, OnInit, ChangeDetectorRef } from '@angular/core';
import { AppsManagerService, ManagedApp } from './apps-manager.service';
import { ConfirmService } from '../dialog-confirm/confirm.service';
import { StateStoreService } from '../../providers/state-store.service';
import { Router } from '@angular/router';

// This interface should be defined in a shared models file


@Component({
  selector: 'dburst-apps-manager',
  templateUrl: './apps-manager.template.html',
})
export class AppsManagerComponent implements OnInit {
  @Input() apps: ManagedApp[] = [];
  @Input() dropdownDirection: 'up' | 'down' | 'expandedList' = 'down';

  // We can add more specific inputs if needed, e.g., for single-app display
  // @Input() appId: string;

  constructor(
    protected appsManagerService: AppsManagerService,
    protected confirmService: ConfirmService,
    protected stateStore: StateStoreService, 
    protected router: Router,
    //protected changeDetectorRef: ChangeDetectorRef

  ) { }

  async ngOnInit(): Promise<void> {
    // Respect the input [apps] if provided; otherwise, fetch all
    if (!this.apps || this.apps.length === 0) {
      this.apps = await this.appsManagerService.getAllApps();
    }
    // Refresh statuses from API
    await this.appsManagerService.refreshAllStatuses();
    // Update the provided/input apps with refreshed states
    if (this.apps && this.apps.length > 0) {
      this.apps = await Promise.all(
        this.apps.map(app => this.appsManagerService.getAppById(app.id).then(updated => updated || app))
      );
    }
  }


  async onToggleApp(app: ManagedApp) {
    
    // Check if Docker is required and not installed, and only for starting (not stopping)
    if (app.state !== 'running' && !this.stateStore?.configSys?.sysInfo?.setup?.docker?.isDockerOk) {
      const message = `Docker is not installed and it is required for starting the <strong>${app.name}</strong> application.<br><br>Would you like to see how to install it?`;

      this.confirmService.askConfirmation({
        message: message,
        confirmAction: () => {
          // Navigate to help section with active tab
          this.router.navigate(['/help', 'starterPacksMenuSelected'], { queryParams: { activeTab: 'extraPackagesTab' } });
        },
        cancelAction: () => {
          // Do nothing on No - don't proceed with toggle
        }
      });
      return;  // Exit without proceeding to normal toggle
    }
    
    let dialogQuestion = `Stop ${app.name}?`;
    if (app.state !== 'running') {
      // Default start message with patience note
      dialogQuestion = `Start ${app.name}? This may take a few minutes, please be patient.`;
      
      // Special message for cms-webportal if not provisioned
      if (app.id === 'cms-webportal' && !this.stateStore?.configSys?.sysInfo?.setup?.portal?.isProvisioned) {
        dialogQuestion = `Start ${app.name}? Since the portal is not yet provisioned, the first launch may take considerably more time (please be patient). Subsequent start/stop cycles will be considerably faster.`;
      }
    }

    this.confirmService.askConfirmation({
      message: dialogQuestion,
      confirmAction: async () => {
        // Set immediate UI feedback
        app.state = app.state === 'running' ? 'stopping' : 'starting';
        //this.changeDetectorRef.detectChanges();  // Force UI update

        await this.appsManagerService.toggleApp(app);
        // No need to re-fetch; the service callback updates the app object
        //this.changeDetectorRef.detectChanges();  // Ensure final state is reflected
      }
    });
  }

  sanitizeAppName(name: string): string {
    return name ? name.replace(/\s/g, '') : '';
  }

  onLaunch(app: ManagedApp, event: MouseEvent) {
    event.stopPropagation();
    event.preventDefault();
    if (!app || !app.url) return;
    if (app.state !== 'running') return;
    window.open(app.url, '_blank', 'noopener');
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }

}