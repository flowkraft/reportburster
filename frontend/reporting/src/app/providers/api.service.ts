import { Injectable } from '@angular/core';
import { APP_CONFIG } from '../../environments/environment';
import Utilities from '../helpers/utilities';
import { HttpParams } from '@angular/common/http';
import { SettingsService } from './settings.service';
import { Inject } from '@angular/core';
import UtilitiesElectron from '../helpers/utilities-electron';

export enum RequestMethod {
  get = 'GET',
  head = 'HEAD',
  post = 'POST',
  put = 'PUT',
  delete = 'DELETE',
  options = 'OPTIONS',
  patch = 'PATCH',
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private BACKEND_URL = '';

  private headers: Headers;
  private jwtToken: string;

  constructor() {
    this.getBackendUrl();

    this.headers = new Headers({
      Accept: 'application/json',
      'Content-Type': 'application/json',
    });

    this.jwtToken = '';
  }

  public async getBackendUrl(): Promise<string> {
    if (this.BACKEND_URL) return this.BACKEND_URL;
    else {
      this.BACKEND_URL = await UtilitiesElectron.getBackendUrl();
      console.log(`api.server this.BACKEND_URL = ${this.BACKEND_URL}`);
      return this.BACKEND_URL;
    }
  }

  private serialize(obj: any): HttpParams {
    let params = new HttpParams();

    for (const key in obj) {
      if (obj.hasOwnProperty(key) && !Utilities.looseInvalid(obj[key])) {
        params = params.set(key, obj[key]);
      }
    }

    return params;
  }

  private extractTokenFromHttpResponse(headers: Headers): string | null {
    const authorization = headers.get('Authorization');
    if (authorization && authorization.startsWith('Bearer ')) {
      return authorization.substring(7);
    }
    return null;
  }

  private setToken(token: string) {
    this.jwtToken = token;
  }

  public getToken(): string {
    return this.jwtToken;
  }

  private async request(
    path: string,
    method: RequestMethod,
    body: any = '',
    customHeaders?: Headers,
  ): Promise<any> {
    //console.log(`apiService.request.path: ${JSON.stringify(path)}`);

    const url = `${await this.getBackendUrl()}${path}`;
    const headers = new Headers(customHeaders || this.headers);
    const options: RequestInit = {
      method,
      headers: customHeaders || this.headers,
      credentials: 'include',
    };

    if (
      method === RequestMethod.post ||
      method === RequestMethod.put ||
      method === RequestMethod.patch
    ) {
      if (body instanceof FormData) {
        options.body = body;
        // Remove the Content-Type header so the browser can set it
        headers.delete('Content-Type');
      } else if (customHeaders?.get('Content-Type') === 'text/plain') {
        options.body = body;
      } else {
        options.body = JSON.stringify(body);
        headers.set('Content-Type', 'application/json');
      }
    }
    //console.log(`options.body = ${JSON.stringify(options.body)}`);

    const response = await fetch(url, options);

    if (!response.ok) {
      this.checkError(response.status);
      throw new Error(`Request failed with status ${response.status}`);
    }

    const jwtToken = this.extractTokenFromHttpResponse(response.headers);
    if (jwtToken) {
      this.setToken(jwtToken);
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    } else {
      let data = {};
      if (response.headers.get('Content-Length') === '0') {
        console.log('No data returned from API');
      } else {
        //console.log(`apiService.request.response: ${JSON.stringify(response)}`);

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else if (contentType && contentType.includes('text/plain')) {
          data = await response.text();
        }
      }
      return data;
    }
  }

  public get(path: string, args?: any, customHeaders?: Headers): Promise<any> {
    //console.log(`GET path: ${path}`);
    //if (args) console.log(`GET args: ${JSON.stringify(args)}`);

    const params = args ? this.serialize(args).toString() : '';
    //if (args) console.log(`GET this.serialize(args).toString(): ${params}`);

    //if (customHeaders)
    //  console.log(`GET customHeaders: ${JSON.stringify(customHeaders)}`);

    return this.request(
      `${path}?${params}`,
      RequestMethod.get,
      undefined,
      customHeaders,
    );
  }

  public post(path: string, body?: any, customHeaders?: Headers): Promise<any> {
    return this.request(path, RequestMethod.post, body, customHeaders);
  }

  public put(path: string, body: any): Promise<any> {
    return this.request(path, RequestMethod.put, body);
  }

  public delete(path: string, body?: any): Promise<any> {
    return this.request(path, RequestMethod.delete, body);
  }

  // Display error if logged in, otherwise redirect to IDP
  private checkError(error: any): any {
    // this.displayError(error);
    throw error;
  }
}
