import { Component } from '@angular/core';

import { chocolateyTemplate } from './chocolatey.template';
import { ConfirmService } from '../../../components/dialog-confirm/confirm.service';
import { ElectronService } from '../../../core/services/electron/electron.service';

@Component({
  selector: 'dburst-chocolatey',
  template: ` ${chocolateyTemplate} `,
})
export class ChocolateyComponent {
  constructor(
    protected electronService: ElectronService,
    protected confirmService: ConfirmService,
  ) {}

  installChocolatey() {
    this.confirmService.askConfirmation({
      message: 'Are you sure that you want to perform this action?',
      confirmAction: () => {
        this.electronService.typeCommandOnTerminalAndThenPressEnter(
          'install chocolatey',
        );
      },
    });
  }

  unInstallChocolatey() {
    this.confirmService.askConfirmation({
      message: 'Are you sure that you want to perform this action?',
      confirmAction: () => {
        this.electronService.typeCommandOnTerminalAndThenPressEnter(
          'uninstall chocolatey',
        );
      },
    });
  }
}
