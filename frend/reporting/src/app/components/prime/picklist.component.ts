import { Component, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common'; // Import CommonModule
import { FormsModule } from '@angular/forms'; // Import FormsModule if needed for inputs/buttons potentially
import { TreeNode, TreeComponent } from './tree.component'; // Import TreeComponent

@Component({
  selector: 'dburst-picklist',
  standalone: true,
  imports: [CommonModule, FormsModule, TreeComponent],
  templateUrl: './picklist.component.html',
  styles: [
    `
      :host {
        display: block;
      }

      /* Picklist Layout Styles */
      .p-picklist {
        display: flex;
        gap: 1rem; /* dt('picklist.gap') - Adjust as needed */
      }

      .p-picklist-controls {
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 0.5rem; /* dt('picklist.controls.gap') - Adjust as needed */
      }

      .p-picklist-list-container {
        flex: 1 1 50%;
        display: flex; /* Added to manage header/tree layout */
        flex-direction: column; /* Added */
      }

      .p-picklist-header {
        background: #f9fafb; /* Example header background */
        color: #374151; /* Example header text color */
        border: 1px solid #e5e7eb;
        padding: 0.75rem 1rem;
        font-weight: 600;
        border-bottom: 0 none;
        border-top-right-radius: 6px;
        border-top-left-radius: 6px;
      }

      /* Ensure tree takes remaining space */
      /* Style dburst-tree directly if needed, or use a wrapper */
      /* Note: Styling the component host (dburst-tree) from here might be limited */
      .p-picklist-list-container > dburst-tree {
        flex-grow: 1;
        border-top-left-radius: 0; /* Adjust if tree has border */
        border-top-right-radius: 0;
        border: 1px solid #e5e7eb; /* Match header border */
        border-top: 0; /* Remove top border if header has bottom */
        /* Ensure the tree itself allows scrolling if content overflows */
        /* The style binding in the template already sets height */
        overflow-y: auto;
      }

      /* Basic Button Styles (Keep existing ones) */
      .p-button {
        display: inline-flex;
        cursor: pointer;
        user-select: none;
        align-items: center;
        vertical-align: bottom;
        text-align: center;
        overflow: hidden;
        position: relative;
        border: 1px solid #ced4da;
        background: #f8f9fa;
        color: #495057;
        padding: 0.5rem 1rem;
        font-size: 1rem;
        transition:
          background-color 0.2s,
          color 0.2s,
          border-color 0.2s,
          box-shadow 0.2s;
        border-radius: 6px;
      }
      .p-button:enabled:hover {
        background: #e9ecef;
        color: #495057;
        border-color: #ced4da;
      }
      .p-button:disabled {
        opacity: 0.65;
        cursor: default;
      }
      .p-button-icon-only {
        width: 2.5rem; /* Adjust size as needed */
        padding: 0.5rem 0;
        justify-content: center;
      }
      .p-button .pi {
        font-size: 1.25rem; /* Adjust icon size */
      }

      .p-picklist-field-toolbar {
        display: flex;
        gap: 0.25rem;
        padding: 0.35rem 0.5rem;
        background: #f0f9ff;
        border: 1px solid #e5e7eb;
        border-top: 0;
        border-bottom: 0;
      }
      .p-button-toolbar {
        padding: 0.2rem 0.5rem;
        font-size: 0.8rem;
        border-radius: 4px;
      }
      .p-button-toolbar .pi {
        font-size: 0.8rem;
      }
      .p-button-toolbar-active {
        background: #dbeafe;
        border-color: #3b82f6;
        color: #1d4ed8;
        font-weight: 600;
      }
      .p-button-toolbar-active:enabled:hover {
        background: #bfdbfe;
        border-color: #3b82f6;
        color: #1d4ed8;
      }
    `,
  ],
})
export class PicklistComponent {
  constructor(private cdRef: ChangeDetectorRef) {}

  @Input() picklistId: string | undefined;

  @Input() sourceItems: TreeNode[] = [];
  @Output() sourceItemsChange = new EventEmitter<TreeNode[]>();

  @Input() targetItems: TreeNode[] = [];
  @Output() targetItemsChange = new EventEmitter<TreeNode[]>();

  @Input() sourceHeader: string = '';
  @Input() targetHeader: string = '';
  @Input() sourceFilterPlaceholder: string = 'Filter...';
  @Input() targetFilterPlaceholder: string = 'Filter...';

  @Input() enableFieldSelection: boolean = false;

  selectedSourceNodes: TreeNode[] = [];
  selectedTargetNodes: TreeNode[] = [];
  fieldIncludedNodes: TreeNode[] = [];
  fieldSelectionMode: 'allDetails' | 'namesOnly' | 'custom' = 'allDetails';

  get activeTargetSelection(): TreeNode[] {
    return this.enableFieldSelection ? this.fieldIncludedNodes : this.selectedTargetNodes;
  }

  set activeTargetSelection(value: TreeNode[]) {
    if (this.enableFieldSelection) {
      this.fieldIncludedNodes = value;
      this.fieldSelectionMode = 'custom';
      this.updateTableNodeStyles();
    } else {
      this.selectedTargetNodes = value;
    }
  }

  moveToTarget() {
    const selectedKeys = new Set(
      (this.selectedSourceNodes || []).map((n) => n.key),
    );
    const nodesToKeep: TreeNode[] = [];
    const nodesToMove: TreeNode[] = [];
    this.partitionNodes(
      this.sourceItems,
      selectedKeys,
      nodesToKeep,
      nodesToMove,
    );
    this.sourceItems = nodesToKeep;
    this.targetItems = [...this.targetItems, ...nodesToMove];
    if (this.enableFieldSelection) {
      this.autoIncludeNodes(nodesToMove);
      this.updateTableNodeStyles();
    }
    this.clearSelection();
    this.updateEmitters();
  }

  moveAllToTarget() {
    if (!this.sourceItems || this.sourceItems.length === 0) return;
    const movedItems = [...this.sourceItems];
    this.targetItems = [...this.targetItems, ...movedItems];
    this.sourceItems = [];
    if (this.enableFieldSelection) {
      this.autoIncludeNodes(movedItems);
      this.updateTableNodeStyles();
    }
    this.clearSelection();
    this.updateEmitters();
  }

  moveToSource() {
    const selectedKeys = new Set(
      (this.selectedTargetNodes || []).map((n) => n.key),
    );
    const nodesToKeep: TreeNode[] = [];
    const nodesToMove: TreeNode[] = [];
    this.partitionNodes(
      this.targetItems,
      selectedKeys,
      nodesToKeep,
      nodesToMove,
    );
    this.targetItems = nodesToKeep;
    this.sourceItems = [...this.sourceItems, ...nodesToMove];
    if (this.enableFieldSelection) {
      this.removeFromFieldSelection(nodesToMove);
    }
    this.clearSelection();
    this.updateEmitters();
  }

  moveAllToSource() {
    if (!this.targetItems || this.targetItems.length === 0) return;
    this.sourceItems = [...this.sourceItems, ...this.targetItems];
    this.targetItems = [];
    if (this.enableFieldSelection) {
      this.fieldIncludedNodes = [];
    }
    this.clearSelection();
    this.updateEmitters();
  }

  // --- Field Selection Toolbar Actions ---

  selectAllFields(): void {
    this.fieldIncludedNodes = [];
    this.collectAllNodes(this.targetItems, this.fieldIncludedNodes);
    this.fieldIncludedNodes = [...this.fieldIncludedNodes];
    this.clearPartialSelected(this.targetItems);
    this.fieldSelectionMode = 'allDetails';
    this.updateTableNodeStyles();
    this.cdRef.detectChanges();
  }

  selectNamesOnly(): void {
    this.fieldIncludedNodes = [];
    this.clearPartialSelected(this.targetItems);
    this.fieldSelectionMode = 'namesOnly';
    this.updateTableNodeStyles();
    this.cdRef.detectChanges();
  }

  // --- Field Selection State for Prompt Building ---

  getFieldSelectionState(): {
    fullDetailTables: TreeNode[];
    partialDetailTables: { node: TreeNode; selectedChildren: TreeNode[] }[];
    nameOnlyTables: TreeNode[];
  } {
    const full: TreeNode[] = [];
    const partial: { node: TreeNode; selectedChildren: TreeNode[] }[] = [];
    const nameOnly: TreeNode[] = [];

    const includedKeys = new Set(
      (this.fieldIncludedNodes || []).map((n) => n.key),
    );

    for (const tableNode of this.targetItems) {
      if (!tableNode.children?.length) {
        if (includedKeys.has(tableNode.key)) {
          full.push(tableNode);
        } else {
          nameOnly.push(tableNode);
        }
        continue;
      }

      const selectedChildren = tableNode.children.filter((child) =>
        includedKeys.has(child.key),
      );

      if (selectedChildren.length === tableNode.children.length) {
        full.push(tableNode);
      } else if (selectedChildren.length > 0) {
        partial.push({ node: tableNode, selectedChildren });
      } else {
        nameOnly.push(tableNode);
      }
    }

    return { fullDetailTables: full, partialDetailTables: partial, nameOnlyTables: nameOnly };
  }

  // --- Private Helpers ---

  private updateTableNodeStyles(): void {
    if (!this.enableFieldSelection) return;
    const includedKeys = new Set(
      (this.fieldIncludedNodes || []).map((n) => n.key),
    );
    for (const tableNode of this.targetItems) {
      if (!tableNode.children?.length) {
        tableNode.styleClass = includedKeys.has(tableNode.key) ? '' : 'p-weak-selected';
        continue;
      }
      const selectedChildren = tableNode.children.filter((child) =>
        includedKeys.has(child.key),
      );
      if (selectedChildren.length === 0) {
        tableNode.styleClass = 'p-weak-selected';
      } else {
        tableNode.styleClass = '';
      }
    }
  }

  private autoIncludeNodes(nodes: TreeNode[]): void {
    for (const node of nodes) {
      this.fieldIncludedNodes.push(node);
      if (node.children?.length) {
        this.autoIncludeNodes(node.children);
      }
    }
    this.fieldIncludedNodes = [...this.fieldIncludedNodes];
  }

  private removeFromFieldSelection(nodes: TreeNode[]): void {
    const keysToRemove = new Set<string | undefined>();
    this.collectAllKeys(nodes, keysToRemove);
    this.fieldIncludedNodes = this.fieldIncludedNodes.filter(
      (n) => !keysToRemove.has(n.key),
    );
  }

  private collectAllKeys(
    nodes: TreeNode[],
    keys: Set<string | undefined>,
  ): void {
    for (const node of nodes) {
      keys.add(node.key);
      if (node.children?.length) {
        this.collectAllKeys(node.children, keys);
      }
    }
  }

  private collectAllNodes(nodes: TreeNode[], collected: TreeNode[]): void {
    for (const node of nodes) {
      collected.push(node);
      if (node.children?.length) {
        this.collectAllNodes(node.children, collected);
      }
    }
  }

  private clearPartialSelected(nodes: TreeNode[]): void {
    for (const node of nodes) {
      node.partialSelected = false;
      if (node.children?.length) {
        this.clearPartialSelected(node.children);
      }
    }
  }

  private partitionNodes(
    nodes: TreeNode[],
    selectedKeys: Set<string | undefined>,
    nodesToKeep: TreeNode[],
    nodesToMove: TreeNode[],
  ) {
    if (!nodes) return;
    for (const node of nodes) {
      const nodeKey = node.key;
      if (selectedKeys.has(nodeKey)) {
        nodesToMove.push(node);
      } else if (node.children && node.children.length > 0) {
        const childNodesToKeep: TreeNode[] = [];
        const childNodesToMove: TreeNode[] = [];
        this.partitionNodes(
          node.children,
          selectedKeys,
          childNodesToKeep,
          childNodesToMove,
        );
        if (childNodesToMove.length > 0 && childNodesToKeep.length > 0) {
          const partialNode = { ...node, children: childNodesToKeep };
          nodesToKeep.push(partialNode);
          nodesToMove.push(...childNodesToMove);
        } else if (childNodesToMove.length > 0) {
          nodesToMove.push(...childNodesToMove);
        } else {
          nodesToKeep.push(node);
        }
      } else {
        nodesToKeep.push(node);
      }
    }
  }

  private clearSelection() {
    this.selectedSourceNodes = [];
    this.selectedTargetNodes = [];
  }

  private updateEmitters() {
    this.sourceItemsChange.emit([...this.sourceItems]);
    this.targetItemsChange.emit([...this.targetItems]);
  }
}
