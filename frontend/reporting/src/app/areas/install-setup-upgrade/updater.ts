import * as path from 'path';
import uniqueFilename from 'unique-filename';
import dayjs from 'dayjs';
import AdmZip from 'adm-zip';

import Utilities from '../../helpers/utilities';
import { Settings } from '../../helpers/settings';

import * as semver from 'semver';

import ElectronLog from 'electron-log';
import UtilitiesElectron from '../../helpers/utilities-electron';

export class UpdateInfo {
  mode = 'update-now';

  errorMsg: string;

  jobFilePath: string;
  updateSourceDirectoryPath: string;
  updateSourceVersion: string;

  migrateConfigFiles = new Array<[string, string]>();
  migrateScriptFiles = new Array<[string, string]>();

  templatesFolders = new Array<[string, string]>();

  licenseInfo = {
    latestVersion: '',
    key: '',
    customeremail: '',
    status: '',
  };

  productInfo = {
    product: '',
    version: new semver.SemVer('0.0.0'),
    isServerVersion: false,
    isWindows: true,
  };

  updateOptions = {
    copylicensinginformation: true,
    copyoutputfiles: false,
    copylogfiles: false,
    copyquarantinefiles: false,
    copybackupfiles: false,
  };
}

export class Updater {
  nowFormatted: string;

  updateDestinationDirectoryPath: string;
  upgdDbTempDirectoryPath: string;
  backupZipFileName: string;

  defaultSettings: any;

  readonly BUILTIN_VARS_LEGACY_STRINGTEMPLATE_SYNTAX_TO_FREEMARKER_SYNTAX_MAP =
    new Map([
      ['$burst_token$', '${burst_token}'],
      ['$input_document_extension$', '${input_document_extension}'],
      ['$input_document_name$', '${input_document_name}'],
      ['$burst_index$', '${burst_index}'],
      ['$now_default_date$', '${now_default_date}'],
      ['$now_short_date$', '${now_short_date}'],
      ['$now_medium_date$', '${now_medium_date}'],
      ['$now_long_date$', '${now_long_date}'],
      ['$now_full_date$', '${now_full_date}'],
      ['$now_quarter$', '${now_quarter}'],
      ['$extracted_file_path$', '${extracted_file_path}'],
      [
        '$extracted_file_paths_after_splitting_2nd_time$',
        '${extracted_file_paths_after_splitting_2nd_time}',
      ],
      ['$now;format="yyyy.MM.dd"$', '${now?string["yyyy.MM.dd"]}'],
      [
        '$now;format="yyyy.MM.dd_HH.mm.ss"$',
        '${now?string["yyyy.MM.dd_HH.mm.ss.SSS"]}',
      ],
      [
        '$now;format="yyyy.MM.dd_HH.mm.ss.SSS"$',
        '${now?string["yyyy.MM.dd_HH.mm.ss.SSS"]}',
      ],
      [
        '_stats-$num_pages$pages-$num_files_extracted$extracted-$num_files_distributed$distributed.log',
        '_stats-${stats_info}.log',
      ],
    ]);
  isElectron: boolean = false;

  constructor(
    protected portableExecutableDirectoryPath: string,
    protected log?: typeof ElectronLog,
  ) {
    this.updateDestinationDirectoryPath = Utilities.slash(
      this.portableExecutableDirectoryPath,
    );

    this.nowFormatted = dayjs().format('YYYY.MM.DD_HH.mm.ss');
    this.upgdDbTempDirectoryPath = Utilities.slash(
      uniqueFilename(Utilities.UPG_DB_FOLDER_PATH, this.nowFormatted),
    );
  }

  async fillUpdateInfo(updateInfo: UpdateInfo): Promise<UpdateInfo> {
    updateInfo.migrateConfigFiles = [];
    updateInfo.migrateScriptFiles = [];
    updateInfo.templatesFolders = [];

    // console.log(`${this.updateDestinationDirectoryPath}/config/burst/settings.xml`);
    if (updateInfo.mode == 'migrate-copy') {
      //console.log('Log 1');

      let validDbExeFilePath = await UtilitiesElectron.existsAsync(
        `${updateInfo.updateSourceDirectoryPath}/DocumentBurster.exe`,
      );

      console.log(
        `validDbExeFilePath = ${updateInfo.updateSourceDirectoryPath}/DocumentBurster.exe`,
      );

      if (validDbExeFilePath !== 'file') {
        updateInfo.errorMsg = `DocumentBurster.exe was not found in the ${updateInfo.updateSourceDirectoryPath} selected location. Please select an existing DocumentBurster installation folder!`;
      } else {
        let xmlSourceSettings = {
          documentburster: {
            settings: {
              version: '',
            },
          },
        };

        xmlSourceSettings = await new Settings().loadSettingsFileAsync(
          `${updateInfo.updateSourceDirectoryPath}/config/burst/settings.xml`,
        );

        //console.log(
        //  `SourceDirectoryPath.settings.xml = ${updateInfo.updateSourceDirectoryPath}/config/burst/settings.xml`
        //);

        updateInfo.updateSourceVersion =
          xmlSourceSettings.documentburster.settings.version;
      }
    }
    //config folder
    if (!updateInfo.errorMsg) {
      //console.log(
      //  `exists(updateInfo.updateSourceDirectoryPath) = ${JSON.stringify(
      //    sourceDirectoryExists
      //  )}`
      //);

      //console.log(
      //  `Log 2 updateInfo.updateSourceDirectoryPath: ${updateInfo.updateSourceDirectoryPath}`
      //);

      // Finds all '.xml' files inside 'config' folder but excluding those in 'vendor' subtree.
      const configFilePaths = await UtilitiesElectron.findAsync(
        `${updateInfo.updateSourceDirectoryPath}/config`,
        {
          matching: [
            '*.xml',
            `!_internal/**/*`,
            `!_defaults/**/*`,
            `!burst/internal/**/*`,
            `!burst/default/**/*`,
          ],
        },
      );

      for (const configFilePath of configFilePaths) {
        const configFileName = Utilities.basename(configFilePath);

        const fullConfigFilePath = Utilities.slash(
          `${updateInfo.updateSourceDirectoryPath}/config/burst/${configFileName}`,
        );

        //console.log(`Log 3.00 configFileName = ${configFileName}`);

        //console.log(`Log 3.0 configFilPath = ${configFilePath}`);
        //console.log(`Log 3 fullConfigFilePath = ${fullConfigFilePath}`);
        updateInfo.migrateConfigFiles.push([
          configFileName,
          fullConfigFilePath,
        ]);
      }

      //console.log(updateInfo.migrateConfigFiles);

      //scripts
      const scriptFilePaths = await UtilitiesElectron.findAsync(
        `${updateInfo.updateSourceDirectoryPath}/scripts/burst`,
        {
          matching: ['*.groovy', `!internal/**/*`, `!samples/**/*`],
        },
      );

      for (const scriptFilePath of scriptFilePaths) {
        const fullScriptFilePath = Utilities.slash(
          `${updateInfo.updateSourceDirectoryPath}/${scriptFilePath}`,
        );
        const scriptFileName = path.basename(fullScriptFilePath);

        //console.log('Log 3');

        const scriptContent =
          await UtilitiesElectron.readAsync(fullScriptFilePath);
        //console.log(`fullScriptFilePath = ${fullScriptFilePath}`);

        //only copy / migrate groovy scripts which were customized (which are not empty)
        if (scriptContent) {
          updateInfo.migrateScriptFiles.push([
            scriptFileName,
            fullScriptFilePath,
          ]);
        }
      }

      // Looks for all custom html templates directories
      // (all html templates directories besides the 2 sample templates provided with the app)
      const templatesFolderPaths = await UtilitiesElectron.findAsync(
        `${updateInfo.updateSourceDirectoryPath}/templates`,
        {
          matching: [
            '!html-basic-example',
            '!html-mobile-responsive-emails',
            `!html-email-templates/basic-example`,
            `!html-email-templates/mobile-responsive-example`,
          ],
          files: false,
          directories: true,
          recursive: false,
        },
      );

      for (const templateFolderPath of templatesFolderPaths) {
        const fullTemplatePath = Utilities.slash(
          `${updateInfo.updateSourceDirectoryPath}/${templateFolderPath}`,
        );
        const templateName = path.basename(fullTemplatePath);
        //console.log(`fullTemplatePath = ${fullTemplatePath}`);
        updateInfo.templatesFolders.push([templateName, fullTemplatePath]);
      }
    }

    return updateInfo;
  }

  downloadDb = async (sourceUrl: string, targetFile: string) => {
    await Utilities.download(sourceUrl, targetFile);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    new AdmZip(targetFile).extractAllTo(
      Utilities.slash(path.dirname(targetFile)),
    );
  };

  async doUpdate(updateInfo: UpdateInfo) {
    let topFolderName = 'DocumentBurster';

    // console.log(updateInfo);

    if (updateInfo.mode == 'update-now') {
      if (updateInfo.productInfo.isServerVersion)
        this.updateDestinationDirectoryPath = `${this.upgdDbTempDirectoryPath}/to/${topFolderName}/server`;
      else
        this.updateDestinationDirectoryPath = `${this.upgdDbTempDirectoryPath}/to/${topFolderName}`;
    }

    let homeDirectoryPath = this.portableExecutableDirectoryPath;

    if (updateInfo.productInfo.isServerVersion)
      homeDirectoryPath = path.resolve(homeDirectoryPath, '..');

    //console.log(`homeDirectoryPath = ${homeDirectoryPath}`);

    const upgdDbFromFolderPath = `${this.upgdDbTempDirectoryPath}/from/DocumentBurster`;

    if (updateInfo.mode == 'update-now') {
      //console.log('Log 4');

      await UtilitiesElectron.dirAsync(Utilities.UPG_DB_FOLDER_PATH, {
        empty: true,
        mode: '700',
      });

      //download latest version
      let latestVersionDownloadUrl =
        'https://s3.amazonaws.com/documentburster/newest/documentburster.zip';
      let latestVersionTargetFilePath = `${this.upgdDbTempDirectoryPath}/to/documentburster.zip`;

      if (updateInfo.productInfo.isServerVersion) {
        latestVersionDownloadUrl =
          'https://s3.amazonaws.com/documentburster/newest/documentburster-server.zip';
        latestVersionTargetFilePath = `${this.upgdDbTempDirectoryPath}/to/documentburster-server.zip`;
      }

      //Ensures that directory on given path exists and meets given criteria
      //console.log('Log 5');

      await UtilitiesElectron.dirAsync(`${this.upgdDbTempDirectoryPath}/to`, {
        empty: true,
      });

      await this.downloadDb(
        latestVersionDownloadUrl,
        latestVersionTargetFilePath,
      );

      //it could be DocumentBurster-8.7.1 but it could  be also just
      //DocumentBurster => it should work in both cases
      let topFolderNamePath = '';

      //console.log(
      //  `Log 6 - this.upgdDbTempDirectoryPath = ${this.upgdDbTempDirectoryPath}`
      //);

      topFolderNamePath = await UtilitiesElectron.findAsync(
        `${this.upgdDbTempDirectoryPath}/to`,
        {
          matching: ['DocumentBurster*'],
          files: false,
          directories: true,
          recursive: false,
        },
      )[0];

      if (!topFolderNamePath)
        topFolderNamePath = `${this.upgdDbTempDirectoryPath}/to/DocumentBurster`;

      //console.log(`Log 61 - topFolderNamePath = ${topFolderNamePath}`);

      topFolderName = path.basename(topFolderNamePath);

      if (updateInfo.productInfo.isServerVersion)
        this.updateDestinationDirectoryPath = `${this.upgdDbTempDirectoryPath}/to/${topFolderName}/server`;
      else
        this.updateDestinationDirectoryPath = `${this.upgdDbTempDirectoryPath}/to/${topFolderName}`;

      // keep a backup of the existing installation
      //console.log('Log 7');

      await UtilitiesElectron.copyAsync(
        homeDirectoryPath,
        upgdDbFromFolderPath,
      );
    }

    // console.log(updateInfo);
    /*
    if (updateInfo.mode == 'update-now') {
    } else if (updateInfo.mode == 'migrate-copy') {
    }
    */

    // config files
    for (const configFile of updateInfo.migrateConfigFiles) {
      const configFilePath = configFile[1];

      // console.log(configFilePath);
      await this.migrateSettingsFile(configFilePath);
      // console.log(configFilePath);
    }

    //documentburster.properties
    //old location
    //console.log('Log 8');

    let dbPropertiesFileExists = await UtilitiesElectron.existsAsync(
      `${updateInfo.updateSourceDirectoryPath}/config/burst/internal/documentburster.properties`,
    );

    if (dbPropertiesFileExists) {
      //console.log('Log 9');

      await UtilitiesElectron.copyAsync(
        `${updateInfo.updateSourceDirectoryPath}/config/burst/internal/documentburster.properties`,
        `${this.updateDestinationDirectoryPath}/config/_internal/documentburster.properties`,
        { overwrite: true },
      );
    }

    //new location
    //console.log('Log 10');

    dbPropertiesFileExists = await UtilitiesElectron.existsAsync(
      `${updateInfo.updateSourceDirectoryPath}/config/_internal/documentburster.properties`,
    );

    if (dbPropertiesFileExists) {
      //console.log('Log 11');

      await UtilitiesElectron.copyAsync(
        `${updateInfo.updateSourceDirectoryPath}/config/_internal/documentburster.properties`,
        `${this.updateDestinationDirectoryPath}/config/_internal/documentburster.properties`,
        { overwrite: true },
      );
    }
    // script files
    for (const scriptFile of updateInfo.migrateScriptFiles) {
      const scriptFilePath = scriptFile[1];

      await this.migrateScriptFile(scriptFilePath);
    }

    // template folders
    for (const templateFolder of updateInfo.templatesFolders) {
      const templateFolderName = templateFolder[0];
      const templateFolderPath = templateFolder[1];

      //console.log('Log 12');

      await UtilitiesElectron.copyAsync(
        templateFolderPath,
        `${this.updateDestinationDirectoryPath}/templates/${templateFolderName}`,
        { overwrite: true },
      );
    }

    // if (updateInfo.mode == "migrate-copy") {

    if (updateInfo.updateOptions.copyoutputfiles) {
      //console.log('Log 13');

      await UtilitiesElectron.copyAsync(
        `${updateInfo.updateSourceDirectoryPath}/output`,
        `${this.updateDestinationDirectoryPath}/output`,
        { overwrite: true },
      );
    }

    if (updateInfo.updateOptions.copylogfiles) {
      //console.log('Log 14');

      await UtilitiesElectron.copyAsync(
        `${updateInfo.updateSourceDirectoryPath}/logs`,
        `${this.updateDestinationDirectoryPath}/logs`,
        { overwrite: true },
      );
    }

    if (updateInfo.updateOptions.copyquarantinefiles) {
      //console.log('Log 15');

      await UtilitiesElectron.copyAsync(
        `${updateInfo.updateSourceDirectoryPath}/quarantine`,
        `${this.updateDestinationDirectoryPath}/quarantine`,
        { overwrite: true },
      );
    }

    if (updateInfo.updateOptions.copybackupfiles) {
      //console.log('Log 16');

      await UtilitiesElectron.copyAsync(
        `${updateInfo.updateSourceDirectoryPath}/backup`,
        `${this.updateDestinationDirectoryPath}/backup`,
        { overwrite: true },
      );
    }

    if (updateInfo.updateOptions.copylicensinginformation) {
      //Before v7.1 license.xml file was not existing (software licensing was introduced in v7.1)
      //old location
      //console.log('Log 17');

      let licenseFileExists = await UtilitiesElectron.existsAsync(
        `${updateInfo.updateSourceDirectoryPath}/config/burst/internal/license.xml`,
      );

      if (licenseFileExists) {
        //console.log('Log 18');

        await UtilitiesElectron.copyAsync(
          `${updateInfo.updateSourceDirectoryPath}/config/burst/internal/license.xml`,
          `${this.updateDestinationDirectoryPath}/config/_internal/license.xml`,
          { overwrite: true },
        );
      }
      //new location
      //console.log('Log 19');

      licenseFileExists = await UtilitiesElectron.existsAsync(
        `${updateInfo.updateSourceDirectoryPath}/config/_internal/license.xml`,
      );

      if (licenseFileExists) {
        //console.log('Log 20');

        await UtilitiesElectron.copyAsync(
          `${updateInfo.updateSourceDirectoryPath}/config/_internal/license.xml`,
          `${this.updateDestinationDirectoryPath}/config/_internal/license.xml`,
          { overwrite: true },
        );
      }
    }

    //}

    if (updateInfo.mode == 'update-now') {
      //console.log('Log 21');

      let allFilesAndFoldersPaths = await UtilitiesElectron.findAsync(
        homeDirectoryPath,
        {
          matching: ['**/*'],
          directories: true,
        },
      );

      //remove all but not DocumentBurster.exe
      allFilesAndFoldersPaths = allFilesAndFoldersPaths.filter(
        (fileFolderPath) => !fileFolderPath.includes('DocumentBurster.exe'),
      );

      for (const fileFolderPath of allFilesAndFoldersPaths) {
        //console.log('Log 22');
        await UtilitiesElectron.removeAsync(fileFolderPath);
      }

      //console.log('Log 23');

      await UtilitiesElectron.copyAsync(
        `${this.upgdDbTempDirectoryPath}/to/${topFolderName}`,
        homeDirectoryPath,
        {
          matching: [
            `!${this.updateDestinationDirectoryPath}/DocumentBurster.exe`,
          ],
          overwrite: true,
        },
      );

      if (updateInfo.productInfo.isServerVersion)
        this.backupZipFileName = `documentburster-server-${updateInfo.productInfo.version}-${this.nowFormatted}.zip`;
      else
        this.backupZipFileName = `documentburster-${updateInfo.productInfo.version}-${this.nowFormatted}.zip`;

      const zip = new AdmZip();
      zip.addLocalFolder(`${this.upgdDbTempDirectoryPath}/from`);

      zip.writeZip(`${this.upgdDbTempDirectoryPath}/${this.backupZipFileName}`);

      //console.log('Log 24');
      await UtilitiesElectron.moveAsync(
        `${this.upgdDbTempDirectoryPath}/${this.backupZipFileName}`,
        `${updateInfo.updateSourceDirectoryPath}/backup/${this.backupZipFileName}`,
      );
    }
  }

  async migrateSettingsFile(settingsFilePath: string) {
    //console.log(
    //  `Log 86 - this.updateDestinationDirectoryPath = ${this.updateDestinationDirectoryPath}`
    //);

    //console.log(`Log 99 - settingsFilePath = ${settingsFilePath}`);

    //console.log('Log 25');
    let previousXMLSettingsContent =
      await UtilitiesElectron.readAsync(settingsFilePath);

    if (!previousXMLSettingsContent) {
      Error.stackTraceLimit = 100;
      console.log(`Log 25 - settingsFilePath = ${settingsFilePath}`);
    }

    const previousConfigFileName = Utilities.basename(settingsFilePath);

    const newMigratedSettingsFilePath = `${this.updateDestinationDirectoryPath}/config/burst/${previousConfigFileName}`;

    //STEP0 - some configuration settings node names were renamed (no structural changes)

    //this is a quick way to "re-map" such old tag names to the new tag names
    if (previousXMLSettingsContent.includes('defaultmessage')) {
      previousXMLSettingsContent = previousXMLSettingsContent
        .split('<defaultmessage>')
        .join('<emailsettings>');

      previousXMLSettingsContent = previousXMLSettingsContent
        .split('</defaultmessage>')
        .join('</emailsettings>');
    }

    if (previousXMLSettingsContent.includes('defaultmessage'))
      if (this.log)
        this.log.error(
          `migrateSettingsFile - ${newMigratedSettingsFilePath} 'defaultmessage' not expected!`,
        );

    if (!previousXMLSettingsContent.includes('emailsettings'))
      if (this.log)
        this.log.error(
          `migrateSettingsFile - ${newMigratedSettingsFilePath} 'emailsettings' not found!`,
        );

    previousXMLSettingsContent = previousXMLSettingsContent
      .split('<defaultftp>')
      .join('<uploadsettings>');
    previousXMLSettingsContent = previousXMLSettingsContent
      .split('</defaultftp>')
      .join('</uploadsettings>');

    if (previousXMLSettingsContent.includes('defaultftp'))
      if (this.log)
        this.log.error(
          `migrateSettingsFile - ${newMigratedSettingsFilePath} 'defaultftp' not expected!`,
        );

    if (!previousXMLSettingsContent.includes('uploadsettings'))
      if (this.log)
        this.log.error(
          `migrateSettingsFile - ${newMigratedSettingsFilePath} 'uploadsettings' not found!`,
        );

    previousXMLSettingsContent = previousXMLSettingsContent
      .split('<url>')
      .join('<ftpcommand>');
    previousXMLSettingsContent = previousXMLSettingsContent
      .split('</url>')
      .join('</ftpcommand>');

    if (previousXMLSettingsContent.includes('<url'))
      if (this.log)
        this.log.error(
          `migrateSettingsFile - ${newMigratedSettingsFilePath} '<url' not expected!`,
        );

    if (!previousXMLSettingsContent.includes('ftpcommand'))
      if (this.log)
        this.log.error(
          `migrateSettingsFile - ${newMigratedSettingsFilePath} 'ftpcommand' not found!`,
        );

    const previousSettings = await Utilities.parseStringPromise(
      previousXMLSettingsContent,
      {
        trim: true,
        explicitArray: false,
      },
    );

    //console.log(`defaultSettings = ${this.defaultSettings}`);

    if (!this.defaultSettings) {
      //console.log('Log 26');
      const defaultsXMLSettingsContent = await UtilitiesElectron.readAsync(
        `${this.updateDestinationDirectoryPath}/config/_defaults/settings.xml`,
      );

      //console.log(`defaultsXMLSettingsContent = ${defaultsXMLSettingsContent}`);
      //console.log(
      //  `this.updateDestinationDirectoryPath = ${this.updateDestinationDirectoryPath}`
      //);

      this.defaultSettings = await Utilities.parseStringPromise(
        defaultsXMLSettingsContent,
        {
          trim: true,
          explicitArray: false,
        },
      );
    }

    const migratedSettings = JSON.parse(JSON.stringify(this.defaultSettings));

    const numberOfUserVariables =
      previousSettings.documentburster.settings.numberofuservariables;

    //STEP1 - automatically migrate the vast majority of the configuration settings for which the structure
    //did not change between the software versions
    Utilities.traverseJSONObjTree(migratedSettings, (key, value, scope) => {
      //version should not be copied from the previousSettings
      if (typeof value !== 'object' && key != 'version') {
        const currentConfigurationItemKeys = scope.concat(key);

        const configurationStructureDidNotChange =
          this.checkObjectHasAllAttributes(
            previousSettings,
            currentConfigurationItemKeys,
          );

        let migratedValue = value;

        if (configurationStructureDidNotChange) {
          //initialize the "migratedValue" configuration value with the previous configuration value
          migratedValue = Utilities.getDeeplyNestedLastProp(
            previousSettings,
            currentConfigurationItemKeys,
          );

          //if neeeded, migrate STRINGTEMPLATE_SYNTAX_TO_FREEMARKER_SYNTAX
          if (migratedValue) {
            // remove the line breaks characters which sometimes appear in the configuration values
            // (but don't remove this from the email message configurations)

            if (!['text', 'html', 'subject'].includes(key)) {
              // remove the line breaks
              migratedValue = migratedValue.replace(/(\r\n|\n|\r)/gm, '');

              // remove the spaces but only if in between $ and $ (i.e only for vars, not for folder paths with spaces)
              if (migratedValue)
                migratedValue = migratedValue.replace(/\s+(?=[^$\$]*\$)/g, '');
            }

            if (migratedValue)
              for (const [keyST, valueFM] of Array.from(
                this
                  .BUILTIN_VARS_LEGACY_STRINGTEMPLATE_SYNTAX_TO_FREEMARKER_SYNTAX_MAP,
              )) {
                //migrate STRINGTEMPLATE_SYNTAX_TO_FREEMARKER_SYNTAX
                migratedValue = migratedValue.split(keyST).join(valueFM);
              }

            if (migratedValue)
              for (let i = 0; i < numberOfUserVariables; i++) {
                //migrate STRINGTEMPLATE_SYNTAX_TO_FREEMARKER_SYNTAX
                migratedValue = migratedValue
                  .split(`$var${i}$`)
                  .join(`$\{var${i}\}`);
              }
          }
        } else {
          if (key == 'template' && previousConfigFileName != 'settings.xml')
            migratedValue = previousConfigFileName;
        }

        this.setDeeplyNestedLastProp(
          migratedSettings,
          migratedValue,
          currentConfigurationItemKeys,
        );
      }
    });

    //STEP2 - new default values for configuration settings for which the structure did not change between
    if (
      previousSettings.documentburster.settings.numberofuservariables == '10'
    ) {
      migratedSettings.documentburster.settings.numberofuservariables = '20';
    }

    //STEP3 - manually migrate the configuration settings for which the structure did change between
    //versions

    // do this only if the structure is old like this <sendfiles>true</sendfiles>

    // otherwise, if the structure is new like <sendfiles><email>true</email></sendfiles> the below
    // line of code should not execute
    if (
      typeof previousSettings.documentburster.settings.sendfiles.email ===
      'undefined'
    )
      migratedSettings.documentburster.settings.sendfiles.email =
        previousSettings.documentburster.settings.sendfiles;

    if (
      migratedSettings.documentburster.settings.uploadsettings.ftpcommand ==
      'ftp://'
    )
      migratedSettings.documentburster.settings.uploadsettings.ftpcommand = '';

    //STEP5 - manually handle few special situations
    if (
      migratedSettings.documentburster.settings.burstfilename.includes(
        'input_document_extension',
      )
    )
      migratedSettings.documentburster.settings.burstfilename =
        migratedSettings.documentburster.settings.burstfilename.replace(
          'input_document_extension',
          'output_type_extension',
        );

    migratedSettings.documentburster.settings.qualityassurance.emailserver.port =
      this.defaultSettings.documentburster.settings.qualityassurance.emailserver.port;

    migratedSettings.documentburster.settings.sortbyposition =
      this.defaultSettings.documentburster.settings.sortbyposition;

    migratedSettings.documentburster.settings.emailserver.useconn = false;
    migratedSettings.documentburster.settings.emailserver.conncode = '';

    // console.log(`${this.updateDestinationDirectoryPath}/config/burst/${previousConfigFileName}`);

    //finally, once everything is migrated, save the configuration
    return new Settings().saveSettingsFileAsync(
      migratedSettings,
      newMigratedSettingsFilePath,
    );
  }

  async migrateScriptFile(
    scriptFilePath: string,
    legacyVersion?: string,
  ): Promise<string> {
    const scriptFileName = path.basename(scriptFilePath);

    let newScriptFilePath = `${this.updateDestinationDirectoryPath}/scripts/burst/${scriptFileName}`;

    if (legacyVersion)
      newScriptFilePath = `${this.updateDestinationDirectoryPath}/scripts/burst/${legacyVersion}/${scriptFileName}`;

    //ASYNC ISSUE - if I make this async it fails
    //console.log('Log 27');
    await UtilitiesElectron.copyAsync(scriptFilePath, newScriptFilePath, {
      overwrite: true,
    });

    /*
    let exists = await fsExtra.pathExists(scriptFilePath);
 
    if (exists)
      console.log(scriptFilePath);
    else
      throw new Error(`!!! scriptFilePath File Path Not Found -  ${scriptFilePath}`);
 
    exists = await fsExtra.pathExists(newScriptFilePath);
 
    if (exists)
      console.log(newScriptFilePath);
    else
      throw new Error(`!!! newScriptFilePath File Path Not Found -  ${newScriptFilePath}`);
    
      */

    let replaceValues: { from: string; to: string }[] = [];

    replaceValues.push({
      from: 'import com.smartwish',
      to: 'import com.sourcekraft',
    });

    replaceValues.push({ from: 'extractFilePath', to: 'extractedFilePath' });

    replaceValues.push({
      from: 'org.apache.commons.vfs.tasks',
      to: 'org.apache.commons.vfs2.tasks',
    });

    replaceValues.push({
      from: ';lib/burst/commons-logging-1.1.1.jar',
      to: ';lib/burst/jcl-over-slf4j-1.7.30.jar;lib/burst/slf4j-api-1.7.30.jar',
    });

    replaceValues.push({
      from: 'jcl-over-slf4j-1.7.5.jar',
      to: 'jcl-over-slf4j-1.7.30.jar',
    });

    replaceValues.push({
      from: 'slf4j-api-1.7.5.jar',
      to: 'slf4j-api-1.7.30.jar',
    });

    replaceValues.push({
      from: 'lib/burst/pdfbox-1.0.0.jar',
      to: 'lib/burst/pdfbox-2.0.20.jar;lib/burst/pdfbox-tools-2.0.20.jar',
    });

    replaceValues.push({
      from: 'lib/burst/pdfbox-1.8.2.jar',
      to: 'lib/burst/pdfbox-2.0.20.jar;lib/burst/pdfbox-tools-2.0.20.jar',
    });

    replaceValues.push({
      from: 'jempbox-1.0.0.jar',
      to: 'xmpbox-2.0.20.jar',
    });

    replaceValues.push({
      from: 'jempbox-1.8.2.jar',
      to: 'xmpbox-2.0.20.jar',
    });

    replaceValues.push({
      from: 'fontbox-1.0.0.jar',
      to: 'fontbox-2.0.20.jar',
    });

    replaceValues.push({
      from: 'fontbox-1.8.2.jar',
      to: 'fontbox-2.0.20.jar',
    });

    replaceValues.push({
      from: 'bcmail-jdk15-1.44.jar',
      to: 'bcmail-jdk15-1.46.jar',
    });

    replaceValues.push({
      from: 'bcprov-jdk15-1.44.jar',
      to: 'bcprov-jdk15-1.46.jar',
    });

    //console.log('Log 28');
    //console.log(`newScriptFilePath = ${newScriptFilePath}`);

    let scriptContent = await UtilitiesElectron.readAsync(newScriptFilePath);
    //console.log(`scriptContent before = ${scriptContent}`);

    for (const replaceValue of replaceValues) {
      if (scriptContent.includes(replaceValue.from)) {
        scriptContent = scriptContent.replace(
          new RegExp(replaceValue.from, 'g'),
          replaceValue.to,
        );
      }
    }

    scriptContent = scriptContent.replace(
      new RegExp(
        'samples\\/stamp\\.pdf \\\\"\\$inputFile\\\\" \\\\"\\$inputFile\\\\"',
        'g',
      ),
      '\\"$inputFile\\" samples/Stamp.pdf \\"$inputFile\\"',
    );

    scriptContent = scriptContent.replace(
      new RegExp(
        'samples\\/Stamp\\.pdf \\\\"\\$inputFile\\\\" \\\\"\\$inputFile\\\\"',
        'g',
      ),
      '\\"$inputFile\\" samples/Stamp.pdf \\"$inputFile\\"',
    );

    //correct groovy vars
    scriptContent = scriptContent.replace(
      new RegExp('.Overlay \\$overlayOptions', 'g'),
      '.OverlayPDF ${overlayOptions}',
    );

    if (
      scriptContent.includes('.Overlay') &&
      !scriptContent.includes('.OverlayPDF ${overlayOptions}')
    )
      if (this.log)
        this.log.error(
          `migrateScriptFile - ${newScriptFilePath} '.OverlayPDF \${overlayOptions}' not found!`,
        );

    if (
      scriptContent.includes('org.apache.pdfbox.') &&
      !scriptContent.includes('org.apache.pdfbox.tools.')
    ) {
      scriptContent = scriptContent.replace(
        new RegExp('-cp \\$pdfBoxClassPath org.apache.pdfbox.', 'g'),
        '-cp ${pdfBoxClassPath} org.apache.pdfbox.tools.',
      );

      if (
        scriptContent.includes('pdfBoxClassPath') &&
        scriptContent.includes('org.apache.pdfbox.') &&
        !scriptContent.includes('org.apache.pdfbox.tools')
      )
        if (this.log)
          this.log.error(
            `migrateScriptFile - ${newScriptFilePath} 'org.apache.pdfbox.tools' not found!`,
          );
    }
    scriptContent = scriptContent.replace(
      new RegExp('\\$hostName', 'g'),
      '${hostName}',
    );

    if (scriptContent.includes('$hostName'))
      if (this.log)
        this.log.error(
          `migrateScriptFile - ${newScriptFilePath} '$hostName' not expected!`,
        );

    scriptContent = scriptContent.replace(
      new RegExp('\\$tempFilePath', 'g'),
      '${tempFilePath}',
    );

    if (scriptContent.includes('$tempFilePath'))
      if (this.log)
        this.log.error(
          `migrateScriptFile - ${newScriptFilePath} '$tempFilePath' not expected!`,
        );

    scriptContent = scriptContent.replace(
      new RegExp('\\$curlOptions', 'g'),
      '${curlOptions}',
    );

    if (scriptContent.includes('$curlOptions'))
      if (this.log)
        this.log.error(
          `migrateScriptFile - ${newScriptFilePath} '$curlOptions' not expected!`,
        );

    scriptContent = scriptContent.replace(
      new RegExp('\\$userName', 'g'),
      '${userName}',
    );

    if (scriptContent.includes('$userName'))
      if (this.log)
        this.log.error(
          `migrateScriptFile - ${newScriptFilePath} '$userName' not expected!`,
        );

    scriptContent = scriptContent.replace(
      new RegExp('\\$password', 'g'),
      '${password}',
    );

    if (scriptContent.includes('$password'))
      if (this.log)
        this.log.error(
          `migrateScriptFile - ${newScriptFilePath} '$password' not expected!`,
        );

    scriptContent = scriptContent.replace(
      new RegExp('\\$absolutePath', 'g'),
      '${absolutePath}',
    );

    if (scriptContent.includes('$absolutePath'))
      if (this.log)
        this.log.error(
          `migrateScriptFile - ${newScriptFilePath} '$absolutePath' not expected!`,
        );

    scriptContent = scriptContent.replace(
      new RegExp('\\$destDir', 'g'),
      '${destDir}',
    );

    if (scriptContent.includes('$destDir'))
      if (this.log)
        this.log.error(
          `migrateScriptFile - ${newScriptFilePath} '$destDir' not expected!`,
        );

    scriptContent = scriptContent.replace(
      new RegExp('\\$sharedLocationPath', 'g'),
      '${sharedLocationPath}',
    );

    if (scriptContent.includes('$sharedLocationPath'))
      if (this.log)
        this.log.error(
          `migrateScriptFile - ${newScriptFilePath} '$sharedLocationPath' not expected!`,
        );

    scriptContent = scriptContent.replace(
      new RegExp('\\$uploadFilePath', 'g'),
      '${uploadFilePath}',
    );

    if (scriptContent.includes('$uploadFilePath'))
      if (this.log)
        this.log.error(
          `migrateScriptFile - ${newScriptFilePath} '$uploadFilePath' not expected!`,
        );

    scriptContent = scriptContent.replace(
      new RegExp('\\$execOptions', 'g'),
      '${execOptions}',
    );

    if (scriptContent.includes('$execOptions'))
      if (this.log)
        this.log.error(
          `migrateScriptFile - ${newScriptFilePath} '$execOptions' not expected!`,
        );

    scriptContent = scriptContent.replace(
      new RegExp('\\$inputFile', 'g'),
      '${inputFile}',
    );

    if (scriptContent.includes('$inputFile'))
      if (this.log)
        this.log.error(
          `migrateScriptFile - ${newScriptFilePath} '$inputFile' not expected!`,
        );

    scriptContent = scriptContent.replace(
      new RegExp('\\$pdfBoxClassPath', 'g'),
      '${pdfBoxClassPath}',
    );

    if (scriptContent.includes('$pdfBoxClassPath'))
      if (this.log)
        this.log.error(
          `migrateScriptFile - ${newScriptFilePath} '$pdfBoxClassPath' not expected!`,
        );

    scriptContent = scriptContent.replace(
      new RegExp('\\$encryptOptions', 'g'),
      '${encryptOptions}',
    );

    if (scriptContent.includes('$encryptOptions'))
      if (this.log)
        this.log.error(
          `migrateScriptFile - ${newScriptFilePath} '$encryptOptions' not expected!`,
        );

    scriptContent = scriptContent.replace(
      new RegExp('\\$extractedFilePath', 'g'),
      '${extractedFilePath}',
    );

    if (scriptContent.includes('$extractedFilePath'))
      if (this.log)
        this.log.error(
          `migrateScriptFile - ${newScriptFilePath} '$extractedFilePath' not expected!`,
        );

    scriptContent = scriptContent.replace(
      new RegExp('\\$stampedFilePath', 'g'),
      '${stampedFilePath}',
    );

    if (scriptContent.includes('$stampedFilePath'))
      if (this.log)
        this.log.error(
          `migrateScriptFile - ${newScriptFilePath} '$stampedFilePath' not expected!`,
        );

    scriptContent = scriptContent.replace(
      new RegExp('\\$overlayOptions', 'g'),
      '${overlayOptions}',
    );

    if (scriptContent.includes('$overlayOptions'))
      if (this.log)
        this.log.error(
          `migrateScriptFile - ${newScriptFilePath} '$overlayOptions' not expected!`,
        );

    scriptContent = scriptContent.replace(
      new RegExp('\\$printOptions', 'g'),
      '${printOptions}',
    );

    if (scriptContent.includes('$printOptions'))
      if (this.log)
        this.log.error(
          `migrateScriptFile - ${newScriptFilePath} '$printOptions' not expected!`,
        );

    scriptContent = scriptContent.replace(
      new RegExp('\\$numberedFilePath', 'g'),
      '${numberedFilePath}',
    );

    if (scriptContent.includes('$numberedFilePath'))
      if (this.log)
        this.log.error(
          `migrateScriptFile - ${newScriptFilePath} '$numberedFilePath' not expected!`,
        );

    scriptContent = scriptContent.replace(
      new RegExp('\\$host', 'g'),
      '${host}',
    );

    if (scriptContent.includes('$host'))
      if (this.log)
        this.log.error(
          `migrateScriptFile - ${newScriptFilePath} '$host' not expected!`,
        );

    scriptContent = scriptContent.replace(
      new RegExp('\\$port', 'g'),
      '${port}',
    );

    if (scriptContent.includes('$port'))
      if (this.log)
        this.log.error(
          `migrateScriptFile - ${newScriptFilePath} '$port' not expected!`,
        );

    scriptContent = scriptContent.replace(
      new RegExp('\\$user', 'g'),
      '${user}',
    );

    if (scriptContent.includes('$user'))
      if (this.log)
        this.log.error(
          `migrateScriptFile - ${newScriptFilePath} '$user' not expected!`,
        );

    scriptContent = scriptContent.replace(
      new RegExp('\\$subject', 'g'),
      '${subject}',
    );

    if (scriptContent.includes('$subject'))
      if (this.log)
        this.log.error(
          `migrateScriptFile - ${newScriptFilePath} '$subject' not expected!`,
        );

    scriptContent = scriptContent.replace(
      new RegExp('\\$from', 'g'),
      '${from}',
    );

    if (scriptContent.includes('$from'))
      if (this.log)
        this.log.error(
          `migrateScriptFile - ${newScriptFilePath} '$from' not expected!`,
        );

    scriptContent = scriptContent.replace(new RegExp('\\$to', 'g'), '${to}');

    if (scriptContent.includes('$to'))
      if (this.log)
        this.log.error(
          `migrateScriptFile - ${newScriptFilePath} '$to' not expected!`,
        );

    scriptContent = scriptContent.replace(
      new RegExp('\\$message', 'g'),
      '${message}',
    );

    if (scriptContent.includes('$message'))
      if (this.log)
        this.log.error(
          `migrateScriptFile - ${newScriptFilePath} '$message' not expected!`,
        );

    scriptContent = scriptContent.replace(new RegExp('\\$ssl', 'g'), '${ssl}');

    if (scriptContent.includes('$ssl'))
      if (this.log)
        this.log.error(
          `migrateScriptFile - ${newScriptFilePath} '$ssl' not expected!`,
        );

    scriptContent = scriptContent.replace(
      new RegExp('\\$enableStartTLS', 'g'),
      '${enableStartTLS}',
    );

    if (scriptContent.includes('$enableStartTLS'))
      if (this.log)
        this.log.error(
          `migrateScriptFile - ${newScriptFilePath} '$enableStartTLS' not expected!`,
        );

    scriptContent = scriptContent.replace(
      new RegExp('\\$mergedFileName', 'g'),
      '${mergedFileName}',
    );

    if (scriptContent.includes('$mergedFileName'))
      if (this.log)
        this.log.error(
          `migrateScriptFile - ${newScriptFilePath} '$mergedFileName' not expected!`,
        );

    scriptContent = scriptContent.replace(
      new RegExp('\\${employeeRow.employee_id}', 'g'),
      '$employeeRow.employee_id',
    );

    if (scriptContent.includes('${employeeRow.employee_id}'))
      if (this.log)
        this.log.error(
          `migrateScriptFile - ${newScriptFilePath} '\${employeeRow.employee_id}' not expected!`,
        );

    scriptContent = scriptContent.replace(
      new RegExp('String\\.valueOf\\("\\${token}"\\)', 'g'),
      `"\${token}"`,
    );

    scriptContent = scriptContent.replace(
      new RegExp('String\\.valueOf\\("\\${emailAddress}"\\)', 'g'),
      `"\${emailAddress}"`,
    );

    scriptContent = scriptContent.replace(
      new RegExp('String\\.valueOf\\("\\${firstName}"\\)', 'g'),
      `"\${firstName}"`,
    );

    scriptContent = scriptContent.replace(
      new RegExp('String\\.valueOf\\("\\${lastName}"\\)', 'g'),
      `"\${lastName}"`,
    );

    if (scriptContent.includes('String.valueOf'))
      if (this.log)
        this.log.error(
          `migrateScriptFile - ${newScriptFilePath} 'String.valueOf' not expected!`,
        );

    scriptContent = scriptContent.replace(
      new RegExp('\\$var0\\$', 'g'),
      '${var0}',
    );

    if (scriptContent.includes('$var0$'))
      if (this.log)
        this.log.error(
          `migrateScriptFile - ${newScriptFilePath} '$var0$' not expected!`,
        );

    scriptContent = scriptContent.replace(
      new RegExp('\\$var1\\$', 'g'),
      '${var1}',
    );

    if (scriptContent.includes('$var1$'))
      if (this.log)
        this.log.error(
          `migrateScriptFile - ${newScriptFilePath} '$var1$' not expected!`,
        );

    scriptContent = scriptContent.replace(
      new RegExp('\\$var2\\$', 'g'),
      '${var2}',
    );

    if (scriptContent.includes('$var2$'))
      if (this.log)
        this.log.error(
          `migrateScriptFile - ${newScriptFilePath} '$var2$' not expected!`,
        );

    scriptContent = scriptContent.replace(
      new RegExp('\\$var3\\$', 'g'),
      '${var3}',
    );

    if (scriptContent.includes('$var3$'))
      if (this.log)
        this.log.error(
          `migrateScriptFile - ${newScriptFilePath} '$var3$' not expected!`,
        );
    //end correct groovy vars

    //console.log(`scriptContent after = ${scriptContent}`);

    if (scriptContent.includes('import com.smartwish'))
      if (this.log)
        this.log.error(
          `migrateScriptFile - ${newScriptFilePath} 'import com.smartwish' not expected!`,
        );

    if (scriptContent.includes('extractFilePath'))
      if (this.log)
        this.log.error(
          `migrateScriptFile - ${newScriptFilePath} 'extractFilePath' not expected!`,
        );

    if (
      scriptContent.includes(
        'samples/Stamp.pdf \\"$inputFile\\" \\"$inputFile\\"',
      )
    )
      if (this.log)
        this.log.error(
          `migrateScriptFile - ${newScriptFilePath} 'samples/Stamp.pdf \\"$inputFile\\" \\"$inputFile\\"' not expected!`,
        );

    if (
      scriptContent.includes(
        'samples/stamp.pdf \\"$inputFile\\" \\"$inputFile\\"',
      )
    )
      if (this.log)
        this.log.error(
          `migrateScriptFile - ${newScriptFilePath} 'samples/stamp.pdf \\"$inputFile\\" \\"$inputFile\\"' not expected!`,
        );

    if (scriptContent.includes('org.apache.commons.vfs.tasks'))
      if (this.log)
        this.log.error(
          `migrateScriptFile - ${newScriptFilePath} 'org.apache.commons.vfs.tasks' not expected!`,
        );

    if (scriptContent.includes('commons-logging'))
      if (this.log)
        this.log.error(
          `migrateScriptFile - ${newScriptFilePath} 'commons-logging' not expected!`,
        );

    if (scriptContent.includes('jcl-over-slf4j-1.7.5.jar'))
      if (this.log)
        this.log.error(
          `migrateScriptFile - ${newScriptFilePath} 'jcl-over-slf4j-1.7.5.jar' not expected!`,
        );

    if (scriptContent.includes('slf4j-api-1.7.5.jar'))
      if (this.log)
        this.log.error(
          `migrateScriptFile - ${newScriptFilePath} 'slf4j-api-1.7.5.jar' not expected!`,
        );

    if (scriptContent.includes('pdfbox-1.0.0.jar'))
      if (this.log)
        this.log.error(
          `migrateScriptFile - ${newScriptFilePath} 'pdfbox-1.0.0.jar' not expected!`,
        );

    if (scriptContent.includes('pdfbox-1.8.2.jar'))
      if (this.log)
        this.log.error(
          `migrateScriptFile - ${newScriptFilePath} 'pdfbox-1.8.2.jar' not expected!`,
        );

    if (scriptContent.includes('jempbox-1.0.0.jar'))
      if (this.log)
        this.log.error(
          `migrateScriptFile - ${newScriptFilePath} 'jempbox-1.0.0.jar' not expected!`,
        );

    if (scriptContent.includes('jempbox-1.8.2.jar'))
      if (this.log)
        this.log.error(
          `migrateScriptFile - ${newScriptFilePath} 'jempbox-1.8.2.jar' not expected!`,
        );

    if (scriptContent.includes('fontbox-1.0.0.jar'))
      if (this.log)
        this.log.error(
          `migrateScriptFile - ${newScriptFilePath} 'fontbox-1.0.0.jar' not expected!`,
        );

    if (scriptContent.includes('fontbox-1.8.2.jar'))
      if (this.log)
        this.log.error(
          `migrateScriptFile - ${newScriptFilePath} 'fontbox-1.8.2.jar' not expected!`,
        );

    if (scriptContent.includes('bcmail-jdk15-1.44.jar'))
      if (this.log)
        this.log.error(
          `migrateScriptFile - ${newScriptFilePath} 'bcmail-jdk15-1.44.jar' not expected!`,
        );

    if (scriptContent.includes('bcprov-jdk15-1.44.jar'))
      if (this.log)
        this.log.error(
          `migrateScriptFile - ${newScriptFilePath} 'bcprov-jdk15-1.44.jar' not expected!`,
        );

    //console.log('Log 29');
    await UtilitiesElectron.writeAsync(newScriptFilePath, scriptContent);

    return Promise.resolve(newScriptFilePath);
  }

  async removeTempUpgradeFolder() {
    //console.log('Log 30');
    return UtilitiesElectron.removeAsync(this.upgdDbTempDirectoryPath);
  }

  checkObjectHasAllAttributes(obj: any, attrs: Array<string>): boolean {
    let tempObj = obj;

    let hasAllAttrs = true;

    for (const attr of attrs) {
      if (hasAllAttrs) {
        tempObj = tempObj[attr];
        hasAllAttrs = typeof tempObj !== 'undefined';
      }
    }

    return hasAllAttrs;
  }

  setDeeplyNestedLastProp(obj: any, value: string, props: Array<string>) {
    const [head, ...rest] = props;

    !rest.length
      ? (obj[head] = value)
      : this.setDeeplyNestedLastProp(obj[head], value, rest);
  }
}
