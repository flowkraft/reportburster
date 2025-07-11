import {
  Component,
  Input,
  OnInit,
  AfterViewChecked,
  ChangeDetectorRef,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { AiManagerService, PromptInfo } from './ai-manager.service';
import { InfoService } from '../../components/dialog-info/info.service';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal'; // Add ngx-bootstrap modal service
import { AppsManagerService, ManagedApp } from '../apps-manager/apps-manager.service';

// Define constants for tab indices for clarity
const VANNA_TAB_INDEX = 0;
const PROMPTS_TAB_INDEX = 1;
const HEY_AI_TAB_INDEX = 2;

// Add launch configuration interface
export type AiManagerLaunchConfig = {
  initialActiveTabKey?: 'PROMPTS' | 'VANNA' | 'HEY_AI';
  initialSelectedCategory?: string;
  initialExpandedPromptId?: string;
  promptVariables?: { [key: string]: string };
};

interface CategoryWithCount {
  name: string;
  count: number;
}

@Component({
  selector: 'dburst-ai-manager',
  templateUrl: './ai-manager.template.html',
})
export class AiManagerComponent implements OnInit, AfterViewChecked {
  @Input() mode: 'standalone' | 'embedded' | 'launchCopilot' = 'standalone';
  @Input() dropdownDirection: 'down' | 'up' = 'down';
  //@Input() showVanna: boolean = true;

  @Input() showVanna: boolean = false;
  
  vannaApp: ManagedApp;

  // Internal state
  isModalVisible: boolean = false;
  intendedTabIndex: number = PROMPTS_TAB_INDEX;
  modalRef?: BsModalRef; // NgxBootstrap modal reference

  // Modal config
  modalConfig = {
    class: 'ai-copilot-modal-large',
    backdrop: true,
    ignoreBackdropClick: false,
    animated: false, // Disable animations for smoother opening
    keyboard: true, // Allow ESC key to close
  };

  // Flags to control active state for ngx-bootstrap tabs
  isVannaTabActive: boolean = false;
  isPromptsTabActive: boolean = false;
  isHeyAiTabActive: boolean = false;

  // --- AI Prompts Tab State ---
  allPrompts: PromptInfo[] = [];
  filteredPrompts: PromptInfo[] = [];
  uniqueTags: string[] = [];
  categoriesWithCounts: CategoryWithCount[] = [];
  searchTerm: string = '';
  selectedCategory: string = 'All Prompts';
  selectedTag: string | null = null;
  expandedPrompt: PromptInfo | null = null;
  // --- End AI Prompts Tab State ---

  // initialState properties from modal
  @Input() initialActiveTabKey?: 'PROMPTS' | 'VANNA' | 'HEY_AI';
  @Input() initialSelectedCategory?: string;
  @Input() initialExpandedPromptId?: string;
  @Input() promptVariables?: { [key: string]: string };

  @ViewChild('aiManagerModalTemplate')
  aiManagerModalTemplate!: TemplateRef<any>;

  // guard to run init logic once per open
  private pendingInit = false;

  constructor(
    private aiManagerService: AiManagerService,
    private cdRef: ChangeDetectorRef,
    private infoService: InfoService,
    private modalService: BsModalService, // Add ngx-bootstrap modal service
    protected appsManagerService: AppsManagerService,
  ) {
  }

  async ngOnInit(): Promise<void> {
    try {
      this.loadPrompts();
      this.vannaApp = await this.appsManagerService.getAppById('vanna-ai');
  
    } catch (error) {
      console.error('Error during AiManagerComponent ngOnInit:', error);
      // Optionally, handle the error more gracefully, e.g., show a message or disable AI features
    }
    // remove previous setTimeout logic
  }

  ngAfterViewChecked(): void {
    if (this.pendingInit) {
      this.pendingInit = false;
      this.completeInitialization();
      this.cdRef.detectChanges();
    }
  }

  /**
   * Determine active tab based on configuration and update tab state
   */
  private initializeTabConfiguration(): void {
    let tabIndexToActivate = this.determineInitialActiveTab();
    this.setActiveTab(tabIndexToActivate);
  }

  /**
   * Calculate which tab should be active initially
   */
  private determineInitialActiveTab(): number {
    // Default tab based on Vanna visibility
    let tabIndexToActivate = this.showVanna
      ? VANNA_TAB_INDEX
      : PROMPTS_TAB_INDEX;

    // Override with explicit configuration if provided
    if (this.initialActiveTabKey) {
      switch (this.initialActiveTabKey) {
        case 'PROMPTS':
          tabIndexToActivate = this.showVanna
            ? PROMPTS_TAB_INDEX
            : VANNA_TAB_INDEX;
          break;
        case 'VANNA':
          if (this.showVanna) tabIndexToActivate = VANNA_TAB_INDEX;
          break;
        case 'HEY_AI':
          tabIndexToActivate = this.showVanna
            ? HEY_AI_TAB_INDEX
            : PROMPTS_TAB_INDEX;
          break;
      }
    }

    return tabIndexToActivate;
  }

  /**
   * Apply any filters specified in the initial configuration
   */
  private applyInitialFiltersIfNeeded(): void {
    // Only apply filters if the prompts tab is active
    if (this.isPromptsTabActive) {
      this.selectedCategory = this.initialSelectedCategory || 'All Prompts';
      this.applyFilters();
    }
  }

  /**
   * Process and expand the specified prompt if needed
   */
  private processExpandedPromptIfNeeded(): void {
    // Only process if the prompts tab is active and an expanded prompt ID was specified
    if (this.isPromptsTabActive && this.initialExpandedPromptId) {
      const promptDef = this.allPrompts.find(
        (p) => p.id === this.initialExpandedPromptId,
      );

      if (promptDef) {
        this.expandPromptWithVariables(promptDef);
      }
    }
  }

  /**
   * Expand a prompt with variable substitutions
   */
  private expandPromptWithVariables(promptDef: PromptInfo): void {
    let text = promptDef.promptText;

    if (this.promptVariables) {
      Object.entries(this.promptVariables).forEach(([key, val]) => {
        const escKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        text = text.replace(new RegExp(escKey, 'g'), val);
      });
    }

    this.expandedPrompt = { ...promptDef, promptText: text };
  }

  // --- Prompt Loading and Filtering ---
  loadPrompts(): void {
    this.allPrompts = this.aiManagerService.getAllPrompts();
    this.calculateUniqueTags();
    this.calculateCategoriesWithCounts();
    this.applyFilters(); // Apply initial filters (show all)
  }

  calculateUniqueTags(): void {
    const tags = new Set<string>();
    this.allPrompts.forEach((p) => p.tags.forEach((tag) => tags.add(tag)));
    this.uniqueTags = Array.from(tags).sort();
  }

  calculateCategoriesWithCounts(): void {
    const counts: { [key: string]: number } = {};
    this.allPrompts.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });

    this.categoriesWithCounts = [
      { name: 'All Prompts', count: this.allPrompts.length },
      ...Object.entries(counts)
        .map(([name, count]) => ({
          name: name as PromptInfo['category'],
          count,
        }))
        .sort((a, b) => a.name.localeCompare(b.name)), // Sort categories alphabetically
    ];
  }

  applyFilters(): void {
    let tempPrompts = [...this.allPrompts];

    // 1. Filter by Category
    if (this.selectedCategory !== 'All Prompts') {
      tempPrompts = tempPrompts.filter(
        (p) => p.category === this.selectedCategory,
      );
    }

    // 2. Filter by Tag
    if (this.selectedTag) {
      tempPrompts = tempPrompts.filter((p) =>
        p.tags.includes(this.selectedTag!),
      );
    }

    // 3. Filter by Search Term
    const term = this.searchTerm.toLowerCase().trim();
    if (term) {
      tempPrompts = tempPrompts.filter(
        (p) =>
          p.title.toLowerCase().includes(term) ||
          p.description.toLowerCase().includes(term) ||
          p.promptText.toLowerCase().includes(term) ||
          p.tags.some((tag) => tag.toLowerCase().includes(term)),
      );
    }

    this.filteredPrompts = tempPrompts;
    this.expandedPrompt = null; // Collapse any expanded prompt when filters change
  }

  filterByCategory(category: string): void {
    this.selectedCategory = category;
    this.selectedTag = null; // Reset tag filter when category changes
    this.applyFilters();
  }

  filterByTag(tag: string | null): void {
    // If clicking the same tag, toggle it off
    this.selectedTag = this.selectedTag === tag ? null : tag;
    this.applyFilters();
  }

  onSearchChange(): void {
    this.applyFilters();
  }
  // --- End Prompt Loading and Filtering ---

  // --- Prompt Display ---
  expandPrompt(prompt: PromptInfo): void {
    this.expandedPrompt = prompt;
  }

  collapsePrompt(): void {
    this.expandedPrompt = null;
  }
  // --- End Prompt Display ---

  // --- Copy to Clipboard ---
  copyToClipboard(text: string): void {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        // Replace toast with InfoService
        this.infoService.showInformation({
          message: 'Prompt copied to clipboard!',
        });
      })
      .catch((err) => {
        console.error('Failed to copy text: ', err);
        this.infoService.showInformation({
          message: 'Failed to copy prompt.',
        });
      });
  }
  // --- End Copy to Clipboard ---

  // Helper to set the active tab flags for ngx-bootstrap
  setActiveTab(index: number): void {
    this.intendedTabIndex = index;
    this.isVannaTabActive = this.showVanna && index === VANNA_TAB_INDEX;
    // Adjust index checks based on Vanna visibility
    const promptsIndex = this.showVanna ? PROMPTS_TAB_INDEX : VANNA_TAB_INDEX;
    const heyAiIndex = this.showVanna ? HEY_AI_TAB_INDEX : PROMPTS_TAB_INDEX;

    this.isPromptsTabActive = index === promptsIndex;
    this.isHeyAiTabActive = index === heyAiIndex;

    // Ensure only one tab is active if Vanna is hidden and indices shift
    if (!this.showVanna) {
      if (this.isPromptsTabActive && this.isHeyAiTabActive) {
        // Default to prompts if somehow both became active due to index shift
        this.isHeyAiTabActive = false;
      }
    } else {
      // Ensure only one is active when Vanna is shown
      if (
        this.isVannaTabActive &&
        (this.isPromptsTabActive || this.isHeyAiTabActive)
      ) {
        this.isPromptsTabActive = false;
        this.isHeyAiTabActive = false;
      } else if (this.isPromptsTabActive && this.isHeyAiTabActive) {
        this.isHeyAiTabActive = false; // Prioritize prompts if conflict
      }
    }
  }

  // --- Standalone Mode: Dropdown Button Actions ---

  triggerOpenCopilotBrowser(): void {
    console.log('Placeholder: Open external Copilot browser window');
    // window.open('your-external-copilot-url', '_blank'); // Example
  }

  openVannaModal(template: TemplateRef<any>): void {
    if (this.mode === 'standalone' && this.showVanna) {
      this.setActiveTab(VANNA_TAB_INDEX);
      this.pendingInit = true;
      this.openModal(template);
      console.log('Placeholder: Opening modal to Vanna tab');
    }
  }

  openAiPromptsModal(template: TemplateRef<any>): void {
    if (this.mode === 'standalone') {
      const targetIndex = this.showVanna ? PROMPTS_TAB_INDEX : VANNA_TAB_INDEX;
      this.setActiveTab(targetIndex);
      this.pendingInit = true;
      this.openModal(template);
      console.log('Placeholder: Opening modal to AI Prompts tab');
    }
  }

  // --- Modal Control ---
  // Open modal using ngx-bootstrap
  openModal(template: TemplateRef<any>, initialState?: object): void {
    this.isModalVisible = true;
    const config = { ...this.modalConfig, initialState: initialState || {} };
    this.modalRef = this.modalService.show(template, config);

    this.modalRef.onHide?.subscribe(() => {
      this.closeModal();
    });
  }

  closeModal(): void {
    this.isModalVisible = false;
    if (this.modalRef) {
      this.modalRef.hide();
    }
  }

  // --- ngx-bootstrap Tab Selection Handling ---
  // Method called when a tab is selected to update internal state if needed
  onTabSelect(tabIndex: number): void {
    console.log(`Tab selected: ${tabIndex}`);
    this.setActiveTab(tabIndex);
    // Add any logic needed when a tab becomes active
  }

  // Public method to launch with configuration
  public launchWithConfiguration(config?: AiManagerLaunchConfig): void {
    if (config?.initialActiveTabKey)
      this.initialActiveTabKey = config?.initialActiveTabKey;
    if (config?.initialSelectedCategory)
      this.initialSelectedCategory = config.initialSelectedCategory;
    if (config?.initialExpandedPromptId)
      this.initialExpandedPromptId = config.initialExpandedPromptId;
    if (config?.promptVariables) this.promptVariables = config.promptVariables;
    this.pendingInit = true;
    this.openModal(this.aiManagerModalTemplate);
  }

  /**
   * Launch Microsoft Copilot in a new browser tab
   */
  launchExternalCopilot(): void {
    window.open('https://copilot.microsoft.com', '_blank');
  }

  private completeInitialization(): void {
    try {
      const idx = this.determineInitialActiveTab();
      this.setActiveTab(idx);
      if (this.isPromptsTabActive) {
        if (this.initialSelectedCategory) {
          this.selectedCategory = this.initialSelectedCategory;
          this.applyFilters();
        }
        if (this.initialExpandedPromptId) {
          const p = this.allPrompts.find(
            (x) => x.id === this.initialExpandedPromptId,
          );
          if (p) {
            if (
              this.promptVariables &&
              Object.keys(this.promptVariables).length > 0
            ) {
              this.expandPromptWithVariables(p);
            } else {
              this.expandPrompt(p);
            }
          }
        }
      }
    } catch (error) {
      console.error(
        'Error during AiManagerComponent completeInitialization:',
        error,
      );
      // Optionally, handle the error more gracefully
    }
  }
}
