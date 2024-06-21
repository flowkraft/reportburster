import { BrowserModule } from '@angular/platform-browser';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { SharedModule } from './shared/shared.module';

import { AppRoutingModule } from './app-routing.module';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

// NG Translate
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { AppComponent } from './app.component';
import { ToastrModule } from 'ngx-toastr';
import { AreasModule } from './areas/areas.module';
import { StateStoreService } from './providers/state-store.service';
import { RbElectronService } from './areas/electron-nodejs/electron.service';
import { InitService } from './providers/init.service';
const httpLoaderFactory = (http: HttpClient): TranslateHttpLoader =>
  new TranslateHttpLoader(http, './assets/i18n/', '.json');

export function initApp(
  stateStore: StateStoreService,
  electronService: RbElectronService,
) {
  return async () => {
    //if electron
    if (electronService.isElectron) {
      stateStore.configSys.sysInfo.setup.BACKEND_URL =
        await electronService.getBackendUrl();

      const systemInfo = await electronService.getSystemInfo();
      stateStore.configSys.sysInfo.setup.chocolatey = {
        ...systemInfo.chocolatey,
      };
      stateStore.configSys.sysInfo.setup.java = { ...systemInfo.java };
      stateStore.configSys.sysInfo.setup.env = { ...systemInfo.env };
    }

    //console.log(
    //  `app.module - stateStore.configSys.sysInfo.setup = ${JSON.stringify(stateStore.configSys.sysInfo.setup)}`,
    //);
  };
}

@NgModule({
  declarations: [AppComponent],
  imports: [
    SharedModule,
    AreasModule,
    BrowserModule,
    FormsModule,
    HttpClientModule,
    AppRoutingModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: httpLoaderFactory,
        deps: [HttpClient],
      },
    }),
    ToastrModule.forRoot({
      timeOut: 5000,
      positionClass: 'toast-bottom-right',
      preventDuplicates: true,
    }),
    BrowserAnimationsModule,
  ],
  providers: [
    InitService,
    {
      provide: APP_INITIALIZER,
      useFactory: initApp,
      deps: [StateStoreService, RbElectronService],
      multi: true,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
