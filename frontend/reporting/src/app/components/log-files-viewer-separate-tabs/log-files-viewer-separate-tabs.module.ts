import { NgModule } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { LogFileViewerModule } from '../log-file-viewer/log-file-viewer.module';

import { LogFilesViewerSeparateTabsComponent } from './log-files-viewer-separate-tabs.component';

@NgModule({
  declarations: [LogFilesViewerSeparateTabsComponent],
  exports: [LogFilesViewerSeparateTabsComponent],
  imports: [LogFileViewerModule, TabsModule.forRoot(), TranslateModule],
})
export class LogFilesViewerSeparateTabsModule {}
