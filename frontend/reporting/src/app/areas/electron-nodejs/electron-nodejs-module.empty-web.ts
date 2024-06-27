// electron-nodejs-module.dummy.ts
import { NgModule, Component } from '@angular/core';
import { RbElectronService } from './electron.service.empty-web';

@Component({
  selector: 'dburst-java',
  template: '',
})
export class JavaComponent {}

@Component({
  selector: 'dburst-extra-packages',
  template: '',
})
export class ExtraPackagesComponent {}

@Component({
  selector: 'dburst-terminal',
  template: '',
})
export class TerminalComponent {}

@Component({
  selector: 'dburst-update',
  template: '',
})
export class UpdateComponent {}

@Component({
  selector: 'dburst-system-diagnostics',
  template: '',
})
export class SystemDiagnosticsComponent {}

@NgModule({
  declarations: [
    JavaComponent,
    ExtraPackagesComponent,
    TerminalComponent,
    UpdateComponent,
    SystemDiagnosticsComponent,
  ],
  exports: [
    JavaComponent,
    ExtraPackagesComponent,
    TerminalComponent,
    UpdateComponent,
    SystemDiagnosticsComponent,
  ],
  providers: [RbElectronService],
})
export class ElectronNodeJsModule {}
