import { APP_INITIALIZER, Inject, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class InitService {
  constructor(@Inject(APP_INITIALIZER) private appInitializer: any) {}
}
