export const leftMenuTemplate = `<!-- Sidebar Menu-->
<ul class="sidebar-menu" data-widget="tree">
  <li class="header">{{ 'AREAS.HELP.LEFT-MENU.TOP-TITLE' | translate }}</li>
  <li routerLinkActive="active">
    <a id='leftMenuHelpSupport' href="#" [routerLink]="['/help','supportMenuSelected']" skipLocationChange="true">
      <i class="fa fa-hand-o-right"></i>
      <span>{{
        'AREAS.HELP.LEFT-MENU.SUPPORT' | translate }}</span>
    </a>
  </li>
  <li routerLinkActive="active">
    <a id='leftMenuHelpServices' href="#" [routerLink]="['/help','servicesMenuSelected']" skipLocationChange="true">
      <i class="fa fa-paper-plane-o"></i>
      <span>{{
        'AREAS.HELP.LEFT-MENU.SERVICES' | translate }}</span>
    </a>
  </li>
  <li routerLinkActive="active">
    <a id='leftMenuStarterPacks' href="#" [routerLink]="['/help','starterPacksMenuSelected']" skipLocationChange="true">
      <i class="fa fa-th-large"></i>
      <span>Starter Packs / Extra Utils</span>
    </a>
  </li>
  <li routerLinkActive="active">
    <a id='leftMenuHelpDocumentation' href="#" [routerLink]="['/help','docsMenuSelected']" skipLocationChange="true">
      <i class="fa fa-question-circle-o"></i>
      <span>{{
        'AREAS.HELP.LEFT-MENU.DOCUMENTATION' | translate }}</span>
    </a>
  </li>
  <li routerLinkActive="active">
    <a id='leftMenuHelpExamples' href="#" [routerLink]="['/help','useCasesMenuSelected']" skipLocationChange="true">
      <i class="fa fa-star-o"></i>
      <span>{{
        'AREAS.HELP.LEFT-MENU.EXAMPLES' | translate }}</span>
    </a>
  </li>
  <li routerLinkActive="active">
    <a id='leftMenuHelpCustomerReviews' href="#" [routerLink]="['/help','reviewsMenuSelected']" skipLocationChange="true">
      <i class="fa fa-address-card-o"></i>
      <span>{{
        'AREAS.HELP.LEFT-MENU.REVIEWS' | translate }}</span>
    </a>
  </li>
  <li routerLinkActive="active">
    <a id='leftMenuHelpBlog' href="#" [routerLink]="['/help','blogMenuSelected']" skipLocationChange="true">
      <i class="fa fa-rss"></i>
      <span>{{
        'AREAS.HELP.LEFT-MENU.BLOG' | translate }}</span>
    </a>
  </li>
  <li routerLinkActive="active" *ngIf="isRunningInsideElectron()">
    <a id='leftMenuHelpInstallSetup' href="#" [routerLink]="['/help','installSetupMenuSelected']" skipLocationChange="true">
      <i class="fa fa-cogs"></i>
      <span>{{
        'AREAS.HELP.LEFT-MENU.INSTALL-SETUP' | translate }}</span>
    </a>
  </li>
  <li routerLinkActive="active">
    <a id='leftMenuHelpLicense' href="#" [routerLink]="['/help','licenseMenuSelected']" skipLocationChange="true">
      <i class="fa fa-key"></i>
      <span>{{
        'AREAS.HELP.LEFT-MENU.LICENSE' | translate }}</span>
    </a>
  </li>
  <li routerLinkActive="active">
    <a id='leftMenuHelpAbout' href="#" [routerLink]="['/help','aboutMenuSelected']" skipLocationChange="true">
      <i class="fa fa-info"></i>
      <span>{{
        'AREAS.HELP.LEFT-MENU.ABOUT' | translate }}</span>
    </a>
  </li>
</ul>
`;
