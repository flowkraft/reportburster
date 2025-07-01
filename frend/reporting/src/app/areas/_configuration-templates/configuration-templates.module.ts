import { NgModule, Component } from '@angular/core';

import { TabsModule } from 'ngx-bootstrap/tabs';

import { ConfigurationTemplatesComponent } from './configuration-templates.component';
import { AppRoutingModule } from '../../app-routing.module';
import { LicenseModule } from '../../components/license/license.module';
import { SharedModule } from '../../shared/shared.module';
import { EditorModule } from 'primeng/editor';

@NgModule({
  declarations: [ConfigurationTemplatesComponent],
  exports: [ConfigurationTemplatesComponent],
  imports: [
    TabsModule.forRoot(),
    AppRoutingModule,
    SharedModule,
    LicenseModule,
    EditorModule,
  ],
})
export class ConfigurationTemplatesModule {}
