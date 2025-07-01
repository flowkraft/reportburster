declare module 'form-data' {
  class FormData {
    constructor();
    append(key: string, value: any, options?: any): void;
    getHeaders(): any;
    getBuffer(): Buffer;
    getBoundary(): string;
    setBoundary(boundary: string): void;
    setHeader(name: string, value: string): void;
    submit(
      params: string | object,
      callback?: (error: Error | null, response: any) => void,
    ): any;
    pipe(to: any): any;
  }
  export = FormData;
}
