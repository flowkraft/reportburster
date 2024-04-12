export const systemDiagnosticsTemplate = `<!--<ng-template #systemDiagnosticsTemplate> -->
<strong id='checkPointHelpJavaPreRequisite'
  >{{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.DIAGNOSTICS.STATUS' | translate
  }}</strong
>
<br /><br />

<div class="row" *ngIf="!electronService.isJavaOk">
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

<span class="label label-success" *ngIf="electronService.isJavaOk"
  ><i class="fa fa-check-square-o"></i>&nbsp;<strong
    >{{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.JAVA.GREAT' | translate }},
    <em>Java</em>
    {{electronService.javaVersion}}
    {{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.JAVA.FOUND' | translate }}
    <em>DocumentBurster</em></strong
  ></span
>

<br /><br />
<strong>Environment Variables</strong>
<br /><br />
<ol>
  <li>
    <em>%JAVA_HOME%</em> (process.env) <code>{{electronService.JAVA_HOME}}</code>
  </li>
  <li>
    <em>%JRE_HOME%</em> (process.env) <code>{{electronService.JRE_HOME}}</code>
  </li>
  <li><em>%PATH%</em> (process.env) <code>{{electronService.PATH}}</code></li>

  <li *ngIf="electronService.isRestartRequired">
    <em>%JAVA_HOME%</em> (registry)
    <code>{{electronService.JAVA_HOME_REGISTRY}}</code>
  </li>
  <li *ngIf="electronService.isRestartRequired">
    <em>%PATH%</em> (registry) <code>{{electronService.PATH_REGISTRY}}</code>
  </li>
</ol>

<br />
<strong
  >{{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.DIAGNOSTICS.HEALTH-CHECKS' |
  translate }}</strong
>
<br /><br />
<ol>
  <li>
    <span
      class="label label-success"
      *ngIf="electronService.javaDiagnostics.javaHomeFolderExists"
      ><i class="fa fa-check-square-o"></i>&nbsp;{{electronService.JAVA_HOME}}
      {{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.DIAGNOSTICS.FOLDER-EXISTS' |
      translate }}</span
    >
    <span
      class="label label-warning"
      *ngIf="!electronService.javaDiagnostics.javaHomeFolderExists"
      >&nbsp;<em>%JAVA_HOME%</em>
      {{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.DIAGNOSTICS.FOLDER-NOT-FOUND' |
      translate }}</span
    >
  </li>

  <li>
    <span
      class="label label-success"
      *ngIf="electronService.javaDiagnostics.pathIncludesJavaHomeBin"
      ><i class="fa fa-check-square-o"></i>&nbsp;{{electronService.JAVA_HOME}}/bin
      {{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.DIAGNOSTICS.LOCATION-IN-PATH' |
      translate }} <em>%PATH%</em></span
    >
    <span
      class="label label-warning"
      *ngIf="!electronService.javaDiagnostics.pathIncludesJavaHomeBin"
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
      *ngIf="electronService.javaDiagnostics.javaExeExists"
      ><i class="fa fa-check-square-o"></i
      >&nbsp;{{electronService.JAVA_HOME}}/bin/java.exe
      {{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.DIAGNOSTICS.FILE-EXISTS' |
      translate }}</span
    >
    <span
      class="label label-warning"
      *ngIf="!electronService.javaDiagnostics.javaExeExists"
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
      *ngIf="electronService.javaDiagnostics.jreHomeFolderExists"
      ><i class="fa fa-check-square-o"></i>&nbsp;{{electronService.JRE_HOME}}
      {{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.DIAGNOSTICS.FOLDER-EXISTS' |
      translate }}</span
    >
    <span
      class="label label-warning"
      *ngIf="!electronService.javaDiagnostics.jreHomeFolderExists"
      >&nbsp;<em>%JRE_HOME%</em>
      ({{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.DIAGNOSTICS.REQUIRED-BY' |
      translate }}&nbsp;<em>DocumentBurster</em> Web Console)
      {{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.DIAGNOSTICS.FOLDER-NOT-FOUND' |
      translate }}</span
    >
  </li>
</ol>

<!--</ng-template> -->
`;
