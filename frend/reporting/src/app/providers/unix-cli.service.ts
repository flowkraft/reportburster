import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import Utilities from '../helpers/utilities';

@Injectable({
  providedIn: 'root',
})
export class UnixCliService {
  constructor(protected apiService: ApiService) {}

  async findAsync(
    path: string = '.',
    searchOptions: {
      matching?: string[];
      filter?: (path: string) => boolean;
      files?: boolean;
      directories?: boolean;
      recursive?: boolean;
      ignoreCase?: boolean;
    } = { matching: ['*'], files: true, directories: false, recursive: false },
  ): Promise<string[]> {
    // Construct the parameters as an object
    const params: any = {};

    // Loop over the keys of searchOptions to set the parameters
    for (const [key, value] of Object.entries(searchOptions)) {
      if (value) {
        params[key] = value;
      }
    }

    return this.apiService.get(`/jobman/system/unix-cli/find`, {
      //path: encodeURIComponent(Utilities.slash(path)),
      path: Utilities.slash(path),
      ...params,
    });
  }

  async catAsync(path: string) {
    //console.log(`catAsync = ${path}`);
    return this.apiService.get(
      `/jobman/system/unix-cli/cat`,
      {
        //path: encodeURIComponent(Utilities.slash(path)),
        path: Utilities.slash(path),
      },
      new Headers({
        Accept: 'text/plain',
        'Content-Type': 'application/json',
      }),
    );
  }
}
