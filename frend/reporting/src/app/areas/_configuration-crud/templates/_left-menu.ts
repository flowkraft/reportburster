export const leftMenuTemplate = `<!-- Sidebar Menu -->
<ul class="sidebar-menu" data-widget="tree">
  <li class="header">Reports, Connections & Cubes</li>
  <li [class.active]="activeSection === 'reports'">
    <a id="btnNavSectionReports" href="#" [routerLink]="['/configuration-crud', 'reports']" skipLocationChange="true">
      <i class="fa fa-files-o"></i> <span>Reports</span>
    </a>
  </li>
  <li [class.active]="activeSection === 'connections'">
    <a id="btnNavSectionConnections" href="#" [routerLink]="['/configuration-crud', 'connections']" skipLocationChange="true">
      <i class="fa fa-plug"></i> <span>Connections</span>
    </a>
  </li>
  <li [class.active]="activeSection === 'cubes'">
    <a id="btnNavSectionCubes" href="#" [routerLink]="['/configuration-crud', 'cubes']" skipLocationChange="true">
      <i class="fa fa-cube"></i> <span>Cubes</span>
    </a>
  </li>
</ul>`;
