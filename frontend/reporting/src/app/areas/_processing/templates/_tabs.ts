export const tabsTemplate = `
<tabset>

  <tab *ngFor="let tab of visibleTabs" [id]="tab.id" [heading]="tab.heading | translate">

    <ng-container [ngTemplateOutlet]="this[tab.ngTemplateOutlet]">
    </ng-container>
  </tab>

</tabset>
`;
