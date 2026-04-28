export const tabsTemplate = `<tabset>
  <tab
    heading="{{ 'AREAS.CONFIGURATION-TEMPLATES.TABS.CONFIGURATION-TEMPLATES' | translate }}"
  >
    <ng-container *ngTemplateOutlet="tabConfTemplates"> </ng-container>
  </tab>

  <tab heading="{{ 'SHARED-TABS.LICENSE' | translate }}">
    <ng-container *ngTemplateOutlet="tabLicenseTemplate"> </ng-container>
  </tab>
</tabset>`;
