//import * as util from 'util';

//import * as fs from 'fs';
//import { WriteStream } from 'fs';

//import * as os from 'os';

//import * as path from 'path';

//import { Readable } from 'stream';

import { convertableToString, OptionsV2, parseString } from 'xml2js';

/*
import {
  XMLParser,
  XMLValidator,
  XMLBuilder,
  j2xParser,
} from 'fast-xml-parser';
*/

export default class Utilities {
  static TT_URL = 'https://www.pdfburst.com/19863306942987104-tt.php';
  static isWindows() {
    return (
      process &&
      (process.platform === 'win32' ||
        /^(msys|cygwin)$/.test(process.env.OSTYPE))
    );
  }

  static looseInvalid(a: string | number): boolean {
    return a === '' || a === null || a === undefined;
  }

  static slash(inputPath: string): string {
    if (!inputPath) return inputPath;

    const isExtendedLengthPath = /^\\\\\?\\/.test(inputPath);

    if (isExtendedLengthPath) {
      return inputPath;
    }
    //console.log(
    //  `inputPath = ${inputPath}, typeof inputPath = ${typeof inputPath}`
    //);
    return inputPath.replace(/\\/g, '/');
  }

  static basename(path: string, extension?: string): string {
    let base = path.split(/[\\/]/).pop() || '';

    if (extension && base.slice(-extension.length) === extension) {
      base = base.slice(0, -extension.length);
    }

    return base;
  }

  static dirname(path: string): string {
    const lastSlash = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
    return path.substring(0, lastSlash);
  }

  static traverseJSONObjTree(
    obj: any,
    fn: (obj: any, k: string, v: any) => void,
    scope = [],
  ) {
    for (const i in obj) {
      fn.apply(this, [i, obj[i], scope]);
      if (obj[i] !== null && typeof obj[i] === 'object') {
        this.traverseJSONObjTree(obj[i], fn, scope.concat(i));
      }
    }
  }

  /*
  static parseStringPromise(
    xml: convertableToString,
    options?: OptionsV2,
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
  */

  static uniqueFilename(
    dir: string,
    fileprefix: string,
    uniqstr?: string,
  ): string {
    // Use the provided unique string or generate a unique string from the current timestamp
    const uniquePart = uniqstr || new Date().getTime().toString(36);

    // Generate the filename by appending the unique part to the base name
    const filename = `${dir}/${fileprefix ? fileprefix + '-' : ''}${uniquePart}`;

    return filename;
  }

  static isRunningInsideElectron(): boolean {
    return typeof window.require !== 'undefined';
  }

  //xml2js stuff

  static parseStringPromise(
    xml: convertableToString,
    options?: OptionsV2,
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

  static _buildObject(
    obj: any,
    doc: Document,
    element: Element = doc.documentElement,
  ) {
    for (const key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        const nested = doc.createElement(key);
        element.appendChild(nested);
        Utilities._buildObject(obj[key], doc, nested);
      } else {
        const nested = doc.createElement(key);
        nested.textContent = obj[key];
        element.appendChild(nested);
      }
    }
  }

  static xml2jsXmlObjectToString(obj: any): string {
    const doc = document.implementation.createDocument('', '', null);
    const root = doc.createElement('root'); // Create a root element
    doc.appendChild(root); // Append the root element to the document
    Utilities._buildObject(obj, doc, root); // Pass the root element instead of the document
    const serializer = new XMLSerializer();
    return serializer.serializeToString(doc);
  }

  /*
  // Convert XML to JSON
  static xmlToJson(xml: Node): any {
    let obj = {};
    if (xml.nodeType === 1) {
      // element
      let element = xml as Element;
      if (element.attributes.length > 0) {
        obj['@attributes'] = {};
        for (let j = 0; j < element.attributes.length; j++) {
          let attribute = element.attributes.item(j);
          obj['@attributes'][attribute.nodeName] = attribute.nodeValue;
        }
      }
    } else if (xml.nodeType === 3) {
      // text
      obj = xml.nodeValue;
    }

    if (xml.hasChildNodes()) {
      for (let i = 0; i < xml.childNodes.length; i++) {
        let item = xml.childNodes.item(i);
        let nodeName = item.nodeName;
        if (typeof obj[nodeName] === 'undefined') {
          obj[nodeName] = this.xmlToJson(item);
        } else {
          if (typeof obj[nodeName].push === 'undefined') {
            let old = obj[nodeName];
            obj[nodeName] = [];
            obj[nodeName].push(old);
          }
          obj[nodeName].push(this.xmlToJson(item));
        }
      }
    }
    return obj;
  }

  // Trim all string values in an object
  static trimValues(obj: any): any {
    if (typeof obj !== 'object') return obj;
    for (let key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = obj[key].trim();
      } else if (typeof obj[key] === 'object') {
        obj[key] = this.trimValues(obj[key]);
      }
    }
    return obj;
  }

  // Unwrap arrays with a single item
  static unwrapArrays(obj: any): any {
    if (typeof obj !== 'object') return obj;
    for (let key in obj) {
      if (Array.isArray(obj[key]) && obj[key].length === 1) {
        obj[key] = obj[key][0];
      } else if (typeof obj[key] === 'object') {
        obj[key] = this.unwrapArrays(obj[key]);
      }
    }
    return obj;
  }

  // Parse boolean values
  static parseBooleanValues(obj: any): any {
    for (let key in obj) {
      if (typeof obj[key] === 'object') {
        this.parseBooleanValues(obj[key]);
      } else if (obj[key] === 'true' || obj[key] === 'false') {
        obj[key] = obj[key] === 'true';
      }
    }
    return obj;
  }

  static fastXmlParseStringPromise(
    xml: string,
    options?: ParseOptions,
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        // Validate XML
        const isValid = fastXmlParser.XMLValidator.validate(xml);
        if (isValid !== true) {
          reject(new Error('Error parsing XML'));
        } else {
          const parser = new fastXmlParser.XMLParser({
            trimValues: options.trimValues,
            parseTagValue: options.parseTagValue,
            isArray: options.isArray,
          });
          const jsonObj = parser.parse(xml);
          return jsonObj;
         
          }

          // Resolve with the JSON object
          resolve(json);
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  static fastXmlObjectToString(obj: any): string {
    // Create a default configuration for the parser
    const defaultOptions = {
      format: true,
      indentBy: '  ',
      supressEmptyNode: false,
    };

    // Create a new parser with the default configuration
    return new XMLBuilder().build(obj);
  }
  */
  //end xml2js stuff

  static getDeeplyNestedLastProp(obj: any, props: Array<string>) {
    let tempObj = obj;

    for (const prop of props) tempObj = tempObj[prop];

    //return tempObj;
    return String(tempObj);
  }

  static getExcerpt(content: string, link?: string, wordLimit = 45) {
    if (Array.isArray(content)) {
      content = content[0];
    }

    //console.log(`content = ${content}`);

    //if (typeof content !== 'string') {
    //  console.error(
    //    `Expected content to be a string, but received ${typeof content}`,
    //  );
    //  console.error(content); // Log the content object
    //}

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

  static getFileNameFromPath(filePath: string) {
    return filePath.split('\\').pop().split('/').pop();
  }

  static getParentFolderPath(folderPath: string) {
    let separator = folderPath.includes('/') ? '/' : '\\';
    return folderPath.substring(0, folderPath.lastIndexOf(separator));
  }

  static sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
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

  static toTitleCase(str: string): string {
    if (!str) return '';
    // Simple title case for underscore or all-caps names
    return str
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
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
