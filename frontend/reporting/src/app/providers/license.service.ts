import { Injectable } from '@angular/core';

//import * as jetpack from 'fs-jetpack';
import * as xml2js from 'xml2js';

import { unserialize } from 'php-serialize';

import { Changelog, parser } from 'keep-a-changelog';

import * as semver from 'semver';

import { ShellService } from './shell.service';
import { SettingsService } from './settings.service';
import Utilities from '../helpers/utilities';
import { ElectronService } from '../core/services';
import SemVer from 'keep-a-changelog/types/deps/deno.land/x/semver@v1.4.0/mod';

@Injectable({
  providedIn: 'root',
})
export class LicenseService {
  protected licenseFilePath: string;

  licenseDetails: any;

  changeLogStr: string;
  changeLog: Changelog;

  latestVersion: semver.SemVer;
  isNewerVersionAvailable: boolean = false;

  constructor(
    protected settingsService: SettingsService,
    protected shellService: ShellService,
    protected electronService: ElectronService
  ) {
    this.licenseFilePath = Utilities.slash(
      `${this.settingsService.CONFIGURATION_FOLDER_PATH}/_internal/license.xml`
    );
  }

  async saveLicenseFileAsync() {
    const builder = new xml2js.Builder();

    return this.electronService.jetpack.writeAsync(
      this.licenseFilePath,
      builder.buildObject(this.licenseDetails)
    );
  }

  async loadLicenseFileAsync() {
    const content = await this.electronService.jetpack.readAsync(
      this.licenseFilePath
    );

    this.licenseDetails = await Utilities.parseStringPromise(content, {
      trim: true,
      explicitArray: false,
    });

    if (this.licenseDetails.license.latestversion) {
      this.latestVersion = this.licenseDetails.license.latestversion;
      this.changeLogStr = this.licenseDetails.license.changelog;
    } // if it is a demo installation
    else {
      const response = await this.getChangeLogForTheDemoInstallationToo();
      const bodyAsJson = await response.json();

      //console.log(`response.json: ${JSON.stringify(bodyAsJson)}`);

      this.latestVersion = bodyAsJson.new_version;

      const { changelog } = unserialize(bodyAsJson.sections, {
        description: String,
        changelog: String,
      });
      this.changeLogStr = changelog;
    }

    this.isNewerVersionAvailable = false;

    if (!this.settingsService.version)
      await this.settingsService.loadDefaultSettingsFileAsync();

    this.latestVersion = semver.coerce(this.latestVersion);
    this.settingsService.version = semver.coerce(this.settingsService.version);

    if (semver.gt(this.latestVersion, this.settingsService.version)) {
      this.isNewerVersionAvailable = true;
    }

    try {
      //the "Improved software changelog" keepachangelog format was implemented in
      //DocumentBurster v8.8.0
      this.changeLog = parser(this.changeLogStr);
    } catch {}
  }

  getChangeLogForTheDemoInstallationToo(): Promise<any> {
    return Utilities.httpGet(
      `https://store.reportburster.com?edd_action=get_version&item_name=${this.settingsService.product}`
    );
  }

  verifyLicense(action, exitCallback?) {
    this.shellService.runBatFile([action], 'license', exitCallback);
  }

  deActivateLicense(exitCallback?) {
    this.shellService.runBatFile(['-dl'], 'license', exitCallback);
  }
}
