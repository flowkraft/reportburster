import {
  Component,
  Input,
  Output,
  EventEmitter,
  TemplateRef,
  HostBinding,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { TreeNode } from './tree.component';

@Component({
  selector: 'dburst-tree-node',
  standalone: true,
  imports: [CommonModule], // Import itself for recursion if needed, but handled by parent loop here
  template: `
    <div
      class="p-treenode-content"
      [style.padding-left]="level * indentation + 'rem'"
      [ngClass]="{
        'p-treenode-selectable': selectable && node.selectable !== false,
        'p-treenode-selected': isSelected && checkboxMode,
        'p-highlight': isSelected && !checkboxMode,
      }"
      (click)="onNodeClick($event)"
    >
      <!-- Toggler -->
      <button
        type="button"
        *ngIf="!isNodeLeaf()"
        class="p-tree-node-toggle-button p-link"
        (click)="toggle($event)"
      >
        <span
          class="p-tree-node-toggle-icon pi"
          [ngClass]="node.expanded ? 'pi-chevron-down' : 'pi-chevron-right'"
        >
        </span>
      </button>
      <!-- Placeholder for leaf nodes to maintain alignment -->
      <span
        *ngIf="isNodeLeaf()"
        class="p-tree-node-toggle-button p-link"
        style="visibility: hidden;"
      >
        <span class="p-tree-node-toggle-icon pi"></span>
      </span>

      <!-- Checkbox -->
      <div
        *ngIf="checkboxMode"
        class="p-checkbox p-component"
        (click)="onCheckboxClick($event)"
      >
        <!-- Stop propagation on checkbox click -->
        <div
          class="p-checkbox-box"
          [ngClass]="{
            'p-highlight': isSelected,
            'p-indeterminate': node.partialSelected,
          }"
        >
          <span
            class="p-checkbox-icon pi"
            [ngClass]="{
              'pi-check': isSelected,
              'pi-minus': node.partialSelected,
            }"
          >
          </span>
        </div>
      </div>

      <!-- Icon -->
      <span
        [class]="getIcon()"
        *ngIf="node.icon || node.expandedIcon || node.collapsedIcon"
      ></span>

      <!-- Label -->
      <span class="p-treenode-label">
        <span *ngIf="!nodeTemplate">{{ node.label }}</span>
        <ng-container
          *ngIf="nodeTemplate"
          [ngTemplateOutlet]="nodeTemplate"
          [ngTemplateOutletContext]="{ $implicit: node }"
        >
        </ng-container>
      </span>
    </div>

    <!-- Children -->
    <ul
      class="p-treenode-children"
      *ngIf="node.expanded && node.children && node.children.length"
      role="group"
    >
      <!-- Use ng-container to avoid adding extra elements -->
      <ng-container
        *ngFor="let childNode of node.children; trackBy: trackByChild"
      >
        <li
          class="p-treenode"
          [ngClass]="{ 'p-treenode-leaf': isChildNodeLeaf(childNode) }"
          role="treeitem"
          *ngIf="childNode.visible !== false"
        >
          <!-- Render child only if visible (for filtering) -->
          <dburst-tree-node
            [node]="childNode"
            [level]="level + 1"
            [indentation]="indentation"
            [selectable]="selectable"
            [checkboxMode]="checkboxMode"
            [isSelected]="isNodeSelected(childNode)"
            [nodeTemplate]="nodeTemplate"
            (nodeSelect)="onChildNodeSelect($event)"
            (nodeUnselect)="onChildNodeUnselect($event)"
            (nodeToggle)="onChildNodeToggle($event)"
          >
          </dburst-tree-node>
        </li>
      </ng-container>
    </ul>
  `,
  styles: [
    `
      :host {
        display: block; /* Ensure the component takes block space */
      }
      /* Node Structure */
      .p-treenode {
        padding: 0;
        outline: 0 none;
        list-style-type: none; /* Remove default list styling */
        margin: 0;
      }
      .p-treenode-children {
        display: flex;
        list-style-type: none;
        flex-direction: column;
        margin: 0;
        padding: 0;
        gap: 0px; /* dt('tree.gap') */
        padding-block-start: 0px; /* dt('tree.gap') */
        /* Indentation is handled by padding-left on content now */
      }

      /* Node Content Area */
      .p-treenode-content {
        border-radius: 4px; /* dt('tree.node.border.radius') */
        padding: 0.25rem 0.5rem; /* dt('tree.node.padding') - Adjusted for tighter fit */
        display: flex;
        align-items: center;
        outline-color: transparent;
        color: #4b5563; /* dt('tree.node.color') */
        gap: 0.5rem; /* dt('tree.node.gap') */
        transition:
          background 0.2s,
          color 0.2s,
          box-shadow 0.2s; /* dt('tree.transition.duration') */
        cursor: default; /* Default cursor */
      }
      .p-treenode-selectable {
        cursor: pointer; /* Pointer cursor only for selectable nodes */
      }
      .p-treenode-content:focus-visible {
        /* Use focus-visible for keyboard nav */
        box-shadow: 0 0 0 0.2rem rgba(16, 185, 129, 0.5); /* dt('tree.node.focus.ring.shadow') - Example focus */
        outline: 0 none; /* dt('tree.node.focus.ring.width') etc. */
      }
      .p-treenode-selectable:not(.p-highlight):not(.p-treenode-selected):hover {
        background: #f3f4f6; /* dt('tree.node.hover.background') */
        color: #374151; /* dt('tree.node.hover.color') */
      }
      /* Selection Highlight (non-checkbox) */
      .p-treenode-content.p-highlight {
        background: #d1fae5; /* dt('tree.node.selected.background') - Lighter green */
        color: #065f46; /* dt('tree.node.selected.color') - Darker green */
      }

      /* Toggler Button */
      .p-tree-node-toggle-button {
        cursor: pointer;
        user-select: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        position: relative;
        flex-shrink: 0;
        width: 1.5rem; /* dt('tree.node.toggle.button.size') */
        height: 1.5rem;
        color: #6b7280; /* dt('tree.node.toggle.button.color') */
        border: 0 none;
        background: transparent;
        border-radius: 50%; /* dt('tree.node.toggle.button.border.radius') */
        transition:
          background 0.2s,
          color 0.2s,
          box-shadow 0.2s;
        outline-color: transparent;
        padding: 0;
      }
      .p-tree-node-toggle-button:enabled:hover {
        background: #e5e7eb; /* dt('tree.node.toggle.button.hover.background') */
        color: #4b5563; /* dt('tree.node.toggle.button.hover.color') */
      }
      .p-treenode-content.p-highlight .p-tree-node-toggle-button:hover {
        background: rgba(
          6,
          95,
          70,
          0.1
        ); /* dt('tree.node.toggle.button.selected.hover.background') */
        color: #065f46; /* dt('tree.node.toggle.button.selected.hover.color') */
      }
      .p-tree-node-toggle-icon {
        font-size: 0.875rem; /* Adjust icon size */
      }

      /* Checkbox */
      .p-checkbox {
        display: inline-flex;
        cursor: pointer;
        user-select: none;
        vertical-align: bottom;
        position: relative;
        width: 1.25rem; /* Checkbox size */
        height: 1.25rem;
        margin-right: 0.5rem; /* Spacing */
      }
      .p-checkbox-box {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 1.25rem;
        height: 1.25rem;
        border: 1px solid #ced4da; /* Checkbox border */
        border-radius: 4px;
        background: #ffffff;
        transition:
          background-color 0.2s,
          border-color 0.2s,
          box-shadow 0.2s;
      }
      .p-checkbox-box.p-highlight {
        border-color: var(--primary-color, #10b981);
        background: var(--primary-color, #10b981);
      }
      .p-checkbox-box.p-indeterminate {
        border-color: var(--primary-color, #10b981);
        background: var(--primary-color, #10b981);
      }
      .p-checkbox-icon {
        font-size: 0.875rem; /* Icon size */
        color: #ffffff; /* Icon color when selected */
        transition-duration: 0.2s;
        line-height: normal; /* Ensure icon aligns well */
      }
      .p-checkbox-box:not(.p-highlight):not(.p-indeterminate):hover {
        border-color: var(--primary-color, #10b981); /* Hover border */
      }

      /* Node Icon */
      .p-treenode-icon {
        color: #6b7280; /* dt('tree.node.icon.color') */
        margin-right: 0.5rem; /* Spacing */
        transition: color 0.2s;
      }
      .p-treenode-selectable:not(.p-highlight):not(.p-treenode-selected):hover
        .p-treenode-icon {
        color: #4b5563; /* dt('tree.node.icon.hover.color') */
      }
      .p-treenode-content.p-highlight .p-treenode-icon {
        color: #065f46; /* dt('tree.node.icon.selected.color') */
      }

      /* Node Label */
      .p-treenode-label {
        flex-grow: 1; /* Allow label to take remaining space */
        overflow: hidden; /* Prevent long labels from breaking layout */
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush, // Use OnPush for performance with immutable data
})
export class TreeNodeComponent {
  @Input() node: TreeNode;
  @Input() level: number = 0;
  @Input() indentation: number = 1.5;
  @Input() selectable: boolean = false;
  @Input() checkboxMode: boolean = false;
  @Input() isSelected: boolean = false;
  @Input() nodeTemplate: TemplateRef<any> | undefined;

  @Output() nodeSelect = new EventEmitter<{
    originalEvent: Event;
    node: TreeNode;
  }>();
  @Output() nodeUnselect = new EventEmitter<{
    originalEvent: Event;
    node: TreeNode;
  }>(); // Keep for consistency, handled by parent
  @Output() nodeToggle = new EventEmitter<{
    originalEvent: Event;
    node: TreeNode;
    expanded: boolean;
  }>();

  // Bind leaf class to host for potential external styling
  @HostBinding('class.p-treenode-leaf') get isLeafClass() {
    return this.isNodeLeaf();
  }

  // Basic trackBy for children loop
  trackByChild = (index: number, node: TreeNode) => node.key || node;

  onNodeClick(event: MouseEvent) {
    // Prevent selection logic when clicking on toggler or checkbox directly
    const target = event.target as HTMLElement;
    if (
      target.closest('.p-tree-node-toggle-button') ||
      target.closest('.p-checkbox')
    ) {
      return;
    }

    // Emit select/unselect event to the parent tree component
    if (this.selectable && this.node.selectable !== false) {
      // Parent component handles the actual selection logic based on mode
      this.nodeSelect.emit({ originalEvent: event, node: this.node });
    }
  }

  onCheckboxClick(event: MouseEvent) {
    event.stopPropagation(); // Prevent node click when clicking checkbox
    // Emit select/unselect event to the parent tree component
    if (this.selectable && this.node.selectable !== false) {
      this.nodeSelect.emit({ originalEvent: event, node: this.node });
    }
  }

  toggle(event: Event) {
    event.stopPropagation(); // Prevent node click event
    this.node.expanded = !this.node.expanded;
    this.nodeToggle.emit({
      originalEvent: event,
      node: this.node,
      expanded: this.node.expanded,
    });
  }

  isNodeLeaf(): boolean {
    return this.node.leaf === false
      ? false
      : !(this.node.children && this.node.children.length > 0);
  }

  isChildNodeLeaf(node: TreeNode): boolean {
    return node.leaf === false
      ? false
      : !(node.children && node.children.length > 0);
  }

  getIcon(): string {
    let icon: string | undefined;

    if (this.node.icon) {
      icon = this.node.icon;
    } else {
      // Default folder icons
      icon =
        this.node.expanded && !this.isNodeLeaf()
          ? this.node.expandedIcon || 'pi pi-fw pi-folder-open'
          : this.node.collapsedIcon || 'pi pi-fw pi-folder';
    }

    return 'p-treenode-icon ' + icon;
  }

  // Check selection state for child nodes (passed down from parent)
  isNodeSelected(node: TreeNode): boolean {
    // This needs to be determined by the parent component's selection state
    // We pass the `isSelected` input for the current node,
    // but for children, the parent needs to calculate it.
    // Let's assume the parent component handles this logic correctly
    // when iterating and passing inputs.
    // For simplicity here, we re-emit events upwards.
    // A more robust way involves passing the selection array down or using a service.
    return false; // Placeholder - Parent component should manage this state
  }

  // --- Event Bubbling ---
  // Re-emit events from child nodes up to the main tree component

  onChildNodeSelect(event: { originalEvent: Event; node: TreeNode }) {
    this.nodeSelect.emit(event);
  }

  onChildNodeUnselect(event: { originalEvent: Event; node: TreeNode }) {
    this.nodeUnselect.emit(event);
  }

  onChildNodeToggle(event: {
    originalEvent: Event;
    node: TreeNode;
    expanded: boolean;
  }) {
    this.nodeToggle.emit(event);
  }
}
