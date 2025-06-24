import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared.module';
import { StatusBarComponent } from './status-bar.component';
import { ProgressbarModule } from 'ngx-bootstrap/progressbar';

@NgModule({
  declarations: [StatusBarComponent],
  exports: [StatusBarComponent],
  imports: [SharedModule, ProgressbarModule],
})
export class StatusBarModule {}
