import * as xml2js from 'xml2js';

import { promises as fsp } from 'fs';

import Utilities from './utilities';

export class Settings {
  constructor(protected fs: typeof fsp) {}
  async saveSettingsFileAsync(settings: {}, filePath: string) {
    //console.log(`filePath: ${filePath}`);
    //console.log(`settings: ${JSON.stringify(settings)}`);

    try {
      await this.fs.rm(filePath);
      //await this.fs.unlink(filePath);
    } catch (error) {
    } finally {
      const builder = new xml2js.Builder();
      return this.fs.writeFile(filePath, builder.buildObject(settings));
      //return this.fs.writeFile(filePath, '123');
    }
  }

  async loadFileContentAsync(filePath: string): Promise<string> {
    return this.fs.readFile(filePath, 'utf8');
  }

  async loadReportingFileAsync(filePath: string): Promise<any> {
    const configFolderPath = Utilities.dirname(filePath);

    const configReportingFilePath = `${configFolderPath}/reporting.xml`;

    const content = await this.fs.readFile(configReportingFilePath, 'utf8');

    return Utilities.parseStringPromise(content, {
      trim: true,
      explicitArray: false,
      valueProcessors: [xml2js.processors.parseBooleans],
    });
  }

  async loadSettingsFileAsync(filePath: string): Promise<any> {
    //console.trace();

    const content = await this.fs.readFile(filePath, 'utf8');

    const parsedString = await Utilities.parseStringPromise(content, {
      trim: true,
      explicitArray: false,
      valueProcessors: [xml2js.processors.parseBooleans],
    });

    //XML files from older versions (i.e. v5) do not contain attachments
    if (parsedString.documentburster.settings.attachments) {
      if (parsedString.documentburster.settings.attachments.items.attachment) {
        if (
          !Array.isArray(
            parsedString.documentburster.settings.attachments.items.attachment
          )
        ) {
          parsedString.documentburster.settings.attachments.items.attachment = [
            parsedString.documentburster.settings.attachments.items.attachment,
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
    const content = await this.fs.readFile(filePath, 'utf8');

    const parsedString = await Utilities.parseStringPromise(content, {
      trim: true,
      explicitArray: false,
      valueProcessors: [xml2js.processors.parseBooleans],
    });

    return parsedString;
  }

  async parseXmlFileAsync(filePath: string): Promise<any> {
    //console.trace();

    const content = await this.fs.readFile(filePath, 'utf8');

    const xml = await Utilities.parseStringPromise(content, {
      trim: true,
      explicitArray: false,
      valueProcessors: [xml2js.processors.parseBooleans],
    });

    return xml;
  }
}
