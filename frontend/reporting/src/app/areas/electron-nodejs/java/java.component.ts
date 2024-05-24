import { Component } from '@angular/core';

import { javaTemplate } from './java.template';

import { ConfirmService } from '../../../components/dialog-confirm/confirm.service';
import { ElectronService } from '../electron.service';
import { StateStoreService } from '../../../providers/state-store.service';

@Component({
  selector: 'dburst-java',
  template: ` ${javaTemplate} `,
})
export class JavaComponent {
  constructor(
    protected electronService: ElectronService,
    protected stateStore: StateStoreService,
    protected confirmService: ConfirmService,
  ) {}

  restartApp() {
    this.confirmService.askConfirmation({
      message: 'Are you sure that you want to perform this action?',
      confirmAction: () => {
        //this.electronService.restartElectronApp();
      },
    });
  }

  //by default DocumentBurster installs Java11
  installJava() {
    this.confirmService.askConfirmation({
      message: 'Are you sure that you want to perform this action?',
      confirmAction: () => {
        //this.electronService.typeCommandOnTerminalAndThenPressEnter(
        //  'choco install jre8 -PackageParameters "/exclude:64" --yes',
        //);
        this.electronService.typeCommandOnTerminalAndThenPressEnter(
          'choco install temurin11 --yes',
        );
      },
    });
  }

  unInstallJava() {
    this.confirmService.askConfirmation({
      message: 'Are you sure that you want to perform this action?',
      confirmAction: () => {
        this.electronService.typeCommandOnTerminalAndThenPressEnter(
          'choco uninstall temurin11 --yes',
        );
      },
    });
  }
}
