import { Component, Input, OnInit } from '@angular/core';
import { SettingsService } from '../../../providers/settings.service';
import { UpdateInfo } from '../updater';

import { whenUpdatingTemplate } from './when-updating.template';

@Component({
  selector: 'dburst-when-updating',
  template: ` ${whenUpdatingTemplate} `,
})
export class WhenUpdatingComponent {
  //@Input() ctx: string = 'updatenow';
  @Input() ctx: string = 'migratecopy';

  @Input() updateInfo: UpdateInfo;

  constructor() {
    console.log(`updateInfo = ${this.updateInfo}`);
  }
}
