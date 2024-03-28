import { Component, OnInit } from '@angular/core';
import { LicenseService } from '../../providers/license.service';
import { AskForFeatureService } from '../../components/ask-for-feature/ask-for-feature.service';
import { SamplesService } from '../../providers/samples.service';
import { SettingsService } from '../../providers/settings.service';

@Component({
  selector: 'dburst-top-menu-header',
  templateUrl: './top-menu-header.template.html',
})
export class TopMenuHeaderComponent implements OnInit {
  constructor(
    protected settingsService: SettingsService,
    protected licenseService: LicenseService,
    protected askForFeatureService: AskForFeatureService,
    protected samplesService: SamplesService,
  ) {}

  async ngOnInit() {
    //console.log('TopMenuHeaderComponent');
    await this.settingsService.loadAllConnectionFilesAsync();

    this.settingsService.configurationFiles =
      await this.settingsService.loadAllSettingsFilesAsync();

    await this.samplesService.fillSamplesNotes();
  }

  onAskForFeatureModalShow() {
    this.askForFeatureService.showAskForFeature({});
  }
}
