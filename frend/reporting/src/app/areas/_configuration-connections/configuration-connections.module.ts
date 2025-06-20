import { NgModule } from '@angular/core';

import { TabsModule } from 'ngx-bootstrap/tabs';

import { ConnectionListComponent } from './configuration-connections.component';
import { AppRoutingModule } from '../../app-routing.module';
import { LicenseModule } from '../../components/license/license.module';
import { SharedModule } from '../../shared/shared.module';
import { FileExplorerModule } from '../../components/file-explorer/file-explorer.module';
import { ConnectionDetailsModule } from '../../components/connection-details/connection-details.module';

@NgModule({
  declarations: [ConnectionListComponent],
  exports: [ConnectionListComponent],
  imports: [
    SharedModule,
    TabsModule.forRoot(),
    AppRoutingModule,
    ConnectionDetailsModule,
    LicenseModule,
  ],
})
export class ConfigurationConnectionsModule {}
