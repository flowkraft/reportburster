import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  ViewChild,
  TemplateRef,
  ChangeDetectorRef,
  AfterViewChecked,
} from '@angular/core';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { AiCopilotService, PromptInfo } from '../ai-copilot/ai-copilot.service';
import { InfoService } from '../dialog-info/info.service';

// --- Merged Interfaces & Types ---

// A comprehensive interface for managed applications, based on apps.json and runtime needs.
export interface ManagedApp {
  id: string;
  name: string;
  description: string;
  type: 'docker' | 'local' | 'url';
  url?: string;
  commands?: { key: string; name: string; description: string; command: string }[];
  healthCheck?: { type: 'tcp' | 'command'; command?: string };
  state?: 'running' | 'stopped' | 'unknown' | 'not-installed';
  aiPromptCategory?: string; // Links an app to a category of AI prompts
  index?: number;
}

// Configuration for launching the AI Copilot modal with specific settings.
export type AiCopilotLaunchConfig = {
  initialActiveTabKey?: 'PROMPTS' | 'HEY_AI';
  initialSelectedCategory?: string;
  initialExpandedPromptId?: string;
  promptVariables?: { [key: string]: string };
};

// Internal interface for prompt categories.
interface CategoryWithCount {
  name: string;
  count: number;
}

// --- Component Definition ---

@Component({
  selector: 'dburst-action-center',
  templateUrl: './action-center.component.html',
})
export class ActionCenterComponent implements OnInit, AfterViewChecked {
  // --- Inputs ---
  @Input() apps: ManagedApp[] = [];
  @Input() availableAppsToAdd: ManagedApp[] = [];
  @Input() displayMode: 'dropUp' | 'dropDown' | 'expandedList' | 'promptsButton' = 'dropDown';
  @Input() readOnly: boolean = true;

  // --- Outputs ---
  @Output() appsChanged = new EventEmitter<ManagedApp[]>();
  @Output() commandExecuted = new EventEmitter<{ app: ManagedApp; command: { key: string; name: string; description: string; command: string } }>();

  // --- Component State ---
  isEditing: boolean = false;
  private pendingInit = false;

  // --- AI Copilot Modal State ---
  @ViewChild('aiCopilotModalTemplate') aiCopilotModalTemplate!: TemplateRef<any>;
  modalRef?: BsModalRef;
  isPromptsTabActive: boolean = true;
  isHeyAiTabActive: boolean = false;
  allPrompts: PromptInfo[] = [];
  filteredPrompts: PromptInfo[] = [];
  categoriesWithCounts: CategoryWithCount[] = [];
  uniqueTags: string[] = [];
  searchTerm: string = '';
  selectedCategory: string = 'All Prompts';
  selectedTag: string | null = null;
  expandedPrompt: PromptInfo | null = null;
  
  // --- Modal Launch Configuration ---
  private launchConfig: AiCopilotLaunchConfig = {};

  constructor(
    private modalService: BsModalService,
    private aiCopilotService: AiCopilotService,
    private infoService: InfoService,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (!this.readOnly) {
      this.isEditing = true;
    }
    this.loadPrompts();
  }

  ngAfterViewChecked(): void {
    if (this.pendingInit) {
      this.pendingInit = false;
      this.completeInitialization();
      this.cdRef.detectChanges();
    }
  }

  // --- App Management Logic ---
  executeCommand(app: ManagedApp, command: any): void {
    this.commandExecuted.emit({ app, command });
  }

  toggleEditMode(): void {
    this.isEditing = !this.isEditing;
  }

  onAppReordered(): void {
    this.emitAppChanges();
  }

  removeApp(appToRemove: ManagedApp): void {
    this.apps = this.apps.filter(app => app.id !== appToRemove.id);
    this.emitAppChanges();
  }

  addApp(appToAdd: ManagedApp): void {
    this.apps.push(appToAdd);
    this.emitAppChanges();
  }

  private emitAppChanges(): void {
    const appsWithIndex = this.apps.map((app, index) => ({ ...app, index }));
    this.appsChanged.emit(appsWithIndex);
  }

  // --- AI Copilot Logic ---
  public launchAiCopilot(config?: AiCopilotLaunchConfig): void {
    this.launchConfig = config || {};
    this.pendingInit = true;
    this.modalRef = this.modalService.show(this.aiCopilotModalTemplate, {
      class: 'ai-copilot-modal-large',
      animated: false,
    });
  }

  private completeInitialization(): void {
    this.isPromptsTabActive = this.launchConfig.initialActiveTabKey !== 'HEY_AI';
    this.isHeyAiTabActive = this.launchConfig.initialActiveTabKey === 'HEY_AI';

    if (this.isPromptsTabActive) {
      this.selectedCategory = this.launchConfig.initialSelectedCategory || 'All Prompts';
      this.applyFilters();

      if (this.launchConfig.initialExpandedPromptId) {
        const p = this.allPrompts.find(p => p.id === this.launchConfig.initialExpandedPromptId);
        if (p) {
          this.expandPromptWithVariables(p);
        }
      }
    }
  }

  private expandPromptWithVariables(promptDef: PromptInfo): void {
    let text = promptDef.promptText;
    if (this.launchConfig.promptVariables) {
      Object.entries(this.launchConfig.promptVariables).forEach(([key, val]) => {
        const escKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        text = text.replace(new RegExp(escKey, 'g'), val);
      });
    }
    this.expandedPrompt = { ...promptDef, promptText: text };
  }

  closeModal(): void {
    this.modalRef?.hide();
  }

  onTabSelect(isHeyAi: boolean): void {
    this.isPromptsTabActive = !isHeyAi;
    this.isHeyAiTabActive = isHeyAi;
  }

  loadPrompts(): void {
    this.allPrompts = this.aiCopilotService.getAllPrompts();
    this.calculateUniqueTags();
    this.calculateCategoriesWithCounts();
    this.applyFilters();
  }

  calculateUniqueTags(): void {
    const tags = new Set<string>();
    this.allPrompts.forEach(p => p.tags.forEach(tag => tags.add(tag)));
    this.uniqueTags = Array.from(tags).sort();
  }

  calculateCategoriesWithCounts(): void {
    const counts: { [key: string]: number } = {};
    this.allPrompts.forEach(p => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    this.categoriesWithCounts = [
      { name: 'All Prompts', count: this.allPrompts.length },
      ...Object.entries(counts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    ];
  }

  applyFilters(): void {
    let tempPrompts = [...this.allPrompts];
    if (this.selectedCategory !== 'All Prompts') {
      tempPrompts = tempPrompts.filter(p => p.category === this.selectedCategory);
    }
    if (this.selectedTag) {
      tempPrompts = tempPrompts.filter(p => p.tags.includes(this.selectedTag!));
    }
    const term = this.searchTerm.toLowerCase().trim();
    if (term) {
      tempPrompts = tempPrompts.filter(p =>
        p.title.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term) ||
        p.promptText.toLowerCase().includes(term) ||
        p.tags.some(tag => tag.toLowerCase().includes(term))
      );
    }
    this.filteredPrompts = tempPrompts;
    this.expandedPrompt = null;
  }

  filterByCategory(category: string): void {
    this.selectedCategory = category;
    this.selectedTag = null;
    this.applyFilters();
  }

  filterByTag(tag: string | null): void {
    this.selectedTag = this.selectedTag === tag ? null : tag;
    this.applyFilters();
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  expandPrompt(prompt: PromptInfo): void {
    this.expandedPrompt = prompt;
  }

  collapsePrompt(): void {
    this.expandedPrompt = null;
  }

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.infoService.showInformation({ message: 'Prompt copied to clipboard!' });
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      this.infoService.showInformation({ message: 'Failed to copy prompt.' });
    });
  }

  launchExternalCopilot(): void {
    window.open('https://copilot.microsoft.com', '_blank');
  }
}