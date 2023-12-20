import { NgModule } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { LogFilesViewerAllTogetherComponent } from './log-files-viewer-all-together.component';
import { ButtonNativeSystemDialogModule } from '../button-native-system-dialog/button-native-system-dialog.component.module';
import { CommonModule } from '@angular/common';
import { LogFileViewerModule } from '../log-file-viewer/log-file-viewer.module';
import { LogFileViewerComponent } from '../log-file-viewer/log-file-viewer.component';

@NgModule({
  declarations: [LogFilesViewerAllTogetherComponent],
  exports: [LogFilesViewerAllTogetherComponent],
  imports: [
    LogFileViewerModule,
    ButtonNativeSystemDialogModule,
    TranslateModule,
  ],
})
export class LogFilesViewerAllTogetherModule {}
