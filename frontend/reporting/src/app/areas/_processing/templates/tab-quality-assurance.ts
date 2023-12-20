export const tabQualityAssuranceTemplate = `<ng-template #tabQualityAssuranceTemplate>
  <div class="well">
    <div class="row">
      <div class="col-xs-2">
        PDF / Excel
        {{ 'AREAS.PROCESSING.TAB-QUALITY-ASSURANCE.FILE' | translate }}
      </div>
      <div class="col-xs-8">
        <input id="qaBurstFile" [(ngModel)]="procQualityAssuranceInfo.inputFilePath" class="form-control" required />
      </div>

      <div class="col-xs-2">
        <dburst-button-native-system-dialog value="{{
            'COMPONENTS.BUTTON-NATIVE-SYSTEM-DIALOG.SELECT' | translate
          }}" dialogType="file" (pathsSelected)="onQAFileSelected($event)"></dburst-button-native-system-dialog>
      </div>
    </div>

    <p></p>

    <div class="radio">
      <label>
        <input type="radio" name="optradio" checked="checked" [(ngModel)]="procQualityAssuranceInfo.mode" value="ta" />{{
          'AREAS.PROCESSING.TAB-QUALITY-ASSURANCE.TEST-ALL-TOKENS' | translate
        }}</label>
    </div>

    <p></p>

    <div class="radio">
      <label>
        <input id="testTokensRandom" type="radio" name="optradio" [(ngModel)]="procQualityAssuranceInfo.mode" value="tr"
          (focus)="onDifferentQualityAssuranceModeFocus('tr')" />{{ 'AREAS.PROCESSING.TAB-QUALITY-ASSURANCE.TEST' | translate }}
        {{ procQualityAssuranceInfo.numberOfRandomTokens }}
        {{
          'AREAS.PROCESSING.TAB-QUALITY-ASSURANCE.RANDOM-BURST-TOKENS'
            | translate
        }}</label>
      <input id="numberOfRandomTokens" class="form-control" placeholder="2"
        [(ngModel)]="procQualityAssuranceInfo.numberOfRandomTokens"
        (focus)="onDifferentQualityAssuranceModeFocus('numberOfRandomTokens')" />
    </div>

    <p></p>

    <div class="radio">
      <label>
        <input id="testTokensList" type="radio" name="optradio" [(ngModel)]="procQualityAssuranceInfo.mode" value="tl"
          (focus)="onDifferentQualityAssuranceModeFocus('tl')" />{{
          'AREAS.PROCESSING.TAB-QUALITY-ASSURANCE.TEST-FOLLOWING' | translate
        }}</label>
      <input id="listOfTokens" class="form-control"
        placeholder="clyde.grew@northridgehealth.org,alfreda.waldback@northridgehealth.org"
        [(ngModel)]="procQualityAssuranceInfo.listOfTokens"
        (focus)="onDifferentQualityAssuranceModeFocus('listOfTokens')" />
    </div>

    <p></p>

    <div class="row">
      <div class="col-xs-1" style="margin-right: 40px">
        <button id="btnRunTest" type="button" class="btn btn-primary" (click)="doRunTest()" [disabled]="
            runTestShouldBeDisabled() ||
            executionStatsService.jobStats.numberOfActiveJobs > 0
          ">
          <i class="fa fa-thumbs-o-up"></i>&nbsp;{{
            'AREAS.PROCESSING.TAB-QUALITY-ASSURANCE.RUN-TEST' | translate
          }}
        </button>
      </div>

      <div class="col-xs-3">
        <dburst-button-clear-logs></dburst-button-clear-logs>
      </div>

      <div class="col-xs-3">
        <dburst-button-native-system-dialog value="{{ 'AREAS.PROCESSING.TAB-BURST.VIEW-REPORTS' | translate }}"
          dialogType="file">
        </dburst-button-native-system-dialog>
      </div>
    </div>

    <hr />

    <div class="row">
      <div class="col-xs-6" *ngIf="procQualityAssuranceInfo.testEmailServerStatus === 'started'"
        style="margin-right: 40px">
        <a href="{{ xmlSettings.documentburster.settings.qualityassurance.emailserver.weburl }}" target="_blank">
          <button class="btn" type="button">
            <span style="color:dodgerblue">
              <i class="fa fa-paper-plane"></i> </span>&nbsp;&nbsp;&nbsp;<span [innerHTML]="
                'AREAS.PROCESSING.TAB-QUALITY-ASSURANCE.VIEW-TESTED-EMAILS'
                  | translate
              "></span>
          </button>
        </a>
      </div>

      <div class=" col-xs-6" *ngIf="procQualityAssuranceInfo.testEmailServerStatus !== 'started'"
        style="margin-right: 40px">
        <button class="btn" type="button" [disabled]="true">
          <span style="color:gray"> <i class="fa fa-paper-plane"></i> </span>&nbsp;&nbsp;&nbsp;<span [innerHTML]="
              'AREAS.PROCESSING.TAB-QUALITY-ASSURANCE.INNER-HTML.VIEW-EMAILS'
                | translate
            "></span>
        </button>
      </div>

      <div class="col-xs-5" *ngIf="
          procQualityAssuranceInfo.testEmailServerStatus === 'starting' ||
          procQualityAssuranceInfo.testEmailServerStatus === 'stopping'
        ">
        <button type="button" class="btn btn-block" [disabled]="true">
          <i class="fa fa-spinner fa-pulse"></i>&nbsp;&nbsp;&nbsp;
          <strong *ngIf="
              procQualityAssuranceInfo.testEmailServerStatus === 'starting'
            " [innerHTML]="
              'AREAS.PROCESSING.TAB-QUALITY-ASSURANCE.STARTING' | translate
            "></strong>
          <strong *ngIf="
              procQualityAssuranceInfo.testEmailServerStatus === 'stopping'
            " [innerHTML]="
              'AREAS.PROCESSING.TAB-QUALITY-ASSURANCE.STOPPING' | translate
            "></strong>
        </button>
      </div>

      <div class=" col-xs-5" *ngIf="procQualityAssuranceInfo.testEmailServerStatus === 'stopped'">
        <button id="startTestEmailServer" type="button" class="btn btn-block"
          (click)="doStartStopTestEmailServer('start')" [disabled]="procQualityAssuranceInfo.mode === 'ta'">
          <span style="color:gray"> <i class="fa fa-circle"></i> </span>&nbsp;&nbsp;&nbsp;
          <strong>Start
            <em>{{
              'AREAS.PROCESSING.TAB-QUALITY-ASSURANCE.TEST-EMAIL-SERVER'
                | translate
            }}</em>
          </strong>
        </button>
      </div>

      <div class="col-xs-5" *ngIf="procQualityAssuranceInfo.testEmailServerStatus === 'started'">
        <button id="stopTestEmailServer" type="button" class="btn btn-block"
          (click)="doStartStopTestEmailServer('shut')">
          <span style="color:dodgerblue"> <i class="fa fa-circle"></i> </span>&nbsp;&nbsp;&nbsp;
          <strong>Stop
            <em>{{
              'AREAS.PROCESSING.TAB-QUALITY-ASSURANCE.TEST-EMAIL-SERVER'
                | translate
            }}</em>
          </strong>
        </button>
      </div>
    </div>

    <hr />

    <div class="row">
      <div class="col-xs-12" [innerHTML]="
          'AREAS.PROCESSING.TAB-QUALITY-ASSURANCE.INNER-HTML.TEST-SERVER-CATCH'
            | translate
        "></div>
    </div>
  </div>
</ng-template>
`;
