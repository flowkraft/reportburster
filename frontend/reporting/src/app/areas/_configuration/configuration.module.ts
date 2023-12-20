import { NgModule } from '@angular/core';

import { ButtonNativeSystemDialogModule } from '../../components/button-native-system-dialog/button-native-system-dialog.component.module';

import { LicenseModule } from '../../components/license/license.module';

import { ConfigurationComponent } from './configuration.component';
import { AppRoutingModule } from '../../app-routing.module';
import { ButtonHtmlPreviewComponent } from '../../components/button-html-preview/button-html-preview.component';

import { SharedModule } from '../../shared/shared.module';
import { EditorModule } from 'primeng/editor';
import { NgSelectModule } from '@ng-select/ng-select';

@NgModule({
  declarations: [ConfigurationComponent],
  exports: [ConfigurationComponent],
  imports: [
    EditorModule,
    NgSelectModule,
    AppRoutingModule,
    SharedModule,
    ButtonNativeSystemDialogModule,
    LicenseModule,
  ],
})
export class ConfigurationModule {}
