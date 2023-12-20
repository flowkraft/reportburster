import { NgModule } from '@angular/core';
import { MarkdownModule } from 'ngx-markdown';
import { SharedModule } from '../../../shared/shared.module';

import { WhatsNewComponent } from './whats-new.component';

@NgModule({
  imports: [SharedModule, MarkdownModule.forRoot()],
  declarations: [WhatsNewComponent],
  exports: [WhatsNewComponent],
})
export class WhatsNewModule {}
