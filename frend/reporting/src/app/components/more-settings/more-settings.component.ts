import { Component, DestroyRef, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { ConfigurationRepository } from '../../providers/configuration-repository.service';
import { ToastrMessagesService } from '../../providers/toastr-messages.service';
import { StateStoreService } from '../../providers/state-store.service';

@Component({
  selector: 'dburst-more-settings',
  templateUrl: './more-settings.template.html',
  standalone: true,
  imports: [FormsModule],
})
export class MoreSettingsComponent {
  onCopilotUrlChanged = new Subject<string>();
  onAppsUrlChanged = new Subject<string>();

  aiChatOptions = [
    { name: 'ChatGPT', url: 'https://chatgpt.com/' },
    { name: 'Microsoft Copilot', url: 'https://copilot.microsoft.com/' },
    { name: 'Z.ai (GLM model)', url: 'https://chat.z.ai/' },
  ];

  /** The option whose "Use this" waits for its Yes / No. */
  confirmingAiChatUrl: string | null = null;

  private destroyRef = inject(DestroyRef);

  constructor(
    protected settingsService: ConfigurationRepository,
    protected storeService: StateStoreService,
    protected messagesService: ToastrMessagesService,
  ) {
    this.onCopilotUrlChanged.pipe(
      debounceTime(400),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(async (newUrl) => {
      this.settingsService.xmlInternalSettings.documentburster.settings.copiloturl = newUrl;
      await this.settingsService.savePreferences(this.settingsService.xmlInternalSettings);
      this.messagesService.showInfo('AI Assistant URL saved');
    });
    this.onAppsUrlChanged.pipe(
      debounceTime(400),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(async (newUrl) => {
      this.settingsService.xmlInternalSettings.documentburster.settings.appsurl = newUrl;
      await this.settingsService.savePreferences(this.settingsService.xmlInternalSettings);
      this.messagesService.showInfo('Apps URL saved');
    });
  }

  async show() {
    // The dialog shows what the server holds, not what this page started with. The browser build
    // never loads the preferences at startup (they need a signed-in user), so without this the
    // Samples box opens unticked while the lists are already showing the samples.
    try {
      this.settingsService.xmlInternalSettings.documentburster =
        await this.settingsService.loadPreferences();
    } catch (e) {
      console.warn('[MoreSettings] Failed to load preferences:', e);
    }
    (document.getElementById('moreSettingsModal') as HTMLDialogElement)?.showModal();
  }

  close() {
    (document.getElementById('moreSettingsModal') as HTMLDialogElement)?.close();
  }

  onDialogClick(_event: MouseEvent) {
    this.close();
  }

  async onShowSamplesChanged(checked: boolean) {
    if (!this.storeService.configSys.sysInfo.setup.java.isJavaOk) {
      alert('To use DataPallas, Java 17 (or newer) must be installed on your computer.');
      return;
    }
    this.settingsService.xmlInternalSettings.documentburster =
      await this.settingsService.loadPreferences();
    this.settingsService.xmlInternalSettings.documentburster.settings.showsamples = checked;
    await this.settingsService.savePreferences(this.settingsService.xmlInternalSettings);
    this.messagesService.showInfo(
      checked
        ? 'Sample connections, reports & cubes are now visible'
        : 'Samples are now hidden',
    );
  }

  isCurrentAiChat(url: string): boolean {
    const current: string = this.settingsService.xmlInternalSettings?.documentburster?.settings?.copiloturl || '';
    return current.replace(/\/+$/, '') === url.replace(/\/+$/, '');
  }

  async useAiChat(url: string) {
    this.confirmingAiChatUrl = null;
    this.settingsService.xmlInternalSettings.documentburster.settings.copiloturl = url;
    await this.settingsService.savePreferences(this.settingsService.xmlInternalSettings);
    this.messagesService.showInfo('AI Assistant URL saved');
  }
}
