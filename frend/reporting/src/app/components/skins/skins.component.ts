import { OnInit, Component } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import { SettingsService } from '../../providers/settings.service';
import { StateStoreService } from '../../providers/state-store.service';
import { ToastrMessagesService } from '../../providers/toastr-messages.service';

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

  private internalSettingsChangedSub?: Subscription;
  protected onInternalSettingsChanged = new Subject<string>();
  
  constructor(
    protected settingsService: SettingsService,
    protected storeService: StateStoreService,
    protected messagesService: ToastrMessagesService
  ) {}

  async ngOnInit() {
    this.settingsService.xmlInternalSettings.documentburster =
      await this.settingsService.loadPreferencesFileAsync(
        this.settingsService.INTERNAL_SETTINGS_FILE_PATH,
      );

   // Debounced save for Copilot URL
    this.internalSettingsChangedSub = this.onInternalSettingsChanged.pipe(debounceTime(400)).subscribe(async (newUrl) => {
      this.settingsService.xmlInternalSettings.documentburster.settings.copiloturl = newUrl;
      await this.settingsService.savePreferencesFileAsync(
        this.settingsService.INTERNAL_SETTINGS_FILE_PATH,
        this.settingsService.xmlInternalSettings,
      );
      this.messagesService.showInfo('Copilot/LLM URL saved');
    });   

    //console.log(
    //  `this.settingsService.xmlInternalSettings = ${JSON.stringify(
    //    this.settingsService.xmlInternalSettings
    //  )}`
    //);
    if (!this.settingsService.xmlInternalSettings.documentburster) return;

    let skin =
      this.settingsService.xmlInternalSettings.documentburster.settings.skin;

    if (!skin) skin = 'skin-black';

    this.applySkin(skin);
  }

  ngOnDestroy() {
    this.internalSettingsChangedSub?.unsubscribe();
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
    if (!this.storeService.configSys.sysInfo.setup.java.isJavaOk) {
      alert(
        'To use ReportBurster, Java 17 (or newer) must be installed on your computer.',
      );
      return;
    }

    this.settingsService.xmlInternalSettings.documentburster =
      await this.settingsService.loadPreferencesFileAsync(
        this.settingsService.INTERNAL_SETTINGS_FILE_PATH,
      );

    this.settingsService.xmlInternalSettings.documentburster.settings.skin =
      newSkin;

    await this.settingsService.savePreferencesFileAsync(
      this.settingsService.INTERNAL_SETTINGS_FILE_PATH,
      this.settingsService.xmlInternalSettings,
    );
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    this.messagesService.showInfo('URL copied to clipboard!');
  }
}
