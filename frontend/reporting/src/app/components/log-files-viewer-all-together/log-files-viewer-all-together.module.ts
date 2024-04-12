import { NgModule } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { LogFilesViewerAllTogetherComponent } from './log-files-viewer-all-together.component';
import { LogFileViewerModule } from '../log-file-viewer/log-file-viewer.module';

@NgModule({
  declarations: [LogFilesViewerAllTogetherComponent],
  exports: [LogFilesViewerAllTogetherComponent],
  imports: [LogFileViewerModule, TranslateModule],
})
export class LogFilesViewerAllTogetherModule {}
