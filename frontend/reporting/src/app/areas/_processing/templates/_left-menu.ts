export const leftMenuTemplate = `<!-- Sidebar Menu-->
<ul class="sidebar-menu" data-widget="tree">
  <li class="header">{{
    'AREAS.PROCESSING.LEFT-MENU.ACTIONS' | translate }}</li>

  <li routerLinkActive="active">
    <a href="#" [routerLink]="['/processing','burstMenuSelected']">
      <i class="fa fa-play"></i>
      <span>{{
        'AREAS.PROCESSING.LEFT-MENU.BURST' | translate }}</span>
    </a>
  </li>
  <li routerLinkActive="active">
    <a id="leftMenuMergeBurst" href="#" [routerLink]="['/processing','mergeBurstMenuSelected']">
      <i class="fa fa-plus-square-o"></i>
      <span>{{
        'AREAS.PROCESSING.LEFT-MENU.MERGE-BURST' | translate }}</span>
    </a>
  </li>
  <li routerLinkActive="active">
    <a id="leftMenuQualityAssurance" href="#" [routerLink]="['/processing','qualityMenuSelected']">
      <i class="fa fa-flag-checkered"></i>
      <span>{{
        'AREAS.PROCESSING.LEFT-MENU.QUALITY-ASSURANCE' | translate }}</span>
    </a>
  </li>
  <li routerLinkActive="active">
    <a href="#" [routerLink]="['/processing','logsMenuSelected']">
      <i class="fa fa-file-text-o"></i>
      <span>{{
        'AREAS.PROCESSING.LEFT-MENU.LOGGING-TRACING' | translate }}</span>
    </a>
  </li>
  <li *ngIf="false" routerLinkActive="active">
    <a href="#" [routerLink]="['/processing','samplesMenuSelected']">
      <i class="fa fa-bell-o"></i>
      <span>{{
        'AREAS.PROCESSING.LEFT-MENU.SAMPLES' | translate }}</span>
    </a>
  </li>
</ul>
`;
