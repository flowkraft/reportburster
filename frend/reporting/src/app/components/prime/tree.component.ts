import {
  Component,
  Input,
  Output,
  EventEmitter,
  TemplateRef,
  ViewChild,
  ElementRef,
  OnInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TreeNodeComponent } from './tree-node.component'; // Import the node component

// Define TreeNode interface (can be in its own file)
export interface TreeNode {
  key?: string;
  label: string;
  data?: any;
  icon?: string;
  expandedIcon?: string;
  collapsedIcon?: string;
  children?: TreeNode[];
  expanded?: boolean;
  type?: string;
  parent?: TreeNode;
  partialSelected?: boolean;
  styleClass?: string;
  draggable?: boolean;
  droppable?: boolean;
  selectable?: boolean;
  leaf?: boolean;
  style?: string;
  visible?: boolean; // Added for filtering
}

@Component({
  selector: 'dburst-tree',
  standalone: true,
  imports: [CommonModule, FormsModule, TreeNodeComponent], // Import CustomTreeNodeComponent here
  template: `
    <div
      id="{{ treeId }}"
      class="p-tree p-component"
      [ngClass]="{
        'p-tree-selectable': !!selectionMode,
        'p-tree-loading': loading,
      }"
    >
      <div
        *ngIf="loading && loadingMode === 'mask'"
        class="p-tree-mask p-overlay-mask"
      >
        <i [class]="'p-tree-loading-icon pi pi-spin ' + loadingIcon"></i>
      </div>

      <div *ngIf="filter" class="p-tree-filter-container">
        <input
          #filterInput
          id="filterInput{{ treeId }}"
          type="text"
          class="p-tree-filter p-inputtext p-component"
          [attr.placeholder]="filterPlaceholder || 'Filter'"
          (input)="onFilterKeyup($event)"
        />
        <span class="p-tree-filter-icon pi pi-search"></span>
      </div>

      <div class="p-tree-wrapper" [style.max-height]="scrollHeight">
        <ul class="p-tree-container p-tree-root-children" role="tree">
          <dburst-tree-node
            *ngFor="let node of visibleNodes; trackBy: trackBy"
            id="treeNode{{ node.key }}{{ treeId }}"
            [node]="node"
            [level]="0"
            [indentation]="indentation"
            [selectable]="isSelectable()"
            [checkboxMode]="selectionMode === 'checkbox'"
            [isSelected]="isSelected(node)"
            [nodeTemplate]="
              nodeTemplate || _templateMap?.[node.type || 'default']
            "
            (nodeSelect)="handleNodeSelect($event)"
            (nodeUnselect)="handleNodeUnselect($event)"
            (nodeToggle)="handleNodeToggle($event)"
          >
          </dburst-tree-node>
        </ul>
        <div *ngIf="isEmpty()" class="p-tree-empty-message">
          {{ emptyMessage || 'No records found' }}
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      /* Base Tree Styles */
      .p-tree {
        background: #ffffff; /* dt('tree.background') */
        color: #4b5563; /* dt('tree.color') */
        padding: 0.5rem; /* dt('tree.padding') */
        border: 1px solid #dee2e6; /* Example border */
        border-radius: 6px; /* Example border-radius */
        position: relative; /* Needed for mask */
        overflow: hidden; /* Contain elements */
      }
      .p-tree-wrapper {
        overflow: auto; /* Enable scrolling if needed */
      }
      .p-tree-container.p-tree-root-children {
        display: flex;
        list-style-type: none;
        flex-direction: column;
        margin: 0;
        padding: 0;
        gap: 0px; /* dt('tree.gap') - Adjust as needed */
        padding-block-start: 0px; /* dt('tree.gap') */
      }

      /* Filter Styles */
      .p-tree-filter-container {
        position: relative;
        margin-bottom: 0.5rem; /* Spacing */
      }
      .p-tree-filter {
        width: 100%;
        padding: 0.5rem 0.75rem; /* Basic input padding */
        padding-right: 2.5rem; /* Space for icon */
        border: 1px solid #ced4da;
        border-radius: 6px;
        box-sizing: border-box; /* Include padding and border in width */
      }
      .p-tree-filter-icon {
        position: absolute;
        top: 50%;
        right: 0.75rem;
        transform: translateY(-50%);
        color: #6c757d;
      }

      /* Loading Mask Styles */
      .p-tree-mask {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.4); /* Semi-transparent white */
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10; /* Ensure it's above content */
      }
      .p-tree-loading-icon {
        font-size: 2rem; /* dt('tree.loading.icon.size') */
        width: 2rem;
        height: 2rem;
        color: var(
          --primary-color,
          #10b981
        ); /* Use primary color if available */
      }
      /* Add pi-spin animation if not globally available */
      @keyframes pi-spin {
        100% {
          transform: rotate(360deg);
        }
      }
      .pi-spin {
        animation: pi-spin 1s linear infinite;
      }

      /* Empty Message Styles */
      .p-tree-empty-message {
        padding: 1rem;
        text-align: center;
        color: #6c757d;
      }
    `,
  ],
})
export class TreeComponent implements OnInit, OnChanges {
  @Input() treeId: string | undefined;

  @Input() value: TreeNode[] = [];
  @Input() selectionMode: 'single' | 'multiple' | 'checkbox' | null = null;
  @Input() selection: any = null;
  @Input() filter: boolean = false;
  @Input() filterBy: string = 'label';
  @Input() filterPlaceholder: string | undefined;
  @Input() filterMode: 'lenient' | 'strict' = 'lenient';
  @Input() loading: boolean = false;
  @Input() loadingMode: 'mask' | 'icon' = 'mask'; // 'icon' mode not fully implemented here
  @Input() loadingIcon: string = 'pi pi-spinner';
  @Input() emptyMessage: string | undefined;
  @Input() scrollHeight: string | undefined;
  @Input() indentation: number = 1.5; // Default indentation in rem
  @Input() propagateSelectionUp: boolean = true;
  @Input() propagateSelectionDown: boolean = true;
  @Input() metaKeySelection: boolean = false; // For multiple selection
  @Input() nodeTemplate: TemplateRef<any> | undefined; // Specific template for all nodes
  @Input() _templateMap: { [key: string]: TemplateRef<any> } | undefined; // For typed nodes

  @Output() selectionChange = new EventEmitter<any>();
  @Output() nodeSelect = new EventEmitter<{
    originalEvent: Event;
    node: TreeNode;
  }>();
  @Output() nodeUnselect = new EventEmitter<{
    originalEvent: Event;
    node: TreeNode;
  }>();
  @Output() nodeExpand = new EventEmitter<{
    originalEvent: Event;
    node: TreeNode;
  }>();
  @Output() nodeCollapse = new EventEmitter<{
    originalEvent: Event;
    node: TreeNode;
  }>();
  @Output() onFilter = new EventEmitter<{
    filter: string;
    filteredValue: TreeNode[] | null;
  }>();

  @ViewChild('filterInput') filterInputViewChild:
    | ElementRef<HTMLInputElement>
    | undefined;

  visibleNodes: TreeNode[] = [];
  _filteredNodes: TreeNode[] | null = null;
  _filterValue: string = '';
  nodeTouched: boolean = false; // For metaKeySelection on touch devices

  // Basic trackBy function
  trackBy = (index: number, node: TreeNode) => node.key || node;

  ngOnInit() {
    this.updateVisibleNodes();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.value) {
      this.updateVisibleNodes();
      if (this.hasFilterActive()) {
        this._filter(this._filterValue); // Re-apply filter if value changes
      }
    }
    if (changes.selectionMode || changes.selection) {
      // Potentially update partial selection states if needed
    }
  }

  updateVisibleNodes() {
    this.visibleNodes = this._filteredNodes ?? this.value ?? [];
    // Initialize parent references and potentially other properties
    this.initializeNodes(null, this.value);
  }

  initializeNodes(parent: TreeNode | null, nodes: TreeNode[] | undefined) {
    if (!nodes) return;
    for (const node of nodes) {
      node.parent = parent ?? undefined; // Set parent reference
      if (node.children) {
        this.initializeNodes(node, node.children);
      }
    }
  }

  onFilterKeyup(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this._filterValue = value;
    this._filter(value);
  }

  _filter(value: string) {
    const filterValue = value.trim();
    if (filterValue === '') {
      this._filteredNodes = null;
    } else {
      this._filteredNodes = [];
      const searchFields: string[] = this.filterBy.split(',');
      const filterText = filterValue.toLowerCase(); // Basic case-insensitive filter
      const isStrictMode = this.filterMode === 'strict';

      for (let node of this.value) {
        const copyNode = { ...node }; // Shallow copy to avoid modifying original
        const params = { searchFields, filterText, isStrictMode };
        if (this.filterNode(copyNode, params)) {
          this._filteredNodes.push(copyNode);
        }
      }
    }
    this.updateVisibleNodes();
    this.onFilter.emit({
      filter: filterValue,
      filteredValue: this._filteredNodes,
    });
  }

  // Recursive function to check if a node or its children match the filter
  filterNode(
    node: TreeNode,
    params: {
      searchFields: string[];
      filterText: string;
      isStrictMode: boolean;
    },
  ): boolean {
    let matched = this.isFilterMatched(node, params);

    if (node.children) {
      let filteredChildren: TreeNode[] = [];
      let childMatched = false;
      for (const childNode of node.children) {
        const copyChild = { ...childNode }; // Shallow copy children too
        if (this.filterNode(copyChild, params)) {
          filteredChildren.push(copyChild);
          childMatched = true;
        }
      }
      node.children = filteredChildren; // Replace children with filtered ones
      // In lenient mode, expand parent if a child matches
      if (!params.isStrictMode && childMatched) {
        node.expanded = true; // Auto-expand filtered nodes
        matched = true;
      }
      // In strict mode, only include parent if it matches directly AND has matched children
      if (params.isStrictMode && matched && !childMatched) {
        matched = false; // Parent matches, but no children do in strict mode
      }
      // If parent doesn't match but children do
      if (!matched && childMatched) {
        matched = true;
      }
    }
    // Ensure leaf nodes are included if they match directly
    if (this.isNodeLeaf(node) && this.isFilterMatched(node, params)) {
      matched = true;
    }

    node.visible = matched; // Mark node visibility based on match
    return matched;
  }

  // Checks if the node itself matches the filter text
  isFilterMatched(
    node: TreeNode,
    params: { searchFields: string[]; filterText: string },
  ): boolean {
    for (const field of params.searchFields) {
      const fieldValue = (node[field] ?? '').toString().toLowerCase();
      if (fieldValue.includes(params.filterText)) {
        return true;
      }
    }
    return false;
  }

  resetFilter() {
    this._filteredNodes = null;
    this._filterValue = '';
    if (this.filterInputViewChild) {
      this.filterInputViewChild.nativeElement.value = '';
    }
    this.updateVisibleNodes();
    this.onFilter.emit({ filter: '', filteredValue: null });
  }

  hasFilterActive(): boolean {
    return this._filterValue.length > 0;
  }

  handleNodeToggle(event: {
    originalEvent: Event;
    node: TreeNode;
    expanded: boolean;
  }) {
    if (event.expanded) {
      this.nodeExpand.emit({
        originalEvent: event.originalEvent,
        node: event.node,
      });
    } else {
      this.nodeCollapse.emit({
        originalEvent: event.originalEvent,
        node: event.node,
      });
    }
    // Force change detection if needed, though direct property binding should handle it
  }

  handleNodeSelect(event: { originalEvent: Event; node: TreeNode }) {
    const node = event.node;
    const originalEvent = event.originalEvent;

    if (!this.selectionMode || node.selectable === false) {
      return;
    }

    const isSelected = this.isSelected(node);
    const metaKey =
      (this.metaKeySelection &&
        !this.nodeTouched &&
        (originalEvent as MouseEvent).ctrlKey) ||
      (originalEvent as MouseEvent).metaKey;

    if (this.selectionMode === 'single') {
      if (isSelected) {
        this.selection = null;
        this.nodeUnselect.emit({ originalEvent, node });
      } else {
        this.selection = node;
        this.nodeSelect.emit({ originalEvent, node });
      }
    } else if (this.selectionMode === 'multiple') {
      if (isSelected) {
        if (metaKey) {
          this.selection = this.selection.filter((n) => n.key !== node.key);
          this.nodeUnselect.emit({ originalEvent, node });
        } else {
          // If not using meta key, clicking a selected node might deselect others
          // Or just deselect itself - depends on desired UX. Let's deselect others.
          this.selection = [node];
          // Technically, this is a select event for the node, even if others were deselected.
          this.nodeSelect.emit({ originalEvent, node });
        }
      } else {
        this.selection = metaKey ? [...(this.selection || []), node] : [node];
        this.nodeSelect.emit({ originalEvent, node });
      }
    } else if (this.selectionMode === 'checkbox') {
      this.selection = this.selection || [];
      const index = this.findIndexInSelection(node);

      if (index !== -1) {
        // Node is currently selected, deselect it
        if (this.propagateSelectionDown) this.propagateDown(node, false);
        else this.selection.splice(index, 1);

        if (this.propagateSelectionUp && node.parent)
          this.propagateUp(node.parent, false);

        this.nodeUnselect.emit({ originalEvent, node });
      } else {
        // Node is not selected, select it
        if (this.propagateSelectionDown) this.propagateDown(node, true);
        else this.selection.push(node);

        if (this.propagateSelectionUp && node.parent)
          this.propagateUp(node.parent, true);

        this.nodeSelect.emit({ originalEvent, node });
      }
      // Update partial selection states after propagation
      this.updatePartialSelection(this.value);
    }

    this.selectionChange.emit(this.selection);
    this.nodeTouched = false; // Reset touch flag
  }

  handleNodeUnselect(event: { originalEvent: Event; node: TreeNode }) {
    // This is mostly handled within handleNodeSelect now, but keep the output emit
    // If direct unselect logic is needed (e.g., external button), implement here
  }

  findIndexInSelection(node: TreeNode): number {
    if (!this.selection) return -1;

    if (this.selectionMode === 'single') {
      return this.selection?.key === node.key ? 0 : -1;
    } else {
      return (this.selection as TreeNode[]).findIndex(
        (n) => n.key === node.key,
      );
    }
  }

  isSelected(node: TreeNode): boolean {
    return this.findIndexInSelection(node) !== -1;
  }

  isSelectable(): boolean {
    return this.selectionMode != null;
  }

  isNodeLeaf(node: TreeNode): boolean {
    return node.leaf === false
      ? false
      : !(node.children && node.children.length > 0);
  }

  isEmpty(): boolean {
    return !this.visibleNodes || this.visibleNodes.length === 0;
  }

  // --- Checkbox Propagation Logic ---

  propagateUp(node: TreeNode, select: boolean) {
    if (!node || !this.value) return; // Check if node or value is null/undefined

    let selectedCount = 0;
    let childPartialSelected = false;

    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        if (this.isSelected(child)) {
          selectedCount++;
        } else if (child.partialSelected) {
          childPartialSelected = true;
        }
      }
    } else {
      // Handle case where node might not have children initially
      // or children array is empty
    }

    const nodeIndex = this.findIndexInSelection(node);
    const isNodeSelected = nodeIndex !== -1;

    if (
      select &&
      node.children &&
      selectedCount === node.children.length &&
      !childPartialSelected
    ) {
      // All children selected, select parent if not already selected
      if (!isNodeSelected) {
        this.selection = [...(this.selection || []), node];
      }
      node.partialSelected = false;
    } else {
      // Not all children selected or some are partially selected
      if (isNodeSelected) {
        // Parent is selected, but children aren't fully selected -> deselect parent
        this.selection.splice(nodeIndex, 1);
      }
      // Set partial selection if at least one child is selected or partially selected
      node.partialSelected =
        childPartialSelected ||
        (selectedCount > 0 &&
          (!node.children || selectedCount < node.children.length));
    }

    // Propagate to the parent node
    if (node.parent) {
      this.propagateUp(node.parent, select);
    }
  }

  propagateDown(node: TreeNode, select: boolean) {
    const index = this.findIndexInSelection(node);

    if (select && index === -1) {
      this.selection = [...(this.selection || []), node];
    } else if (!select && index !== -1) {
      this.selection.splice(index, 1);
    }
    node.partialSelected = false; // When propagating down, the node itself is fully selected or deselected

    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        this.propagateDown(child, select);
      }
    }
  }

  // Call this after selection changes to update visual states
  updatePartialSelection(nodes: TreeNode[] | undefined) {
    if (
      !nodes ||
      this.selectionMode !== 'checkbox' ||
      !this.propagateSelectionUp
    )
      return;

    for (const node of nodes) {
      if (!this.isNodeLeaf(node) && node.children) {
        this.updatePartialSelection(node.children); // Update children first

        let selectedCount = 0;
        let childPartialSelected = false;
        for (const child of node.children) {
          if (this.isSelected(child)) {
            selectedCount++;
          } else if (child.partialSelected) {
            childPartialSelected = true;
          }
        }

        const isSelected = this.isSelected(node);
        if (isSelected) {
          node.partialSelected = false; // If selected, cannot be partial
        } else {
          node.partialSelected =
            childPartialSelected ||
            (selectedCount > 0 && selectedCount < node.children.length);
        }
      } else {
        node.partialSelected = false; // Leaf nodes cannot be partial
      }
    }
  }
}
