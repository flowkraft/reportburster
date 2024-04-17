export const systemDiagnosticsTemplate = `<!--<ng-template #systemDiagnosticsTemplate> -->
<strong id='checkPointHelpJavaPreRequisite'
  >{{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.DIAGNOSTICS.STATUS' | translate
  }}</strong
>
<br /><br />

<div class="row" *ngIf="!this.stateStore.configSys.sysInfo.setup.java.isJavaOk">
  <div class="col-xs-2">
    <span class="label label-warning"
      ><strong
        ><em>Java</em> {{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.JAVA.NOT-FOUND'
        | translate }}</strong
      ></span
    >
  </div>

  <div class="col-xs-10">
    <button type="button" class="btn btn-primary" (click)="restartApp()">
      <i class="fa fa-play"></i
      >&nbsp;{{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.JAVA.RESTART' | translate
      }} <em>DocumentBurster</em>
    </button>
  </div>
</div>

<span class="label label-success" *ngIf="this.stateStore.configSys.sysInfo.setup.java.isJavaOk"
  ><i class="fa fa-check-square-o"></i>&nbsp;<strong
    >{{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.JAVA.GREAT' | translate }},
    <em>Java</em>
    {{this.stateStore.configSys.sysInfo.setup.java.version}}
    {{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.JAVA.FOUND' | translate }}
    <em>DocumentBurster</em></strong
  ></span
>

<br /><br />
<strong>Environment Variables</strong>
<br /><br />
<ol>
  <li>
    <em>%JAVA_HOME%</em> (process.env) <code>{{this.stateStore.configSys.sysInfo.setup.env.JAVA_HOME}}</code>
  </li>
  <li>
    <em>%JRE_HOME%</em> (process.env) <code>{{this.stateStore.configSys.sysInfo.setup.env.JRE_HOME}}</code>
  </li>
  <li><em>%PATH%</em> (process.env) <code>{{this.stateStore.configSys.sysInfo.setup.env.PATH}}</code></li>

  <!--
  <li *ngIf="this.stateStore.configSys.sysInfo.setup.isRestartRequired">
    <em>%JAVA_HOME%</em> (registry)
    <code>{{this.stateStore.configSys.sysInfo.setup.env.JAVA_HOME_REGISTRY}}</code>
  </li>
  <li *ngIf="this.stateStore.configSys.sysInfo.setup.isRestartRequired">
    <em>%PATH%</em> (registry) <code>{{this.stateStore.configSys.sysInfo.setup.env.PATH_REGISTRY}}</code>
  </li>
  -->  
</ol>


<br />
<!--
<strong
  >{{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.DIAGNOSTICS.HEALTH-CHECKS' |
  translate }}</strong
>
<br /><br />
<ol>
  <li>
    <span
      class="label label-success"
      *ngIf="this.stateStore.configSys.sysInfo.setup.javaDiagnostics.javaHomeFolderExists"
      ><i class="fa fa-check-square-o"></i>&nbsp;{{this.stateStore.configSys.sysInfo.setup.JAVA_HOME}}
      {{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.DIAGNOSTICS.FOLDER-EXISTS' |
      translate }}</span
    >
    <span
      class="label label-warning"
      *ngIf="!this.stateStore.configSys.sysInfo.setup.javaDiagnostics.javaHomeFolderExists"
      >&nbsp;<em>%JAVA_HOME%</em>
      {{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.DIAGNOSTICS.FOLDER-NOT-FOUND' |
      translate }}</span
    >
  </li>

  <li>
    <span
      class="label label-success"
      *ngIf="this.stateStore.configSys.sysInfo.setup.javaDiagnostics.pathIncludesJavaHomeBin"
      ><i class="fa fa-check-square-o"></i>&nbsp;{{this.stateStore.configSys.sysInfo.setup.JAVA_HOME}}/bin
      {{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.DIAGNOSTICS.LOCATION-IN-PATH' |
      translate }} <em>%PATH%</em></span
    >
    <span
      class="label label-warning"
      *ngIf="!this.stateStore.configSys.sysInfo.setup.javaDiagnostics.pathIncludesJavaHomeBin"
    >
      &nbsp;
      <strong>%JAVA_HOME%/bin</strong>
      {{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.DIAGNOSTICS.LOCATION-NOT-IN-PATH'
      | translate }} <em>%PATH%</em></span
    >
  </li>

  <li>
    <span
      class="label label-success"
      *ngIf="this.stateStore.configSys.sysInfo.setup.javaDiagnostics.javaExeExists"
      ><i class="fa fa-check-square-o"></i
      >&nbsp;{{this.stateStore.configSys.sysInfo.setup.JAVA_HOME}}/bin/java.exe
      {{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.DIAGNOSTICS.FILE-EXISTS' |
      translate }}</span
    >
    <span
      class="label label-warning"
      *ngIf="!this.stateStore.configSys.sysInfo.setup.javaDiagnostics.javaExeExists"
    >
      &nbsp;
      <strong>%JAVA_HOME%/bin/java.exe</strong>
      {{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.DIAGNOSTICS.FILE-NOT-FOUND' |
      translate }}</span
    >
  </li>

  <li *ngIf="settingsService.isServerVersion">
    <span
      class="label label-success"
      *ngIf="this.stateStore.configSys.sysInfo.setup.javaDiagnostics.jreHomeFolderExists"
      ><i class="fa fa-check-square-o"></i>&nbsp;{{this.stateStore.configSys.sysInfo.setup.JRE_HOME}}
      {{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.DIAGNOSTICS.FOLDER-EXISTS' |
      translate }}</span
    >
    <span
      class="label label-warning"
      *ngIf="!this.stateStore.configSys.sysInfo.setup.javaDiagnostics.jreHomeFolderExists"
      >&nbsp;<em>%JRE_HOME%</em>
      ({{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.DIAGNOSTICS.REQUIRED-BY' |
      translate }}&nbsp;<em>DocumentBurster</em> Web Console)
      {{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.DIAGNOSTICS.FOLDER-NOT-FOUND' |
      translate }}</span
    >
  </li>
</ol>
-->
<!--</ng-template> -->
`;
