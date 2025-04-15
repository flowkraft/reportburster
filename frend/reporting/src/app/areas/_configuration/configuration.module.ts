import { NgModule } from '@angular/core';

import { LicenseModule } from '../../components/license/license.module';

import { AppRoutingModule } from '../../app-routing.module';

import { SharedModule } from '../../shared/shared.module';
import { EditorModule } from 'primeng/editor';
import { NgSelectModule } from '@ng-select/ng-select';
import { ConfigurationComponent } from './configuration.component';
import { NgxCodeJarComponent } from 'ngx-codejar';
import { AngularSplitModule } from 'angular-split';
import { CarouselModule } from 'primeng/carousel';
import { ScaleIframeDirective } from '../../helpers/scale-iframe';
import { MarkdownModule } from 'ngx-markdown';

@NgModule({
  declarations: [ConfigurationComponent, ScaleIframeDirective],
  exports: [ConfigurationComponent],
  imports: [
    EditorModule,
    NgSelectModule,
    AppRoutingModule,
    SharedModule,
    LicenseModule,
    NgxCodeJarComponent,
    AngularSplitModule,
    CarouselModule,
    MarkdownModule.forRoot(),
  ],
})
export class ConfigurationModule {}
