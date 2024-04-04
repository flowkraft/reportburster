export const systemDiagnosticsTemplate = `<!--<ng-template #systemDiagnosticsTemplate> -->
<strong id='checkPointHelpJavaPreRequisite'
  >{{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.DIAGNOSTICS.STATUS' | translate
  }}</strong
>
<br /><br />

<div class="row" *ngIf="!storeService.configSys.sysInfo.setup.java.isJavaOk">
  <div class="col-xs-2">
    <span class="label label-warning"
      ><strong
        ><em>Java</em> {{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.JAVA.NOT-FOUND'
        | translate }}</strong
      ></span
    >
  </div>
</div>

<span class="label label-success" *ngIf="storeService.configSys.sysInfo.setup.java.isJavaOk"
  ><i class="fa fa-check-square-o"></i>&nbsp;<strong
    >{{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.JAVA.GREAT' | translate }},
    <em>Java</em>
    {{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.JAVA.FOUND' | translate }}
    <em>ReportBurster</em></strong
  ></span
>

<br /><br />
<strong>Environment Variables</strong>
<br /><br />
<ol>
<li><strong>%JAVA_HOME%</strong><p><code>{{storeService.configSys.sysInfo.setup.env.JAVA_HOME}}</code></p></li>
<li><strong>%JRE_HOME%</strong><p><code>{{storeService.configSys.sysInfo.setup.env.JRE_HOME}}</code></p></li>
<li><strong>%PATH%</strong><p><code>{{storeService.configSys.sysInfo.setup.env.PATH}}</code></p></li>
</ol>

<!--</ng-template> -->
`;
