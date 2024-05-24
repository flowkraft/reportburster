import { Component, OnInit } from '@angular/core';
import { LicenseService } from '../../providers/license.service';
import { AskForFeatureService } from '../../components/ask-for-feature/ask-for-feature.service';
import { SamplesService } from '../../providers/samples.service';
import { SettingsService } from '../../providers/settings.service';
import Utilities from '../../helpers/utilities';
import { StateStoreService } from '../../providers/state-store.service';

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
    protected storeService: StateStoreService,
  ) {}

  async ngOnInit() {
    if (!this.storeService.configSys.sysInfo.setup.java.isJavaOk) {
      //alert(
      //  'To use ReportBurster, Java 11 (or newer) must be installed on your computer.',
      //);
      return;
    }

    //console.log('TopMenuHeaderComponent');
    await this.settingsService.loadAllConnectionFilesAsync();

    this.settingsService.configurationFiles =
      await this.settingsService.loadAllSettingsFilesAsync();

    await this.samplesService.fillSamplesNotes();
  }

  onAskForFeatureModalShow() {
    if (!this.storeService.configSys.sysInfo.setup.java.isJavaOk) {
      alert(
        'To use ReportBurster, Java 11 (or newer) must be installed on your computer.',
      );
      return;
    }

    this.askForFeatureService.showAskForFeature({});
  }

  isRunningInsideElectron(): boolean {
    return Utilities.isRunningInsideElectron();
  }
}
