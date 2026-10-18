import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ApiService } from './api.service';
import { DP_DEFAULT_THEME } from '../shared/theme-defaults';

@Injectable({
  providedIn: 'root',
})
export class PreferencesService {
  xmlInternalSettings = {
    documentburster: {
      settings: {
        theme: DP_DEFAULT_THEME,
        // Must match config/_internal/settings.xml, '/api' included. The packaged desktop app reads
        // backendurl from that file to find its own backend, and this default is what gets marshalled
        // back into it when a preferences load failed — dropping the suffix here sends every request
        // to a path that does not exist, which answers 401 for the entire application and leaves no
        // login screen to recover through.
        backendurl: 'http://localhost:9090/api',
        copiloturl: 'https://chatgpt.com/',
        appsurl: 'http://localhost:{port}',
        showsamples: false,
      },
    },
  };

  // Emits whenever the showsamples preference changes.
  // CRUD list views (Connections, Reports, Cube Definitions) subscribe and reload.
  // Decision Log: BehaviorSubject over Angular Signals — Signals require zone-less change
  // detection (Angular 17+ provideExperimentalZonelessChangeDetection). Migration deferred
  // to Phase A3+; do not pre-empt it here.
  showSamples$ = new BehaviorSubject<boolean>(false);

  get showSamples(): boolean {
    const v: any = this.xmlInternalSettings?.documentburster?.settings?.showsamples;
    // Robust to both boolean and string XML representations
    return v === true || v === 'true';
  }

  public apiService = inject(ApiService);

  private loaded = false;

  async loadPreferences(): Promise<any> {
    const loaded = await this.apiService.get('/system/preferences');
    this.loaded = true;
    // Defensive default: if the loaded XML doesn't have the new field, it's false
    if (loaded?.settings && loaded.settings.showsamples === undefined) {
      loaded.settings.showsamples = false;
    }
    // Sync the BehaviorSubject with the loaded value (robust to bool/string)
    // Only when it changed: the list views reload on every emission.
    const v = loaded?.settings?.showsamples === true || loaded?.settings?.showsamples === 'true';
    if (v !== this.showSamples$.value) this.showSamples$.next(v);
    return loaded;
  }

  async savePreferences(
    xmlSettings: { documentburster: {} },
  ): Promise<any> {
    const result = await this.apiService.put(
      '/system/preferences',
      xmlSettings.documentburster,
    );
    // Notify subscribers (CRUD list views) that the preference may have changed
    this.showSamples$.next(this.showSamples);
    return result;
  }

  getCopilotUrl(): string {
    return (
      this.xmlInternalSettings?.documentburster?.settings?.copiloturl ||
      'https://copilot.microsoft.com'
    );
  }

  /**
   * An app's address as the viewer's browser reaches it. The apps are written
   * `http://localhost:<port>`, right when the browser runs on the DataPallas machine; the Apps URL
   * preference (`http://localhost:{port}` by default) says where they are for everyone else.
   */
  appUrl(url: string): string {
    const pattern: string = this.xmlInternalSettings?.documentburster?.settings?.appsurl;
    if (!url || !pattern?.includes('{port}')) return url;
    return url.replace(/^http:\/\/localhost:(\d+)/, (_m, port) =>
      pattern.replace(/\/+$/, '').replace('{port}', port),
    );
  }

  /**
   * The browser build cannot load the preferences at startup (they need a signed-in user), and
   * the app links follow the saved Apps URL: a page with app links loads them if nobody has.
   */
  async ensurePreferencesLoaded(): Promise<void> {
    if (this.loaded) return;
    try {
      this.xmlInternalSettings.documentburster = await this.loadPreferences();
    } catch (e) {
      console.warn('[PreferencesService] Failed to load preferences:', e);
    }
  }
}
