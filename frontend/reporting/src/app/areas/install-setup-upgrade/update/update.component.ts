import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';

//import * as jetpack from 'fs-jetpack';
//import * as slash from 'slash';

//import * as path from 'path';

import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
dayjs.extend(utc);

//import * as semver from 'semver';

import { updateTemplate } from './update.template';

import { UpdateInfo, Updater } from '../updater';

import Utilities from '../../../helpers/utilities';
import { SettingsService } from '../../../providers/settings.service';
import { LicenseService } from '../../../providers/license.service';
import { ExecutionStatsService } from '../../../providers/execution-stats.service';
import { ToastrMessagesService } from '../../../providers/toastr-messages.service';
import { ShellService } from '../../../providers/shell.service';
import { ElectronService } from '../../../core/services';
import { UsageDetails } from '../../../model/usage-details';
import { ConfirmService } from '../../../components/dialog-confirm/confirm.service';
import { BashService } from '../bash.service';

@Component({
  selector: 'dburst-update',
  template: ` ${updateTemplate} `,
})
export class UpdateComponent implements OnInit {
  homeDirectoryPath: string;

  letMeUpdateManually: false;
  letMeUpdateSourceDirectoryPath: string;

  updateInfo = new UpdateInfo();
  updater: Updater;

  @Input() succint: boolean = false;

  constructor(
    protected settingsService: SettingsService,
    protected licenseService: LicenseService,
    protected executionStatsService: ExecutionStatsService,
    protected confirmService: ConfirmService,
    protected messagesService: ToastrMessagesService,
    protected shellService: ShellService,
    protected bashService: BashService,
    protected electronService: ElectronService
  ) {
    this.homeDirectoryPath = Utilities.slash(
      this.electronService.path.resolve(
        this.electronService.PORTABLE_EXECUTABLE_DIR
      )
    );
    this.updater = new Updater(
      this.homeDirectoryPath,
      this.electronService.jetpack,
      this.electronService.fs,
      this.electronService.log
    );
  }

  async ngOnInit(): Promise<void> {
    this.updateInfo.updateSourceDirectoryPath = Utilities.slash(
      this.electronService.path.resolve(
        this.electronService.PORTABLE_EXECUTABLE_DIR
      )
    );

    await this.settingsService.loadDefaultSettingsFileAsync();

    this.updateInfo.productInfo.product = this.settingsService.product;

    this.updateInfo.productInfo.version = this.settingsService.version;
    this.updateInfo.productInfo.isServerVersion =
      this.settingsService.isServerVersion;
    this.updateInfo.productInfo.isWindows = this.settingsService.isWindows;

    await this.licenseService.loadLicenseFileAsync();

    this.updateInfo.licenseInfo.latestVersion =
      this.licenseService.licenseDetails?.license.latestversion;

    this.updateInfo.licenseInfo.key =
      this.licenseService.licenseDetails?.license.key;
    this.updateInfo.licenseInfo.customeremail =
      this.licenseService.licenseDetails?.license.customeremail;
    this.updateInfo.licenseInfo.status =
      this.licenseService.licenseDetails?.license.status;
  }

  async onExistingInstallationFolderSelected(
    oldInstallationFolderPath: string
  ) {
    if (oldInstallationFolderPath) {
      this.updateInfo.errorMsg = '';
      this.updateInfo.mode = 'migrate-copy';

      this.letMeUpdateSourceDirectoryPath = Utilities.slash(
        this.electronService.path.resolve(oldInstallationFolderPath)
      );
      this.updateInfo.updateSourceDirectoryPath =
        this.letMeUpdateSourceDirectoryPath;

      this.updateInfo = await this.updater.fillUpdateInfo(this.updateInfo);
    }
  }

  async handleUpdateNow() {
    const dialogQuestion =
      'The update will take a few minutes, grab a glass of water and wait patiently until it is done.';

    this.confirmService.askConfirmation({
      confirmLabel: "OK, I'll wait for the update to finish.",
      message: dialogQuestion,
      confirmAction: async () => {
        this.updateInfo.mode = 'update-now';
        await this.doUpdate();
      },
    });
  }

  async handleMigrateCopyAboveFiles() {
    const dialogQuestion =
      'All the existing configuration files (i.e. settings.xml) and scripts could be overridden, are you sure you want to continue? The update will take some time, please wait patiently until it is done.';

    this.confirmService.askConfirmation({
      message: dialogQuestion,
      confirmAction: async () => {
        this.updateInfo.mode = 'migrate-copy';
        await this.doUpdate();

        await this.licenseService.loadLicenseFileAsync();

        if (this.licenseService.licenseDetails.license.key)
          this.licenseService.verifyLicense('-cl');

        this.settingsService.configurationFiles =
          await this.settingsService.loadAllSettingsFilesAsync();

        await this.licenseService.loadLicenseFileAsync();

        this.letMeUpdateManually = false;
        this.letMeUpdateSourceDirectoryPath = '';

        this.updateInfo = new UpdateInfo();

        // this._changeDetectorRef.detectChanges();

        /*
          this.updateInfo.licenseInfo.key = this._licenseService.licenseDetails.license.key;
          this.updateInfo.licenseInfo.customeremail = this._licenseService.licenseDetails.license.customeremail;
          this.updateInfo.licenseInfo.status = this._licenseService.licenseDetails.license.status;

        */
      },
    });
  }

  /*
  async createJobFile(): Promise<string> {
    const filePath = `${this.electronService.PORTABLE_EXECUTABLE_DIR}/updating DocumentBurster, please wait`;
    const jobType = 'update';

    const jobFileName = Utilities.getRandomJobFileName();

    const jobFilePath = `${this.electronService.PORTABLE_EXECUTABLE_DIR}/temp/${jobFileName}`;
    const jobFileContent = Utilities.getJobFileContent(
      filePath,
      jobType,
      '14234234324324'
    );

    await this.electronService.jetpack.writeAsync(jobFilePath, jobFileContent);

    return Promise.resolve(
      Utilities.slash(this.electronService.path.resolve(jobFilePath))
    );
  }

  */

  async backupExistingConfiguration() {
    const nowFormatted = dayjs().utc().format('YYYY-MM-DD HH-mm-ss');

    // Creates directory if doesn't exist
    const backupFolderPath = `${this.electronService.PORTABLE_EXECUTABLE_DIR}/backup/config-files-before-updating/${this.settingsService.version}/${nowFormatted}`;
    await this.electronService.jetpack.dirAsync(backupFolderPath);

    await this.electronService.jetpack.copyAsync(
      `${this.electronService.PORTABLE_EXECUTABLE_DIR}`,
      backupFolderPath,
      { matching: ['config/**/*'], overwrite: true }
    );
    await this.electronService.jetpack.copyAsync(
      `${this.electronService.PORTABLE_EXECUTABLE_DIR}`,
      backupFolderPath,
      { matching: ['scripts/**/*'], overwrite: true }
    );
    await this.electronService.jetpack.copyAsync(
      `${this.electronService.PORTABLE_EXECUTABLE_DIR}`,
      backupFolderPath,
      { matching: ['templates/**/*'], overwrite: true }
    );
  }

  async doUpdate() {
    const start = this.electronService.clock();

    let updateError: Error = null;

    this.updateInfo.jobFilePath = await this.bashService.createJobFile(
      'update'
    );

    try {
      await this.electronService.jetpack.removeAsync(
        this.shellService.logFilePath
      );

      this.executionStatsService.jobStats.numberOfActiveUpdateJobs = 1;

      if (this.updateInfo.mode == 'migrate-copy')
        await this.backupExistingConfiguration();

      this.updateInfo = await this.updater.fillUpdateInfo(this.updateInfo);

      await this.updater.doUpdate(this.updateInfo);

      if (this.updateInfo.mode == 'update-now') {
        //START - REMOVE THIS AFTER FEW RELEASES (when the jar will be there)
        let updateJarExists = await this.electronService.jetpack.existsAsync(
          this.settingsService.UPDATE_JAR_FILE_PATH
        );
        if (!updateJarExists) {
          // console.log(`from: ${this._updater.upgdDbTempDirectoryPath}/from/DocumentBurster/lib/burst/${this.electronService.path.basename(this._settingsService.UPDATE_JAR_FILE_PATH)}, to: ${this.settingsService.UPDATE_JAR_FILE_PATH}`)
          await this.electronService.jetpack.copyAsync(
            `${
              this.updater.upgdDbTempDirectoryPath
            }/from/DocumentBurster/lib/burst/${this.electronService.path.basename(
              this.settingsService.UPDATE_JAR_FILE_PATH
            )}`,
            this.settingsService.UPDATE_JAR_FILE_PATH
          );
        }
        //END - REMOVE THIS AFTER FEW RELEASES (when the jar will be there)

        await this.licenseService.loadLicenseFileAsync();

        if (this.licenseService.licenseDetails.license.key)
          await this.licenseService.verifyLicense('-cl');

        await this.shellService.doKillOldExeThenCopyAndStartNewExe(
          this.updateInfo.jobFilePath,
          `${this.updater.updateDestinationDirectoryPath}/DocumentBurster.exe`,
          this.updater.upgdDbTempDirectoryPath
        );
      }

      this.messagesService.showInfo('Update Done!');
    } catch (e) {
      updateError = e;

      //console.log(`error doUpdate: ${e}`);

      this.electronService.log.error(updateError.stack);

      if (updateError.message.includes('zip'))
        this.messagesService.showError(
          "Ups, there was an update error. Please try to 'Update Now' again!"
        );
      else this.messagesService.showError('Update Error!');
    } finally {
      this.electronService.log.info(
        `Updater.updateDestinationDirectoryPath: ${this.updater.updateDestinationDirectoryPath}`
      );

      if (this.updateInfo.mode == 'update-now') {
        this.electronService.log.info(
          `Updater.upgdDbTempDirectoryPath: ${this.updater.upgdDbTempDirectoryPath}`
        );
        this.electronService.log.info(
          `Updater.backupZipFileName: ${this.updater.backupZipFileName}`
        );
      }

      this.electronService.log.info(
        `Updater.updateInfo: ${JSON.stringify(this.updateInfo)}`
      );

      const duration = this.electronService.clock(start)[0];

      this.electronService.log.info(
        `Updater.Duration: ${Math.round(duration / 1000)} seconds`
      );

      if (this.electronService.SHOULD_SEND_STATS)
        this.doStats(this.updateInfo, updateError, duration);

      this.executionStatsService.jobStats.numberOfActiveUpdateJobs = 0;

      this.letMeUpdateSourceDirectoryPath = null;
      this.letMeUpdateManually = false;

      return this.electronService.jetpack.removeAsync(
        this.updateInfo.jobFilePath
      );
    }
  }

  doStats(updateInfo: UpdateInfo, err: Error, executionTime) {
    let eventDetails = 'update';

    if (updateInfo.mode == 'update-now') eventDetails += '-now';
    else eventDetails += '-letme';

    if (this.settingsService.isServerVersion) eventDetails += '-dbs';
    else eventDetails += '-db';

    eventDetails = `${eventDetails}-${updateInfo.updateSourceVersion}-to-${this.settingsService.version}`;

    if (this.settingsService.isWindows) eventDetails += '-win';
    else eventDetails += '-linux';

    eventDetails = `${eventDetails}-${Math.round(executionTime / 1000)}sec`;
    const tt = new UsageDetails();

    tt.text1 = eventDetails;

    tt.code1 = this.licenseService.licenseDetails.key;
    tt.code2 = this.licenseService.licenseDetails.customeremail;

    tt.status1 = this.licenseService.licenseDetails.status;
    tt.status2 = 'COMPLETED';

    if (err) {
      tt.status2 = 'FAILED';

      tt.clob1 = this.electronService.stackUtils.clean(err.stack);
    }

    tt.clob2 = JSON.stringify(updateInfo);

    Utilities.httpPost(Utilities.TT_URL, tt);
  }
}
