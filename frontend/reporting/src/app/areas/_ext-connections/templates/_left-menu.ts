export const leftMenuTemplate = `<!-- Sidebar Menu -->
<ul class="sidebar-menu" data-widget="tree">
  <li class="header">
    {{ 'AREAS.EXTERNAL-CONNECTIONS.LEFT-MENU.EXTERNAL-CONNECTIONS' | translate }}
  </li>

  <li class="active"><a href="#" [routerLink]="['/ext-connections']" skipLocationChange="true"><i class="fa fa-files-o"></i> <span>
        {{ 'AREAS.EXTERNAL-CONNECTIONS.LEFT-MENU.EXTERNAL-CONNECTIONS' | translate }}
      </span></a></li>
</ul>`;
