import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ElectronService } from './core/services';
import { setTheme } from 'ngx-bootstrap/utils';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  constructor(
    protected electronService: ElectronService,
    protected translate: TranslateService
  ) {
    setTheme('bs3'); // or 'bs4'

    this.translate.setDefaultLang('en');

    if (this.electronService.isElectron) {
      new this.electronService.cet.Titlebar({
        backgroundColor: this.electronService.cet.Color.fromHex('#FFF'),
        menu: null,
        maximizable: false,
        shadow: true,
        icon: null,
      });
    } else {
      //console.log('Run in browser');
    }
  }
}
