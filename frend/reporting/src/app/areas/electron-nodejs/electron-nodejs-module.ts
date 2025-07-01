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
import { RbElectronService } from './electron.service';
import { ButtonNativeSystemDialogComponent } from './button-native-system-dialog/button-native-system-dialog.component';
import { UpdateComponent } from './update/update.component';
import { WhenUpdatingComponent } from './update/when-updating';

@NgModule({
  declarations: [
    JavaComponent,
    ExtraPackagesComponent,
    TerminalComponent,
    SystemDiagnosticsComponent,
    ChocolateyComponent,
    ButtonNativeSystemDialogComponent,
    UpdateComponent,
    WhenUpdatingComponent,
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
    UpdateComponent,
    JavaComponent,
    ExtraPackagesComponent,
    TerminalComponent,
    SystemDiagnosticsComponent,
  ],
  providers: [BashService, TerminalService, RbElectronService],
})
export class ElectronNodeJsModule {}
