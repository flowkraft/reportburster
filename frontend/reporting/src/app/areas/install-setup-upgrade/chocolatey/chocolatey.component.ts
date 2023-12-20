import { Component } from '@angular/core';

import { chocolateyTemplate } from './chocolatey.template';
import { BashService } from '../bash.service';
import { ConfirmService } from '../../../components/dialog-confirm/confirm.service';

@Component({
  selector: 'dburst-chocolatey',
  template: ` ${chocolateyTemplate} `,
})
export class ChocolateyComponent {
  constructor(
    protected bashService: BashService,
    protected confirmService: ConfirmService
  ) {}

  installChocolatey() {
    this.confirmService.askConfirmation({
      message: 'Are you sure that you want to perform this action?',
      confirmAction: () => {
        this.bashService.typeCommandOnTerminalAndThenPressEnter(
          'install chocolatey'
        );
      },
    });
  }

  unInstallChocolatey() {
    this.confirmService.askConfirmation({
      message: 'Are you sure that you want to perform this action?',
      confirmAction: () => {
        this.bashService.typeCommandOnTerminalAndThenPressEnter(
          'uninstall chocolatey'
        );
      },
    });
  }
}
