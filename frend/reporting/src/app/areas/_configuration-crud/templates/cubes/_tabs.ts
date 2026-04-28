export const tabsTemplate = `<tabset>
  <tab heading="Cubes">
    <ng-container *ngTemplateOutlet="tabCubeDefinitionsTemplate">
    </ng-container>
  </tab>

  <tab heading="{{ 'SHARED-TABS.LICENSE' | translate }}">
    <ng-container *ngTemplateOutlet="tabLicenseTemplate">
    </ng-container>
  </tab>
</tabset>`;
