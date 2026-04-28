# Plan: Consolidate Reports, Connections & Cubes Under a Common Explorer

## Problem Statement

Currently, **Reports**, **Connections**, and **Cubes** are separate entries inside the Configuration dropdown in the top menu. Each opens its own standalone screen that **hides** the left sidebar via `document.body.classList.add('sidebar-collapse')`. The user wants to:

1. Create a **single top-level menu entry** for Reports, Connections & Cubes
2. Clicking it opens a **new explorer screen** with a **visible left sidebar** showing: Reports, Connections, Cubes
3. Each section shows **exactly 2 tabs**: its own list tab + License tab
4. Remove the `sidebar-collapse` hack
5. Keep all existing list functionality intact

---

## Current Architecture

```mermaid
graph TD
    A[Top Menu - Configuration Dropdown] --> B[Reports link]
    A --> C[Connections link]
    A --> D[Cubes link]
    B --> E[/configuration-reports route]
    C --> F[/configuration-connections route]
    D --> G[/configuration-cubes route]
    E --> H[ConfigurationReportsComponent - sidebar-collapse ON]
    F --> I[ConnectionListComponent - sidebar-collapse ON]
    G --> J[CubeListComponent - sidebar-collapse ON]
    H --> K[Own left sidebar: only Reports]
    I --> L[Own left sidebar: only Connections]
    J --> M[Own left sidebar: only Cubes]
```

### Current Module Structure - 3 separate modules

| Module | Declares | Specific Deps |
|---|---|---|
| ConfigurationReportsModule | ConfigurationReportsComponent | EditorModule, ReportsListModule |
| ConfigurationConnectionsModule | ConnectionListComponent | ConnectionDetailsModule |
| ConfigurationCubesModule | CubeListComponent | CUSTOM_ELEMENTS_SCHEMA, AngularSplitModule, ConnectionDetailsModule |

Shared deps across all 3: TabsModule, AppRoutingModule, SharedModule, LicenseModule

---

## Target Architecture - SIMPLIFIED

```mermaid
graph TD
    A[Top Menu Bar] --> B[Burst]
    A --> C[Configuration Dropdown]
    A --> D[Reports, Connections and Cubes - NEW entry]
    A --> E[Help Dropdown]
    D --> F[/configuration-explorer/reports route]
    F --> G[ConfigurationExplorerComponent]
    G --> H[Left Sidebar: Reports, Connections, Cubes]
    H --> I[Reports selected]
    H --> J[Connections selected]
    H --> K[Cubes selected]
    I --> L[ConfigurationReportsComponent - embedded]
    J --> M[ConnectionListComponent - embedded]
    K --> N[CubeListComponent - embedded]
```

### Single Module: ConfigurationExplorerModule

| Declares | Role |
|---|---|
| ConfigurationExplorerComponent | NEW wrapper with shared left sidebar |
| ConfigurationReportsComponent | Existing - stripped of own sidebar |
| ConnectionListComponent | Existing - stripped of own sidebar |
| CubeListComponent | Existing - stripped of own sidebar |

---

## Files to Create - 1 new folder, 2 files

### 1. `frend/reporting/src/app/areas/_configuration-explorer/configuration-explorer.component.ts`

Wrapper component with:
- Shared left sidebar with 3 entries: Reports, Connections, Cubes
- `*ngIf` switching based on `activeSection` from route param `:section`
- NO `sidebar-collapse` - sidebar is always visible
- Defaults to `reports` if no section specified

Template structure:
```html
<aside class="main-sidebar">
  <section class="sidebar">
    <ul class="sidebar-menu" data-widget="tree">
      <li class="header">Reports, Connections & Cubes</li>
      <li [class.active]="activeSection === 'reports'">
        <a [routerLink]="['/configuration-explorer', 'reports']" skipLocationChange="true">
          <i class="fa fa-files-o"></i> <span>Reports</span>
        </a>
      </li>
      <li [class.active]="activeSection === 'connections'">
        <a [routerLink]="['/configuration-explorer', 'connections']" skipLocationChange="true">
          <i class="fa fa-plug"></i> <span>Connections</span>
        </a>
      </li>
      <li [class.active]="activeSection === 'cubes'">
        <a [routerLink]="['/configuration-explorer', 'cubes']" skipLocationChange="true">
          <i class="fa fa-cube"></i> <span>Cubes</span>
        </a>
      </li>
    </ul>
  </section>
</aside>
<div class="content-wrapper">
  <section class="content">
    <dburst-configuration-reports *ngIf="activeSection === 'reports'"></dburst-configuration-reports>
    <dburst-connection-list *ngIf="activeSection === 'connections'"></dburst-connection-list>
    <dburst-cube-list *ngIf="activeSection === 'cubes'"></dburst-cube-list>
  </section>
</div>
```

### 2. `frend/reporting/src/app/areas/_configuration-explorer/configuration-explorer.module.ts`

Single module that replaces all 3 old modules:

```typescript
@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [
    ConfigurationExplorerComponent,  // NEW wrapper
    ConfigurationReportsComponent,   // from _configuration-reports
    ConnectionListComponent,         // from _configuration-connections
    CubeListComponent,               // from _configuration-cubes
  ],
  exports: [ConfigurationExplorerComponent],
  imports: [
    // Shared deps from all 3
    TabsModule.forRoot(),
    AppRoutingModule,
    SharedModule,
    LicenseModule,
    // Reports-specific
    EditorModule,
    ReportsListModule,
    // Connections-specific
    ConnectionDetailsModule,
    // Cubes-specific
    AngularSplitModule,
  ],
})
export class ConfigurationExplorerModule {}
```

---

## Files to Modify

### 3. `_configuration-reports/configuration-reports.component.ts`

- Remove `<aside class="main-sidebar">` and its content from template
- Remove `<div class="content-wrapper"><section class="content">` wrapper
- Remove `document.body.classList.add('sidebar-collapse')` from `ngOnInit`
- Remove `ngOnDestroy` entirely - it only removed `sidebar-collapse`
- Remove `OnDestroy` from imports
- Remove `leftMenuTemplate` import
- Keep: tabs, tab content templates, all existing functionality

### 4. `_configuration-connections/configuration-connections.component.ts`

- Remove `<aside class="main-sidebar">` and its content from template
- Remove `<div class="content-wrapper"><section class="content">` wrapper
- Remove `document.body.classList.add('sidebar-collapse')` from `ngOnInit`
- Remove `document.body.classList.remove('sidebar-collapse')` from `ngOnDestroy` - keep `ngOnDestroy` for `showSamplesSub?.unsubscribe()`
- Remove `leftMenuTemplate` import
- Remove `${tabLogsTemplate}` from template
- Remove `tabLogsTemplate` import
- Keep: all connection list functionality

### 5. `_configuration-cubes/configuration-cubes.component.ts`

- Remove `<aside class="main-sidebar">` and its content from template
- Remove `<div class="content-wrapper"><section class="content">` wrapper
- Remove `document.body.classList.add('sidebar-collapse')` from `ngOnInit`
- Remove `document.body.classList.remove('sidebar-collapse')` from `ngOnDestroy` - keep `ngOnDestroy` for cleanup
- Remove `leftMenuTemplate` import
- Remove `${tabLogsTemplate}` from template
- Remove `tabLogsTemplate` import
- Keep: all cube list functionality

### 6. `_configuration-connections/templates/_tabs.ts`

Remove Logging tab, keep Connections + License:

**Before:** Connections + Logging + License
**After:** Connections + License

### 7. `_configuration-cubes/templates/_tabs.ts`

Remove Logging tab, keep Cubes + License:

**Before:** Cubes + Logging + License
**After:** Cubes + License

### 8. `top-menu-header/top-menu-header.template.html`

- Remove Reports, Connections, Cubes entries from Configuration dropdown
- Add new top-level menu item between Configuration and Help:

```html
<li routerLinkActive="active">
  <a id="topMenuExplorer" href="#"
    [routerLink]="['/configuration-explorer', 'reports']"
    skipLocationChange="true"
    >Reports, Connections & Cubes</a>
</li>
```

### 9. `app-routing.module.ts`

Add new routes + redirect old ones:

```typescript
import { ConfigurationExplorerComponent } from './areas/_configuration-explorer/configuration-explorer.component';

// New:
{ path: 'configuration-explorer', redirectTo: 'configuration-explorer/reports', pathMatch: 'full' },
{ path: 'configuration-explorer/:section', canActivate: [NoJavaGuard], component: ConfigurationExplorerComponent },

// Redirect old routes:
{ path: 'configuration-reports', redirectTo: 'configuration-explorer/reports' },
{ path: 'configuration-connections', redirectTo: 'configuration-explorer/connections' },
{ path: 'configuration-cubes', redirectTo: 'configuration-explorer/cubes' },
```

Keep `configuration-connections/:goBackLocation/:configurationFilePath/:configurationFileName` as-is for backward compat from config screen.

### 10. `areas.module.ts`

Replace 3 old module imports with 1 new:

```typescript
// Remove:
import { ConfigurationReportsModule } from './_configuration-reports/configuration-reports.module';
import { ConfigurationConnectionsModule } from './_configuration-connections/configuration-connections.module';
import { ConfigurationCubesModule } from './_configuration-cubes/configuration-cubes.module';

// Add:
import { ConfigurationExplorerModule } from './_configuration-explorer/configuration-explorer.module';

// In imports array: replace 3 with ConfigurationExplorerModule
```

---

## Files to Delete - 6 files

### Old module files - no longer needed since declarations move to ConfigurationExplorerModule:

1. `frend/reporting/src/app/areas/_configuration-reports/configuration-reports.module.ts`
2. `frend/reporting/src/app/areas/_configuration-connections/configuration-connections.module.ts`
3. `frend/reporting/src/app/areas/_configuration-cubes/configuration-cubes.module.ts`

### Old left menu templates - no longer used:

4. `frend/reporting/src/app/areas/_configuration-reports/templates/_left-menu.ts`
5. `frend/reporting/src/app/areas/_configuration-connections/templates/_left-menu.ts`
6. `frend/reporting/src/app/areas/_configuration-cubes/templates/_left-menu.ts`

---

## Execution Order

1. Create `_configuration-explorer/configuration-explorer.component.ts`
2. Create `_configuration-explorer/configuration-explorer.module.ts`
3. Modify `_configuration-reports/configuration-reports.component.ts` - strip sidebar + collapse
4. Modify `_configuration-connections/configuration-connections.component.ts` - strip sidebar + collapse + tabLogs
5. Modify `_configuration-cubes/configuration-cubes.component.ts` - strip sidebar + collapse + tabLogs
6. Modify `_configuration-connections/templates/_tabs.ts` - remove Logging tab
7. Modify `_configuration-cubes/templates/_tabs.ts` - remove Logging tab
8. Modify `top-menu-header.template.html` - add explorer entry, remove old dropdown entries
9. Modify `app-routing.module.ts` - add explorer routes, redirect old routes
10. Modify `areas.module.ts` - swap 3 old imports for 1 new
11. Delete 3 old module files + 3 old left-menu templates
12. Clean up unused imports in modified components

---

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Old deep links to /configuration-reports etc. | Redirect old routes to new explorer routes |
| goBack params route for connections | Keep parameterized route as-is for backward compat |
| Components re-init on section switch | Expected - consistent with current behavior |
| Logging tab removal | Per 2-tabs-each requirement. Still in Configuration screen |
| Moving declarations between modules | Angular allows this as long as component is declared in exactly one module |
