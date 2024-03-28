import { Component } from '@angular/core';

import { javaTemplate } from './java.template';

import { ConfirmService } from '../../../components/dialog-confirm/confirm.service';
import { ElectronService } from '../../../core/services/electron/electron.service';

@Component({
  selector: 'dburst-java',
  template: ` ${javaTemplate} `,
})
export class JavaComponent {
  constructor(
    protected electronService: ElectronService,
    protected confirmService: ConfirmService,
  ) {}

  restartApp() {
    this.confirmService.askConfirmation({
      message: 'Are you sure that you want to perform this action?',
      confirmAction: () => {
        this.electronService.restartElectronApp();
      },
    });
  }

  //DocumentBurster Server Windows Services requires Java32 bit => by default DocumentBurster will install Java8 32bit
  installJava() {
    this.confirmService.askConfirmation({
      message: 'Are you sure that you want to perform this action?',
      confirmAction: () => {
        this.electronService.typeCommandOnTerminalAndThenPressEnter(
          'choco install jre8 -PackageParameters "/exclude:64" --yes',
        );
      },
    });
  }

  unInstallJava() {
    this.confirmService.askConfirmation({
      message: 'Are you sure that you want to perform this action?',
      confirmAction: () => {
        this.electronService.typeCommandOnTerminalAndThenPressEnter(
          'choco uninstall jre8 --yes',
        );
      },
    });
  }
}
