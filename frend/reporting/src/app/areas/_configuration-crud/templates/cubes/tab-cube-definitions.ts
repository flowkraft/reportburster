export const tabCubeDefinitionsTemplate = `
<div class="well">
  <div class="row">
    <div class="col-xs-10">
      <table id="cubeDefinitionsTable" class="table table-bordered table-hover">
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Connection</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let cube of pagedCubes"
              [id]="cube.id"
              [ngClass]="{ 'info': cube.activeClicked }"
              (click)="onCubeClick(cube)"
              style="cursor: pointer">
            <td>
              {{ cube.name }}
              <span *ngIf="cube.isSample" class="label label-primary" style="margin-left: 6px;">sample</span>
            </td>
            <td>{{ cube.description }}</td>
            <td>{{ cube.connectionId }}</td>
          </tr>
          <tr *ngIf="pagedCubes.length === 0">
            <td colspan="3" style="text-align: center; color: #999; padding: 20px;">
              <span *ngIf="cubeSearchTerm">No cubes match '{{ cubeSearchTerm }}'</span>
              <span *ngIf="!cubeSearchTerm">No cube definitions yet</span>
            </td>
          </tr>
        </tbody>
      </table>

      <nav *ngIf="filteredCubes.length > cubePageSize" style="margin-top: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="color: #777; font-size: 12px;">
            Showing {{ cubePageStart + 1 }}-{{ cubePageEnd }} of {{ filteredCubes.length }}
          </span>
          <ul class="pagination" style="margin: 0;">
            <li [ngClass]="{ 'disabled': cubePageIndex === 0 }">
              <a href="#" (click)="prevCubePage(); $event.preventDefault()">&laquo;</a>
            </li>
            <li *ngFor="let p of cubePageNumbers" [ngClass]="{ 'active': p === cubePageIndex }">
              <a href="#" (click)="goToCubePage(p); $event.preventDefault()">{{ p + 1 }}</a>
            </li>
            <li [ngClass]="{ 'disabled': cubePageIndex >= totalCubePages - 1 }">
              <a href="#" (click)="nextCubePage(); $event.preventDefault()">&raquo;</a>
            </li>
          </ul>
        </div>
      </nav>

      <div class="row" style="margin-top: 10px;" *ngIf="totalCubePages >= 2 || cubeSearchTerm">
        <div class="col-xs-12">
          <div class="input-group">
            <span class="input-group-addon"><i class="fa fa-search"></i></span>
            <input type="text" id="cubesSearch" class="form-control" placeholder="Search by name or description"
              [ngModel]="cubeSearchTerm" (ngModelChange)="onCubeSearchChange($event)" />
            <span class="input-group-btn" *ngIf="cubeSearchTerm">
              <button type="button" class="btn btn-default" (click)="onCubeSearchChange('')" title="Clear search">
                <i class="fa fa-times"></i>
              </button>
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="col-xs-2">
      <button
        id="btnCreateCube"
        type="button"
        class="btn btn-flat btn-default col-xs-12"
        (click)="showCubeModal('create')"
        style="margin-bottom: 5px">
        <i class="fa fa-plus"></i> {{ 'BUTTONS.NEW' | translate }}
      </button>

      <button
        id="btnEditCube"
        type="button"
        class="btn btn-flat btn-default col-xs-12"
        (click)="showCubeModal('update')"
        [ngClass]="{ 'disabled': !getSelectedCube() }"
        style="margin-bottom: 5px">
        <i class="fa fa-pencil-square-o"></i> {{ 'BUTTONS.EDIT' | translate }}
      </button>

      <button
        id="btnDuplicateCube"
        type="button"
        class="btn btn-flat btn-default col-xs-12"
        (click)="showCubeModal('create', true)"
        [ngClass]="{ 'disabled': !getSelectedCube() }"
        style="margin-bottom: 5px">
        <i class="fa fa-clone"></i> {{ 'BUTTONS.DUPLICATE' | translate }}
      </button>

      <button
        id="btnDeleteCube"
        type="button"
        class="btn btn-flat btn-default col-xs-12"
        (click)="onDeleteCube()"
        [ngClass]="{ 'disabled': !getSelectedCube() || getSelectedCube()?.isSample }"
        title="{{ getSelectedCube()?.isSample ? 'Sample cubes are read-only' : '' }}"
        style="margin-bottom: 5px">
        <i class="fa fa-minus"></i> {{ 'BUTTONS.DELETE' | translate }}
      </button>
    </div>
  </div>
</div>

<!-- Cube Edit Modal -->
<div *ngIf="isCubeModalVisible" class="modal fade in" style="display: block;" tabindex="-1">
  <div class="modal-dialog modal-lg" style="width: 90%; margin-top: 20px;">
    <div class="modal-content">
      <div class="modal-header">
        <button type="button" class="close" (click)="closeCubeModal()">&times;</button>
        <h4 class="modal-title">{{ cubeModalTitle }}</h4>
      </div>
      <div class="modal-body" style="max-height: calc(100vh - 200px); overflow-y: auto;">
        <div class="row" style="margin-bottom: 10px;">
          <div class="col-xs-4">
            <label>Name</label>
            <input id="cubeName" type="text" class="form-control" [(ngModel)]="editingCube.name"
              (ngModelChange)="onCubeNameChanged()">
            <span id="cubeAlreadyExistsWarning" *ngIf="cubeNameAlreadyExists" class="text-danger">
              A cube with this name already exists
            </span>
          </div>
          <div class="col-xs-4">
            <label>Description</label>
            <input id="cubeDescription" type="text" class="form-control" [(ngModel)]="editingCube.description">
          </div>
          <div class="col-xs-4">
            <label>Database Connection</label>
            <select id="cubeConnectionId" class="form-control" [(ngModel)]="editingCube.connectionId">
              <option value="">-- None --</option>
              <option *ngFor="let conn of dbConnections" [value]="conn.connectionCode">{{ conn.connectionName }} ({{ conn.connectionCode }})</option>
            </select>
          </div>
        </div>

        <!-- Code editor only (when preview is hidden) -->
        <div *ngIf="!cubePreviewVisible" style="margin-top: 10px;">
          <tabset>
            <tab heading="Cube Options">
              <div style="margin-top: 10px;">
                <ngx-codejar
                  id="cubeDslEditor"
                  [(code)]="editingCube.dslCode"
                  (update)="onDslCodeChanged($event)"
                  [highlightMethod]="highlightGroovyCode"
                  [highlighter]="'prism'"
                  [showLineNumbers]="true"
                  style="height: 350px; border: 1px solid #ccc; border-radius: 4px 4px 0 0; overflow-y: auto; display: block; font-family: 'Courier New', monospace;">
                </ngx-codejar>
                <div style="display: flex;">
                  <button id="btnAiHelpCubeDslFullEditor" type="button" class="btn btn-default" style="flex: 1; border-radius: 0 0 0 4px;" (click)="showDbConnectionModalForCubeDsl()">
                    <strong>Hey AI, Help Me ...</strong>
                  </button>
                  <button id="btnToggleCubePreviewShow" type="button" class="btn btn-default" style="flex: 1; border-radius: 0 0 4px 0;" (click)="toggleCubePreview()">
                    <i class="fa fa-eye"></i> Show Preview
                  </button>
                </div>
              </div>
            </tab>

            <tab heading="Example (Cube Options)">
              <div style="margin-top: 10px;">
                <a id="btnSeeMoreCubeExamples" href="https://datapallas.com/docs/data-exploration" target="_blank" class="btn btn-default btn-block" style="color: #337ab7; text-decoration: underline; margin-bottom: 10px;">
                  See More Cube Options Examples
                </a>
                <ngx-codejar
                  id="cubeDslExampleEditor"
                  [code]="cubeExampleCode"
                  [highlightMethod]="highlightGroovyCode"
                  [highlighter]="'prism'"
                  [showLineNumbers]="true"
                  [readonly]="true"
                  style="height: 350px; border: 1px solid #ccc; border-radius: 4px; overflow-y: auto; display: block; font-family: 'Courier New', monospace; background-color: #f8f8f8;">
                </ngx-codejar>
                <button id="btnCopyToClipboardCubeDslExample" type="button" class="btn btn-default btn-block" style="margin-top: 10px;" (click)="copyCubeExampleToClipboard()">
                  Copy Example Cube Options To Clipboard
                </button>
              </div>
            </tab>
          </tabset>
        </div>

        <!-- Split pane with editor and preview -->
        <as-split *ngIf="cubePreviewVisible" direction="horizontal"
                  [gutterSize]="8" [useTransition]="true"
                  style="height: 480px; margin-top: 10px;">

          <!-- Editor Pane -->
          <as-split-area [size]="50" [minSize]="20">
            <div style="height: 100%; display: flex; flex-direction: column; overflow: hidden;">
              <tabset>
                <tab heading="Cube Options">
                  <div style="margin-top: 10px;">
                    <ngx-codejar
                      id="cubeDslEditor"
                      [(code)]="editingCube.dslCode"
                      (update)="onDslCodeChanged($event)"
                      [highlightMethod]="highlightGroovyCode"
                      [highlighter]="'prism'"
                      [showLineNumbers]="true"
                      style="height: 390px; border: 1px solid #ccc; border-radius: 4px 4px 0 0; overflow-y: auto; display: block; font-family: 'Courier New', monospace;">
                    </ngx-codejar>
                    <div style="display: flex;">
                      <button id="btnAiHelpCubeDsl" type="button" class="btn btn-default" style="flex: 1; border-radius: 0 0 0 4px;" (click)="showDbConnectionModalForCubeDsl()">
                        <strong>Hey AI, Help Me ...</strong>
                      </button>
                      <button id="btnToggleCubePreviewHide" type="button" class="btn btn-default" style="flex: 1; border-radius: 0 0 4px 0;" (click)="toggleCubePreview()">
                        <i class="fa fa-code"></i> Expand Code Editor
                      </button>
                    </div>
                  </div>
                </tab>

                <tab heading="Example (Cube Options)">
                  <div style="margin-top: 10px;">
                    <a id="btnSeeMoreCubeExamples" href="https://datapallas.com/docs/data-exploration" target="_blank" class="btn btn-default btn-block" style="color: #337ab7; text-decoration: underline; margin-bottom: 10px;">
                      See More Cube Options Examples
                    </a>
                    <ngx-codejar
                      id="cubeDslExampleEditor"
                      [code]="cubeExampleCode"
                      [highlightMethod]="highlightGroovyCode"
                      [highlighter]="'prism'"
                      [showLineNumbers]="true"
                      [readonly]="true"
                      style="height: 340px; border: 1px solid #ccc; border-radius: 4px; overflow-y: auto; display: block; font-family: 'Courier New', monospace; background-color: #f8f8f8;">
                    </ngx-codejar>
                    <button id="btnCopyToClipboardCubeDslExample" type="button" class="btn btn-default btn-block" (click)="copyCubeExampleToClipboard()">
                      Copy Example Cube Options To Clipboard
                    </button>
                  </div>
                </tab>
              </tabset>
            </div>
          </as-split-area>

          <!-- Preview Pane -->
          <as-split-area [size]="50" [minSize]="20">
            <div style="height: 100%; display: flex; flex-direction: column;">
              <div style="flex: 1; border: 1px solid #ccc; border-radius: 4px 4px 0 0; padding: 10px; overflow-y: auto; background: #fafafa;">
                <rb-cube-renderer
                  [cubeConfig]="parsedCube"
                  [connectionId]="editingCube.connectionId"
                  [apiBaseUrl]="apiBaseUrl"
                  (selectionChanged)="onCubeSelectionChanged($any($event))">
                </rb-cube-renderer>

                <div *ngIf="parseDslError" class="text-danger" style="margin-top: 10px;">
                  <i class="fa fa-exclamation-triangle"></i> {{ parseDslError }}
                </div>
              </div>
              <button id="btnViewSql" type="button" class="btn btn-primary btn-block"
                style="border-radius: 0 0 4px 4px; margin: 0;"
                [disabled]="!hasFieldSelections"
                (click)="viewSql()">
                <i class="fa fa-search"></i> Show SQL
              </button>
            </div>
          </as-split-area>
        </as-split>
      </div>
      <div class="modal-footer">
        <span *ngIf="editingCube.isSample" class="text-muted" style="margin-right: 12px; font-size: 12px;">
          <i class="fa fa-info-circle"></i> Sample cubes are read-only. Use Duplicate to create an editable copy.
        </span>
        <button id="btnOKConfirmationCubeModal" type="button" class="btn btn-primary"
          (click)="saveCube()"
          [disabled]="!editingCube.name || cubeNameAlreadyExists || editingCube.isSample">
          Save
        </button>
        <button id="btnCloseCubeModal" type="button" class="btn btn-default" (click)="closeCubeModal()">Close</button>
      </div>
    </div>
  </div>
</div>
<div *ngIf="isCubeModalVisible" class="modal-backdrop fade in"></div>

<!-- SQL Preview Modal -->
<div *ngIf="showSqlModal" class="modal fade in" style="display: block; z-index: 1060;" tabindex="-1">
  <div class="modal-dialog modal-lg">
    <div class="modal-content">
      <div class="modal-header">
        <button type="button" class="close" (click)="closeSqlModal()">&times;</button>
        <h4 class="modal-title">Generated SQL</h4>
      </div>
      <div class="modal-body">
        <div *ngIf="sqlLoading" style="text-align: center; padding: 30px;">
          <i class="fa fa-spinner fa-spin fa-2x"></i>
          <p style="margin-top: 10px;">Generating SQL...</p>
        </div>
        <pre id="cubeSqlResult" *ngIf="!sqlLoading" style="background: #1e1e1e; color: #d4d4d4; padding: 16px; border-radius: 4px; font-family: 'Courier New', monospace; font-size: 13px; white-space: pre-wrap; max-height: 400px; overflow-y: auto;">{{ generatedSql }}</pre>
      </div>
      <div class="modal-footer">
        <button id="btnCopyCubeSql" type="button" class="btn btn-primary" (click)="copySqlToClipboard()" [disabled]="sqlLoading">
          <i class="fa fa-clipboard"></i> Copy SQL to Clipboard
        </button>
        <button id="btnCloseCubeSqlModal" type="button" class="btn btn-default" (click)="closeSqlModal()">Close</button>
      </div>
    </div>
  </div>
</div>
<div *ngIf="showSqlModal" class="modal-backdrop fade in" style="z-index: 1055;"></div>

<!-- Connection Details modal — used by the cube "Hey AI" button to let the user
     pick tables from the cube's DB connection before launching the AI prompt. -->
<dburst-connection-details
  #connectionDetailsModal
  [mode]="'viewMode'"
  [context]="'cubeDsl'">
</dburst-connection-details>
`;
