export const tabsTemplate = `<tabset>

  <tab *ngFor="let tab of visibleTabs" [id]="tab.id">
    <ng-template tabHeading><span [innerHTML]="tab.heading | translate"></span></ng-template>
    <ng-container [ngTemplateOutlet]="this[tab.ngTemplateOutlet]">
    </ng-container>

  </tab>

</tabset>`;
