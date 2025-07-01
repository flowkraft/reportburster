export const tabsTemplate = `
<tabset #processingTabs>

  <tab *ngFor="let tab of visibleTabs" [id]="tab.id" [heading]="tab.heading | translate" [active]="tab.active">
    <ng-container [ngTemplateOutlet]="this[tab.ngTemplateOutlet]">
    </ng-container>
  </tab>

</tabset>
`;
