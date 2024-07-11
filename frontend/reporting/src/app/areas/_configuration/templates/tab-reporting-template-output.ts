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
          {{ 'AREAS.CONFIGURATION.TAB-REPORT-TEMPLATE-OUTPUT.TEMPLATE-FILE' |
          translate }}
        </div>

        <div class="col-xs-10">
          <ng-select
            id="selectTemplateFile"
            [(ngModel)]="selectedReportTemplateFile"
            (change)="onSelectTemplateFileChanged($event)"
            appendTo="body"
          >
            <ng-option
              *ngFor="let reportTemplate of settingsService.getReportTemplates(xmlReporting?.documentburster.report.template.outputtype, {samples: false})"
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
