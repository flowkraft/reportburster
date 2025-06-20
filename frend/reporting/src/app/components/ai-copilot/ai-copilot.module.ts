import { NgModule } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { AiCopilotComponent } from './ai-copilot.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [AiCopilotComponent],
  exports: [AiCopilotComponent],
  imports: [SharedModule, TranslateModule],
})
export class AiCopilotModule {}
