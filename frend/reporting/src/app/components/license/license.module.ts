import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';

import { LicenseComponent } from './license.component';
import { WhatsNewComponent } from './whats-new/whats-new.component';
import { MarkdownModule } from 'ngx-markdown';

@NgModule({
  imports: [SharedModule, MarkdownModule.forRoot()],
  declarations: [LicenseComponent, WhatsNewComponent],
  exports: [LicenseComponent],
})
export class LicenseModule {}
