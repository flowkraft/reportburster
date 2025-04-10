import { Injectable } from '@angular/core';
import Utilities from '../helpers/utilities';
import { HttpParams } from '@angular/common/http';
import { StateStoreService } from './state-store.service';
import { InitService } from './init.service';

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
  public BACKEND_URL = '/api';

  private headers: Headers;
  private jwtToken: string;

  constructor(protected stateStore: StateStoreService) {
    this.headers = new Headers({
      Accept: 'application/json',
      'Content-Type': 'application/json',
    });

    this.jwtToken = '';

    //console.log(
    //  `apiService.constructor - stateStore.configSys.sysInfo.setup = ${JSON.stringify(stateStore.configSys.sysInfo.setup)}`,
    //);
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
    responseType?: string,
  ): Promise<any> {
    //console.log(
    //  `this.stateStore.configSys.sysInfo.setup = ${JSON.stringify(this.stateStore.configSys.sysInfo.setup)}`,
    // );

    if (
      this.stateStore.configSys.info.FRONTEND == 'electron' &&
      this.BACKEND_URL == '/api'
    ) {
      //console.log(
      //  `apiService.constructor stateStore.configSys.sysInfo.setup.BACKEND_URL: ${JSON.stringify(this.stateStore.configSys.sysInfo.setup.BACKEND_URL)}`,
      //);

      this.BACKEND_URL = this.stateStore.configSys.sysInfo.setup.BACKEND_URL;
    }

    const url = `${this.BACKEND_URL}${path}`;
    //console.log(`apiService.request.url: ${JSON.stringify(url)}`);

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

    if (!this.stateStore.configSys.sysInfo.setup.java.isJavaOk) return;

    const response = await fetch(url, options);

    if (!response.ok) {
      //this.stateStore.configSys.sysInfo.setup.java.isJavaOk = false;
      this.checkError(response.status);
      throw new Error(`Request failed with status ${response.status}`);
    }

    const jwtToken = this.extractTokenFromHttpResponse(response.headers);
    if (jwtToken) {
      this.setToken(jwtToken);
    }

    // Handle blob response type
    if (responseType === 'blob') {
      return response.blob();
    }
    // Add this new line to handle text response type
    else if (responseType === 'text') {
      return response.text();
    }

    let data = {};
    if (response.headers.get('Content-Length') === '0') {
      //console.log(
      //  `No data returned from API call: ${url}, body: ${JSON.stringify(body)}`,
      //);
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

  public get(
    path: string,
    args?: any,
    customHeaders?: Headers,
    responseType?: string,
  ): Promise<any> {
    const params = args ? this.serialize(args).toString() : '';
    const fullPath = params ? `${path}?${params}` : path;

    return this.request(
      fullPath,
      RequestMethod.get,
      undefined,
      customHeaders,
      responseType,
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
