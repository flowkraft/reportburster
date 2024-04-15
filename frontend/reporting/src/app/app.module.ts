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
import UtilitiesElectron from './helpers/utilities-electron';

// AoT requires an exported function for factories
const httpLoaderFactory = (http: HttpClient): TranslateHttpLoader =>
  new TranslateHttpLoader(http, './assets/i18n/', '.json');

export function initApp(stateStore: StateStoreService) {
  return async () => {
    const systemInfo = await UtilitiesElectron.getSystemInfo();
    stateStore.configSys.sysInfo.setup.chocolatey = systemInfo.chocolatey;
    stateStore.configSys.sysInfo.setup.java = systemInfo.java;
    stateStore.configSys.sysInfo.setup.env = systemInfo.env;
    stateStore.configSys.sysInfo.setup.BACKEND_URL =
      await UtilitiesElectron.getBackendUrl();
    //console.log(
    //  `stateStore.configSys.sysInfo.setup = ${JSON.stringify(stateStore.configSys.sysInfo.setup)}`,
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
    StateStoreService,
    {
      provide: APP_INITIALIZER,
      useFactory: initApp,
      deps: [StateStoreService],
      multi: true,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
