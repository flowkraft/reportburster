import { NgModule } from '@angular/core';

import { HelpComponent } from './help.component';
import { AppRoutingModule } from '../../app-routing.module';

import { LogFilesViewerAllTogetherModule } from '../../components/log-files-viewer-all-together/log-files-viewer-all-together.module';

import { ButtonNativeSystemDialogModule } from '../../components/button-native-system-dialog/button-native-system-dialog.component.module';
import { LicenseModule } from '../../components/license/license.module';
import { InstallSetupUpgradeModule } from '../install-setup-upgrade/install-setup-upgrade.module';
import { UpdateModule } from '../install-setup-upgrade/update/update.module';
import { SharedModule } from '../../shared/shared.module';
import { LogFileViewerModule } from '../../components/log-file-viewer/log-file-viewer.module';

@NgModule({
  declarations: [HelpComponent],
  exports: [HelpComponent],
  imports: [
    AppRoutingModule,
    SharedModule,
    LogFileViewerModule,
    ButtonNativeSystemDialogModule,
    LicenseModule,
    InstallSetupUpgradeModule,
    UpdateModule,
  ],
})
export class HelpModule {}
