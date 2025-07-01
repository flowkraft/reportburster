import { Component } from '@angular/core';

import { systemDiagnosticsTemplate } from './system-diagnostics.template';
import { ConfirmService } from '../../../components/dialog-confirm/confirm.service';
import { SettingsService } from '../../../providers/settings.service';
import { RbElectronService } from '../electron.service';
import { StateStoreService } from '../../../providers/state-store.service';

@Component({
  selector: 'dburst-system-diagnostics',
  template: ` ${systemDiagnosticsTemplate} `,
})
export class SystemDiagnosticsComponent {
  constructor(
    //protected electronService: ElectronService,
    protected stateStore: StateStoreService,
    protected settingsService: SettingsService,
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
}
