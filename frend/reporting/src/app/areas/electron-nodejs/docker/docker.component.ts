import { Component } from '@angular/core';

import { dockerTemplate } from './docker.template';

import { ConfirmService } from '../../../components/dialog-confirm/confirm.service';
import { RbElectronService } from '../electron.service';
import { StateStoreService } from '../../../providers/state-store.service';

@Component({
  selector: 'dburst-docker',
  template: ` ${dockerTemplate} `,
})
export class DockerComponent {
  constructor(
    protected electronService: RbElectronService,
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

  installDocker() {
    this.confirmService.askConfirmation({
      message: 'Are you sure that you want to perform this action?',
      confirmAction: () => {
        this.electronService.typeCommandOnTerminalAndThenPressEnter(
          'choco install docker-desktop --yes',
        );
      },
    });
  }

  unInstallDocker() {
    this.confirmService.askConfirmation({
      message: 'Are you sure that you want to perform this action?',
      confirmAction: () => {
        this.electronService.typeCommandOnTerminalAndThenPressEnter(
          'choco uninstall docker-desktop --yes',
        );
      },
    });
  }
}
