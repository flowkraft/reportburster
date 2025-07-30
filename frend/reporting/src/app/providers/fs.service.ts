import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import Utilities from '../helpers/utilities';

export interface InspectResult {
  name: string;
  type: 'file' | 'dir' | 'symlink';
  size: number;
  absolutePath?: string;
  md5?: string;
  sha1?: string;
  sha256?: string;
  sha512?: string;
  mode?: number;
  accessTime?: Date;
  modifyTime?: Date;
  changeTime?: Date;
  birthTime?: Date;
}

@Injectable({
  providedIn: 'root',
})
export class FsService {
  constructor(protected apiService: ApiService) {}

  async removeAsync(path: string) {
    //console.log('removeAsync', path);
    return this.apiService.delete(
      `/jobman/system/fs/delete-quietly?path=${encodeURIComponent(
        Utilities.slash(path),
      )}`,
    );
  }

  async copyAsync(
    sourcePath: string,
    destinationPath: string,
    criteria: {
      overwrite?:
        | boolean
        | ((src: any, dest: any) => boolean | Promise<boolean>);
      matching?: string[];
      ignoreCase?: boolean;
    } = {},
  ): Promise<void> {
    const overwrite =
      typeof criteria.overwrite === 'function'
        ? criteria.overwrite(sourcePath, destinationPath)
        : criteria.overwrite;

    //console.log(`overwrite = ${overwrite}`);

    let postUrl = `/jobman/system/fs/copy?fromPath=${encodeURIComponent(
      Utilities.slash(sourcePath),
    )}&toPath=${encodeURIComponent(Utilities.slash(destinationPath))}`;

    if (overwrite) postUrl = `${postUrl}&overwrite=${overwrite}`;
    if (criteria.matching) postUrl = `${postUrl}&matching=${criteria.matching}`;
    if (criteria.matching)
      postUrl = `${postUrl}&ignoreCase=${criteria.ignoreCase}`;

    return this.apiService.post(postUrl);
  }

  async existsAsync(path: string): Promise<'dir' | 'file' | 'other' | false> {
    const result = await this.apiService.get(
      '/jobman/system/fs/exists',
      {
        path: encodeURIComponent(Utilities.slash(path)),
      },
      new Headers({
        Accept: 'text/plain',
        'Content-Type': 'application/json',
      }),
    );

    //console.log('existsAsync', path, result);
    // Convert the literal string "false" to the boolean false
    if (result === 'false') {
      return false;
    }

    // Otherwise, return the original result
    return result;
  }

  async dirAsync(
    path: string,
    criteria: {
      empty?: true;
      mode?: string;
    } = {},
  ): Promise<void> {
    return this.apiService.post(
      `/jobman/system/fs/dir?path=${encodeURIComponent(Utilities.slash(path))}`,
      criteria,
    );
  }

  async readAsync(path: string): Promise<string> {
    return this.apiService.get(
      '/jobman/system/fs/read-file-to-string',
      { path: encodeURIComponent(path) },
      new Headers({
        Accept: 'text/plain',
        'Content-Type': 'application/json',
      }),
    );
  }

  async writeAsync(path: string, content: string) {
    const encodedPath = encodeURIComponent(Utilities.slash(path));
    return this.apiService.post(
      `/jobman/system/fs/write-string-to-file?path=${encodedPath}`,
      content,
      new Headers({
        'Content-Type': 'text/plain',
      }),
    );
  }

  async fileAsync(
    path: string,
    criteria: {
      content?: string | Buffer | Object | Array<any>;
      jsonIndent?: number;
      mode?: number | string;
    } = {},
  ): Promise<void> {
    const encodedPath = encodeURIComponent(Utilities.slash(path));

    return this.apiService.post(
      `/jobman/system/fs/file?path=${encodedPath}`,
      criteria,
    );
  }

  inspectAsync(
    path: string,
    criteria: {
      checksum?: 'md5' | 'sha1' | 'sha256' | 'sha512';
      mode?: boolean;
      times?: boolean;
      absolutePath?: boolean;
      symlinks?: 'report' | 'follow';
    } = {},
  ): Promise<InspectResult | undefined> {
    return this.apiService.get(
      `/jobman/system/fs/inspect/${encodeURIComponent(Utilities.slash(path))}`,
      {
        checksum: criteria.checksum,
        mode: criteria.mode,
        times: criteria.times,
        absolutePath: criteria.absolutePath,
        symlinks: criteria.symlinks,
      },
    );
  }
}
