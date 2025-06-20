import { NgModule } from '@angular/core';

import { ProgressbarModule } from 'ngx-bootstrap/progressbar';

import { AreasComponent } from './areas.component';
import { TopMenuHeaderComponent } from './top-menu-header/top-menu-header.component';
import { StatusBarComponent } from './status-bar/status-bar.component';

//import { SharedModule } from '../shared.module';
import { SharedModule } from '../shared/shared.module';

import { ProcessingModule } from './_processing/processing.module';
import { AppRoutingModule } from '../app-routing.module';
import { ConfigurationTemplatesModule } from './_configuration-templates/configuration-templates.module';
import { HelpModule } from './_help/help.module';
import { ConfigurationModule } from './_configuration/configuration.module';
import { SkinsComponent } from '../components/skins/skins.component';
import { ConfigurationConnectionsModule } from './_configuration-connections/configuration-connections.module';
import { BrandComponent } from '../components/brand/brand.component';

@NgModule({
  declarations: [
    AreasComponent,
    BrandComponent,
    TopMenuHeaderComponent,
    StatusBarComponent,
    SkinsComponent,
  ],
  exports: [AreasComponent],
  imports: [
    SharedModule,
    ProcessingModule,
    ConfigurationModule,
    ConfigurationTemplatesModule,
    ConfigurationConnectionsModule,
    HelpModule,
    AppRoutingModule,
    ProgressbarModule.forRoot(),
  ],
})
export class AreasModule {}
