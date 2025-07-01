import { Component, Input, Output, EventEmitter } from '@angular/core';
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
    `,
  ],
})
export class PicklistComponent {
  @Input() picklistId: string | undefined;

  @Input() sourceItems: TreeNode[] = [];
  @Output() sourceItemsChange = new EventEmitter<TreeNode[]>();

  @Input() targetItems: TreeNode[] = [];
  @Output() targetItemsChange = new EventEmitter<TreeNode[]>();

  @Input() sourceHeader: string = '';
  @Input() targetHeader: string = '';
  @Input() sourceFilterPlaceholder: string = 'Filter...';
  @Input() targetFilterPlaceholder: string = 'Filter...';

  selectedSourceNodes: TreeNode[] = [];
  selectedTargetNodes: TreeNode[] = [];

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
    this.clearSelection();
    this.updateEmitters();
  }

  moveAllToTarget() {
    if (!this.sourceItems || this.sourceItems.length === 0) return;
    this.targetItems = [...this.targetItems, ...this.sourceItems];
    this.sourceItems = [];
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
    this.clearSelection();
    this.updateEmitters();
  }

  moveAllToSource() {
    if (!this.targetItems || this.targetItems.length === 0) return;
    this.sourceItems = [...this.sourceItems, ...this.targetItems];
    this.targetItems = [];
    this.clearSelection();
    this.updateEmitters();
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
