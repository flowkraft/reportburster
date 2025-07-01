import { Component, OnInit, OnDestroy, SecurityContext } from '@angular/core'; // Import SecurityContext
import { DomSanitizer, SafeHtml } from '@angular/platform-browser'; // Import DomSanitizer
import { Subscription, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

// Import specific icons you need from simple-icons
// Using distinct placeholders for Oracle/SQLServer/DB2
import {
  siPostgresql,
  siMysql,
  siMariadb,
  siSqlite,
  siMongodb, // Placeholder 1
  siElasticsearch, // Placeholder 2
  siServerless, // Placeholder 3
  // Add any other icons you might use here
} from 'simple-icons';

import { ApiService } from '../../providers/api.service';
// Import the new service and definition interface
// Ensure this path is correct relative to the current file
import {
  StarterPacksService,
  StarterPackDefinition,
} from './starter-packs.service';

// Interface for dynamic status data from API
interface StarterPackStatusData {
  id: string; // ID must match the one in StarterPackDefinition
  status: 'running' | 'stopped' | 'pending' | 'error' | 'unknown';
  info?: any; // Or a more specific type if known (e.g., string for logs)
  lastOutput?: string; // Last output message from the backend process
}

// Interface for combined UI data (static definition + dynamic status + UI state)
// Inherits static props from StarterPackDefinition
interface StarterPackUIData extends StarterPackDefinition {
  // Dynamic props from API (overwrites definition if names clash, e.g., id)
  status: 'running' | 'stopped' | 'pending' | 'error' | 'unknown';
  info?: any;
  lastOutput?: string;

  // UI State props (added by component for managing UI interactions)
  currentCommandValue: string; // The command currently displayed and editable in the input field
}

// Define expected response types for clarity
// API now returns only the dynamic status part
interface PackStatusResponse extends Array<StarterPackStatusData> {}
interface ExecuteResponse {
  output: string;
  newStatus: StarterPackUIData['status'];
}

// --- Map icon names (from definition) to imported simple-icons objects ---
const iconMap = {
  // Use distinct, non-brand icons as placeholders
  oracle: siMongodb, // Placeholder 1
  sqlserver: siElasticsearch, // Placeholder 2
  ibmdb2: siServerless, // Placeholder 3
  postgresql: siPostgresql,
  mysql: siMysql,
  mariadb: siMariadb,
  sqlite: siSqlite,
  // Add other mappings as needed based on your definition.icon values
};

// Helper function to construct default commands based on definition
// Uses the defaultStartCmd and defaultStopCmd from the definition
const getDefaultCommand = (
  definition: StarterPackDefinition,
  action: 'start' | 'stop',
): string => {
  return action === 'start' ? definition.startCmd : definition.stopCmd;
};

@Component({
  selector: 'dburst-starter-packs',
  templateUrl: './starter-packs.template.html',
})
export class StarterPacksComponent implements OnInit, OnDestroy {
  // --- State ---
  starterPacks: StarterPackUIData[] = []; // Master list (merged static + dynamic)
  filteredStarterPacks: StarterPackUIData[] = []; // List displayed in the template
  isLoading: boolean = true; // For initial load indicator
  isRefreshing: boolean = false; // For manual refresh indicator
  error: string | null = null; // Global error message

  // Search and Filter State
  searchTerm: string = '';
  selectedTag: string | null = null;
  allTags: string[] = []; // Unique tags extracted from definitions

  // Debounce search input
  public searchSubject = new Subject<string>();
  private searchSubscription: Subscription | null = null;

  // Inject DomSanitizer along with other services
  constructor(
    private apiService: ApiService,
    private starterPacksService: StarterPacksService,
    private sanitizer: DomSanitizer, // Inject DomSanitizer
  ) {}

  ngOnInit(): void {
    this.loadInitialData(); // Fetch data when component initializes

    // Subscribe to search term changes with debounce
    this.searchSubscription = this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((term) => {
        this.searchTerm = term;
        this.applyFilters(); // Re-apply filters when search term changes
      });
  }

  ngOnDestroy(): void {
    // Unsubscribe to prevent memory leaks
    this.searchSubscription?.unsubscribe();
  }

  // --- Data Fetching & Processing ---

  /**
   * Loads the initial data on component startup.
   */
  async loadInitialData(): Promise<void> {
    this.isLoading = true;
    this.isRefreshing = false;
    this.error = null;
    await this.fetchStarterPacksStatus();
  }

  /**
   * Manually triggers a refresh of the starter pack statuses.
   */
  async refreshData(): Promise<void> {
    // Prevent concurrent refreshes
    if (this.isRefreshing || this.isLoading) {
      console.log('Refresh skipped (already in progress or loading)');
      return;
    }
    console.log('Starting manual refresh...');
    this.isRefreshing = true;
    this.error = null; // Clear previous errors on refresh
    await this.fetchStarterPacksStatus();
  }

  /**
   * Fetches static definitions and dynamic statuses, then merges them.
   */
  async fetchStarterPacksStatus(): Promise<void> {
    const wasInitialLoad = this.isLoading;
    // Ensure refresh indicator is on if it's not the initial load
    if (!wasInitialLoad) {
      this.isRefreshing = true;
    }

    console.log(
      `Fetching status (Initial: ${wasInitialLoad}, Refreshing: ${this.isRefreshing})`,
    );

    try {
      // 1. Get static definitions from the service
      const definitions = this.starterPacksService.getStarterPackDefinitions();

      // 2. Fetch dynamic status data from the backend API
      const statusDataArray: PackStatusResponse = await this.apiService.get(
        '/jobman/starter-packs/status',
      );

      console.log('Received packs status data:', statusDataArray);

      // 3. Merge static definitions with dynamic status data
      this.starterPacks = definitions
        .map((definition) => {
          // Find corresponding status data from API response using the unique ID
          const statusData = statusDataArray.find(
            (status) => status.id === definition.id,
          );

          // Find existing UI state from the current component state (to preserve command value if pending)
          const existingPack = this.starterPacks.find(
            (p) => p.id === definition.id,
          );

          // Determine status and default command based on API or initial state
          let currentStatus: StarterPackUIData['status'] = 'unknown';
          let apiLastOutput: string | undefined;

          if (statusData) {
            currentStatus = statusData.status;
            apiLastOutput = statusData.lastOutput;
          } else {
            console.warn(
              `No status data received from API for starter pack ID: ${definition.id}. Setting status to 'unknown'.`,
            );
          }

          // Respect optimistic 'pending' state
          if (
            existingPack?.status === 'pending' &&
            currentStatus !== 'running' &&
            currentStatus !== 'stopped' &&
            currentStatus !== 'error'
          ) {
            currentStatus = 'pending'; // Keep it pending
          }

          // Determine the command to display based on the current status
          let displayCommand = '';
          if (currentStatus === 'running') {
            displayCommand = getDefaultCommand(definition, 'stop'); // Show stop command if running
          } else {
            displayCommand = getDefaultCommand(definition, 'start'); // Show start command otherwise
          }

          // If the pack existed before and is now pending, keep the command value it had
          if (existingPack && currentStatus === 'pending') {
            displayCommand = existingPack.currentCommandValue;
          }

          // Determine lastOutput
          let lastOutput = apiLastOutput;
          if (
            currentStatus === 'pending' &&
            existingPack?.status === 'pending'
          ) {
            lastOutput = existingPack?.lastOutput; // Keep the "Executing..." message
          }

          // Create the merged StarterPackUIData object
          const mergedPack: StarterPackUIData = {
            ...definition, // Static definition properties
            // Dynamic properties (use defaults if statusData is missing)
            status: currentStatus,
            info: statusData?.info,
            lastOutput: lastOutput,
            // UI State
            currentCommandValue: displayCommand, // Set the command to display/edit
          };
          return mergedPack;
        })
        .filter((pack): pack is StarterPackUIData => !!pack); // Ensure no null/undefined entries

      this.extractAllTags(); // Update the list of available tags
      this.applyFilters(); // Apply current search/filter to the new data
      this.error = null; // Clear global error on successful fetch
    } catch (err: any) {
      console.error('Error fetching starter packs status:', err);
      // --- MOCK DATA IMPLEMENTATION START ---
      console.warn('API call failed. Using mock data for UI development.');
      const definitions = this.starterPacksService.getStarterPackDefinitions();
      this.starterPacks = definitions.map((definition, index) => {
        const mockStatus = index % 2 === 0 ? 'stopped' : ('running' as const);
        const mockCommand =
          mockStatus === 'running'
            ? getDefaultCommand(definition, 'stop')
            : getDefaultCommand(definition, 'start');
        return {
          ...definition,
          status: mockStatus,
          info: `Mock info for ${definition.displayName}`,
          lastOutput: `Mock last output for ${definition.id}`,
          currentCommandValue: mockCommand,
        };
      });
      this.extractAllTags();
      this.applyFilters();
      this.error = null;
      // --- MOCK DATA IMPLEMENTATION END ---
    } finally {
      console.log(`Finalizing fetch status (WasInitial: ${wasInitialLoad})`);
      if (wasInitialLoad) {
        this.isLoading = false;
      }
      this.isRefreshing = false;
    }
  }

  // --- Action Trigger ---

  /**
   * Toggles the state (start/stop) of a starter pack by calling the backend API
   * using the command currently present in the input field.
   * @param pack The starter pack to toggle.
   */
  async togglePackState(pack: StarterPackUIData): Promise<void> {
    // Prevent action if already in a pending state
    if (pack.status === 'pending') {
      console.log(`Action skipped for ${pack.id} (already pending)`);
      return;
    }

    const action = pack.status === 'running' ? 'stop' : 'start';
    // Read the command directly from the ngModel-bound property
    const command = pack.currentCommandValue?.trim(); // Trim whitespace

    // Ensure command is not empty/null before proceeding
    if (!command) {
      console.error(`Command is empty for pack ${pack.id}. Aborting action.`);
      pack.lastOutput = 'Error: Command cannot be empty.';
      pack.status = 'error'; // Set to error state
      // Update the command input to reflect the default for the error state (start)
      pack.currentCommandValue = getDefaultCommand(pack, 'start');
      return;
    }

    console.log(
      `Executing ${action} for ${pack.displayName} with command: ${command}`, // Use the current value
    );

    // Optimistic UI update: set status to 'pending' immediately
    pack.status = 'pending';
    pack.lastOutput = `Executing ${action}...`; // Provide immediate feedback
    this.error = null; // Clear global error when initiating an action

    try {
      // Call the backend API to execute the command
      const response: ExecuteResponse = await this.apiService.post(
        '/jobman/starter-packs/execute',
        { command: command }, // Send the current command string
      );

      // Handle the direct response from the execute call
      if (response) {
        console.log(
          `Action ${action} direct response for ${pack.id}:`,
          response,
        );
        // Update pack status and output based on immediate response
        // This might be overwritten shortly by the refreshData call
        pack.status = response.newStatus;
        pack.lastOutput = response.output;
        // Update the command input field based on the new status
        pack.currentCommandValue =
          response.newStatus === 'running'
            ? getDefaultCommand(pack, 'stop')
            : getDefaultCommand(pack, 'start');
      }
    } catch (err: any) {
      console.error(`Error executing ${action} for ${pack.id}:`, err);
      const errorMsg = `Error executing ${action}: ${err?.error?.message || err?.message || 'Unknown error'}`;
      // Update UI to show error state for this specific pack
      pack.status = 'error';
      pack.lastOutput = errorMsg;
      // Update the command input field based on the error status (show start command)
      pack.currentCommandValue = getDefaultCommand(pack, 'start');
    } finally {
      // Trigger a refresh after the action completes (success or error)
      // to get the definitive status from the backend.
      console.log(
        `Action ${action} finalized for ${pack.id}. Triggering refresh.`,
      );
      // Use setTimeout to ensure it runs after the current execution context
      // and potential immediate UI updates from the direct response.
      setTimeout(() => this.refreshData(), 50); // Small delay might help UI consistency
    }
  }

  // --- UI Interaction Methods ---

  /**
   * Extracts all unique tags from the starter pack definitions.
   */
  extractAllTags(): void {
    const tagSet = new Set<string>();
    // Use starterPacks which now contains merged data including tags from definition
    this.starterPacks.forEach((pack) => {
      pack.tags?.forEach((tag) => tagSet.add(tag));
    });
    this.allTags = Array.from(tagSet).sort(); // Store sorted unique tags
  }

  /**
   * Applies the current search term and selected tag filter to the starterPacks list.
   */
  applyFilters(): void {
    let packs = [...this.starterPacks]; // Start with the full merged list

    // Filter by selected tag
    if (this.selectedTag) {
      packs = packs.filter((pack) => pack.tags?.includes(this.selectedTag!));
    }

    // Filter by search term (case-insensitive)
    const term = this.searchTerm.toLowerCase().trim();
    if (term) {
      packs = packs.filter(
        (pack) =>
          pack.displayName.toLowerCase().includes(term) ||
          pack.description.toLowerCase().includes(term) ||
          pack.family.toLowerCase().includes(term) ||
          pack.packName.toLowerCase().includes(term) ||
          (pack.target && pack.target.toLowerCase().includes(term)) ||
          (pack.tags &&
            pack.tags.some((tag) => tag.toLowerCase().includes(term))),
      );
    }
    this.filteredStarterPacks = packs; // Update the list displayed in the template
  }

  /**
   * Sets or clears the selected tag filter.
   * @param tag The tag to filter by.
   */
  filterByTag(tag: string): void {
    if (this.selectedTag === tag) {
      this.clearTagFilter(); // Toggle off if the same tag is clicked again
    } else {
      this.selectedTag = tag;
      this.applyFilters(); // Apply the new tag filter
    }
  }

  /**
   * Clears the selected tag filter.
   */
  clearTagFilter(): void {
    this.selectedTag = null;
    this.applyFilters(); // Re-apply filters without the tag constraint
  }

  /**
   * TrackBy function for *ngFor to improve performance.
   */
  trackPackById(index: number, pack: StarterPackUIData): string {
    return pack.id; // Use the unique ID for tracking
  }

  // --- Helper function to get SVG HTML for an icon name ---
  getIconSvg(iconKey: string | undefined): SafeHtml | null {
    if (!iconKey) {
      return null;
    }
    // Ensure the key is lowercase for matching the map
    const lowerCaseKey = iconKey.toLowerCase();
    // Look up the imported icon object using the map
    const iconData = iconMap[lowerCaseKey as keyof typeof iconMap];

    if (iconData) {
      // Construct the full SVG string
      // You can adjust height, width, fill, class, style as needed
      const svg = `<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" height="20" width="20" style="fill: currentColor; margin-right: 10px; vertical-align: middle;" class="pull-left"><title>${iconData.title}</title><path d="${iconData.path}"/></svg>`;
      // Sanitize the HTML before binding
      return this.sanitizer.bypassSecurityTrustHtml(svg);
    }
    console.warn(`Simple Icon not found or mapped for key: ${iconKey}`);
    return null; // Icon not found in map or simple-icons import
  }

  async copyToClipboard(text: string | undefined | null): Promise<void> {
    if (!text) {
      console.warn('Attempted to copy empty text.');
      return;
    }
    if (!navigator.clipboard) {
      console.error('Clipboard API not available in this browser.');
      // Optionally, implement a fallback using document.execCommand (older method)
      alert('Clipboard API not supported in your browser.');
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      console.log('Text copied to clipboard:', text);
      // Optional: Add visual feedback to the user (e.g., change button icon/text briefly, show a toast)
      // Example: Temporarily change button text (requires adding state to the pack or component)
      // alert('Copied!'); // Simple feedback
    } catch (err) {
      console.error('Failed to copy text to clipboard:', err);
      alert('Failed to copy text.');
    }
  }
}
