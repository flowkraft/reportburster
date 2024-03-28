import * as xml2js from 'xml2js';
import Utilities from './utilities';
import UtilitiesElectron from './utilities-electron';

export class Settings {
  constructor() {}
  async saveSettingsFileAsync(settings: {}, filePath: string) {
    //console.log(`filePath: ${filePath}`);
    //console.log(`settings: ${JSON.stringify(settings)}`);

    try {
      await UtilitiesElectron.removeAsync(filePath);
      //await this.fs.unlink(filePath);
    } catch (error) {
    } finally {
      const builder = new xml2js.Builder();
      return UtilitiesElectron.writeAsync(
        filePath,
        builder.buildObject(settings),
      );

      //return this.fs.writeFile(filePath, '123');
    }
  }

  async loadFileContentAsync(filePath: string): Promise<string> {
    return UtilitiesElectron.readAsync(filePath);
  }

  async loadReportingFileAsync(filePath: string): Promise<any> {
    const configFolderPath = Utilities.dirname(filePath);

    const configReportingFilePath = `${configFolderPath}/reporting.xml`;

    const content = await UtilitiesElectron.readAsync(configReportingFilePath);

    return Utilities.parseStringPromise(content, {
      trim: true,
      explicitArray: false,
      valueProcessors: [xml2js.processors.parseBooleans],
    });
  }

  async loadSettingsFileAsync(filePath: string): Promise<any> {
    //console.trace();

    const content = await UtilitiesElectron.readAsync(filePath);

    const parsedString = await Utilities.parseStringPromise(content, {
      trim: true,
      explicitArray: false,
      valueProcessors: [xml2js.processors.parseBooleans],
    });

    //XML files from older versions (i.e. v5) do not contain attachments
    if (parsedString.documentburster.settings.attachments) {
      if (
        parsedString.documentburster.settings.attachments.items.attachmentItems
      ) {
        if (
          !Array.isArray(
            parsedString.documentburster.settings.attachments.items
              .attachmentItems,
          )
        ) {
          parsedString.documentburster.settings.attachments.items.attachmentItems =
            [
              parsedString.documentburster.settings.attachments.itemsItems
                .attachment,
            ];
        }
      } else {
        parsedString.documentburster.settings.attachments.items = {};
        parsedString.documentburster.settings.attachments.items.attachment = [];
      }
    }

    return parsedString;
  }

  async loadPreferencesFileAsync(filePath: string): Promise<any> {
    const content = await UtilitiesElectron.readAsync(filePath);

    const parsedString = await Utilities.parseStringPromise(content, {
      trim: true,
      explicitArray: false,
      valueProcessors: [xml2js.processors.parseBooleans],
    });

    return parsedString;
  }

  async parseXmlFileAsync(filePath: string): Promise<any> {
    //console.trace();

    const content = await UtilitiesElectron.readAsync(filePath);

    const xml = await Utilities.parseStringPromise(content, {
      trim: true,
      explicitArray: false,
      valueProcessors: [xml2js.processors.parseBooleans],
    });

    return xml;
  }
}
