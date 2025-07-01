import { NgModule } from '@angular/core';

import { HelpComponent } from './help.component';
import { AppRoutingModule } from '../../app-routing.module';

import { LicenseModule } from '../../components/license/license.module';
import { SharedModule } from '../../shared/shared.module';
import { LogFileViewerModule } from '../../components/log-file-viewer/log-file-viewer.module';
import { ElectronNodeJsModule } from '../electron-nodejs/electron-nodejs-module';
import { StarterPacksComponent } from '../../components/starter-packs/starter-packs.component';

@NgModule({
  declarations: [HelpComponent, StarterPacksComponent],
  exports: [HelpComponent],
  imports: [
    AppRoutingModule,
    SharedModule,
    LogFileViewerModule,
    LicenseModule,
    ElectronNodeJsModule,
  ],
})
export class HelpModule {}
