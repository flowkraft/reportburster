export const leftMenuTemplate = `<!-- Sidebar Menu -->
<ul class="sidebar-menu" data-widget="tree">
  <li class="header">
    {{ 'AREAS.CONFIGURATION-CONNECTIONS.LEFT-MENU.CONFIGURATION-CONNECTIONS' | translate }}
  </li>

  <li class="active"><a href="#" [routerLink]="['/configuration-connections']" skipLocationChange="true"><i class="fa fa-files-o"></i> <span>
        {{ 'AREAS.CONFIGURATION-CONNECTIONS.LEFT-MENU.CONFIGURATION-CONNECTIONS' | translate }}
      </span></a></li>
</ul>`;
