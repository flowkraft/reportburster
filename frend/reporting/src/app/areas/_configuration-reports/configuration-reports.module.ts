import { NgModule, Component } from '@angular/core';

import { TabsModule } from 'ngx-bootstrap/tabs';

import { ConfigurationReportsComponent } from './configuration-reports.component';
import { AppRoutingModule } from '../../app-routing.module';
import { LicenseModule } from '../../components/license/license.module';
import { SharedModule } from '../../shared/shared.module';
import { EditorModule } from 'primeng/editor';

@NgModule({
  declarations: [ConfigurationReportsComponent],
  exports: [ConfigurationReportsComponent],
  imports: [
    TabsModule.forRoot(),
    AppRoutingModule,
    SharedModule,
    LicenseModule,
    EditorModule,
  ],
})
export class ConfigurationReportsModule {}
