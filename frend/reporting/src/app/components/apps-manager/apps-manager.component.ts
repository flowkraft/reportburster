import { Component, Input, OnInit, ChangeDetectorRef, OnDestroy, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { AppsManagerService, ManagedApp } from './apps-manager.service';
import { ConfirmService } from '../dialog-confirm/confirm.service';
import { StateStoreService } from '../../providers/state-store.service';
import { ToastrMessagesService } from '../../providers/toastr-messages.service';
import { Router } from '@angular/router';
import { AiManagerComponent, AiManagerLaunchConfig } from '../ai-manager/ai-manager.component';
import { PollingHelper } from '../../providers/polling.helper';

// This interface should be defined in a shared models file

@Component({
  selector: 'dburst-apps-manager',
  templateUrl: './apps-manager.template.html',
})
export class AppsManagerComponent implements OnInit, OnChanges, OnDestroy {
  // Search and Tag Filter State
  searchTerm: string = '';
  selectedTag: string | null = null;
  allTags: string[] = [];
  isLoading: boolean = true;
  isRefreshing: boolean = false;

  // Polling subscription for apps in transitional states (starting/stopping)
  private pollingSubscription: Subscription | null = null;

  // Periodic sync interval — keeps embedded instances in sync when state changes externally
  private syncInterval: any;

  // Search debounce
  public searchSubject = new Subject<string>();
  private searchSubscription: Subscription | null = null;

  @Input() inputAppsToShow: ManagedApp[] | string[] | undefined;
  // Actual list displayed by the UI (either all apps after filtering, or provided input app(s))
  public visibleApps: ManagedApp[] = [];
  @Input() dropdownDirection: 'up' | 'down' | 'expandedList' = 'down';

  /** Optional: When provided, renders an "Ask AI" button next to Start/Stop in expandedList mode */
  @Input() askAiForHelpOutputTypeCode: string = '';

  /** Optional: When false, hides dev-oriented controls (command input, build flags). Default: true */
  @Input() showDevButtons: boolean = true;

  /** Reference to the embedded AI manager component */
  @ViewChild('aiManagerInstance') aiManagerInstance: AiManagerComponent | undefined;

  // Keep an unfiltered master list for applying filters
  private masterApps: ManagedApp[] = [];

  // Parent-provided apps to show

  // We can add more specific inputs if needed, e.g., for single-app display
  // @Input() appId: string;

  constructor(
    protected appsManagerService: AppsManagerService,
    protected confirmService: ConfirmService,
    protected stateStore: StateStoreService,
    protected router: Router,
    protected cdRef: ChangeDetectorRef,
    protected sanitizer: DomSanitizer,
    protected messagesService: ToastrMessagesService,
  ) { }

  /**
   * Returns true if Docker is installed and available.
   */
  get isDockerAvailable(): boolean {
    return !!this.stateStore?.configSys?.sysInfo?.setup?.docker?.isDockerOk;
  }

  /**
   * Returns true if the app is running.
   */
  isAppRunning(app: ManagedApp): boolean {
    return app.state === 'running';
  }

  isCmsWebPortal(app: ManagedApp | undefined): boolean {
    if (!app) return false;
    return ['cms-webportal', 'cms-webportal-playground'].includes(app.id);
  }

  isFlowkraftApp(app: ManagedApp | undefined): boolean {
    if (!app) return false;
    return ['flowkraft-grails', 'flowkraft-next', 'flowkraft-bkend-boot-groovy', 'flowkraft-ai-hub', 'flowkraft-chat2db'].includes(app.id);
  }

  isStartingOrStopping(app: ManagedApp | undefined): boolean {
    if (!app || !app.state) return false;
    return app.state === 'starting' || app.state === 'stopping';
  }

  isAppStopped(app: ManagedApp | undefined): boolean {
    if (!app || !app.state) return false;
    return app.state === 'stopped' || app.state === 'unknown' || app.state === 'error';
  }

  isAppStarting(app: ManagedApp | undefined): boolean {
    if (!app || !app.state) return false;
    return app.state === 'starting';
  }

  isAppStopping(app: ManagedApp | undefined): boolean {
    if (!app || !app.state) return false;
    return app.state === 'stopping';
  }

  isAppError(app: ManagedApp | undefined): boolean {
    if (!app || !app.state) return false;
    return app.state === 'error';
  }

  /**
   * Returns true if the app requires Docker (type === 'docker') and Docker is NOT available.
   * Used in the template to disable Start button and show notice.
   */
  isDockerRequiredButMissing(app: ManagedApp): boolean {
    return app.type === 'docker' && !this.isDockerAvailable;
  }

  /**
   * Navigate to the Extra Packages tab to help user install Docker.
   */
  navigateToDockerInstall(): void {
    this.router.navigate(['/help', 'starterPacksMenuSelected'], { queryParams: { activeTab: 'extraPackagesTab' } });
  }

  async ngOnInit(): Promise<void> {
    // Remember whether parent provided an `apps` input (used to hide search/filter UI)
    // Determine if the parent provided explicit app(s) to show
    // (inputAppsToShow is undefined when the caller wants the default behavior)

    // Load apps (will resolve string id(s) or fetch all when no input provided)
    await this.loadInitialApps();
    // Subscribe to search changes
    this.searchSubscription = this.searchSubject.pipe(debounceTime(300), distinctUntilChanged()).subscribe((term) => {
      this.searchTerm = term;
      this.applyFilters();
    });

    // When showing a fixed set of apps (embedded mode), periodically sync state
    // so changes from other component instances are reflected
    if (this.inputAppsToShow != null) {
      this.syncInterval = setInterval(async () => {
        try {
          const fetched = await Promise.all(
            this.masterApps.map(async (app) => this.appsManagerService.getAppById(app.id))
          );
          let changed = false;
          fetched.forEach((fresh, i) => {
            if (fresh && this.masterApps[i] && fresh.state !== this.masterApps[i].state) {
              this.masterApps[i].state = fresh.state;
              this.masterApps[i].lastOutput = fresh.lastOutput;
              changed = true;
            }
          });
          if (changed) {
            this.visibleApps = [...this.masterApps];
            this.cdRef.detectChanges();
            // If any app entered a transitional state externally, start polling
            if (PollingHelper.hasTransitionalItems(this.masterApps)) {
              this.startTransitionPolling();
            }
          }
        } catch (e) { /* ignore sync errors */ }
      }, 3000);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.inputAppsToShow && !changes.inputAppsToShow.firstChange) {
      // Re-load initial apps when parent changes the input (e.g., via async pipe)
      void this.loadInitialApps();
    }
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
    this.searchSubject.complete(); // Complete subject to prevent memory leaks
    this.stopTransitionPolling();
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
  }

  // Load apps and initial statuses
  async loadInitialApps(): Promise<void> {
    this.isLoading = true;
    this.isRefreshing = false;
    // If parent provided an `apps` input, respect its form (string id, string[] ids, ManagedApp, ManagedApp[])
    if (this.inputAppsToShow != null) {
      // array of ids
      if (Array.isArray(this.inputAppsToShow) && this.inputAppsToShow.length && typeof (this.inputAppsToShow as any)[0] === 'string') {
        const ids = this.inputAppsToShow as string[];
        const all = await this.appsManagerService.getAllApps();
        this.masterApps = all.filter(a => ids.includes(a.id)).map(a => ({ ...a }));
      }
      // ManagedApp or ManagedApp[] provided directly
      else if (Array.isArray(this.inputAppsToShow)) {
        this.masterApps = (this.inputAppsToShow as ManagedApp[]).map(a => ({ ...a }));
      } else {
        this.masterApps = [{ ...(this.inputAppsToShow as ManagedApp) }];
      }
      this.visibleApps = [...this.masterApps];
    } else {
      const apps = await this.appsManagerService.getAllApps();
      // Use the apps from the service as the master list and copy into visible list
      this.masterApps = apps.map(app => ({ ...app }));
      this.visibleApps = [...this.masterApps];
    }
    // Refresh statuses using the API
    await this.appsManagerService.refreshAllStatuses(PollingHelper.hasTransitionalItems(this.masterApps));
    // Update state from service
    const fetched = await Promise.all(this.masterApps.map(async (app) => this.appsManagerService.getAppById(app.id)));
    this.masterApps = fetched.map(a => a || ({} as ManagedApp));
    this.visibleApps = [...this.masterApps];
    // Ensure change detection after async updates (e.g., called by setter after async pipe resolves)
    try { this.cdRef.detectChanges(); } catch (e) { /* ignore if not necessary */ }
    // Setup tags and filters only if not showing a fixed set from the parent
    if (this.inputAppsToShow == null) {
      this.extractAllTags();
      this.applyFilters();
    } else {
      // Clear any former filters so that provided apps are shown unfiltered
      this.selectedTag = null;
      this.searchTerm = '';
    }
    this.isLoading = false;

    // If any app is already in a transitional state (starting/stopping), start polling
    // This handles the case where user navigates away and back while an app is still starting
    const hasTransitionalApps = PollingHelper.hasTransitionalItems(this.masterApps);
    console.log('loadInitialApps complete. Apps states:', this.masterApps.map(a => ({ id: a.id, state: a.state })));
    console.log('hasTransitionalApps:', hasTransitionalApps);
    if (hasTransitionalApps) {
      console.log('Starting transition polling...');
      this.startTransitionPolling();
    }
  }

  extractAllTags(): void {
    const set = new Set<string>();
    this.masterApps.forEach(a => { if (a.tags) a.tags.forEach(t => set.add(t)); });
    this.allTags = Array.from(set).sort();
  }

  applyFilters(): void {
    // Do not apply filters when parent provided a fixed set of apps to show
    if (this.inputAppsToShow != null) return;
    let list = [...this.masterApps];
    if (this.selectedTag) {
      list = list.filter(a => (a.tags || []).includes(this.selectedTag!));
    }
    const term = this.searchTerm.toLowerCase().trim();
    if (term) {
      list = list.filter(a =>
        (a.name || '').toLowerCase().includes(term) ||
        (a.description || '').toLowerCase().includes(term) ||
        (a.category || '').toLowerCase().includes(term) ||
        (a.service_name || '').toLowerCase().includes(term) ||
        (a.tags || []).some(t => t.toLowerCase().includes(term))
      );
    }
    this.visibleApps = list;
  }

  filterByTag(tag: string): void {
    if (this.selectedTag === tag) { this.clearTagFilter(); } else { this.selectedTag = tag; this.applyFilters(); }
  }

  clearTagFilter(): void { this.selectedTag = null; this.applyFilters(); }

  async refreshData(): Promise<void> {
    if (this.isRefreshing) return;
    this.isRefreshing = true;
    try {
      await this.appsManagerService.refreshAllStatuses(PollingHelper.hasTransitionalItems(this.masterApps));
      // update local UI state
      const fetched = await Promise.all(this.masterApps.map(async (app) => this.appsManagerService.getAppById(app.id)));
      this.masterApps = fetched.map(a => a || ({} as ManagedApp));
      this.visibleApps = [...this.masterApps];
      this.extractAllTags();
      this.applyFilters();
    } catch (err) {
      console.error('Failed refreshing apps statuses', err);
    } finally {
      this.isRefreshing = false;
    }
  }

  sanitizeAppId(id: string): string {
    return id ? id.replace(/\s/g, '') : '';
  }

  onLaunch(app: ManagedApp, event: MouseEvent) {
    event.stopPropagation();
    event.preventDefault();
    if (!app || !app.url) return;
    if (app.state !== 'running') return;
    window.open(app.url, '_blank', 'noopener');
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      this.messagesService.showInfo('Copied to clipboard!', 'Success');
    }).catch((err) => {
      console.error('Failed to copy: ', err);
      this.messagesService.showInfo('Failed to copy to clipboard.', 'Error');
    });
  }

  copyCredential(credential: string, event: Event) {
    event.preventDefault();
    event.stopPropagation();
    navigator.clipboard.writeText(credential).then(() => {
      this.messagesService.showInfo('Copied!', 'Success');
    }).catch((err) => {
      console.error('Failed to copy: ', err);
      this.messagesService.showInfo('Failed to copy.', 'Error');
    });
  }

  toggleCommandFlag(app: ManagedApp, flag: string, event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    const isChecked = checkbox.checked;

    if (!app.currentCommandValue) return;

    // Remove flag if unchecked
    if (!isChecked) {
      app.currentCommandValue = app.currentCommandValue
        .replace(new RegExp(`\\s*${flag}`, 'g'), '')
        .trim();
    } else {
      // Add flag if checked (and not already present)
      if (!app.currentCommandValue.includes(flag)) {
        app.currentCommandValue = app.currentCommandValue.trim() + ' ' + flag;
      }
      // If --no-cache is checked, remove --build (--no-cache implies rebuild)
      if ((flag === '--no-cache' || flag === '--full') && app.currentCommandValue.includes('--build')) {
        app.currentCommandValue = app.currentCommandValue
          .replace(/\s*--build/g, '')
          .trim();
      }

      // If --full is checked, ensure --no-cache is present (full implies no-cache)
      if (flag === '--full' && isChecked && !app.currentCommandValue.includes('--no-cache')) {
        app.currentCommandValue = app.currentCommandValue + ' --no-cache';
      }
    }
  }

  toggleVolumesFlag(app: ManagedApp, event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    const isChecked = checkbox.checked;

    // We only alter the stop command to avoid adding --volumes to the start command by accident
    if (!app.stopCmd) return;

    if (isChecked) {
      const message = `This will permanently delete data stored in the container volumes for ${app.name}. To confirm, type DELETE below and press Delete.`;
      this.confirmService.askConfirmation({ message, confirmationText: 'DELETE', confirmLabel: 'Delete', declineLabel: 'Cancel' }).then((result: boolean) => {
        if (result) {
          if (!app.stopCmd.includes('--volumes')) {
            app.stopCmd = app.stopCmd.trim() + ' --volumes';
          }
          if (app.state === 'running') {
            app.currentCommandValue = app.stopCmd;
          }
        } else {
          // Revert the checkbox visually when the user cancels
          checkbox.checked = false;
        }
      }).catch(() => {
        checkbox.checked = false;
      });
    } else {
      // Remove flag from stopCmd and update the current value if needed
      app.stopCmd = app.stopCmd.replace(/\s*--volumes/g, '').trim();
      if (app.state === 'running') {
        app.currentCommandValue = app.stopCmd;
      }
    }
  }

  // Note: 'Reprovision' is now a switch that adds '--reprovision' to the start command.
  // The actual start invocation will include this flag when the user clicks Start.

  async onToggleApp(app: ManagedApp) {

    let dialogQuestion = `Stop ${app.name}?`;
    if (app.state !== 'running') {
      // Default concise start message with patience note
      dialogQuestion = `Start ${app.name}? Be patient — the first start takes longer while required components download and configure; subsequent start/stop cycles are faster.`;

      // Special concise message for cms-webportal if not provisioned
      if (this.isCmsWebPortal(app) && !this.stateStore?.configSys?.sysInfo?.setup?.portal?.isProvisioned) {
        dialogQuestion = `Start ${app.name}? Since the portal is not provisioned, the first launch may take longer — please be patient. Subsequent start/stop cycles are faster.`;
      }
    }

    this.confirmService.askConfirmation({
      message: dialogQuestion,
      confirmAction: async () => {
        // Refresh Docker status BEFORE checking it (to get the latest status, not stale cached value)
        if (app.state !== 'running' && app.type === 'docker') {
          await this.appsManagerService.refreshAllStatuses();
        }

        // Check Docker AFTER user confirms they want to start (only for docker apps, not for stopping)
        if (app.state !== 'running' && app.type === 'docker' && !this.stateStore?.configSys?.sysInfo?.setup?.docker?.isDockerOk) {
          const dockerInfo = this.stateStore?.configSys?.sysInfo?.setup?.docker;

          if (dockerInfo && dockerInfo.isDockerInstalled && !dockerInfo.isDockerDaemonRunning) {
            this.messagesService.showWarning(
              `Docker is installed but the background service is not running. Please start Docker Desktop first.`,
              'Docker Not Running'
            );
          } else {
            this.messagesService.showWarning(
              `Docker is not installed and it is required for this application. See Help → Apps / Starter Packs for installation instructions.`,
              'Docker Required'
            );
          }
          return; // Don't proceed with starting
        }

        // Set immediate UI feedback
        app.state = app.state === 'running' ? 'stopping' : 'starting';

        await this.appsManagerService.toggleApp(app);

        // Immediately refresh UI with final state from service (don't wait for polling interval)
        await this.refreshDataSilent();

        // After toggleApp completes, start polling if any app is still in transitional state
        this.startTransitionPolling();
      }
    });
  }

  /**
   * Start polling for status updates while any app is in a transitional state (starting/stopping).
   * Polls every 3 seconds until all apps reach a stable state (running/stopped/error/unknown).
   * Uses shared PollingHelper for consistent behavior with starter-packs.
   */
  private startTransitionPolling(): void {
    // Don't start multiple polling loops - if one is active, it will pick up the new transitional app
    if (this.pollingSubscription && !this.pollingSubscription.closed) {
      console.log('Polling already active, skipping...');
      return;
    }

    console.log('Starting polling subscription (max timeout: ' + PollingHelper.getMaxTimeoutDescription() + ')...');

    this.pollingSubscription = PollingHelper.createPollingSubscription(
      // onPoll callback - returns true to stop polling
      async () => {
        // First refresh to get latest state
        await this.refreshDataSilent();

        console.log('After refresh, app states:', this.masterApps.map(a => ({ id: a.id, state: a.state })));

        // Check if we should stop polling
        const hasTransitionalApps = PollingHelper.hasTransitionalItems(this.masterApps);

        if (!hasTransitionalApps) {
          this.stopTransitionPolling();
          return true; // Signal to stop
        }
        return false; // Continue polling
      },
      // onComplete callback
      (reason) => {
        this.pollingSubscription = null;
        if (reason === 'maxIterations') {
          console.warn('Polling stopped: max iterations reached. Some apps may still be starting.');
        }
      },
      // onError callback
      (err) => {
        console.error('Polling error:', err);
        this.pollingSubscription = null;
      }
    );
  }

  /**
   * Stop transition polling explicitly (called on component destroy).
   */
  private stopTransitionPolling(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = null;
    }
  }

  /**
   * Silently refresh data without setting isRefreshing flag (avoids UI flicker during polling).
   */
  private async refreshDataSilent(): Promise<void> {
    try {
      await this.appsManagerService.refreshAllStatuses(true);
      // Update local UI state
      const fetched = await Promise.all(this.masterApps.map(async (app) => this.appsManagerService.getAppById(app.id)));
      this.masterApps = fetched.map(a => a || ({} as ManagedApp));
      this.visibleApps = [...this.masterApps];
      this.applyFilters();
      // Force Angular to detect changes - important since we're in an async context
      try {
        this.cdRef.markForCheck();
        this.cdRef.detectChanges();
      } catch (e) {
        // View might be destroyed
      }
    } catch (err) {
      console.error('Failed polling app statuses', err);
    }
  }

  /**
   * Get the AI button label based on the output type code.
   */
  getAiButtonLabel(): string {
    if (this.askAiForHelpOutputTypeCode === 'cms.webportal') {
      return 'Hey AI, Help Me ...';
    }
    return 'Hey AI, Help Me ...';
  }

  /**
   * Launch the AI manager with the appropriate configuration.
   */
  askAiForHelp(): void {
    if (!this.askAiForHelpOutputTypeCode || !this.aiManagerInstance) {
      return;
    }

    if (this.askAiForHelpOutputTypeCode === 'cms.webportal') {
      const launchConfig: AiManagerLaunchConfig = {
        initialActiveTabKey: 'PROMPTS',
        initialSelectedCategory: 'Web Portal / CMS',
      };
      this.aiManagerInstance.launchWithConfiguration(launchConfig);
    }
    // Add more output type handlers as needed
  }

}