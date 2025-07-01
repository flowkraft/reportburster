export const tabQATemplate = `<ng-template #tabQATemplate>
  <div class="well">

  <div class="row">

      <div class="col-xs-2">{{
        'AREAS.CONFIGURATION.TAB-QA.WEB-URL' | translate }}</div>
      <div class="col-xs-7">
        <input id="qaWebURL" [(ngModel)]="xmlSettings?.documentburster.settings.qualityassurance.emailserver.weburl"
          (ngModelChange)='settingsChangedEventHandler($event)' class="form-control" />
      </div>

  </div>
  <p></p>
  
  <div class="row">

      <div class="col-xs-2">{{
        'AREAS.CONFIGURATION.TAB-QA.FROM-NAME' | translate }}</div>
      <div class="col-xs-7">
        <input id="qaFromName" [(ngModel)]="xmlSettings?.documentburster.settings.qualityassurance.emailserver.name"
          (ngModelChange)='settingsChangedEventHandler($event)' class="form-control" />
      </div>

      <div class="col-xs-3">
        <dburst-button-variables id="btnQaFromNameVariables"
          (sendSelectedVariable)="updateFormControlWithSelectedVariable('qaFromName',$event)">
        </dburst-button-variables>
      </div>

    </div>
    <p></p>
    <div class="row">

      <div class="col-xs-2">{{
        'AREAS.CONFIGURATION.TAB-QA.FROM-ADDRESS' | translate }}</div>
      <div class="col-xs-7">
        <input id="qaFromEmailAddress"
          [(ngModel)]="xmlSettings?.documentburster.settings.qualityassurance.emailserver.fromaddress"
          (ngModelChange)='settingsChangedEventHandler($event)' class="form-control" />
      </div>

      <div class="col-xs-3">
        <dburst-button-variables id="btnQaFromEmailAddressVariables"
          (sendSelectedVariable)="updateFormControlWithSelectedVariable('qaFromEmailAddress',$event)">
        </dburst-button-variables>
      </div>

    </div>
    <p></p>
    <div class="row">

      <div class="col-xs-2">{{
        'AREAS.CONFIGURATION.TAB-QA.HOST' | translate }}</div>
      <div class="col-xs-7">
        <input id="qaEmailServerHost"
          [(ngModel)]="xmlSettings?.documentburster.settings.qualityassurance.emailserver.host"
          (ngModelChange)='settingsChangedEventHandler($event)' class="form-control" />
      </div>

    </div>
    <p></p>
    <div class="row">

      <div class="col-xs-2">{{
        'AREAS.CONFIGURATION.TAB-QA.USER-NAME' | translate }}</div>
      <div class="col-xs-7">
        <input id="qaUserName" [(ngModel)]="xmlSettings?.documentburster.settings.qualityassurance.emailserver.userid"
          (ngModelChange)='settingsChangedEventHandler($event)' class="form-control" />
      </div>

    </div>
    <p></p>
    <div class="row">

      <div class="col-xs-2">{{
        'AREAS.CONFIGURATION.TAB-QA.PASSWORD' | translate }}</div>
      <div class="col-xs-7">
        <input id="qaPassword"
          [(ngModel)]="xmlSettings?.documentburster.settings.qualityassurance.emailserver.userpassword"
          (ngModelChange)='settingsChangedEventHandler($event)' type="password" class="form-control" />
      </div>

    </div>
    <p></p>
    <div class="row">

      <div class="col-xs-2">{{
        'AREAS.CONFIGURATION.TAB-QA.PORT' | translate }}</div>
      <div class="col-xs-7">
        <input id="qaPort" [(ngModel)]="xmlSettings?.documentburster.settings.qualityassurance.emailserver.port"
          (ngModelChange)='settingsChangedEventHandler($event)' class="form-control" />
      </div>

    </div>
    <p></p>
    <div class="row">

      <div class="col-xs-2"></div>

      <div class="col-xs-3">
        <input type="checkbox" id="btnQASSL"
          [(ngModel)]="xmlSettings?.documentburster.settings.qualityassurance.emailserver.usessl"
          (ngModelChange)='settingsChangedEventHandler($event)' ng-true-value="'true'" ng-false-value="'false'" />
        <label for="btnQASSL" class="checkboxlabel">&nbsp;{{
          'AREAS.CONFIGURATION.TAB-QA.SSL-ENABLED' | translate }}</label>
      </div>

      <div class="col-xs-3">
        <input type="checkbox" id="btnQATLS"
          [(ngModel)]="xmlSettings?.documentburster.settings.qualityassurance.emailserver.usetls"
          (ngModelChange)='settingsChangedEventHandler($event)' ng-true-value="'true'" ng-false-value="'false'" />
        <label for="btnQATLS" class="checkboxlabel">&nbsp;{{
          'AREAS.CONFIGURATION.TAB-QA.TLS-ENABLED' | translate }}</label>
      </div>

    </div>
  </div>
</ng-template>
`;
