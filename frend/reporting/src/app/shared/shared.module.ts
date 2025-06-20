import { ModuleWithProviders, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TranslateModule } from '@ngx-translate/core';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxCodeJarComponent } from 'ngx-codejar';

import { ShellService } from '../providers/shell.service';
import { ToastrMessagesService } from '../providers/toastr-messages.service';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { ConfirmService } from '../components/dialog-confirm/confirm.service';
import { ModalModule } from 'ngx-bootstrap/modal';
import { DialogModule } from 'primeng/dialog';
import { BrowserModule } from '@angular/platform-browser';
import { ConfirmDialogComponent } from '../components/dialog-confirm/confirm-dialog.component';
import { InfoService } from '../components/dialog-info/info.service';
import { InfoDialogComponent } from '../components/dialog-info/info-dialog.component';
import { AskForFeatureService } from '../components/ask-for-feature/ask-for-feature.service';
import { AskForFeatureDialogComponent } from '../components/ask-for-feature/ask-for-feature-dialog.component';
import { ButtonVariablesComponent } from '../components/button-variables/button-variables.component';
import { ButtonWellKnownEmailProvidersComponent } from '../components/button-well-known/button-well-known.component';
import { ButtonClearLogsModule } from '../components/button-clear-logs/button-clear-logs.module';
import { ButtonHtmlPreviewComponent } from '../components/button-html-preview/button-html-preview.component';
import { LogFilesViewerAllTogetherModule } from '../components/log-files-viewer-all-together/log-files-viewer-all-together.module';
import { LogFilesViewerSeparateTabsModule } from '../components/log-files-viewer-separate-tabs/log-files-viewer-separate-tabs.module';
import { LogFileViewerModule } from '../components/log-file-viewer/log-file-viewer.module';
import { SettingsService } from '../providers/settings.service';
import { WebSocketService } from '../providers/websocket.service';
import { FsService } from '../providers/fs.service';
import { ApiService } from '../providers/api.service';
import { StateStoreService } from '../providers/state-store.service';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { LiveChatComponent } from '../components/live-chat/live-chat.component';
import { SafePipe } from './safe.pipe';
import { ReportParametersFormComponent } from '../components/report-parameters-form/report-parameters-form.component';

@NgModule({
  imports: [
    ModalModule.forRoot(),
    TranslateModule.forRoot(),
    DialogModule,
    CommonModule,
    FormsModule,
    NgxCodeJarComponent,
    ReactiveFormsModule,
  ],
  declarations: [
    LiveChatComponent,
    ConfirmDialogComponent,
    InfoDialogComponent,
    AskForFeatureDialogComponent,
    ButtonVariablesComponent,
    ReportParametersFormComponent,
    ButtonWellKnownEmailProvidersComponent,
    ButtonHtmlPreviewComponent,
    SafePipe,
  ],
  exports: [
    CommonModule,
    BrowserModule,
    TranslateModule,
    FormsModule,
    ConfirmDialogModule,
    TabsModule,
    DialogModule,
    NgxCodeJarComponent,
    LiveChatComponent,
    LogFileViewerModule,
    LogFilesViewerAllTogetherModule,
    LogFilesViewerSeparateTabsModule,
    ButtonClearLogsModule,
    ButtonVariablesComponent,
    ReportParametersFormComponent,
    ButtonWellKnownEmailProvidersComponent,
    ButtonHtmlPreviewComponent,
    SafePipe,
  ],
  providers: [
    StateStoreService,
    SettingsService,
    SettingsService,
    FsService,
    WebSocketService,
    ShellService,
    ToastrMessagesService,
    ConfirmService,
    ConfirmationService,
    InfoService,
    AskForFeatureService,
    ApiService,
  ],
})
export class SharedModule {
  static forRoot(): ModuleWithProviders<SharedModule> {
    return {
      ngModule: SharedModule,
      providers: [StateStoreService],
    };
  }
}
