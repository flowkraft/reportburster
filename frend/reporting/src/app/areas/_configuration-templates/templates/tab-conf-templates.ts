export const tabConfigurationTemplatesTemplate = `<ng-template #tabConfTemplates>
  <div class="well">
    <div class="row">
      <div
        class="col-xs-10"
        style="cursor: pointer; height: 500px; overflow: auto"
      >
        <table id="confTemplatesTable"
          class="table table-responsive table-hover table-bordered"
          cellspacing="0"
        >
          <thead>
            <tr>
              <th>
                {{ 'AREAS.CONFIGURATION-TEMPLATES.TAB-CONF-TEMPLATES.NAME' |
                translate }}
              </th>
              <th>
                {{ 'AREAS.CONFIGURATION-TEMPLATES.TAB-CONF-TEMPLATES.CAPABILITIES' |
                translate }}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              </th>
              <th>
                {{ 'AREAS.CONFIGURATION-TEMPLATES.TAB-CONF-TEMPLATES.HOW-TO-USE'
                | translate }}
              </th>
              <th>
                Actions&nbsp;&nbsp;&nbsp;&nbsp;
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              id="{{configurationFile.folderName}}_{{configurationFile.fileName}}"
              *ngFor="let configurationFile of this.settingsService.getConfigurations()"
              (click)="onConfTemplateClick(configurationFile)"
              [ngClass]="{ 'info': configurationFile.activeClicked}"
            >
              <td>
                {{configurationFile.templateName}}
                <span *ngIf="configurationFile.isFallback">
                  <strong> (fallback)</strong>
                </span>
              </td>
              <td>
                <span class="label label-default" *ngIf="!configurationFile.capReportGenerationMailMerge">
                  <i class="fa fa-scissors">&nbsp;</i>
                  <em>Splitting</em>                
                </span>
                <span class="label label-default" *ngIf="configurationFile.capReportGenerationMailMerge">
                   <i class="fa fa-file-text-o">&nbsp;</i> 
                   <em>Generation / Mail Merge</em>
                </span>&nbsp;
                <span class="label label-default" *ngIf="configurationFile.capReportDistribution">
                  <i class="fa fa-envelope-o">&nbsp;</i>
                 <em>Distribution</em> 
                </span>
              </td>
              <td>
                <span *ngIf="!configurationFile.isFallback && !configurationFile.capReportGenerationMailMerge"
                  >&lt;config&gt;{{configurationFile.relativeFilePath}}&lt;/config&gt;</span
                >
                <span
                  *ngIf="configurationFile.isFallback"
                  [innerHTML]="'AREAS.CONFIGURATION-TEMPLATES.TAB-CONF-TEMPLATES.INNER-HTML.DEFAULT-CONFIGURATION' | translate"
                >
                </span>
              </td>
              <td>
                <div id="btnActions_{{configurationFile.folderName}}_{{configurationFile.fileName}}" class="btn-group dropup"> 
                  <button type="button" *ngIf="configurationFile.visibility == 'visible'" class="btn btn-xs btn-primary dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">&nbsp;&nbsp;Visible&nbsp;&nbsp;<span class="caret"></span></button>
                  <button type="button" *ngIf="configurationFile.visibility == 'hidden'" class="btn btn-xs btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">&nbsp;&nbsp;Hidden&nbsp;&nbsp;<span class="caret"></span></button>
                <ul class="dropdown-menu dropdown-menu-right" style="z-index:1;position: relative;">
                  <li id="btnActionRestore_{{configurationFile.folderName}}_{{configurationFile.fileName}}" (click)="restoreDefaultConfigurationValues()">Restore Default Configuration Values</li>
                  <li role="separator" class="divider"></li>
                  <li id="btnActionHideShow_{{configurationFile.folderName}}_{{configurationFile.fileName}}" *ngIf="configurationFile.visibility == 'visible'" (click)="toggleVisibility()">Hide <em>{{configurationFile.templateName}}</em></li>
                  <li id="btnActionHideShow_{{configurationFile.folderName}}_{{configurationFile.fileName}}" *ngIf="configurationFile.visibility == 'hidden'" (click)="toggleVisibility()">Show <em>{{configurationFile.templateName}}</em></li>
                 </ul>
                  </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="col-xs-2">
        <button
          id="btnNew"
          type="button"
          class="btn btn-flat btn-default col-xs-12"
          (click)="showCrudModal('create')"
          style="margin-bottom: 5px"
        >
          <i class="fa fa-plus"></i> {{ 'BUTTONS.NEW' | translate }}
        </button>
        <p></p>
        <button
          id="btnEdit"
          type="button"
          class="btn btn-flat btn-default col-xs-12"
          (click)="showCrudModal('update')"
          [ngClass]="{ 'disabled': !getSelectedConfiguration()}"
          style="margin-bottom: 5px"
        >
          <i class="fa fa-pencil-square-o"></i> {{ 'BUTTONS.EDIT' | translate }}
        </button>
        <p></p>
        <button
          id="btnDuplicate"
          type="button"
          class="btn btn-flat btn-default col-xs-12"
          (click)="showCrudModal('create', true)"
          [ngClass]="{ 'disabled': !getSelectedConfiguration()}"
          style="margin-bottom: 5px"

        >
          <i class="fa fa-clone"></i> {{ 'BUTTONS.DUPLICATE' | translate }}
        </button>
        <button
          id="btnDelete"
          type="button"
          class="btn btn-flat btn-default col-xs-12"
          (click)="onDeleteSelectedTemplate()"
          [ngClass]="{ 'disabled': !getSelectedConfiguration() || getSelectedConfiguration().isFallback}"
        >
          <i class="fa fa-minus"></i> {{ 'BUTTONS.DELETE' | translate }}
        </button>
      </div>
    </div>
  </div>
</ng-template>
`;
