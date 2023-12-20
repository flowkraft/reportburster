import { Component } from '@angular/core';

import { javaTemplate } from './java.template';

import { BashService } from '../bash.service';
import { ConfirmService } from '../../../components/dialog-confirm/confirm.service';

@Component({
  selector: 'dburst-java',
  template: ` ${javaTemplate} `,
})
export class JavaComponent {
  constructor(
    protected bashService: BashService,
    protected confirmService: ConfirmService
  ) {}

  restartApp() {
    this.confirmService.askConfirmation({
      message: 'Are you sure that you want to perform this action?',
      confirmAction: () => {
        this.bashService.restartElectronApp();
      },
    });
  }

  //DocumentBurster Server Windows Services requires Java32 bit => by default DocumentBurster will install Java8 32bit
  installJava() {
    this.confirmService.askConfirmation({
      message: 'Are you sure that you want to perform this action?',
      confirmAction: () => {
        this.bashService.typeCommandOnTerminalAndThenPressEnter(
          'choco install jre8 -PackageParameters "/exclude:64" --yes'
        );
      },
    });
  }

  unInstallJava() {
    this.confirmService.askConfirmation({
      message: 'Are you sure that you want to perform this action?',
      confirmAction: () => {
        this.bashService.typeCommandOnTerminalAndThenPressEnter(
          'choco uninstall jre8 --yes'
        );
      },
    });
  }
}
