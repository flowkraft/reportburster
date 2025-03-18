export const tabReportingTemplateOutputTemplate = `<ng-template
  #tabReportingTemplateOutputTemplate
>
  <div class="well">
    <div class="row">
      <div class="col-xs-2">
        {{ 'AREAS.CONFIGURATION.TAB-REPORT-TEMPLATE-OUTPUT.OUTPUT-TYPE' |
        translate }}
      </div>
      <div class="col-xs-10">
        <select
          id="reportOutputType"
          class="form-control"
          [(ngModel)]="xmlReporting?.documentburster.report.template.outputtype"
          (ngModelChange)="settingsChangedEventHandler($event)"
          (change)="onReportOutputTypeChanged()"
        >
          <option value="output.none">
            {{ 'AREAS.CONFIGURATION.TAB-REPORT-TEMPLATE-OUTPUT.TYPE-NONE' |
            translate }}
          </option>
          <option value="output.docx">
            {{ 'AREAS.CONFIGURATION.TAB-REPORT-TEMPLATE-OUTPUT.TYPE-DOCX' |
            translate }}
          </option>
          <option value="output.pdf">
            {{ 'AREAS.CONFIGURATION.TAB-REPORT-TEMPLATE-OUTPUT.TYPE-PDF' |
            translate }}
          </option>
          <option value="output.xlsx">
            {{ 'AREAS.CONFIGURATION.TAB-REPORT-TEMPLATE-OUTPUT.TYPE-XLSX' |
            translate }}
          </option>
          <option value="output.html">
            {{ 'AREAS.CONFIGURATION.TAB-REPORT-TEMPLATE-OUTPUT.TYPE-HTML' |
            translate }}
          </option>
        </select>
      </div>
    </div>
    <p></p>
    <div
      *ngIf="askForFeatureService.alreadyImplementedFeatures.includes(xmlReporting?.documentburster.report.template.outputtype)"
    >
      <div
        class="row"
        id="reportTemplate"
        *ngIf="xmlReporting?.documentburster.report.template.outputtype != 'output.none'"
      >
        <div class="col-xs-2">
          {{ (xmlReporting?.documentburster.report.template.outputtype === 'output.docx' ? 
            'AREAS.CONFIGURATION.TAB-REPORT-TEMPLATE-OUTPUT.TEMPLATE-FILE': 
            'AREAS.CONFIGURATION.TAB-REPORT-TEMPLATE-OUTPUT.TEMPLATE-HTML') | translate }}
        </div>

        <div class="col-xs-10">
          <!-- Template file selector for DOCX -->
          <ng-select
            *ngIf="xmlReporting?.documentburster.report.template.outputtype === 'output.docx'"
            id="selectTemplateFile"
            [(ngModel)]="selectedReportTemplateFile"
            (change)="onSelectTemplateFileChanged($event)"
            appendTo="body"
          >
            <ng-option
              *ngFor="let reportTemplate of settingsService.getReportTemplates(xmlReporting?.documentburster.report.template.outputtype, {samples: xmlReporting?.documentburster.report.template.documentpath?.includes('/samples/')})"
              [value]="reportTemplate"
              >
              <span id="{{reportTemplate.fileName}}">
              {{reportTemplate.fileName}}
              <span *ngIf="reportTemplate.type.includes('-sample')"
                >(sample)</span>
              </span>  
              </ng-option
            >
          </ng-select>

          <!-- Template error message when no DOCX templates are found -->
          <div 
            *ngIf="xmlReporting?.documentburster.report.template.outputtype === 'output.docx' && 
                  settingsService.getReportTemplates(xmlReporting?.documentburster.report.template.outputtype, {samples: false})?.length === 0"
            class="alert alert-danger" 
            style="margin-top: 10px; font-weight: bold;">
            <i class="fa fa-exclamation-triangle"></i> 
            {{ 'AREAS.CONFIGURATION.TAB-REPORT-TEMPLATE-OUTPUT.NO-TEMPLATES-FOUND' | translate }}
            <pre style="margin-top: 8px; background-color: #f8f8f8; padding: 8px; font-weight: normal; word-break: break-all;">{{settingsService.CONFIGURATION_TEMPLATES_FOLDER_PATH}}/reports/</pre>
            <span style="font-size: 13px;">
              <strong>{{ 'AREAS.CONFIGURATION.TAB-REPORT-TEMPLATE-OUTPUT.SUGGESTED-FILENAME' | translate }}</strong> 
              <code>{{settingsService.currentConfigurationTemplate?.folderName}}_template.docx</code>
            </span>
          </div>

          <!-- HTML editor for HTML, PDF and XLSX -->
          <div *ngIf="xmlReporting?.documentburster.report.template.outputtype === 'output.html' || 
                    xmlReporting?.documentburster.report.template.outputtype === 'output.pdf' || 
                    xmlReporting?.documentburster.report.template.outputtype === 'output.xlsx'">
            <textarea 
              id="reportTemplateHtmlContent"
              class="form-control" 
              rows="25" 
              [(ngModel)]="reportTemplateHtmlContent"
              (ngModelChange)="onTemplateHtmlContentChanged($event)"
               [placeholder]="'AREAS.CONFIGURATION.TAB-REPORT-TEMPLATE-OUTPUT.TEMPLATE-PLACEHOLDER' | translate"></textarea>
          </div>
        </div>
      </div>
    </div>
    <div
      *ngIf="!askForFeatureService.alreadyImplementedFeatures.includes(xmlReporting?.documentburster.report.template.outputtype)"
    >
      <div class="row">
        <div class="col-xs-2"></div>
        <div class="col-xs-5">
          <button
            type="button"
            class="btn btn-primary btn-block"
            (click)="onAskForFeatureModalShow(xmlReporting?.documentburster.report.template.outputtype)"
          >
            Request <span class="badge">New</span> Feature
          </button>
        </div>
      </div>
    </div>
  </div>
</ng-template> `;
