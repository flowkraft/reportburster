export const leftMenuTemplate = `<!-- Sidebar Menu -->
<ul class="sidebar-menu" data-widget="tree">
  <li class="header">
    {{ 'AREAS.CONFIGURATION-TEMPLATES.LEFT-MENU.CONFIGURATION-TEMPLATES' | translate }}
  </li>

  <li class="active"><a href="#" [routerLink]="['/configuration-templates']" skipLocationChange="true"><i class="fa fa-files-o"></i> <span>
        {{ 'AREAS.CONFIGURATION-TEMPLATES.LEFT-MENU.CONFIGURATION-TEMPLATES' | translate }}
      </span></a></li>
</ul>`;
