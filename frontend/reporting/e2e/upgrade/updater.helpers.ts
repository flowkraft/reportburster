import * as jetpack from 'fs-jetpack';

//import decompress from 'decompress';
import AdmZip from 'adm-zip';

import * as _ from 'lodash';

import * as path from 'path';
import * as semver from 'semver';

import * as PATHS from '../utils/paths';
import Utilities from '../../src/app/helpers/utilities';
import {
  UpdateInfo,
  Updater,
} from '../../src/app/areas/electron-nodejs/updater';
//import SemVer from 'keep-a-changelog/types/deps/deno.land/x/semver@v1.4.0/mod';

export default {
  PDFBOX_VERSION: '2.0.20',

  filesToMigrateDirectoryPath: `${PATHS.E2E_RESOURCES_PATH}/upgrade/files-to-migrate`,

  updateDestinationDirectoryPath: `${PATHS.EXECUTABLE_DIR_PATH}/DocumentBurster`,

  _getInitialUpdateInfo(folderPath: string, isServer: boolean): UpdateInfo {
    let updateInfo = new UpdateInfo();

    updateInfo.updateSourceDirectoryPath = path.resolve(folderPath);

    updateInfo.licenseInfo.latestVersion = '9.9.9';

    updateInfo.licenseInfo.key = '51b0aa18f2bbc066efdca8b53c2dacc8';
    updateInfo.licenseInfo.customeremail = 'virgil.trasca@reportburster.com';
    updateInfo.licenseInfo.status = 'valid';

    updateInfo.productInfo.product = 'DocumentBurster';
    updateInfo.productInfo.version = new semver.SemVer('8.7.2');
    updateInfo.productInfo.isServerVersion = isServer;
    updateInfo.productInfo.isWindows = true;

    return updateInfo;
  },

  async _fillUpdateInfo(
    updater: Updater,
    updateInfo: UpdateInfo,
  ): Promise<UpdateInfo> {
    let _updateInfo = await updater.fillUpdateInfo(updateInfo);

    _updateInfo.updateOptions.copylicensinginformation = _.sample([
      true,
      false,
    ]);
    _updateInfo.updateOptions.copyoutputfiles = _.sample([true, false]);
    _updateInfo.updateOptions.copylogfiles = _.sample([true, false]);
    _updateInfo.updateOptions.copyquarantinefiles = _.sample([true, false]);
    _updateInfo.updateOptions.copybackupfiles = _.sample([true, false]);

    return _updateInfo;
  },

  async _updateNowAndAssertEverythingWorkedWell(
    baselineVersionZipFilePath: string,
    newVersionZipFilePath: string,
  ) {
    let isServer = false;

    if (baselineVersionZipFilePath.includes('-server-')) {
      isServer = true;
      this.updateDestinationDirectoryPath = `${this.updateDestinationDirectoryPath}/server`;
    }

    //console.log(
    //  `this.updateDestinationDirectoryPath2 = ${this.updateDestinationDirectoryPath}`
    // );

    let admZip = new AdmZip(baselineVersionZipFilePath);
    admZip.extractAllTo(PATHS.EXECUTABLE_DIR_PATH);

    //console.log(
    //  `filesToMigrateDirectoryPath = ${this.filesToMigrateDirectoryPath}, updateDestinationDirectoryPath = ${this.updateDestinationDirectoryPath}`
    //);

    //await decompress(baselineVersionZipFilePath, PATHS.EXECUTABLE_DIR_PATH);
    //Step3 - copy all the "config" XML files to  8.7.2 baseline dir
    await jetpack.copyAsync(
      `${this.filesToMigrateDirectoryPath}/config`,
      `${this.updateDestinationDirectoryPath}/config/burst`,
      { matching: '*.xml', overwrite: true },
    );

    const files = await jetpack.listAsync(
      `${this.updateDestinationDirectoryPath}/config/burst`,
    );
    //console.log(
    //  `updateDestinationDirectoryPath/config/burst = ${this.updateDestinationDirectoryPath}/config/burst`
    //);

    //console.log(`_updateNow files = ${JSON.stringify(files)}`);

    await jetpack.copyAsync(
      `${this.filesToMigrateDirectoryPath}/config-cuna`,
      `${this.updateDestinationDirectoryPath}/config/burst`,
      { matching: '*.xml', overwrite: true },
    );

    await jetpack.copyAsync(
      `${this.filesToMigrateDirectoryPath}/config-leidos`,
      `${this.updateDestinationDirectoryPath}/config/burst`,
      { matching: '*.xml', overwrite: true },
    );

    //Step4 - copy all the "scripts" groovy files to 8.7.2 baseline dir with a version stamp
    let dbVersions = [
      '5.1',
      '5.8.1',
      '6.1',
      '6.2',
      '6.4.1',
      '7.1',
      '7.5',
      '8.1',
      '8.7.1',
      '8.7.2',
    ];

    for (let version of dbVersions) {
      let scriptFilePaths = await jetpack.findAsync(
        `${this.filesToMigrateDirectoryPath}/scripts/samples/${version}`,
        { matching: '*.groovy' },
      );

      for (let scriptFilePath of scriptFilePaths) {
        let scriptFileName = path.basename(scriptFilePath);

        await jetpack.copyAsync(
          scriptFilePath,
          `${this.updateDestinationDirectoryPath}/scripts/burst/${version}-${scriptFileName}`,
        );
      }
    }

    //Step6 - in the 8.7.2 tmp generate a sample license file with content to test that
    //the license is correctly copied when the configuration to copy is enabled.

    await jetpack.copyAsync(
      `${PATHS.E2E_RESOURCES_PATH}/license/license-active.xml`,
      `${this.updateDestinationDirectoryPath}/config/_internal/license.xml`,
    );

    //custom documentburster.properties
    await jetpack.copyAsync(
      `${this.filesToMigrateDirectoryPath}/config-cuna/burst/internal/documentburster.properties`,
      `${this.updateDestinationDirectoryPath}/config/_internal/documentburster.properties`,
      { overwrite: true },
    );

    //Step7 - same as above but for the Output files
    await jetpack.copyAsync(
      `${this.filesToMigrateDirectoryPath}/output`,
      `${this.updateDestinationDirectoryPath}/output`,
      { overwrite: true },
    );

    //Step8 - same as above but for the Log files
    await jetpack.copyAsync(
      `${this.filesToMigrateDirectoryPath}/logs`,
      `${this.updateDestinationDirectoryPath}/logs`,
      { overwrite: true },
    );

    //Step9 - same as above but for the Quarantine files
    await jetpack.copyAsync(
      `${this.filesToMigrateDirectoryPath}/quarantine`,
      `${this.updateDestinationDirectoryPath}/quarantine`,
      { overwrite: true },
    );

    //Step10 - same as above but for the Backup files
    await jetpack.copyAsync(
      `${this.filesToMigrateDirectoryPath}/backup`,
      `${this.updateDestinationDirectoryPath}/backup`,
      { overwrite: true },
    );

    /*
    console.log(
      `updater.helpers.updateDestinationDirectoryPath = ${this.updateDestinationDirectoryPath}`
    );
    */

    let updater = new Updater(this.updateDestinationDirectoryPath);
    //mock the download function so that it will not do a real download but only extract a local newVersionZipFilePath file
    updater.downloadDb = async (url: string, folderPath: string) => {
      let admZip = new AdmZip(newVersionZipFilePath);
      admZip.extractAllTo(`${updater.upgdDbTempDirectoryPath}/to`);
      /*
      await decompress(
        newVersionZipFilePath,
        `${updater.upgdDbTempDirectoryPath}/to`
      );
      */
      let updateTempDestinationDirectoryPath = `${updater.upgdDbTempDirectoryPath}/to/DocumentBurster`;
      if (isServer)
        updateTempDestinationDirectoryPath = `${updater.upgdDbTempDirectoryPath}/to/DocumentBurster/server`;

      //Step6 - in the 8.7.2 tmp generate a sample license file with content to test that
      //the license is correctly copied when the configuration to copy is enabled.
      await jetpack.copyAsync(
        `${PATHS.E2E_RESOURCES_PATH}/license/license-just-downloaded-demo.xml`,
        `${updateTempDestinationDirectoryPath}/config/_internal/license.xml`,
      );

      //Step11 - copy the defaults.xml file
      await jetpack.copyAsync(
        `${PATHS.BKEND_REPORTING_FOLDER_PATH}/src/main/external-resources/template/config/burst/settings.xml`,
        `${updateTempDestinationDirectoryPath}/config/_defaults/settings.xml`,
      );

      await jetpack.copyAsync(
        `${PATHS.BKEND_REPORTING_FOLDER_PATH}/src/main/external-resources/template/config/burst/settings.xml`,
        `${updateTempDestinationDirectoryPath}/config/burst/settings.xml`,
      );

      //default documentburster.properties
      await jetpack.copyAsync(
        `${PATHS.E2E_ASSEMBLY_EXTERNAL_RESOURCES_FOLDER_PATH}/db-template/config/_internal/documentburster.properties`,
        `${updateTempDestinationDirectoryPath}/config/_internal/documentburster.properties`,
        { overwrite: true },
      );

      await jetpack.copyAsync(
        `${PATHS.E2E_ASSEMBLY_EXTERNAL_RESOURCES_FOLDER_PATH}/db-template/CHANGELOG.md`,
        `${updateTempDestinationDirectoryPath}/CHANGELOG.md`,
      );
    };

    let updateInfo = this._getInitialUpdateInfo(
      this.updateDestinationDirectoryPath,
      isServer,
    );

    updateInfo = await this._fillUpdateInfo(updater, updateInfo);

    updateInfo.mode = 'update-now';

    //console.log(`updateInfo.mode = ${updateInfo.mode}`);

    await updater.doUpdate(updateInfo);

    await this._expectThingsToBeMigratedAndValid(updateInfo, updater, isServer);

    await updater.removeTempUpgradeFolder();

    let tempExists = await jetpack.existsAsync(updater.upgdDbTempDirectoryPath);

    return expect(tempExists)
      .withContext(
        `upgdDbTempDirectoryPath: ${updater.upgdDbTempDirectoryPath} should not exist`,
      )
      .toBe(false);
  },

  async _extractBaseLineAndCopyCustomConfigAndScriptFiles(
    locationPath: string,
    baselineVersionZipFilePath: string,
  ) {
    const updateBaselineDirectoryPath = Utilities.slash(
      path.resolve(`${locationPath}/baseline`),
    );

    let updateSourceDirectoryPath = `${updateBaselineDirectoryPath}/DocumentBurster`;

    const baselineVersionZipFullFilePath = Utilities.slash(
      path.resolve(baselineVersionZipFilePath),
    );

    if (baselineVersionZipFilePath.includes('-server-')) {
      updateSourceDirectoryPath = `${updateSourceDirectoryPath}/server`;
      this.updateDestinationDirectoryPath = `${this.updateDestinationDirectoryPath}/server`;
    }

    //console.log(
    //  `this.updateDestinationDirectoryPath1 = ${this.updateDestinationDirectoryPath}`
    //);

    /*
    console.log(
      `baselineVersionZipFullFilePath = ${baselineVersionZipFullFilePath}`
    );

    console.log(`updateBaselineDirectoryPath = ${updateBaselineDirectoryPath}`);
    */

    //Step2 - extract the baseline 8.7.2 to the playground/upgrade/baseline dir
    let admZip = new AdmZip(baselineVersionZipFullFilePath);
    admZip.extractAllTo(updateBaselineDirectoryPath);

    /*
    await decompress(
      baselineVersionZipFullFilePath,
      updateBaselineDirectoryPath
    );
    */

    //Step3 - copy all the "config" XML files to  8.7.2 baseline dir
    await jetpack.copyAsync(
      `${this.filesToMigrateDirectoryPath}/config`,
      `${updateSourceDirectoryPath}/config/burst`,
      { matching: '*.xml', overwrite: true },
    );

    const files = await jetpack.listAsync(
      `${updateSourceDirectoryPath}/config/burst`,
    );
    //console.log(
    //  `updateSourceDirectoryPath}/config/burst = ${updateSourceDirectoryPath}/config/burst`
    //);

    //console.log(`_extractBase(letme) files = ${JSON.stringify(files)}`);

    //default documentburster.properties
    await jetpack.copyAsync(
      `${PATHS.E2E_ASSEMBLY_EXTERNAL_RESOURCES_FOLDER_PATH}/db-template/config/_internal/documentburster.properties`,
      `${this.updateDestinationDirectoryPath}/config/_internal/documentburster.properties`,
      { overwrite: true },
    );

    //custom properties file
    await jetpack.copyAsync(
      `${this.filesToMigrateDirectoryPath}/config-cuna/burst/internal/documentburster.properties`,
      `${updateSourceDirectoryPath}/config/burst/internal/documentburster.properties`,
      { overwrite: true },
    );

    await jetpack.copyAsync(
      `${this.filesToMigrateDirectoryPath}/config-cuna`,
      `${updateSourceDirectoryPath}/config/burst`,
      { matching: '*.xml', overwrite: true },
    );

    await jetpack.copyAsync(
      `${this.filesToMigrateDirectoryPath}/config-leidos`,
      `${updateSourceDirectoryPath}/config/burst`,
      { matching: '*.xml', overwrite: true },
    );

    //Step4 - copy all the "scripts" groovy files to 8.7.2 baseline dir with a version stamp
    let dbVersions = [
      '5.1',
      '5.8.1',
      '6.1',
      '6.2',
      '6.4.1',
      '7.1',
      '7.5',
      '8.1',
      '8.7.1',
      '8.7.2',
    ];

    for (let version of dbVersions) {
      let scriptFilePaths = await jetpack.findAsync(
        `${this.filesToMigrateDirectoryPath}/scripts/samples/${version}`,
        { matching: '*.groovy' },
      );

      for (let scriptFilePath of scriptFilePaths) {
        let scriptFileName = path.basename(scriptFilePath);

        await jetpack.copyAsync(
          scriptFilePath,
          `${updateSourceDirectoryPath}/scripts/burst/${version}-${scriptFileName}`,
        );
      }
    }

    //Step6 - in the 8.7.2 tmp generate a sample license file with content to test that
    //the license is correctly copied when the configuration to copy is enabled.
    await jetpack.copyAsync(
      `${PATHS.E2E_RESOURCES_PATH}/license/license-active.xml`,
      `${updateSourceDirectoryPath}/config/burst/internal/license.xml`,
      { overwrite: true },
    );
    await jetpack.copyAsync(
      `${PATHS.E2E_RESOURCES_PATH}/license/license-just-downloaded-demo.xml`,
      `${this.updateDestinationDirectoryPath}/config/_internal/license.xml`,
      { overwrite: true },
    );

    await jetpack.copyAsync(
      `${PATHS.E2E_ASSEMBLY_EXTERNAL_RESOURCES_FOLDER_PATH}/db-template/CHANGELOG.md`,
      `${this.updateDestinationDirectoryPath}/CHANGELOG.md`,
      { overwrite: true },
    );

    //Step7 - same as above but for the Output files
    await jetpack.copyAsync(
      `${this.filesToMigrateDirectoryPath}/output`,
      `${updateSourceDirectoryPath}/output`,
      { overwrite: true },
    );

    //Step8 - same as above but for the Log files
    await jetpack.copyAsync(
      `${this.filesToMigrateDirectoryPath}/logs`,
      `${updateSourceDirectoryPath}/logs`,
      { overwrite: true },
    );

    //Step9 - same as above but for the Quarantine files
    await jetpack.copyAsync(
      `${this.filesToMigrateDirectoryPath}/quarantine`,
      `${updateSourceDirectoryPath}/quarantine`,
      { overwrite: true },
    );

    //Step10 - same as above but for the Backup files
    await jetpack.copyAsync(
      `${this.filesToMigrateDirectoryPath}/backup`,
      `${updateSourceDirectoryPath}/backup`,
      { overwrite: true },
    );

    //Step11 - copy the defaults.xml file
    await jetpack.copyAsync(
      `${PATHS.BKEND_REPORTING_FOLDER_PATH}/src/main/external-resources/template/config/burst/settings.xml`,
      `${this.updateDestinationDirectoryPath}/config/_defaults/settings.xml`,
      { overwrite: true },
    );
    await jetpack.copyAsync(
      `${PATHS.BKEND_REPORTING_FOLDER_PATH}/src/main/external-resources/template/config/burst/settings.xml`,
      `${this.updateDestinationDirectoryPath}/config/burst/settings.xml`,
      { overwrite: true },
    );
  },

  async _updateLetMeAndAssertEverythingWorkedWell(
    baselineVersionZipFilePath: string,
    newVersionZipFilePath: string,
  ) {
    //Step1 - extract the new 9.9.9 zip file to the playground/upgrade working dir

    //console.log(`PATHS.EXECUTABLE_DIR_PATH = ${PATHS.EXECUTABLE_DIR_PATH}`);

    let admZip = new AdmZip(newVersionZipFilePath);
    admZip.extractAllTo(PATHS.EXECUTABLE_DIR_PATH);

    //await decompress(newVersionZipFilePath, PATHS.EXECUTABLE_DIR_PATH);

    await this._extractBaseLineAndCopyCustomConfigAndScriptFiles(
      PATHS.EXECUTABLE_DIR_PATH,
      baselineVersionZipFilePath,
    );

    let updateSourceDirectoryPath = `${PATHS.EXECUTABLE_DIR_PATH}/baseline/DocumentBurster`;

    let isServer = false;

    if (baselineVersionZipFilePath.includes('-server-')) {
      isServer = true;
      updateSourceDirectoryPath = `${updateSourceDirectoryPath}/server`;
    }

    //Step12 - run the Migrate / Copy (letme) update from the 8.7.2 "baseline" dir to the 9.9.9 dir
    const updater = new Updater(this.updateDestinationDirectoryPath);

    let updateInfo = this._getInitialUpdateInfo(
      updateSourceDirectoryPath,
      isServer,
    );
    updateInfo = await this._fillUpdateInfo(updater, updateInfo);

    updateInfo.mode = 'migrate-copy';

    //console.log(`updateInfo.mode = ${updateInfo.mode}`);

    await updater.doUpdate(updateInfo);

    //Step13 -------------------------------------------------------------------- assert results

    //assert templates

    return this._expectThingsToBeMigratedAndValid(
      updateInfo,
      updater,
      isServer,
    );
  },

  async _expectThingsToBeMigratedAndValid(
    updateInfo: UpdateInfo,
    updater: Updater,
    isServer: boolean,
  ) {
    let dbDesktopServerDirectoryPath = `${PATHS.EXECUTABLE_DIR_PATH}/DocumentBurster`;
    let dbWebConsoleDirectoryPath = `${PATHS.EXECUTABLE_DIR_PATH}/DocumentBurster/web-console`;

    if (isServer)
      dbDesktopServerDirectoryPath = `${PATHS.EXECUTABLE_DIR_PATH}/DocumentBurster/server`;

    //console.log(`STEP13`);

    //assert all the *.txt file in the "upgraded" folder contain
    // file-999 and do not contain file-872
    let allTxtFilePaths = await jetpack.findAsync(PATHS.EXECUTABLE_DIR_PATH, {
      matching: 'DocumentBurster/**/*.txt',
    });

    if (updateInfo.updateOptions.copybackupfiles)
      allTxtFilePaths = allTxtFilePaths.filter(
        (path) => !path.includes('backup'),
      );

    if (updateInfo.updateOptions.copylogfiles)
      allTxtFilePaths = allTxtFilePaths.filter(
        (path) => !path.includes('logs'),
      );

    if (updateInfo.updateOptions.copyoutputfiles)
      allTxtFilePaths = allTxtFilePaths.filter(
        (path) => !path.includes('output'),
      );

    if (updateInfo.updateOptions.copyquarantinefiles)
      allTxtFilePaths = allTxtFilePaths.filter(
        (path) => !path.includes('quarantine'),
      );

    allTxtFilePaths = allTxtFilePaths.filter(
      (path) => !path.includes('templates'),
    );

    for (let txtFilePath of allTxtFilePaths) {
      const data = await jetpack.readAsync(txtFilePath);
      expect(data.includes('file-999'))
        .withContext(`txtFilePath: ${txtFilePath} should contain file-999`)
        .toBe(true);
      expect(data.includes('file-872'))
        .withContext(`txtFilePath: ${txtFilePath} should not contain file-872`)
        .toBe(false);
    }

    //console.log(`STEP14`);

    //assert all the above "folder" changes
    let exists = await jetpack.existsAsync(
      `${dbDesktopServerDirectoryPath}/tools`,
    );
    expect(exists)
      .withContext(
        `${dbDesktopServerDirectoryPath}/tools folder should not exist`,
      )
      .toBe(false);

    //console.log(`STEP15`);

    exists = await jetpack.existsAsync(
      `${dbDesktopServerDirectoryPath}/extra-db1`,
    );
    expect(exists)
      .withContext(
        `${dbDesktopServerDirectoryPath}/extra-db1 folder should exist`,
      )
      .toBe('dir');

    exists = await jetpack.existsAsync(
      `${dbDesktopServerDirectoryPath}/extra-db2`,
    );
    expect(exists)
      .withContext(
        `${dbDesktopServerDirectoryPath}/extra-db2 folder should exist`,
      )
      .toBe('dir');

    //console.log(`STEP16`);

    exists = await jetpack.existsAsync(
      `${dbDesktopServerDirectoryPath}/scripts/extra-db3`,
    );
    expect(exists)
      .withContext(
        `${dbDesktopServerDirectoryPath}/scripts/extra-db3 folder should exist`,
      )
      .toBe('dir');

    //console.log(`STEP16`);

    if (isServer) {
      exists = await jetpack.existsAsync(
        `${dbWebConsoleDirectoryPath}/extra-db4`,
      );
      expect(exists)
        .withContext(
          `${dbWebConsoleDirectoryPath}/extra-db4 folder should exist`,
        )
        .toBe('dir');

      //console.log(`STEP17 - server`);

      exists = await jetpack.existsAsync(
        `${dbWebConsoleDirectoryPath}/console/extra-db5`,
      );
      expect(exists)
        .withContext(
          `${dbWebConsoleDirectoryPath}/console/extra-db5 folder should exist`,
        )
        .toBe('dir');

      exists = await jetpack.existsAsync(
        `${dbWebConsoleDirectoryPath}/console/webapps/extra-db6`,
      );
      expect(exists)
        .withContext(
          `${dbWebConsoleDirectoryPath}/console/webapps/extra-db6 folder should exist`,
        )
        .toBe('dir');
      //console.log(`STEP18 - server`);
    }

    //assert settings.xml is correctly upgraded
    await this._assertXmlConfigV51ExpectedNN(
      `${dbDesktopServerDirectoryPath}/config/burst/settings.xml`,
      updater.defaultSettings,
      'My Report',
    );

    //console.log(`STEP19`);

    //assert that each and every xml configuration file is correctly upgraded
    await this._assertXmlConfigV51ExpectedDefaults(
      `${dbDesktopServerDirectoryPath}/config/burst/00-settings-5.1.xml`,
      updater.defaultSettings,
    );
    await this._assertXmlConfigV51ExpectedNN(
      `${dbDesktopServerDirectoryPath}/config/burst/00-settings-5.1-nn.xml`,
      updater.defaultSettings,
      '00-settings-5.1-nn.xml',
    );

    //console.log(`STEP20`);

    let exceptFor = new Map();

    exceptFor.set('documentburster.settings.htmlemail', 'false');

    await this._expectEqualConfigurationValuesExceptFor(
      `${dbDesktopServerDirectoryPath}/config/burst/05-settings-5.8.1.xml`,
      updater.defaultSettings,
      exceptFor,
    );

    //console.log(`STEP21`);

    await this._expectEqualConfigurationValuesExceptFor(
      `${dbDesktopServerDirectoryPath}/config/burst/05-settings-5.8.1-custom.xml`,
      updater.defaultSettings,
      this._getCustomExceptFor(),
    );

    await this._expectEqualConfigurationValuesExceptFor(
      `${dbDesktopServerDirectoryPath}/config/burst/10-settings-6.1.xml`,
      updater.defaultSettings,
      exceptFor,
    );
    await this._expectEqualConfigurationValuesExceptFor(
      `${dbDesktopServerDirectoryPath}/config/burst/10-settings-6.1-custom.xml`,
      updater.defaultSettings,
      this._getCustomExceptFor(),
    );

    //console.log(`STEP22`);

    await this._expectEqualConfigurationValuesExceptFor(
      `${dbDesktopServerDirectoryPath}/config/burst/15-settings-6.2.xml`,
      updater.defaultSettings,
      exceptFor,
    );

    let customExceptFor = this._getCustomExceptFor();
    customExceptFor.set(
      'documentburster.settings.emailsettings.text',
      'custom text\r\n\r\nsecond line\r\n\r\n${var1}',
    );
    customExceptFor.set(
      'documentburster.settings.emailsettings.html',
      'custom html\r\n\r\nsecond line<br>\r\n\r\n${var1}',
    );

    await this._expectEqualConfigurationValuesExceptFor(
      `${dbDesktopServerDirectoryPath}/config/burst/15-settings-6.2-custom.xml`,
      updater.defaultSettings,
      customExceptFor,
    );

    //console.log(`STEP23`);

    await this._expectEqualConfigurationValuesExceptFor(
      `${dbDesktopServerDirectoryPath}/config/burst/20-settings-6.4.1.xml`,
      updater.defaultSettings,
      exceptFor,
    );
    await this._expectEqualConfigurationValuesExceptFor(
      `${dbDesktopServerDirectoryPath}/config/burst/20-settings-6.4.1-custom.xml`,
      updater.defaultSettings,
      this._getCustomExceptFor(),
    );

    //console.log(`STEP24`);

    await this._expectEqualConfigurationValuesExceptFor(
      `${dbDesktopServerDirectoryPath}/config/burst/25-settings-7.1.xml`,
      updater.defaultSettings,
      exceptFor,
    );
    await this._expectEqualConfigurationValuesExceptFor(
      `${dbDesktopServerDirectoryPath}/config/burst/25-settings-7.1-custom.xml`,
      updater.defaultSettings,
      this._getCustomExceptFor(),
    );

    //console.log(`STEP25`);

    await this._expectEqualConfigurationValuesExceptFor(
      `${dbDesktopServerDirectoryPath}/config/burst/30-settings-7.5.xml`,
      updater.defaultSettings,
      exceptFor,
    );
    await this._expectEqualConfigurationValuesExceptFor(
      `${dbDesktopServerDirectoryPath}/config/burst/30-settings-7.5-custom.xml`,
      updater.defaultSettings,
      this._getCustomExceptFor(),
    );

    //console.log(`STEP26`);

    await this._expectEqualConfigurationValuesExceptFor(
      `${dbDesktopServerDirectoryPath}/config/burst/35-settings-8.1.xml`,
      updater.defaultSettings,
    );

    customExceptFor = this._getCustomExceptFor();
    customExceptFor.set('documentburster.settings.htmlemail', 'true');
    await this._expectEqualConfigurationValuesExceptFor(
      `${dbDesktopServerDirectoryPath}/config/burst/35-settings-8.1-custom.xml`,
      updater.defaultSettings,
      customExceptFor,
    );

    //console.log(`STEP27`);

    //assert that each and groovy script file is correctly upgraded
    const scriptsFilePaths = await jetpack.findAsync(
      `${dbDesktopServerDirectoryPath}/scripts/burst`,
      {
        matching: '*.groovy',
        recursive: false,
        files: true,
        directories: false,
      },
    );

    for (let scriptFilePath of scriptsFilePaths) {
      await this._expectScriptContentToBeMigratedAndValid(
        scriptFilePath,
        this.PDFBOX_VERSION,
      );
    }

    //assert "licensing" information is correctly copied if copyLicensing is true
    const licenseFilePath = `${dbDesktopServerDirectoryPath}/config/_internal/license.xml`;

    const licenseFileExists = await jetpack.existsAsync(licenseFilePath);

    expect(licenseFileExists)
      .withContext(`${licenseFilePath} file should exist`)
      .toBe('file');

    const licenseFileContent = await jetpack.readAsync(licenseFilePath);
    if (updateInfo.updateOptions.copylicensinginformation) {
      expect(licenseFileContent.includes('<status>valid</status>'))
        .withContext(
          `licenseFilePath: ${licenseFilePath} license should be active i.e. <status>valid</status>.`,
        )
        .toBe(true);

      /*
      expect(licenseFileContent.includes("## 8.7.1 - 2020-09-20")).toBe(
        true,
        `licenseFilePath: ${licenseFilePath} changelog was not properly migrated.`
      );
      */
    } else
      expect(licenseFileContent.includes('<status />'))
        .withContext(
          `scriptFilePath: ${licenseFilePath} license should be demo i.e <status />.`,
        )
        .toBe(true);

    //console.log(`STEP28`);

    const dbPropertiesFilePath = `${dbDesktopServerDirectoryPath}/config/_internal/documentburster.properties`;
    const dbPropertiesFileContent =
      await jetpack.readAsync(dbPropertiesFilePath);

    expect(dbPropertiesFileContent.includes('-Xms1024m -Xmx1024m'))
      .withContext(
        `dbPropertiesFilePath: ${dbPropertiesFilePath} documentburster.properties was not copied.`,
      )
      .toBe(true);

    //console.log(`STEP29`);

    let payslipsFolderPath = `${dbDesktopServerDirectoryPath}/output/Payslips.pdf`;
    let payslipsFolderExist = await jetpack.existsAsync(payslipsFolderPath);

    //assert "output" information is correctly copied if copyOutput is true
    if (updateInfo.updateOptions.copyoutputfiles)
      expect(payslipsFolderExist)
        .withContext(`${payslipsFolderPath} folder should exist`)
        .toBe('dir');
    else
      expect(payslipsFolderExist)
        .withContext(`${payslipsFolderPath} folder should not exist`)
        .toBe(false);

    //console.log(`STEP30`);

    //assert "logs" information is correctly copied if copyLogs is true
    let archivesFolderPath = `${dbDesktopServerDirectoryPath}/logs/archives`;
    let archivesFolderExist = await jetpack.existsAsync(archivesFolderPath);

    if (updateInfo.updateOptions.copylogfiles)
      expect(archivesFolderExist)
        .withContext(`${archivesFolderExist} folder should exist`)
        .toBe('dir');
    else
      expect(archivesFolderExist)
        .withContext(`${archivesFolderExist} folder should not exist`)
        .toBe(false);

    //assert "backup" information is correctly copied if copyBackup is true
    payslipsFolderPath = `${dbDesktopServerDirectoryPath}/backup/Payslips.pdf`;
    payslipsFolderExist = await jetpack.existsAsync(payslipsFolderPath);

    //console.log(`STEP31`);

    if (updateInfo.updateOptions.copybackupfiles)
      expect(payslipsFolderExist)
        .withContext(`${payslipsFolderPath} folder should exist`)
        .toBe('dir');
    else
      expect(payslipsFolderExist)
        .withContext(`${payslipsFolderPath} folder should not exist`)
        .toBe(false);

    //assert "quarantine" information is correctly copied if copyQuarantine is true
    payslipsFolderPath = `${dbDesktopServerDirectoryPath}/quarantine/Payslips.pdf`;
    payslipsFolderExist = await jetpack.existsAsync(payslipsFolderPath);

    if (updateInfo.updateOptions.copyquarantinefiles)
      expect(payslipsFolderExist)
        .withContext(`${payslipsFolderPath} folder should exist`)
        .toBe('dir');
    else
      expect(payslipsFolderExist)
        .withContext(`${payslipsFolderPath} folder should not exist`)
        .toBe(false);

    //console.log(`STEP32`);

    if (updateInfo.mode == 'update-now') {
      let backupZipFilePath = `${dbDesktopServerDirectoryPath}/backup/${updater.backupZipFileName}`;
      let backupZipFileExist = await jetpack.existsAsync(backupZipFilePath);
      expect(backupZipFileExist)
        .withContext(`${backupZipFileExist} folder should exist`)
        .toBe('file');

      const zip = new AdmZip(backupZipFilePath);
      let zipEntries = zip.getEntries();

      for (let zipEntry of zipEntries) {
        if (zipEntry.entryName.endsWith('.txt')) {
          let data = zipEntry.getData().toString('utf8');
          expect(data.includes('file-872'))
            .withContext(
              `zipEntry.entryName: ${zipEntry.entryName} should contain file-872`,
            )
            .toBe(true);
          expect(data.includes('file-999'))
            .withContext(
              `zipEntry.entryName: ${zipEntry.entryName} should not contain file-999`,
            )
            .toBe(false);
        } else if (zipEntry.entryName.endsWith('.groovy')) {
          let fileName = path.basename(zipEntry.entryName);

          let dbVersion = fileName.split('-')[0];
          dbVersion = semver.coerce(dbVersion).toString();

          let data = zipEntry.getData().toString('utf8');
          if (semver.lt(dbVersion, '6.4.1'))
            expect(data.includes('import com.sourcekraft'))
              .withContext(`zipEntry.entryName: ${zipEntry.entryName}`)
              .toBe(false);
          if (semver.lt(dbVersion, '8.7.1'))
            expect(data.includes('extractedFilePath'))
              .withContext(`zipEntry.entryName: ${zipEntry.entryName}`)
              .toBe(false);
        } else if (zipEntry.entryName.endsWith('.xml')) {
          let data = zipEntry.getData().toString('utf8');
          if (data.includes('8.8.4'))
            expect(data.includes('copylicensinginformation'))
              .withContext(`zipEntry.entryName: ${zipEntry.entryName}`)
              .toBe(true);
          else
            expect(data.includes('copylicensinginformation'))
              .withContext(`zipEntry.entryName: ${zipEntry.entryName}`)
              .toBe(false);
        }
      }
    }
  },

  async _expectScriptContentToBeMigratedAndValid(
    scriptFilePath: string,
    pdfBoxVersion: string,
  ) {
    //checkPoint - "backupZipFile" should exist
    const scriptFileExists = await jetpack.existsAsync(scriptFilePath);

    if (!scriptFileExists)
      throw new Error(
        `_expectScriptContentToBeMigratedAndValid - ${scriptFilePath} was not found`,
      );

    const scriptFileContent = await jetpack.readAsync(scriptFilePath);

    expect(scriptFileContent.includes('import com.smartwish'))
      .withContext(`scriptFilePath: ${scriptFilePath}`)
      .toBe(false);
    expect(scriptFileContent.includes('extractFilePath'))
      .withContext(`scriptFilePath: ${scriptFilePath}`)
      .toBe(false);

    expect(scriptFileContent.includes('commons-logging'))
      .withContext(`scriptFilePath: ${scriptFilePath}`)
      .toBe(false);
    expect(scriptFileContent.includes('jcl-over-slf4j-1.7.5.jar'))
      .withContext(`scriptFilePath: ${scriptFilePath}`)
      .toBe(false);
    expect(scriptFileContent.includes('slf4j-api-1.7.5.jar'))
      .withContext(`scriptFilePath: ${scriptFilePath}`)
      .toBe(false);

    expect(scriptFileContent.includes('pdfbox-1.'))
      .withContext(`scriptFilePath: ${scriptFilePath}`)
      .toBe(false);

    expect(scriptFileContent.includes('jempbox-'))
      .withContext(`scriptFilePath: ${scriptFilePath}`)
      .toBe(false);

    expect(scriptFileContent.includes('fontbox-1.0.0.jar'))
      .withContext(`scriptFilePath: ${scriptFilePath}`)
      .toBe(false);
    expect(scriptFileContent.includes('fontbox-1.8.2.jar'))
      .withContext(`scriptFilePath: ${scriptFilePath}`)
      .toBe(false);

    expect(scriptFileContent.includes('bcmail-jdk15-1.44.jar'))
      .withContext(`scriptFilePath: ${scriptFilePath}`)
      .toBe(false);
    expect(scriptFileContent.includes('bcprov-jdk15-1.44.jar'))
      .withContext(`scriptFilePath: ${scriptFilePath}`)
      .toBe(false);

    if (
      scriptFileContent.includes('import com.') &&
      scriptFileContent.includes('.documentburster.')
    ) {
      expect(scriptFileContent.includes('import com.sourcekraft.'))
        .withContext(`scriptFilePath: ${scriptFilePath}`)
        .toBe(true);
    }

    if (scriptFileContent.includes('.extract')) {
      expect(scriptFileContent.includes('.extractedFilePath'))
        .withContext(`scriptFilePath: ${scriptFilePath}`)
        .toBe(true);
    }

    if (scriptFileContent.includes('org.apache.pdfbox.')) {
      expect(scriptFileContent.includes('org.apache.pdfbox.tools.'))
        .withContext(`scriptFilePath: ${scriptFilePath}`)
        .toBe(true);
      expect(scriptFileContent.includes('org.apache.pdfbox.tools.tools.'))
        .withContext(`scriptFilePath: ${scriptFilePath}`)
        .toBe(false);
    }

    if (scriptFileContent.includes('org.apache.commons.vfs')) {
      expect(scriptFileContent.includes('org.apache.commons.vfs2'))
        .withContext(`scriptFilePath: ${scriptFilePath}`)
        .toBe(true);
    }

    if (scriptFileContent.includes('jcl-over-slf4j')) {
      expect(scriptFileContent.includes('jcl-over-slf4j-1.7.30.jar'))
        .withContext(`scriptFilePath: ${scriptFilePath}`)
        .toBe(true);
    }

    if (scriptFileContent.includes('slf4j-api-')) {
      expect(scriptFileContent.includes('slf4j-api-1.7.30.jar'))
        .withContext(`scriptFilePath: ${scriptFilePath}`)
        .toBe(true);
    }

    if (scriptFileContent.includes('pdfbox-')) {
      expect(scriptFileContent.includes(`pdfbox-${pdfBoxVersion}.jar`))
        .withContext(`scriptFilePath: ${scriptFilePath}`)
        .toBe(true);
    }

    if (scriptFileContent.includes('org.apache.pdfbox.tools.')) {
      expect(scriptFileContent.includes(`pdfbox-tools-${pdfBoxVersion}.jar`))
        .withContext(`scriptFilePath: ${scriptFilePath}`)
        .toBe(true);
    }

    if (scriptFileContent.includes('xmpbox-')) {
      expect(scriptFileContent.includes(`xmpbox-${pdfBoxVersion}.jar`))
        .withContext(`scriptFilePath: ${scriptFilePath}`)
        .toBe(true);
    }

    if (scriptFileContent.includes('fontbox-')) {
      expect(scriptFileContent.includes(`fontbox-${pdfBoxVersion}.jar`))
        .withContext(`scriptFilePath: ${scriptFilePath}`)
        .toBe(true);
    }

    if (scriptFileContent.includes('bcmail-jdk15-')) {
      expect(scriptFileContent.includes('bcmail-jdk15-1.46.jar'))
        .withContext(`scriptFilePath: ${scriptFilePath}`)
        .toBe(true);
    }

    if (scriptFileContent.includes('bcprov-jdk15-')) {
      expect(scriptFileContent.includes('bcprov-jdk15-1.46.jar'))
        .withContext(`scriptFilePath: ${scriptFilePath}`)
        .toBe(true);
    }

    if (scriptFileContent.includes('.Overlay')) {
      expect(scriptFileContent.includes('.OverlayPDF ${overlayOptions}'))
        .withContext(`scriptFilePath: ${scriptFilePath}`)
        .toBe(true);

      expect(scriptFileContent.includes('.Overlay $'))
        .withContext(`scriptFilePath: ${scriptFilePath}`)
        .toBe(false);
    }
  },

  async _migrateAndValidateAllScriptsFromFolder(
    inputFolderScriptsFolderPath: string,
    legacyVersion: string,
  ) {
    const scriptsFilePaths = await jetpack.findAsync(
      inputFolderScriptsFolderPath,
      {
        matching: '*.groovy',
        recursive: false,
        files: true,
        directories: false,
      },
    );

    let updater = new Updater(PATHS.EXECUTABLE_DIR_PATH);

    for (let scriptFilePath of scriptsFilePaths) {
      const newScriptFilePath = await updater.migrateScriptFile(
        scriptFilePath,
        legacyVersion,
      );
      await this._expectScriptContentToBeMigratedAndValid(
        newScriptFilePath,
        this.PDFBOX_VERSION,
      );
    }
  },

  _hasSameProps(obj1: any, obj2: any): boolean {
    var obj1Props = Object.keys(obj1),
      obj2Props = Object.keys(obj2);

    if (obj1Props.length == obj2Props.length) {
      return obj1Props.every(function (prop) {
        let foundIndex = obj2Props.indexOf(prop);
        if (foundIndex < 0)
          throw new Error(
            `Configuration ${prop} exists in one of the compared configuration but not in the other. Configuration ${prop} should exists in both migrated and default configurations.`,
          );
        return foundIndex >= 0;
      });
    }

    return false;
  },

  async _expectEqualConfigurationValuesExceptFor(
    configSettingsFilePath: string,
    expectedSettings: any,
    exceptFor: Map<string, string> = new Map(),
  ) {
    const fileExists = await jetpack.existsAsync(configSettingsFilePath);

    if (fileExists !== 'file')
      throw new Error(`Configuration ${configSettingsFilePath} not found!`);

    if (configSettingsFilePath.includes('config/burst')) {
      exceptFor.set('documentburster.settings.emailserver.useconn', 'false');
      exceptFor.set('documentburster.settings.emailserver.conncode', '');
    }

    //console.log(`configSettingsFilePath: ${configSettingsFilePath}`);

    const settingsContent = await jetpack.readAsync(configSettingsFilePath);

    //if (!settingsContent.includes('documentburster'))
    //  console.log(`settingsContent: ${settingsContent}`);

    const settings = await Utilities.parseStringPromise(settingsContent, {
      trim: true,
      explicitArray: false,
    });

    Utilities.traverseJSONObjTree(settings, (key, value, scope) => {
      if (typeof value !== 'object') {
        let currentConfigurationItemKeys = scope.concat(key);
        let joinedKeys = currentConfigurationItemKeys.join('.');
        let expectedValue: string;

        if (!exceptFor || !exceptFor.has(joinedKeys)) {
          /*
          console.log(
            `currentConfigurationItemKeys: ${currentConfigurationItemKeys}`
          );

          console.log(`expectedSettings: ${expectedSettings}`);
          */
          expectedValue = Utilities.getDeeplyNestedLastProp(
            expectedSettings,
            currentConfigurationItemKeys,
          );

          if (typeof expectedValue === 'undefined')
            throw new Error(
              `Configuration ${joinedKeys} exists in the migrated settings but not in the expectedSettings (defaultSettings)`,
            );
        } else {
          expectedValue = exceptFor.get(joinedKeys);
        }

        if (value !== expectedValue) {
          //only for this case
          if (joinedKeys && joinedKeys.endsWith('.template')) {
            if (['My Report', 'custom'].includes(expectedValue)) {
              if (value && value.startsWith(expectedValue))
                expectedValue = value;
            }
          } //else
          //console.log(
          //  `Key: ${joinedKeys}, Value: ${value}, Expected Value: ${expectedValue}`
          //);
        }

        //expect(value).withContext(joinedKeys).toBe(expectedValue);
        expect(value).withContext(joinedKeys).toBe(expectedValue);
      }
    });

    expect(this._hasSameProps(expectedSettings, settings)).toBe(true);
  },

  _getCustomExceptFor() {
    let exceptFor = new Map();

    exceptFor.set('documentburster.settings.htmlemail', 'false');

    exceptFor.set('documentburster.settings.template', 'custom');

    exceptFor.set(
      'documentburster.settings.burstfilename',
      'custom-${var0}.${output_type_extension}',
    );

    exceptFor.set(
      'documentburster.settings.outputfolder',
      'custom-output path',
    );
    exceptFor.set(
      'documentburster.settings.quarantinefolder',
      'custom-quarantine',
    );

    exceptFor.set(
      'documentburster.settings.emailsettings.subject',
      'custom subject ${var0}',
    );
    exceptFor.set(
      'documentburster.settings.emailsettings.text',
      'custom text ${var1}',
    );

    return exceptFor;
  },

  async _assertXmlConfigV51ExpectedNN(
    xmlConfigFilePath: string,
    baseLineXmlSettings: any,
    templateValue: string,
  ) {
    //console.log(
    //  `_assertXmlConfigV51ExpectedNN xmlConfigFilePath = ${xmlConfigFilePath}`
    //);

    let exceptFor = new Map();

    exceptFor.set('documentburster.settings.template', templateValue);

    exceptFor.set('documentburster.settings.burstfilename', '01');
    exceptFor.set('documentburster.settings.mergefilename', '02');

    exceptFor.set('documentburster.settings.outputfolder', '03');
    exceptFor.set('documentburster.settings.backupfolder', '04');

    exceptFor.set('documentburster.settings.quarantinefiles', '06');
    exceptFor.set('documentburster.settings.quarantinefolder', '07');

    exceptFor.set('documentburster.settings.deletefiles', '09');
    exceptFor.set('documentburster.settings.htmlemail', '10');

    exceptFor.set('documentburster.settings.sendfiles.email', '08');

    exceptFor.set('documentburster.settings.emailserver.host', '15');
    exceptFor.set('documentburster.settings.emailserver.port', '16');
    exceptFor.set('documentburster.settings.emailserver.userid', '17');
    exceptFor.set('documentburster.settings.emailserver.userpassword', '18');
    exceptFor.set('documentburster.settings.emailserver.usessl', '19');
    exceptFor.set('documentburster.settings.emailserver.usetls', '20');
    exceptFor.set('documentburster.settings.emailserver.debug', '21');
    exceptFor.set('documentburster.settings.emailserver.fromaddress', '22');
    exceptFor.set('documentburster.settings.emailserver.name', '23');

    exceptFor.set('documentburster.settings.emailsettings.to', '24');

    exceptFor.set('documentburster.settings.uploadsettings.ftpcommand', '25');
    exceptFor.set('documentburster.settings.numberofuservariables', '26');

    return this._expectEqualConfigurationValuesExceptFor(
      xmlConfigFilePath,
      baseLineXmlSettings,
      exceptFor,
    );
  },

  async _assertXmlConfigV51ExpectedDefaults(
    xmlConfigFilePath: string,
    baseLineXmlSettings: any,
  ) {
    //console.log(`Log 24 - xmlConfigFilePath = ${xmlConfigFilePath}`);

    let exceptFor = new Map();

    exceptFor.set('documentburster.settings.template', '00-settings-5.1.xml');
    exceptFor.set('documentburster.settings.htmlemail', 'false');

    return this._expectEqualConfigurationValuesExceptFor(
      xmlConfigFilePath,
      baseLineXmlSettings,
      exceptFor,
    );
  },
};
