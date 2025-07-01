import { NgModule } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { FileExplorerComponent } from './file-explorer.component';
import { SharedModule } from '../../shared/shared.module';
import { FileExplorerDialogComponent } from './file-explorer-dialog.component';

@NgModule({
  declarations: [FileExplorerComponent, FileExplorerDialogComponent],
  exports: [FileExplorerComponent, FileExplorerDialogComponent],
  imports: [SharedModule, TranslateModule],
})
export class FileExplorerModule {}
