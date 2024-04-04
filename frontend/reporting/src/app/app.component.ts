import { AfterViewInit, Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { setTheme } from 'ngx-bootstrap/utils';
import { ElectronService } from './core/services';

declare var $: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements AfterViewInit {
  constructor(
    protected electronService: ElectronService,
    protected translate: TranslateService,
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

  ngAfterViewInit() {
    $('#topMenu').smartmenus();
  }
}
