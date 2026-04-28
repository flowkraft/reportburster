export const tabConfTemplatesSamples = `<ng-template #tabConfTemplatesSamples>
  <div class="well">
    <div class="row">
      <div
        class="col-xs-12"
        style="cursor: pointer; height: 500px; overflow: auto"
      >
        <table id="confTemplatesSamplesTable"
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
            </tr>
          </thead>
          <tbody>
            <tr
              id="{{configurationFile.fileName}}"
              *ngFor="let configurationFile of settingsService.getSampleConfigurations()"
              (click)="onConfTemplateClick(configurationFile)"
              [ngClass]="{ 'info': configurationFile.activeClicked}"
            >
              <td>
                {{configurationFile.templateName}}
                <span *ngIf="configurationFile.isFallback">
                  <strong> (default)</strong>
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
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  </div>
</ng-template>
`;
