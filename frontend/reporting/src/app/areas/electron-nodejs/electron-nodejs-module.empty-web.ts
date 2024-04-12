// electron-nodejs-module.dummy.ts
import { NgModule } from '@angular/core';
import { ElectronService } from './electron.service.empty-web';

@NgModule({
  providers: [ElectronService],
})
export class ElectronNodeJsModule {}
