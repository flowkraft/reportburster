import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { LogFileViewerComponent } from './log-file-viewer.component';

@NgModule({
  declarations: [LogFileViewerComponent],
  exports: [LogFileViewerComponent, CommonModule],
  imports: [CommonModule],
})
export class LogFileViewerModule {}
