import { Component } from '@angular/core';

import { chocolateyTemplate } from './chocolatey.template';
import { ConfirmService } from '../../../components/dialog-confirm/confirm.service';
import { ElectronService } from '../../../core/services/electron/electron.service';
import { StateStoreService } from '../../../providers/state-store.service';

@Component({
  selector: 'dburst-chocolatey',
  template: ` ${chocolateyTemplate} `,
})
export class ChocolateyComponent {
  constructor(
    protected storeService: StateStoreService,
    protected electronService: ElectronService,
    protected confirmService: ConfirmService,
  ) {
    //console.log(
    //  `isChocoOk = ${this.storeService.configSys.sysInfo.setup.chocolatey.isChocoOk}`,
    //);
  }

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
