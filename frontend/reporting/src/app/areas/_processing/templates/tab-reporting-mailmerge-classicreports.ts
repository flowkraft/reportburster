export const tabReportGenerationMailMergeTemplate = `<ng-template
  #tabReportGenerationMailMergeTemplate
>
  <div class="well">
    <div class="row" style="margin-bottom: 3px">
      <div class="col-xs-1">
        {{
        'AREAS.PROCESSING.TAB-REPORTING-MAILMERGE-CLASSICREPORTS.CHOOSE-REPORT'
        | translate }}
      </div>
      <div class="col-xs-4">
        <ng-select
          id="selectMailMergeClassicReport"
          [(ngModel)]="processingService.procReportingMailMergeInfo.selectedMailMergeClassicReport"
          [groupBy]="groupByMailMergeHelper"
          appendTo="body"
        >
          <ng-option
            *ngFor="let report of this.settingsService.getMailMergeConfigurations('visible')"
            [value]="report"
            >{{report.templateName}}
            <span *ngIf="report.type=='config-samples'">(sample)</span
            ><span id="{{report.folderName}}_{{report.dsInputType}}" *ngIf="report.dsInputType=='ds.csvfile'"
              >(input CSV)</span
            ></ng-option
          >
        </ng-select>
      </div>
      <div class="col-xs-4" *ngIf="processingService.procReportingMailMergeInfo.selectedMailMergeClassicReport">
        <input
          id="mailMergeClassicReportInputFile"
          [(ngModel)]="processingService.procReportingMailMergeInfo.isSample ? processingService.procReportingMailMergeInfo.prefilledInputFilePath : processingService.procReportingMailMergeInfo.inputFileName"
          class="form-control"
          [disabled]="!this.storeService.configSys.sysInfo.setup.java.isJavaOk"
          autofocus
          required
        />
      </div>

      <div id="browseMailMergeClassicReportInputFile" class="col-xs-3" *ngIf="processingService.procReportingMailMergeInfo.selectedMailMergeClassicReport">
        <label for="reportingFileUploadInput" class="btn btn-default btn-block"><i class="fa fa-folder-open-o' }}"></i>&nbsp;Select File</label>
        <input style="display: none;" type="file" id="reportingFileUploadInput" (change)="onMailMergeClassicReportFileSelected($event)" accept=".csv" #reportingFileUploadInput  [disabled]="!storeService.configSys.sysInfo.setup.java.isJavaOk"/>
      <!--  
        <dburst-button-native-system-dialog
          value="{{
          'COMPONENTS.BUTTON-NATIVE-SYSTEM-DIALOG.SELECT-FILE' | translate }}"
          dialogType="file"
          (pathsSelected)="onMailMergeClassicReportFileSelected($event)"
        ></dburst-button-native-system-dialog>-->

      </div>
    </div>

    <div class="row">
      <div class="col-xs-1"></div>

      <div class="col-xs-1">
        <button
          id="btnBurst"
          type="button"
          class="btn btn-primary"
          (click)="doGenerateReports()"
          [disabled]="!processingService.procReportingMailMergeInfo.inputFileName || executionStatsService.jobStats.numberOfActiveJobs > 0"
        >
          <i class="fa fa-play"></i>&nbsp;Burst
        </button>
      </div>

      <div class="col-xs-3">
        <dburst-button-clear-logs></dburst-button-clear-logs>
      </div>

      <div class="col-xs-4">
        <!--  
        <dburst-button-native-system-dialog
          value="{{
          'AREAS.PROCESSING.TAB-BURST.VIEW-REPORTS' | translate }}"
          dialogType="file"
        >
        </dburst-button-native-system-dialog>
        -->
      </div>
    </div>

    <div class="row" *ngIf="!storeService.configSys.sysInfo.setup.java.isJavaOk">
      <br /><br />
      <span class="label label-warning"
        ><strong
          ><em>Java</em>
          {{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.JAVA.NOT-FOUND' | translate
          }}
        </strong></span
      >
      <br /><br />

      <strong
        id="checkPointJavaPreRequisite"
        [innerHTML]="'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.JAVA.INNER-HTML.REQUIRED-SHORT' | translate"
      ></strong>

      <br /><br /><span
        [innerHTML]="'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.JAVA.INNER-HTML.REQUIRED-LONG' | translate"
      ></span>

      <br /><br />

      <a href="#" [routerLink]="['/help', 'installSetupMenuSelected']" skipLocationChange="true"
        ><button type="button" class="btn btn-primary">
          {{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.JAVA.INSTALL' | translate }}
          <em>Java</em>
        </button></a
      >
    </div>
    <div
      class="row"
      *ngIf="processingService.procReportingMailMergeInfo.inputFileName && !executionStatsService.logStats.foundDirtyLogFiles && executionStatsService.jobStats.numberOfActiveJobs === 0 && executionStatsService.jobStats.jobsToResume.length === 0"
    >
      <div class="col-xs-1">
        <i class="fa fa-flag-checkered fa-2x"></i>
      </div>

      <div class="col-xs-11">
        <a
          id="qaReminderLink"
          href="#qaReminder"
          data-toggle="collapse"
          >{{ 'AREAS.PROCESSING.TAB-BURST.DID-YOU-RUN-QA' | translate }}
          <em>{{processingService.procReportingMailMergeInfo.isSample ? processingService.procReportingMailMergeInfo.prefilledInputFilePath : processingService.procReportingMailMergeInfo.inputFileName}}</em>?</a
        >
        <div id="qaReminder" class="collapse">
          {{ 'AREAS.PROCESSING.TAB-BURST.BEFORE-EMAILING' | translate }}
          <a
            href="#"
            [routerLink]="['/processingQa','qualityMenuSelected',processingService.procReportingMailMergeInfo.prefilledInputFilePath, processingService.procReportingMailMergeInfo.prefilledConfigurationFilePath, 'csv-generate-reports']"
            skipLocationChange="true">Quality Assurance</a
          >
          {{ 'AREAS.PROCESSING.TAB-BURST.FOR-THE-FILE' | translate }}
          <em>{{processingService.procReportingMailMergeInfo.isSample ? processingService.procReportingMailMergeInfo.prefilledInputFilePath : processingService.procReportingMailMergeInfo.inputFileName}}</em>&nbsp;&nbsp;
          <button
            id="goToQa"
            type="button"
            class="btn btn-primary btn-sm"
            [routerLink]="['/processingQa','qualityMenuSelected',processingService.procReportingMailMergeInfo.prefilledInputFilePath, processingService.procReportingMailMergeInfo.prefilledConfigurationFilePath, 'csv-generate-reports']"
            skipLocationChange="true">
            {{ 'AREAS.PROCESSING.TAB-BURST.RUN-QA' | translate }}
          </button>
        </div>
      </div>
    </div>

    <div
      *ngIf="executionStatsService.jobStats.numberOfActiveJobs === 0 && executionStatsService.jobStats.jobsToResume.length > 0"
      class="row"
    >
      <div class="col-xs-12">
        <ng-container [ngTemplateOutlet]="resumeJobs"> </ng-container>
      </div>
    </div>

    <div class="row">
      <dburst-log-files-viewer-separate-tabs></dburst-log-files-viewer-separate-tabs>
    </div>
  </div>
</ng-template> `;
