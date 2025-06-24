import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

import { LicenseModule } from '../../components/license/license.module';

import { AppRoutingModule } from '../../app-routing.module';

import { SharedModule } from '../../shared/shared.module';
import { EditorModule } from 'primeng/editor';
import { NgSelectModule } from '@ng-select/ng-select';
import { ConfigurationComponent } from './configuration.component';
import { AngularSplitModule } from 'angular-split';
import { CarouselModule } from 'primeng/carousel';
import { ScaleIframeDirective } from '../../helpers/scale-iframe';
import { MarkdownModule } from 'ngx-markdown';
import { ConnectionDetailsModule } from '../../components/connection-details/connection-details.module';
import { AiCopilotModule } from '../../components/ai-copilot/ai-copilot.module';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [ConfigurationComponent, ScaleIframeDirective],
  exports: [ConfigurationComponent],
  imports: [
    SharedModule,
    EditorModule,
    NgSelectModule,
    AppRoutingModule,
    LicenseModule,
    AiCopilotModule,
    ConnectionDetailsModule,
    AngularSplitModule,
    CarouselModule,
    MarkdownModule.forRoot(),
  ],
})
export class ConfigurationModule {}
