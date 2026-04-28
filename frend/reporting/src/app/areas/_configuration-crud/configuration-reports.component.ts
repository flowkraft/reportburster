import { Component, OnInit } from '@angular/core';

import { tabsTemplate } from './templates/reports/_tabs';
import { tabConfigurationTemplatesTemplate } from './templates/reports/tab-conf-templates';
import { tabLicenseTemplate } from './templates/reports/tab-license';

import { SettingsService } from '../../providers/settings.service';

@Component({
  selector: 'dburst-configuration-reports',
  template: /*html*/ `
    <div>${tabsTemplate}</div>
    ${tabConfigurationTemplatesTemplate}
    ${tabLicenseTemplate}
  `,
})
export class ConfigurationReportsComponent implements OnInit {
  constructor(protected settingsService: SettingsService) {}

  async ngOnInit() {
    this.settingsService.currentConfigurationTemplateName = '';
    this.settingsService.currentConfigurationTemplatePath = '';
  }
}
