export const tabBurstTemplate = `<ng-template #tabBurstTemplate>
  <div class="well">
    <div class="row">
      <div class="col-xs-2">
        PDF / Excel {{ 'AREAS.PROCESSING.TAB-BURST.FILE' | translate }}
      </div>
      <div class="col-xs-7">
        <input
          id="burstFile"
          [(ngModel)]="procBurstInfo.burstInputFilePath"
          class="form-control"
          autofocus
          required
        />
      </div>

      <div class="col-xs-3">
        <dburst-button-native-system-dialog
          value="{{
          'COMPONENTS.BUTTON-NATIVE-SYSTEM-DIALOG.SELECT-FILE' | translate }}"
          dialogType="file"
          (pathsSelected)="onBurstFileSelected($event)"
        ></dburst-button-native-system-dialog>
      </div>
    </div>
    <div class="row">
      <div class="col-xs-2"></div>

      <div class="col-xs-1" style="margin-right: 20px">
        <button
          id="btnBurst"
          type="button"
          class="btn btn-primary"
          (click)="doBurst()"
          [disabled]="!procBurstInfo.burstInputFilePath || executionStatsService.jobStats.numberOfActiveJobs > 0"
        >
          <i class="fa fa-play"></i>&nbsp;Burst
        </button>
      </div>

      <div class="col-xs-3">
        <dburst-button-clear-logs></dburst-button-clear-logs>
      </div>

      <div class="col-xs-3" style="margin-left: -20px">
        <dburst-button-native-system-dialog
          value="{{
          'AREAS.PROCESSING.TAB-BURST.VIEW-REPORTS' | translate }}"
          dialogType="file"
        >
        </dburst-button-native-system-dialog>
      </div>
    </div>

    <div class="row" *ngIf="!shellService.isJavaOk">
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

      <a href="#" [routerLink]="['/help', 'installSetupMenuSelected']"
        ><button type="button" class="btn btn-primary">
          {{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.JAVA.INSTALL' | translate }}
          <em>Java</em>
        </button></a
      >
    </div>

    <div
      class="row"
      *ngIf="procBurstInfo.burstInputFilePath && !executionStatsService.foundDirtyLogFiles() && executionStatsService.jobStats.numberOfActiveJobs === 0 && executionStatsService.jobStats.jobsToResume.length === 0"
    >
      <div class="col-xs-1">
        <i class="fa fa-flag-checkered fa-2x"></i>
      </div>

      <div class="col-xs-11">
        <a id="qaReminderLink" href="#qaReminder" data-toggle="collapse"
          >{{ 'AREAS.PROCESSING.TAB-BURST.DID-YOU-RUN-QA' | translate }}
          <em>{{procBurstInfo.burstInputFilePath}}</em>?</a
        >
        <div id="qaReminder" class="collapse">
          {{ 'AREAS.PROCESSING.TAB-BURST.BEFORE-EMAILING' | translate }}
          <a
            href="#"
            [routerLink]="['/processing','qualityMenuSelected',procBurstInfo.burstInputFilePath]"
            >Quality Assurance</a
          >
          {{ 'AREAS.PROCESSING.TAB-BURST.FOR-THE-FILE' | translate }}
          <em>{{procBurstInfo.burstInputFilePath}}</em>&nbsp;&nbsp;
          <button
            id="goToQa"
            type="button"
            class="btn btn-primary btn-sm"
            [routerLink]="['/processing','qualityMenuSelected',procBurstInfo.burstInputFilePath]"
          >
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
</ng-template>
`;
