export const systemDiagnosticsTemplate = `<!--<ng-template #systemDiagnosticsTemplate> -->
<strong
  >{{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.DIAGNOSTICS.STATUS' | translate
  }}</strong
>
<br /><br />

<div class="row" *ngIf="!bashService.isJavaOk">
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

<span class="label label-success" *ngIf="bashService.isJavaOk"
  ><i class="fa fa-check-square-o"></i>&nbsp;<strong
    >{{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.JAVA.GREAT' | translate }},
    <em>Java</em>
    {{bashService.javaVersion}}
    {{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.JAVA.FOUND' | translate }}
    <em>DocumentBurster</em></strong
  ></span
>

<br /><br />
<strong>Environment Variables</strong>
<br /><br />
<ol>
  <li>
    <em>%JAVA_HOME%</em> (process.env) <code>{{bashService.JAVA_HOME}}</code>
  </li>
  <li>
    <em>%JRE_HOME%</em> (process.env) <code>{{bashService.JRE_HOME}}</code>
  </li>
  <li><em>%PATH%</em> (process.env) <code>{{bashService.PATH}}</code></li>

  <li *ngIf="bashService.isRestartRequired">
    <em>%JAVA_HOME%</em> (registry)
    <code>{{bashService.JAVA_HOME_REGISTRY}}</code>
  </li>
  <li *ngIf="bashService.isRestartRequired">
    <em>%PATH%</em> (registry) <code>{{bashService.PATH_REGISTRY}}</code>
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
      *ngIf="bashService.diagnostics.javaHomeFolderExists"
      ><i class="fa fa-check-square-o"></i>&nbsp;{{bashService.JAVA_HOME}}
      {{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.DIAGNOSTICS.FOLDER-EXISTS' |
      translate }}</span
    >
    <span
      class="label label-warning"
      *ngIf="!bashService.diagnostics.javaHomeFolderExists"
      >&nbsp;<em>%JAVA_HOME%</em>
      {{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.DIAGNOSTICS.FOLDER-NOT-FOUND' |
      translate }}</span
    >
  </li>

  <li>
    <span
      class="label label-success"
      *ngIf="bashService.diagnostics.pathIncludesJavaHomeBin"
      ><i class="fa fa-check-square-o"></i>&nbsp;{{bashService.JAVA_HOME}}/bin
      {{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.DIAGNOSTICS.LOCATION-IN-PATH' |
      translate }} <em>%PATH%</em></span
    >
    <span
      class="label label-warning"
      *ngIf="!bashService.diagnostics.pathIncludesJavaHomeBin"
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
      *ngIf="bashService.diagnostics.javaExeExists"
      ><i class="fa fa-check-square-o"></i
      >&nbsp;{{bashService.JAVA_HOME}}/bin/java.exe
      {{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.DIAGNOSTICS.FILE-EXISTS' |
      translate }}</span
    >
    <span
      class="label label-warning"
      *ngIf="!bashService.diagnostics.javaExeExists"
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
      *ngIf="bashService.diagnostics.jreHomeFolderExists"
      ><i class="fa fa-check-square-o"></i>&nbsp;{{bashService.JRE_HOME}}
      {{'AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.DIAGNOSTICS.FOLDER-EXISTS' |
      translate }}</span
    >
    <span
      class="label label-warning"
      *ngIf="!bashService.diagnostics.jreHomeFolderExists"
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
