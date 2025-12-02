import { Component, Input, OnInit, ChangeDetectorRef, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { AppsManagerService, ManagedApp } from './apps-manager.service';
import { ConfirmService } from '../dialog-confirm/confirm.service';
import { StateStoreService } from '../../providers/state-store.service';
import { Router } from '@angular/router';

// This interface should be defined in a shared models file


@Component({
  selector: 'dburst-apps-manager',
  templateUrl: './apps-manager.template.html',
})
export class AppsManagerComponent implements OnInit, OnChanges {
  // Search and Tag Filter State
  searchTerm: string = '';
  selectedTag: string | null = null;
  allTags: string[] = [];
  isLoading: boolean = true;
  isRefreshing: boolean = false;

  // Search debounce
  public searchSubject = new Subject<string>();
  private searchSubscription: Subscription | null = null;

  @Input() inputAppsToShow: ManagedApp[] | string[] | undefined;
  // Actual list displayed by the UI (either all apps after filtering, or provided input app(s))
  public visibleApps: ManagedApp[] = [];
  @Input() dropdownDirection: 'up' | 'down' | 'expandedList' = 'down';

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

  ) { }

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
    // No need for special flags; OnChanges will handle later input updates
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.inputAppsToShow && !changes.inputAppsToShow.firstChange) {
      // Re-load initial apps when parent changes the input (e.g., via async pipe)
      void this.loadInitialApps();
    }
  }
  
  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
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
    await this.appsManagerService.refreshAllStatuses();
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
      await this.appsManagerService.refreshAllStatuses();
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
    navigator.clipboard.writeText(text);
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

}