import * as xml2js from 'xml2js';
import Utilities from '../../helpers/utilities';

let fs, AdmZip, path, os, jetpack;

if (typeof window !== 'undefined' && window.require) {
  fs = window.require('fs');
  AdmZip = window.require('adm-zip');
  path = window.require('path');
  os = window.require('os');
  jetpack = window.require('fs-jetpack');
} else {
  fs = require('fs');
  AdmZip = require('adm-zip');
  path = require('path');
  os = require('os');
  jetpack = require('fs-jetpack');
}

export default class UtilitiesNodeJs {
  static pathResolve(pathSegments: string[]): string {
    return path.resolve(...pathSegments);
  }

  static osTmpDir(): string {
    return os.tmpdir();
  }

  static async download(
    sourceUrl: string,
    targetFile: string,
    progressCallback?: (bytesDone: number, percent: number) => void,
    length?: number,
  ) {
    const request = new Request(sourceUrl, {
      headers: new Headers({ 'Content-Type': 'application/octet-stream' }),
    });

    const response = await fetch(request);
    if (!response.ok) {
      throw Error(
        `Unable to download, server returned ${response.status} ${response.statusText}`,
      );
    }

    const body = response.body;
    if (body == null) {
      throw Error('No response body');
    }

    const finalLength =
      length || parseInt(response.headers.get('Content-Length' || '0'), 10);
    const reader = body.getReader();
    const writer = fs.createWriteStream(targetFile);

    await this.streamWithProgress(
      finalLength,
      reader,
      writer,
      progressCallback,
    );
    writer.end();
  }

  static async streamWithProgress(
    length: number,
    reader: ReadableStreamReader<Uint8Array>,
    writer: NodeJS.WriteStream,
    progressCallback?: (bytesDone: number, percent: number) => void,
  ) {
    let bytesDone = 0;

    while (true) {
      //const result = await reader.read(new Uint8Array(length));
      const result = await reader.read();
      if (result.done) {
        if (progressCallback != null) {
          progressCallback(length, 100);
        }
        return;
      }

      const decoder = new TextDecoder();
      const chunk = result.value;
      const str = decoder.decode(chunk);
      if (chunk == null) {
        throw Error('Empty chunk received during download');
      } else {
        writer.write(str);
        if (progressCallback != null) {
          bytesDone += chunk.byteLength;
          const percent =
            length === 0 ? null : Math.floor((bytesDone / length) * 100);
          progressCallback(bytesDone, percent);
        }
      }
    }
  }

  static extractAllTo(targetFile: string, targetPath: string) {
    new AdmZip(targetFile).extractAllTo(
      Utilities.slash(Utilities.dirname(targetFile)),
    );
  }

  static writeZip(targetFile: string, targetPath: string) {
    const zip = new AdmZip();
    zip.addLocalFolder(targetPath);

    zip.writeZip(targetFile);
  }

  //jetpack stuff
  static async dirAsync(
    pathFolder: string,
    criteria?: {
      empty?: boolean;
      mode?: number | string;
    },
  ) {
    return jetpack.dirAsync(pathFolder, criteria);
  }

  static async copyAsync(
    from: string,
    to: string,
    options?: {
      overwrite?:
        | boolean
        | ((source: any, destination: any) => boolean | Promise<boolean>);
      matching?: string[];
      ignoreCase?: boolean;
    },
  ) {
    return await jetpack.copyAsync(from, to, options);
  }

  static async moveAsync(
    from: string,
    to: string,
    options?: {
      overwrite?: false;
    },
  ) {
    return await jetpack.moveAsync(from, to, options);
  }

  static async existsAsync(filePath: string) {
    return await jetpack.existsAsync(filePath);
  }

  static async removeAsync(filePath: string) {
    return await jetpack.removeAsync(filePath);
  }

  static async writeAsync(filePath: string, content: string) {
    return await jetpack.writeAsync(filePath, content);
  }

  static async appendAsync(filePath: string, content: string) {
    return await jetpack.appendAsync(filePath, content);
  }

  static async readAsync(filePath: string) {
    return await jetpack.readAsync(filePath);
  }

  static async findAsync(
    path: string = '.',
    options: {
      matching?: string[];
      filter?: (inspectObj: any) => boolean;
      files?: boolean;
      directories?: boolean;
      recursive?: boolean;
      ignoreCase?: boolean;
    } = {
      matching: ['*'],
      files: true,
      directories: false,
      recursive: true,
      ignoreCase: false,
    },
  ) {
    return await jetpack.findAsync(path, options);
  }

  //end jetpack stuff

  //settings stuff
  static async saveSettingsFileAsync(settings: {}, filePath: string) {
    //console.log(`filePath: ${filePath}`);
    //console.log(`settings: ${JSON.stringify(settings)}`);

    try {
      await UtilitiesNodeJs.removeAsync(filePath);
      //await this.fs.unlink(filePath);
    } catch (error) {
    } finally {
      const builder = new xml2js.Builder();
      return UtilitiesNodeJs.writeAsync(
        filePath,
        builder.buildObject(settings),
      );

      //return this.fs.writeFile(filePath, '123');
    }
  }

  static async loadFileContentAsync(filePath: string): Promise<string> {
    return UtilitiesNodeJs.readAsync(filePath);
  }

  static async loadReportingFileAsync(filePath: string): Promise<any> {
    const configFolderPath = Utilities.dirname(filePath);

    const configReportingFilePath = `${configFolderPath}/reporting.xml`;

    const content = await UtilitiesNodeJs.readAsync(configReportingFilePath);

    return Utilities.parseStringPromise(content, {
      trim: true,
      explicitArray: false,
      valueProcessors: [xml2js.processors.parseBooleans],
    });
  }

  static async loadSettingsFileAsync(filePath: string): Promise<any> {
    //console.trace();

    const content = await UtilitiesNodeJs.readAsync(filePath);

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

  static async loadPreferencesFileAsync(filePath: string): Promise<any> {
    const content = await UtilitiesNodeJs.readAsync(filePath);

    const parsedString = await Utilities.parseStringPromise(content, {
      trim: true,
      explicitArray: false,
      valueProcessors: [xml2js.processors.parseBooleans],
    });

    return parsedString;
  }

  //end settings stuff
}
