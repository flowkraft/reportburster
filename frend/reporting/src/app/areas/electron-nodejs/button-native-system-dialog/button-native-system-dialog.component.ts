import { Component, Input, Output, EventEmitter } from '@angular/core';
import { RbElectronService } from '../electron.service';
import UtilitiesNodeJs from '../utilities-nodejs';

@Component({
  selector: 'dburst-button-native-system-dialog',
  templateUrl: './button-native-system-dialog.component.html',
})
export class ButtonNativeSystemDialogComponent {
  @Input() btnId: string;
  @Input() style: string;

  @Input() value: string;
  @Input() screen: string;

  @Input() saveDialog: string;

  @Input() defaultPath: string;

  @Input() dialogType: string;
  @Input() dialogTitle: string;

  @Output() pathsSelected: EventEmitter<any> = new EventEmitter();

  constructor(protected rbElectronService: RbElectronService) {}

  async onClick() {
    let options: any;

    if (!this.saveDialog) {
      options = {
        title:
          this.dialogTitle ||
          'Select ' + (this.dialogType === 'folder' ? 'Folder' : 'File'),
        defaultPath: this.defaultPath || 'C:/ReportBurster',
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

    if (this.rbElectronService.RUNNING_IN_E2E) {
      this.pathsSelected.emit('');
    } else {
      let paths: string[];
      if (this.saveDialog) {
        paths[0] = (
          await this.rbElectronService.dialog.showSaveDialog(options)
        ).filePath;
        this.pathsSelected.emit(paths[0]);
      } else {
        if (this.screen === 'letmeupdate') {
          let defaultFolderPath = 'C:/DocumentBurster';

          let defaultFolderPathExists =
            await UtilitiesNodeJs.existsAsync(defaultFolderPath);

          if ((defaultFolderPathExists = !'dir')) {
            defaultFolderPath = 'C:/ReportBurster';

            defaultFolderPathExists =
              await UtilitiesNodeJs.existsAsync(defaultFolderPath);
          }

          if ((defaultFolderPathExists = !'dir'))
            defaultFolderPath = this.rbElectronService.PORTABLE_EXECUTABLE_DIR;

          options.defaultPath = defaultFolderPath;
          options.title =
            'Select the installation/location path from where you want to migrate your existing configuration values and data. The selected folder should contain the DocumentBurster.exe/ReportBurster.exe file';
        }

        //console.log(`options = ${JSON.stringify(options)}`);

        paths = (await this.rbElectronService.dialog.showOpenDialog(options))
          .filePaths;
        if (this.dialogType === 'files') this.pathsSelected.emit(paths);
        else this.pathsSelected.emit(paths[0]);
      }
    }
  }
}
