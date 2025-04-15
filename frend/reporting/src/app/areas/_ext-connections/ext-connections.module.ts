import { NgModule } from '@angular/core';

import { TabsModule } from 'ngx-bootstrap/tabs';

import { ExternalConnectionsComponent } from './ext-connections.component';
import { AppRoutingModule } from '../../app-routing.module';
import { LicenseModule } from '../../components/license/license.module';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [ExternalConnectionsComponent],
  exports: [ExternalConnectionsComponent],
  imports: [
    TabsModule.forRoot(),
    AppRoutingModule,
    SharedModule,
    LicenseModule,
  ],
})
export class ExternalConnectionsModule {}
