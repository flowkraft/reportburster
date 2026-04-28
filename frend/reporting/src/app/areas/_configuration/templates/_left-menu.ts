export const leftMenuTemplate = `<!-- Sidebar Menu -->
<ul class="sidebar-menu" data-widget="tree">
  <li class="header">
    {{ 'AREAS.CONFIGURATION.LEFT-MENU.TOP-TITLE' | translate }}
    (<strong>{{ settingsService.currentConfigurationTemplateName }}</strong>)
    <br *ngIf="settingsService.currentConfigurationTemplate?.type === 'config-jasper-reports'" />
    <span *ngIf="settingsService.currentConfigurationTemplate?.type === 'config-jasper-reports'"
          class="label label-default" style="font-size: 0.8em; opacity: 0.85;">
      <i class="fa fa-diamond"></i> JasperReports
    </span>
  </li>

  <li routerLinkActive="active">
    <a id="leftMenuGeneralSettings" href="#" [routerLink]="[
        '/configuration',
        'generalSettingsMenuSelected',
        settingsService.currentConfigurationTemplatePath,
        settingsService.currentConfigurationTemplateName
      ]" skipLocationChange="true">
      <i class="fa fa-pencil-square-o"></i>
      <span>{{ 'AREAS.CONFIGURATION.LEFT-MENU.GENERAL' | translate }}</span>
    </a>
  </li>

  <li *ngIf="xmlSettings?.documentburster?.settings?.capabilities?.reportgenerationmailmerge && settingsService.currentConfigurationTemplate?.type !== 'config-jasper-reports'" routerLinkActive="active">
    <a id="leftMenuReportingSettings" href="#" [routerLink]="[
        '/configuration',
        'reportingSettingsMenuSelected',
        settingsService.currentConfigurationTemplatePath,
        settingsService.currentConfigurationTemplateName
      ]" skipLocationChange="true">
      <i class="fa fa-file-text-o"></i>
      <span>{{ 'AREAS.CONFIGURATION.LEFT-MENU.REPORTING' | translate }}</span>
    </a>
  </li>

  <li *ngIf="xmlSettings?.documentburster?.settings?.capabilities?.reportdistribution" routerLinkActive="active">
    <a id="leftMenuEnableDisableDistribution" href="#" [routerLink]="[
        '/configuration',
        'enableDisableDistributionMenuSelected',
        settingsService.currentConfigurationTemplatePath,
        settingsService.currentConfigurationTemplateName
      ]" skipLocationChange="true">
      <i class="fa fa-check-square-o"></i>
      <span>{{
        'AREAS.CONFIGURATION.LEFT-MENU.ENABLE-DISABLE-DELIVERY' | translate
        }}</span>
    </a>
  </li>

  <li *ngIf="xmlSettings?.documentburster?.settings?.capabilities?.reportdistribution" class="treeview" routerLinkActive="active">
    <a id="leftMenuEmailSettings" href="#" [routerLink]="[
        '/configuration',
        'emailSettingsMenuSelected',
        settingsService.currentConfigurationTemplatePath,
        settingsService.currentConfigurationTemplateName
      ]" skipLocationChange="true">
      <i class="fa fa-envelope-o"></i>
      <span>{{ 'AREAS.CONFIGURATION.LEFT-MENU.EMAIL' | translate }}</span>
      <span class="pull-right-container">
        <i class="fa fa-angle-left pull-right"></i>
      </span>
    </a>
    <ul class="treeview-menu">
      <li routerLinkActive="active">
        <a href="#" [routerLink]="[
            '/configuration',
            'cloudEmailProvidersMenuSelected',
            settingsService.currentConfigurationTemplatePath,
            settingsService.currentConfigurationTemplateName
          ]" skipLocationChange="true">
          <span>{{
            'AREAS.CONFIGURATION.LEFT-MENU.CLOUD-EMAIL-PROVIDERS' | translate
            }}</span>
        </a>
      </li>
    </ul>
  </li>

  <li *ngIf="xmlSettings?.documentburster?.settings?.capabilities?.reportdistribution" routerLinkActive="active">
    <a id="leftMenuUploadSettings" href="#" [routerLink]="[
        '/configuration',
        'uploadSettingsMenuSelected',
        settingsService.currentConfigurationTemplatePath,
        settingsService.currentConfigurationTemplateName
      ]" skipLocationChange="true">
      <i class="fa fa-upload"></i>
      <span>{{ 'AREAS.CONFIGURATION.LEFT-MENU.UPLOAD' | translate }}</span>
    </a>
  </li>

  <li *ngIf="xmlSettings?.documentburster?.settings?.capabilities?.reportdistribution" routerLinkActive="active">
    <a id="leftMenuDocuments2WebSettings" href="#" [routerLink]="[
        '/configuration',
        'documentBursterWebSettingsMenuSelected',
        settingsService.currentConfigurationTemplatePath,
        settingsService.currentConfigurationTemplateName
      ]" skipLocationChange="true">
      <i class="fa fa-credit-card"></i>
      <span>{{ 'AREAS.CONFIGURATION.LEFT-MENU.DOCUMENTS2WEB' | translate }}</span>
    </a>
  </li>

  <li *ngIf="xmlSettings?.documentburster?.settings?.capabilities?.reportdistribution" class="treeview" routerLinkActive="active">
    <a id="leftMenuSMSSettings" href="#" [routerLink]="[
        '/configuration',
        'smsSettingsMenuSelected',
        settingsService.currentConfigurationTemplatePath,
        settingsService.currentConfigurationTemplateName
      ]" skipLocationChange="true">
      <i class="fa fa-commenting-o"></i>
      <span>{{ 'AREAS.CONFIGURATION.LEFT-MENU.SMS' | translate }}</span>
      <span class="pull-right-container">
        <i class="fa fa-angle-left pull-right"></i>
      </span>
    </a>
    <ul class="treeview-menu">
      <li routerLinkActive="active">
        <a id="leftMenuTwilioSettings" href="#" [routerLink]="[
            '/configuration',
            'smsSettingsMenuSelected',
            settingsService.currentConfigurationTemplatePath,
            settingsService.currentConfigurationTemplateName
          ]" skipLocationChange="true">
          <span>{{ 'AREAS.CONFIGURATION.LEFT-MENU.TWILIO' | translate }}</span>
        </a>
      </li>
    </ul>
  </li>

  <li *ngIf="xmlSettings?.documentburster?.settings?.capabilities?.reportdistribution" class="treeview" routerLinkActive="active">
    <a id="leftMenuQualitySettings" href="#" [routerLink]="[
        '/configuration',
        'qualitySettingsMenuSelected',
        settingsService.currentConfigurationTemplatePath,
        settingsService.currentConfigurationTemplateName
      ]" skipLocationChange="true">
      <i class="fa fa-flag-checkered"></i>
      <span>{{
        'AREAS.CONFIGURATION.LEFT-MENU.QUALITY-ASSURANCE' | translate
        }}</span>
      <span class="pull-right-container ">
        <i class="fa fa-angle-left pull-right "></i>
      </span>
    </a>
    <ul class="treeview-menu" routerLinkActive="active">
      <li>
        <a id="leftMenuTestEmailServerSettings" [routerLink]="[
            '/configuration',
            'qualitySettingsMenuSelected',
            settingsService.currentConfigurationTemplatePath,
            settingsService.currentConfigurationTemplateName
          ]" skipLocationChange="true">
          <span>{{ 'AREAS.CONFIGURATION.LEFT-MENU.TEST-EMAIL-SERVER' | translate }}</span>
        </a>
      </li>
    </ul>
  </li>

  <li class="treeview" routerLinkActive="active">
    <a id="leftMenuAdvancedSettings" href="#" [routerLink]="[
        '/configuration',
        'advancedSettingsMenuSelected',
        settingsService.currentConfigurationTemplatePath,
        settingsService.currentConfigurationTemplateName
      ]" skipLocationChange="true">
      <i class="fa fa-sliders"></i>
      <span>{{ 'AREAS.CONFIGURATION.LEFT-MENU.ADVANCED' | translate }}</span>
      <span class="pull-right-container" *ngIf="xmlSettings?.documentburster?.settings?.capabilities?.reportdistribution">
        <i class="fa fa-angle-left pull-right "></i>
      </span>
    </a>
    <ul class="treeview-menu" *ngIf="xmlSettings?.documentburster?.settings?.capabilities?.reportdistribution">
      <li routerLinkActive="active">
        <a id="leftMenuErrorHandlingSettings" href="#" [routerLink]="[
            '/configuration',
            'errorHandlingSettingsMenuSelected',
            settingsService.currentConfigurationTemplatePath,
            settingsService.currentConfigurationTemplateName
          ]" skipLocationChange="true">
          <span>{{
            'AREAS.CONFIGURATION.LEFT-MENU.ERROR-HANDLING' | translate
            }}</span>
        </a>
      </li>
    </ul>
  </li>

  <li style="padding: 0; margin: 0; list-style: none;">
    <hr style="border-color: #4b545c; margin: 8px 10px;" />
  </li>
  <li style="color: #8aa4af; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em; padding: 10px 25px 5px 25px; font-weight: normal;">
    {{ 'AREAS.CONFIGURATION.LEFT-MENU.ALL-REPORTS' | translate }}
  </li>

  <li routerLinkActive="active">
    <a id="leftMenuReports" href="#" [routerLink]="[
        '/configuration',
        'reportsListMenuSelected',
        settingsService.currentConfigurationTemplatePath,
        settingsService.currentConfigurationTemplateName
      ]" skipLocationChange="true" style="font-weight: 600;">
      <i class="fa fa-list-ul" style="color: #00c0ef;"></i>
      <span style="color: #dce6ec;">{{ 'AREAS.CONFIGURATION.LEFT-MENU.REPORTS' | translate }}</span>
    </a>
  </li>
</ul>
`;
