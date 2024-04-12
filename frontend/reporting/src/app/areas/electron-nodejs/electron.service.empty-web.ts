import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ElectronService {
  cet: any;

  get isElectron(): boolean {
    return false;
  }
}
