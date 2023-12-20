import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';

import { TerminalModule, TerminalService } from 'primeng/terminal';

import { SidebarModule } from 'primeng/sidebar';
import { PanelModule } from 'primeng/panel';

import { JavaComponent } from './java/java.component';
import { SystemDiagnosticsComponent } from './system-diagnostics/system-diagnostics.component';
import { ExtraPackagesComponent } from './extra-packages/extra-packages.component';
import { TerminalComponent } from './terminal/terminal.component';

import { ChocolateyComponent } from './chocolatey/chocolatey.component';

import { BashService } from './bash.service';

@NgModule({
  declarations: [
    JavaComponent,
    ExtraPackagesComponent,
    TerminalComponent,
    SystemDiagnosticsComponent,
    ChocolateyComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    TerminalModule,
    PanelModule,
    SidebarModule,
    TranslateModule,
  ],
  exports: [
    JavaComponent,
    ExtraPackagesComponent,
    TerminalComponent,
    SystemDiagnosticsComponent,
  ],
  providers: [BashService, TerminalService],
})
export class InstallSetupUpgradeModule {}
