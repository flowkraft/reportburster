import { OnInit, Component } from '@angular/core';
import { SettingsService } from '../../providers/settings.service';

@Component({
  selector: 'dburst-skins',
  templateUrl: './skins.template.html',
})
export class SkinsComponent implements OnInit {
  ALL_SKINS = [
    'skin-blue',
    'skin-blue-light',
    'skin-yellow',
    'skin-yellow-light',
    'skin-green',
    'skin-green-light',
    'skin-purple',
    'skin-purple-light',
    'skin-red',
    'skin-red-light',
    'skin-black',
    'skin-black-light',
  ];

  bodyElement = document.getElementsByTagName('body')[0];

  constructor(protected settingsService: SettingsService) {}

  async ngOnInit() {
    this.settingsService.xmlInternalSettings =
      await this.settingsService.loadPreferencesFileAsync(
        this.settingsService.INTERNAL_SETTINGS_FILE_PATH
      );

    let skin =
      this.settingsService.xmlInternalSettings.documentburster.settings.skin;

    if (!skin) skin = 'skin-blue';

    this.applySkin(skin);
  }

  async changeSkin(skin: string) {
    this.applySkin(skin);

    await this.saveSkin(skin);
  }

  applySkin(skin: string) {
    if (skin) {
      for (let eachSkin of this.ALL_SKINS) {
        setTimeout(() => {
          this.bodyElement.classList.remove(eachSkin);
        });
      }

      setTimeout(() => {
        this.bodyElement.classList.add(skin);
      });
    }
  }

  async saveSkin(newSkin: string) {
    this.settingsService.xmlInternalSettings =
      await this.settingsService.loadPreferencesFileAsync(
        this.settingsService.INTERNAL_SETTINGS_FILE_PATH
      );

    this.settingsService.xmlInternalSettings.documentburster.settings.skin =
      newSkin;

    await this.settingsService.saveSettingsFileAsync(
      this.settingsService.xmlInternalSettings,
      this.settingsService.INTERNAL_SETTINGS_FILE_PATH
    );
  }
}
