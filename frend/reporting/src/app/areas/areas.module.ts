import { NgModule } from '@angular/core';

import { ProgressbarModule } from 'ngx-bootstrap/progressbar';

import { AreasComponent } from './areas.component';

//import { SharedModule } from '../shared.module';
import { SharedModule } from '../shared/shared.module';

import { ProcessingModule } from './_processing/processing.module';
import { AppRoutingModule } from '../app-routing.module';
import { ConfigurationTemplatesModule } from './_configuration-templates/configuration-templates.module';
import { HelpModule } from './_help/help.module';
import { ConfigurationModule } from './_configuration/configuration.module';
import { ConfigurationConnectionsModule } from './_configuration-connections/configuration-connections.module';
import { StatusBarModule } from './status-bar/status-bar.module';
import { TopMenuHeaderModule } from './top-menu-header/top-menu-header.module';

@NgModule({
  declarations: [AreasComponent],
  exports: [AreasComponent],
  imports: [
    SharedModule,
    TopMenuHeaderModule,
    StatusBarModule,
    ProcessingModule,
    ConfigurationModule,
    ConfigurationTemplatesModule,
    ConfigurationConnectionsModule,
    HelpModule,
  ],
})
export class AreasModule {}
