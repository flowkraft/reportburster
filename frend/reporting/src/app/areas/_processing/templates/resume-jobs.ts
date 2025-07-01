export const resumeJobsTemplate = `<ng-template #resumeJobs>
  <div
    class="row"
    *ngFor="let jobDetails of executionStatsService.jobStats.jobsToResume"
  >
    <div clas="col-xs-12">
      <strong style="text-decoration: underline"
        >{{ 'AREAS.PROCESSING.RESUME-JOBS.RESUME' | translate }}
        <span
          *ngIf="jobDetails.testAll === 'true' || jobDetails.numberOfRandomTestTokens > -1 || jobDetails.listOfTestTokens"
          >{{ 'AREAS.PROCESSING.LEFT-MENU.QUALITY-ASSURANCE' | translate
          }}</span
        >
        {{ 'AREAS.PROCESSING.RESUME-JOBS.JOB' | translate }}</strong
      >
      <span *ngIf="jobDetails.testAll === 'true'">
        <em> - {{ 'AREAS.PROCESSING.RESUME-JOBS.TEST-ALL' | translate }}</em>
      </span>

      <span *ngIf="jobDetails.numberOfRandomTestTokens > -1">
        <em>
          - {{ 'AREAS.PROCESSING.TAB-QUALITY-ASSURANCE.TEST' | translate }}
          {{jobDetails.numberOfRandomTestTokens}} {{
          'AREAS.PROCESSING.RESUME-JOBS.TEST-RANDOM' | translate }}</em
        >
      </span>

      <span *ngIf="jobDetails.listOfTestTokens">
        <em>
          - {{ 'AREAS.PROCESSING.RESUME-JOBS.TEST-LIST' | translate }}
          {{jobDetails.listOfTestTokens}}
        </em>
      </span>

      <br />
      <br />

      <span>{{jobDetails.filePath}}</span> ({{jobDetails.jobDate}})

      <br />
      <br />
      <span style="text-decoration: underline"
        >{{ jobDetails.numberOfRemainingTokens }} {{
        'AREAS.PROCESSING.RESUME-JOBS.DOCS-REMAINING' | translate }}</span
      >
      ({{jobDetails.tokensCount - jobDetails.numberOfRemainingTokens}} {{
      'AREAS.PROCESSING.RESUME-JOBS.OUT-OF' | translate }}
      {{jobDetails.tokensCount}} {{ 'AREAS.PROCESSING.RESUME-JOBS.DOCS-DONE' |
      translate }})
      <br />
      <br />

      <button
        id="btnResume"
        type="button"
        class="btn btn-primary"
        (click)="doResumeJob(jobDetails.jobFilePath)"
      >
        <i class="fa fa-play"></i>&nbsp;Resume
        <span
          *ngIf="jobDetails.testAll ==='true' || jobDetails.numberOfRandomTestTokens > -1 || jobDetails.listOfTestTokens"
          >{{ 'AREAS.PROCESSING.LEFT-MENU.QUALITY-ASSURANCE' | translate
          }}</span
        >
        {{ 'AREAS.PROCESSING.RESUME-JOBS.JOB' | translate }}</button
      >&nbsp;&nbsp;
      <button
        id="btnClear"
        type="button"
        class="btn"
        (click)="clearResumeJob(jobDetails.jobFilePath)"
      >
        <i class="fa fa-file-o"></i>&nbsp;{{
        'AREAS.PROCESSING.RESUME-JOBS.CLEAR-JOB' | translate }}
      </button>
    </div>
  </div>
  <br />
</ng-template>
`;
