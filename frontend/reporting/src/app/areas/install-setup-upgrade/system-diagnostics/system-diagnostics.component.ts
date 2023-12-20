import { Component } from '@angular/core';

import { systemDiagnosticsTemplate } from './system-diagnostics.template';
import { BashService } from '../bash.service';
import { SettingsService } from '../../../providers/settings.service';
import { ConfirmService } from '../../../components/dialog-confirm/confirm.service';

@Component({
  selector: 'dburst-system-diagnostics',
  template: ` ${systemDiagnosticsTemplate} `,
})
export class SystemDiagnosticsComponent {
  constructor(
    protected bashService: BashService,
    protected settingsService: SettingsService,

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
}
