import * as util from 'util';

import * as fs from 'fs';
import { WriteStream } from 'fs';

import * as path from 'path';
import * as os from 'os';

import { convertableToString, OptionsV2, parseString } from 'xml2js';
import * as urling from 'urling';
import { Readable } from 'stream';

export default class Utilities {
  static TT_URL = 'https://www.reportburster.com/19863306942987104-tt.php';
  static isWindows() {
    return (
      process &&
      (process.platform === 'win32' ||
        /^(msys|cygwin)$/.test(process.env.OSTYPE))
    );
  }

  static slash(inputPath: string): string {
    if (!inputPath) return inputPath;

    const isExtendedLengthPath = /^\\\\\?\\/.test(inputPath);

    if (isExtendedLengthPath) {
      return inputPath;
    }

    return inputPath.replace(/\\/g, '/');
  }

  static promisify(original: Function): Function {
    return util.promisify(original);
  }

  //SYSTEM_TEMP_FOLDER_PATH = slash(path.resolve(require('temp-dir')))
  static TMP_DIR_PATH = os.tmpdir;

  static UPG_DB_FOLDER_PATH = Utilities.slash(
    path.resolve(`${Utilities.TMP_DIR_PATH}/upg-db`)
  );

  static dirname(inputPath: string): string {
    return path.dirname(inputPath);
  }

  static traverseJSONObjTree(
    obj: any,
    fn: (obj: any, k: string, v: any) => void,
    scope = []
  ) {
    for (const i in obj) {
      fn.apply(this, [i, obj[i], scope]);
      if (obj[i] !== null && typeof obj[i] === 'object') {
        this.traverseJSONObjTree(obj[i], fn, scope.concat(i));
      }
    }
  }

  static parseStringPromise(
    xml: convertableToString,
    options?: OptionsV2
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      if (options) {
        parseString(xml, options, (err, results) => {
          if (err) {
            reject(err);
          }

          resolve(results);
        });
      } else {
        parseString(xml, (err, results) => {
          if (err) {
            reject(err);
          }

          resolve(results);
        });
      }
    });
  }

  static getDeeplyNestedLastProp(obj: any, props: Array<string>) {
    let tempObj = obj;

    for (const prop of props) tempObj = tempObj[prop];

    return tempObj;
  }

  static getExcerpt(content: string, link?: string, wordLimit = 45) {
    let filter = content.replace(/\s+/g, ' '); // You can add more filters here
    let wordsArr = filter.split(' ');

    if (wordsArr.length < wordLimit) {
      return content;
    } else {
      var result = '';

      for (var i = 0; i < wordLimit; i++) {
        result = result + ' ' + wordsArr[i] + ' ';
      }

      result += ' ...';

      return result;
    }
  }

  static titleCase(text: string) {
    return text[0].toUpperCase() + text.slice(1).toLowerCase();
  }

  static getJobFileContent(filePath: string, jobType: string, exePid: string) {
    return `<job>
    <filepath>${filePath}</filepath>
    <jobtype>${jobType}</jobtype>
    <exepid>${exePid}</exepid>
    </job>
    `;
  }

  static getRandomJobFileName() {
    return Utilities.getRandomFileName('job');
  }

  static getRandomFileName(extension: string) {
    return `${Utilities.getRandomId(9)}.${extension}`;
  }

  static clock(start?: [number, number]): [number, number] {
    if (!start) return process.hrtime();
    var end = process.hrtime(start);
    return [Math.round(end[0] * 1000 + end[1] / 1000000), 0];
  }

  static async download(
    sourceUrl: string,
    targetFile: string,
    progressCallback?: (bytesDone: number, percent: number) => void,
    length?: number
  ) {
    const request = new Request(sourceUrl, {
      headers: new Headers({ 'Content-Type': 'application/octet-stream' }),
    });

    const response = await fetch(request);
    if (!response.ok) {
      throw Error(
        `Unable to download, server returned ${response.status} ${response.statusText}`
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
      progressCallback
    );
    writer.end();
  }

  static async streamToString(stream: Readable) {
    // lets have a ReadableStream as a stream variable
    const chunks = [];

    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }

    return Buffer.concat(chunks).toString('utf-8');
  }

  static async streamWithProgress(
    length: number,
    reader: ReadableStreamReader<Uint8Array>,
    writer: WriteStream,
    progressCallback?: (bytesDone: number, percent: number) => void
  ) {
    let bytesDone = 0;

    while (true) {
      // const result = await reader.read(new Uint8Array(length));
      const result = await reader.read();
      if (result.done) {
        if (progressCallback != null) {
          progressCallback(length, 100);
        }
        return;
      }

      const chunk = result.value;
      if (chunk == null) {
        throw Error('Empty chunk received during download');
      } else {
        writer.write(Buffer.from(chunk));
        if (progressCallback != null) {
          bytesDone += chunk.byteLength;
          const percent =
            length === 0 ? null : Math.floor((bytesDone / length) * 100);
          progressCallback(bytesDone, percent);
        }
      }
    }
  }

  static getRandomId(length: number) {
    let result = '';
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result;
  }

  static async httpPost(url: string, data: {}) {
    // Default options are marked with *
    return fetch(url, {
      method: 'POST', // *GET, POST, PUT, DELETE, etc.
      mode: 'cors', // no-cors, *cors, same-origin
      cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
      credentials: 'same-origin', // include, *same-origin, omit
      headers: {
        'Content-Type': 'application/json',
        // 'Content-Type': 'application/x-www-form-urlencoded',
      },
      redirect: 'follow', // manual, *follow, error
      referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
      body: JSON.stringify(data), // body data type must match "Content-Type" header
    });
  }

  static async httpGet(url: string) {
    //console.log(url);
    return fetch(url, { mode: 'no-cors' });
  }

  static async httpHead(url: string) {
    //console.log(url);
    return fetch(url, { method: 'head' });
  }

  static async urlExists(url: string) {
    //console.log(`urlExists(url: string): ${url}`);
    const options = {
      url: url,
      retry: 0,
      //interval: 10000,
      immediate: true,
    };

    return urling(options);
  }

  static setCursor(htmlElement: HTMLElement, pos: number) {
    // Creates range object
    const setPos = document.createRange();

    // Creates object for selection
    var set = window.getSelection();

    // Set start position of range
    //setPos.setStart(htmlElement.childNodes[0], pos);
    setPos.setStart(htmlElement, pos);

    // Collapse range within its boundary points
    // Returns boolean
    setPos.collapse(true);

    // Remove all ranges set
    set.removeAllRanges();

    // Add range with respect to range object.
    set.addRange(setPos);

    // Set cursor on focus
    //console.log(`htmlElement: ${JSON.stringify(htmlElement.className)}`);
    htmlElement.focus();
  }

  static isPositiveInteger(str: string) {
    const num = Number(str);

    if (Number.isInteger(num) && num > 0) {
      return true;
    }

    return false;
  }
}
