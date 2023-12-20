import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ElectronService } from '../../core/services';

@Component({
  selector: 'dburst-button-native-system-dialog',
  templateUrl: './button-native-system-dialog.component.html',
})
export class ButtonNativeSystemDialogComponent {
  @Input() btnId: string;
  @Input() style: string;

  @Input() value: string;
  @Input() saveDialog: string;

  @Input() defaultPath: string;

  @Input() dialogType: string;
  @Input() dialogTitle: string;

  @Output() pathsSelected: EventEmitter<any> = new EventEmitter();

  constructor(protected electronService: ElectronService) {}

  async onClick() {
    let options: any;

    if (!this.saveDialog) {
      options = {
        title:
          this.dialogTitle ||
          'Select ' + (this.dialogType === 'folder' ? 'Folder' : 'File'),
        defaultPath: this.defaultPath || 'C:/Users/username/Desktop/test/',
        buttonLabel: this.value,
        properties: [
          this.dialogType === 'folder' ? 'openDirectory' : 'openFile',
          this.dialogType === 'files' ? 'multiSelections' : null,
        ],
      };
    } else {
      options = {
        title:
          this.dialogTitle ||
          'Select ' + (this.dialogType === 'folder' ? 'Folder' : 'File'),
        defaultPath: this.defaultPath || 'C:/Users/username/Desktop/test/',
        buttonLabel: this.value,
      };
    }

    /*
    console.log(
      `this.electronService.PORTABLE_EXECUTABLE_DIR: ${this.electronService.PORTABLE_EXECUTABLE_DIR}`
    );

    console.log(
      `this.electronService.SHOULD_SEND_STATS: ${this.electronService.SHOULD_SEND_STATS}`
    );

    console.log(
      `this.electronService.RUNNING_IN_E2E: ${this.electronService.RUNNING_IN_E2E}`
    );
     */

    if (this.electronService.RUNNING_IN_E2E) {
      this.pathsSelected.emit('');
    } else {
      let paths: string[];
      if (this.saveDialog) {
        paths[0] = (
          await this.electronService.dialog.showSaveDialog(options)
        ).filePath;
        this.pathsSelected.emit(paths[0]);
      } else {
        paths = (await this.electronService.dialog.showOpenDialog(options))
          .filePaths;
        if (this.dialogType === 'files') {
          this.pathsSelected.emit(paths);
        } else {
          this.pathsSelected.emit(paths[0]);
        }
      }
    }
  }
}
