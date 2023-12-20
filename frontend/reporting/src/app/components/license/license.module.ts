import { NgModule } from '@angular/core';
import { InstallSetupUpgradeModule } from '../../areas/install-setup-upgrade/install-setup-upgrade.module';
import { UpdateModule } from '../../areas/install-setup-upgrade/update/update.module';
import { WhatsNewModule } from '../../areas/install-setup-upgrade/whats-new/whats-new.module';
import { SharedModule } from '../../shared/shared.module';

import { LicenseComponent } from './license.component';

@NgModule({
  declarations: [LicenseComponent],
  exports: [LicenseComponent],
  imports: [
    SharedModule,
    InstallSetupUpgradeModule,
    WhatsNewModule,
    UpdateModule,
  ],
})
export class LicenseModule {}
