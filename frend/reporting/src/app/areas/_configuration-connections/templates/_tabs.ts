export const tabsTemplate = `<tabset>
  <tab heading="{{ 'AREAS.CONFIGURATION-CONNECTIONS.TABS.CONFIGURATION-CONNECTIONS' | translate }}">
    <ng-container *ngTemplateOutlet="tabExternalConnectionsTemplate">
    </ng-container>
  </tab>
  
  <tab heading="{{ 'SHARED-TABS.LOGGING-TRACING' | translate }}">
    <ng-container *ngTemplateOutlet="tabLogsTemplate">
    </ng-container>

  </tab>

  <tab heading="{{ 'SHARED-TABS.LICENSE' | translate }}">
    <ng-container *ngTemplateOutlet="tabLicenseTemplate">
    </ng-container>

  </tab>
</tabset>`;
