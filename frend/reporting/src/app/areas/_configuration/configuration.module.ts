import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

import { LicenseModule } from '../../components/license/license.module';

import { AppRoutingModule } from '../../app-routing.module';

import { SharedModule } from '../../shared/shared.module';
import { EditorModule } from 'primeng/editor';
import { NgSelectModule } from '@ng-select/ng-select';
import { ConfigurationComponent } from './configuration.component';
import { AngularSplitModule } from 'angular-split';
import { ConnectionDetailsModule } from '../../components/connection-details/connection-details.module';
import { TemplatesGalleryModalModule } from '../../components/templates-gallery-modal/templates-gallery-modal.module';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [ConfigurationComponent],
  exports: [ConfigurationComponent],
  imports: [
    SharedModule,
    TemplatesGalleryModalModule,
    EditorModule,
    NgSelectModule,
    AppRoutingModule,
    LicenseModule,
    ConnectionDetailsModule,
    AngularSplitModule,
  ],
})
export class ConfigurationModule {}
