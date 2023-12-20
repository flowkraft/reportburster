import { NgModule } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { ButtonClearLogsComponent } from './button-clear-logs.component';

@NgModule({
  declarations: [ButtonClearLogsComponent],
  exports: [ButtonClearLogsComponent],
  imports: [TranslateModule]
})
export class ButtonClearLogsModule {}
