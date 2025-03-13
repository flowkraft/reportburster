import {
  Component,
  OnInit,
  ViewChild,
  ChangeDetectorRef,
  TemplateRef,
} from '@angular/core';

import { ActivatedRoute } from '@angular/router';

import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import * as _ from 'lodash';

//import * as path from 'path';

import { leftMenuTemplate } from './templates/_left-menu';
import { tabsTemplate } from './templates/_tabs';

import { ExtConnection } from '../../providers/settings.service';
import { ToastrMessagesService } from '../../providers/toastr-messages.service';

import { tabGeneralSettingsTemplate } from './templates/tab-general-settings';
import { tabReportingDataSourceDataTablesTemplate } from './templates/tab-reporting-datasource-datatables';
import { tabReportingTemplateOutputTemplate } from './templates/tab-reporting-template-output';
import { tabEnableDisableDeliveryTemplate } from './templates/tab-enable-disable-delivery';
import { tabEmailConnectionSettingsTemplate } from './templates/tab-email-connection-settings';
import { tabEmailMessageTemplate } from './templates/tab-email-message';
import { tabAttachmentsTemplate } from './templates/tab-attachments';
import { tabEmailCloudProvidersTemplate } from './templates/tab-email-cloud-providers';
import { tabUploadFTPTemplate } from './templates/tab-upload-ftp';
import { tabUploadFileShareTemplate } from './templates/tab-upload-file-share';
import { tabUploadFTPSTemplate } from './templates/tab-upload-ftps';
import { tabUploadSFTPTemplate } from './templates/tab-upload-sftp';
import { tabUploadHTTPTemplate } from './templates/tab-upload-http';
import { tabUploadCloudTemplate } from './templates/tab-upload-cloud';
import { tabWebUploadDocumentBursterWebTemplate } from './templates/tab-web-upload-documentburster-web';
import { tabWebUploadSharePointTemplate } from './templates/tab-web-upload-sharepoint';
import { tabWebUploadWordPressTemplate } from './templates/tab-web-upload-wordpress';
import { tabWebUploadDrupalTemplate } from './templates/tab-web-upload-drupal';
import { tabWebUploadJoomlaTemplate } from './templates/tab-web-upload-joomla';
import { tabWebUploadOtherWebPlatformsTemplate } from './templates/tab-web-upload-other-web-platforms';
import { tabSMSTwilioTemplate } from './templates/tab-sms-twilio';
import { tabSMSMessageTemplate } from './templates/tab-sms-message';
import { tabQATemplate } from './templates/tab-qa';
import { tabAdvancedTemplate } from './templates/tab-advanced';
import { tabAdvancedErrorHandlingTemplate } from './templates/tab-advanced-error-handling';
import { tabEmailAddressValidationTemplate } from './templates/tab-email-address-validation';
import { tabEmailTuningTemplate } from './templates/tab-email-tuning';
import { tabLogsTemplate } from './templates/tab-logs';

import { tabLicenseTemplate } from './templates/tab-license';

import { modalAttachmentTemplate } from './templates/modal-attachment';
import { ExecutionStatsService } from '../../providers/execution-stats.service';
import Utilities from '../../helpers/utilities';
import { ConfirmService } from '../../components/dialog-confirm/confirm.service';
import { EmailProviderSettings } from '../../components/button-well-known/button-well-known.component';
import { Quill, RangeStatic } from 'quill';
import { InfoService } from '../../components/dialog-info/info.service';
import { AskForFeatureService } from '../../components/ask-for-feature/ask-for-feature.service';
import { SettingsService } from '../../providers/settings.service';
import { ShellService } from '../../providers/shell.service';
import { StateStoreService } from '../../providers/state-store.service';

@Component({
  selector: 'dburst-configuration',
  template: `
    <aside class="main-sidebar">
      <section class="sidebar">${leftMenuTemplate}</section>
    </aside>
    <div class="content-wrapper">
      <section class="content">
        <div>${tabsTemplate}</div>
      </section>
    </div>
    ${tabGeneralSettingsTemplate} ${tabReportingDataSourceDataTablesTemplate}
    ${tabReportingTemplateOutputTemplate} ${tabEnableDisableDeliveryTemplate}
    ${tabEmailCloudProvidersTemplate} ${tabEmailConnectionSettingsTemplate}
    ${tabEmailMessageTemplate} ${tabAttachmentsTemplate} ${tabUploadFTPTemplate}
    ${tabUploadFileShareTemplate} ${tabUploadFTPSTemplate}
    ${tabUploadSFTPTemplate} ${tabUploadHTTPTemplate} ${tabUploadCloudTemplate}
    ${tabWebUploadDocumentBursterWebTemplate} ${tabWebUploadSharePointTemplate}
    ${tabWebUploadWordPressTemplate} ${tabWebUploadDrupalTemplate}
    ${tabWebUploadJoomlaTemplate} ${tabWebUploadOtherWebPlatformsTemplate}
    ${tabSMSTwilioTemplate} ${tabSMSMessageTemplate} ${tabQATemplate}
    ${tabAdvancedTemplate} ${tabAdvancedErrorHandlingTemplate}
    ${tabEmailAddressValidationTemplate} ${tabEmailTuningTemplate}
    ${tabLogsTemplate} ${tabLicenseTemplate} ${modalAttachmentTemplate}
  `,
})
export class ConfigurationComponent implements OnInit {
  //editor: Squire;

  @ViewChild('tabGeneralSettingsTemplate', { static: true })
  tabGeneralSettingsTemplate: TemplateRef<any>;

  @ViewChild('tabReportingDataSourceDataTablesTemplate', { static: true })
  tabReportingDataSourceDataTablesTemplate: TemplateRef<any>;

  @ViewChild('tabReportingTemplateOutputTemplate', { static: true })
  tabReportingTemplateOutputTemplate: TemplateRef<any>;

  @ViewChild('tabEnableDisableDeliveryTemplate', { static: true })
  tabEnableDisableDeliveryTemplate: TemplateRef<any>;

  @ViewChild('tabEmailCloudProvidersTemplate', { static: true })
  tabEmailCloudProvidersTemplate: TemplateRef<any>;

  @ViewChild('tabEmailConnectionSettingsTemplate', { static: true })
  tabEmailConnectionSettingsTemplate: TemplateRef<any>;
  @ViewChild('tabEmailMessageTemplate', { static: true })
  tabEmailMessageTemplate: TemplateRef<any>;

  @ViewChild('tabAttachmentsTemplate', { static: true })
  tabAttachmentsTemplate: TemplateRef<any>;
  @ViewChild('tabUploadFTPTemplate', { static: true })
  tabUploadFTPTemplate: TemplateRef<any>;
  @ViewChild('tabUploadFileShareTemplate', { static: true })
  tabUploadFileShareTemplate: TemplateRef<any>;

  @ViewChild('tabUploadFTPSTemplate', { static: true })
  tabUploadFTPSTemplate: TemplateRef<any>;
  @ViewChild('tabUploadSFTPTemplate', { static: true })
  tabUploadSFTPTemplate: TemplateRef<any>;
  @ViewChild('tabUploadHTTPTemplate', { static: true })
  tabUploadHTTPTemplate: TemplateRef<any>;
  @ViewChild('tabUploadCloudTemplate', { static: true })
  tabUploadCloudTemplate: TemplateRef<any>;
  @ViewChild('tabWebUploadDocumentBursterWebTemplate', { static: true })
  tabWebUploadDocumentBursterWebTemplate: TemplateRef<any>;

  @ViewChild('tabWebUploadSharePointTemplate', { static: true })
  tabWebUploadSharePointTemplate: TemplateRef<any>;
  @ViewChild('tabWebUploadWordPressTemplate', { static: true })
  tabWebUploadWordPressTemplate: TemplateRef<any>;
  @ViewChild('tabWebUploadDrupalTemplate', { static: true })
  tabWebUploadDrupalTemplate: TemplateRef<any>;
  @ViewChild('tabWebUploadJoomlaTemplate', { static: true })
  tabWebUploadJoomlaTemplate: TemplateRef<any>;

  @ViewChild('tabWebUploadOtherWebPlatformsTemplate', { static: true })
  tabWebUploadOtherWebPlatformsTemplate: TemplateRef<any>;
  @ViewChild('tabSMSTwilioTemplate', { static: true })
  tabSMSTwilioTemplate: TemplateRef<any>;
  @ViewChild('tabSMSMessageTemplate', { static: true })
  tabSMSMessageTemplate: TemplateRef<any>;
  @ViewChild('tabQATemplate', { static: true })
  tabQATemplate: TemplateRef<any>;
  @ViewChild('tabAdvancedTemplate', { static: true })
  tabAdvancedTemplate: TemplateRef<any>;

  @ViewChild('tabAdvancedErrorHandlingTemplate', { static: true })
  tabAdvancedErrorHandlingTemplate: TemplateRef<any>;

  @ViewChild('tabEmailAddressValidationTemplate', { static: true })
  tabEmailAddressValidationTemplate: TemplateRef<any>;

  @ViewChild('tabEmailTuningTemplate', { static: true })
  tabEmailTuningTemplate: TemplateRef<any>;

  @ViewChild('tabLogsTemplate', { static: true })
  tabLogsTemplate: TemplateRef<any>;

  @ViewChild('tabLicenseTemplate', { static: true })
  tabLicenseTemplate: TemplateRef<any>;

  selectedAttachment;

  visibleTabs: {
    id: string;
    heading: string;
    ngTemplateOutlet: string;
  }[];

  ALL_TABS = [
    {
      id: 'generalSettingsTab',
      heading: 'AREAS.CONFIGURATION.TABS.GENERAL',
      ngTemplateOutlet: 'tabGeneralSettingsTemplate',
    },
    {
      id: 'reportingDataSourceDataTablesTab',
      heading: 'AREAS.CONFIGURATION.TABS.REPORTING-DATASOURCE-DATATABLES',
      ngTemplateOutlet: 'tabReportingDataSourceDataTablesTemplate',
    },
    {
      id: 'reportingTemplateOutputTab',
      heading: 'AREAS.CONFIGURATION.TABS.REPORTING-TEMPLATE-OUTPUT',
      ngTemplateOutlet: 'tabReportingTemplateOutputTemplate',
    },
    {
      id: 'enableDisableDistributionTab',
      heading: 'AREAS.CONFIGURATION.TABS.ENABLE-DISABLE-DELIVERY',
      ngTemplateOutlet: 'tabEnableDisableDeliveryTemplate',
    },
    {
      id: 'cloudEmailProvidersTab',
      heading: 'AREAS.CONFIGURATION.TABS.EMAIL.CLOUD-PROVIDERS',
      ngTemplateOutlet: 'tabEmailCloudProvidersTemplate',
    },
    {
      id: 'connectionSettingsTab',
      heading: 'AREAS.CONFIGURATION.TABS.EMAIL.CONNECTION',
      ngTemplateOutlet: 'tabEmailConnectionSettingsTemplate',
    },
    {
      id: 'emailMessageTab',
      heading: 'AREAS.CONFIGURATION.TABS.EMAIL.MESSAGE',
      ngTemplateOutlet: 'tabEmailMessageTemplate',
    },
    {
      id: 'attachmentsTab',
      heading: 'AREAS.CONFIGURATION.TABS.ATTACHMENTS',
      ngTemplateOutlet: 'tabAttachmentsTemplate',
    },
    {
      id: 'ftpTab',
      heading: 'AREAS.CONFIGURATION.TABS.UPLOAD.FTP',
      ngTemplateOutlet: 'tabUploadFTPTemplate',
      //iconClass: 'fa fa-upload',
    },
    {
      id: 'fileShareTab',
      heading: 'AREAS.CONFIGURATION.TABS.UPLOAD.FILE-SHARE',
      ngTemplateOutlet: 'tabUploadFileShareTemplate',
      //iconClass: 'fa fa-share-alt',
    },
    {
      id: 'ftpsTab',
      heading: 'AREAS.CONFIGURATION.TABS.UPLOAD.FTPS',
      ngTemplateOutlet: 'tabUploadFTPSTemplate',
      //iconClass: 'fa fa-lock',
    },
    {
      id: 'sftpTab',
      heading: 'AREAS.CONFIGURATION.TABS.UPLOAD.SFTP',
      ngTemplateOutlet: 'tabUploadSFTPTemplate',
      //iconClass: 'fa fa-terminal',
    },
    {
      id: 'httpTab',
      heading: 'AREAS.CONFIGURATION.TABS.UPLOAD.HTTP',
      ngTemplateOutlet: 'tabUploadHTTPTemplate',
      //iconClass: 'fa fa-code',
    },
    {
      id: 'cloudUploadTab',
      heading: 'AREAS.CONFIGURATION.TABS.UPLOAD.CLOUD',
      ngTemplateOutlet: 'tabUploadCloudTemplate',
      //iconClass: 'fa fa-cloud-upload',
    },
    {
      id: 'documentBursterWebTab',
      heading: 'AREAS.CONFIGURATION.TABS.WEB-UPLOAD.DOCUMENTBURSTER-WEB',
      ngTemplateOutlet: 'tabWebUploadDocumentBursterWebTemplate',
      //iconClass: 'fa fa-credit-card',
    },
    {
      id: 'sharePointTab',
      heading: 'AREAS.CONFIGURATION.TABS.WEB-UPLOAD.SHAREPOINT',
      ngTemplateOutlet: 'tabWebUploadSharePointTemplate',
      //iconClass: 'fa fa-windows',
    },
    {
      id: 'wordPressTab',
      heading: 'AREAS.CONFIGURATION.TABS.WEB-UPLOAD.WORDPRESS',
      ngTemplateOutlet: 'tabWebUploadWordPressTemplate',
      //iconClass: 'fa fa-wordpress',
    },
    {
      id: 'drupalTab',
      heading: 'AREAS.CONFIGURATION.TABS.WEB-UPLOAD.DRUPAL',
      ngTemplateOutlet: 'tabWebUploadDrupalTemplate',
      //iconClass: 'fa fa-drupal',
    },
    {
      id: 'joomlaTab',
      heading: 'AREAS.CONFIGURATION.TABS.WEB-UPLOAD.JOOMLA',
      ngTemplateOutlet: 'tabWebUploadJoomlaTemplate',
      //iconClass: 'fa fa-joomla',
    },
    {
      id: 'otherWebPlatformsTab',
      heading: 'AREAS.CONFIGURATION.TABS.WEB-UPLOAD.OTHER-WEB-PLATFORMS',
      ngTemplateOutlet: 'tabWebUploadOtherWebPlatformsTemplate',
      //iconClass: 'fa fa-skyatlas',
    },
    {
      id: 'twilioTab',
      heading: 'AREAS.CONFIGURATION.TABS.SMS.TWILIO',
      ngTemplateOutlet: 'tabSMSTwilioTemplate',
    },
    {
      id: 'smsMessageTab',
      heading: 'AREAS.CONFIGURATION.TABS.SMS.MESSAGE',
      ngTemplateOutlet: 'tabSMSMessageTemplate',
    },
    {
      id: 'confQualityTab',
      heading: 'AREAS.CONFIGURATION.TABS.QA',
      ngTemplateOutlet: 'tabQATemplate',
    },
    {
      id: 'advancedTab',
      heading: 'AREAS.CONFIGURATION.TABS.ADVANCED',
      ngTemplateOutlet: 'tabAdvancedTemplate',
    },
    {
      id: 'errorHandlingTab',
      heading: 'AREAS.CONFIGURATION.TABS.ERROR-HANDLING',
      ngTemplateOutlet: 'tabAdvancedErrorHandlingTemplate',
      visibleWhenCapability: 'reportdistribution',
    },
    {
      id: 'emailAddressValidationTab',
      heading: 'AREAS.CONFIGURATION.TABS.EMAIL-ADDRESS-VALIDATION',
      ngTemplateOutlet: 'tabEmailAddressValidationTemplate',
      visibleWhenCapability: 'reportdistribution',
    },
    {
      id: 'emailTuningTab',
      heading: 'AREAS.CONFIGURATION.TABS.EMAIL-TUNING',
      ngTemplateOutlet: 'tabEmailTuningTemplate',
      visibleWhenCapability: 'reportdistribution',
    },
    {
      id: 'logsTab',
      heading: 'SHARED-TABS.LOGGING-TRACING',
      ngTemplateOutlet: 'tabLogsTemplate',
    },
    {
      id: 'licenseTab',
      heading: 'SHARED-TABS.LICENSE',
      ngTemplateOutlet: 'tabLicenseTemplate',
    },
  ];

  MENU_SELECTED_X_VISIBLE_TABS = [
    {
      selectedMenu: 'generalSettingsMenuSelected',
      visibleTabs: ['generalSettingsTab', 'licenseTab'],
    },
    {
      selectedMenu: 'reportingSettingsMenuSelected',
      visibleTabs: [
        'reportingDataSourceDataTablesTab',
        'reportingTemplateOutputTab',
        'licenseTab',
      ],
    },
    {
      selectedMenu: 'enableDisableDistributionMenuSelected',
      visibleTabs: ['enableDisableDistributionTab', 'licenseTab'],
    },
    {
      selectedMenu: 'emailSettingsMenuSelected',
      visibleTabs: [
        'connectionSettingsTab',
        'emailMessageTab',
        'attachmentsTab',
        'logsTab',
        'licenseTab',
      ],
    },
    {
      selectedMenu: 'cloudEmailProvidersMenuSelected',
      visibleTabs: ['cloudEmailProvidersTab', 'licenseTab'],
    },
    {
      selectedMenu: 'uploadSettingsMenuSelected',
      visibleTabs: [
        'ftpTab',
        'sftpTab',
        'fileShareTab',
        'ftpsTab',
        'httpTab',
        'cloudUploadTab',
        'licenseTab',
      ],
    },
    {
      selectedMenu: 'documentBursterWebSettingsMenuSelected',
      visibleTabs: [
        'documentBursterWebTab',
        'sharePointTab',
        'wordPressTab',
        'drupalTab',
        'joomlaTab',
        'otherWebPlatformsTab',
        'licenseTab',
      ],
    },
    {
      selectedMenu: 'smsSettingsMenuSelected',
      visibleTabs: ['twilioTab', 'smsMessageTab', 'licenseTab'],
    },
    {
      selectedMenu: 'qualitySettingsMenuSelected',
      visibleTabs: ['confQualityTab', 'licenseTab'],
    },
    {
      selectedMenu: 'advancedSettingsMenuSelected',
      visibleTabs: [
        'advancedTab',
        'errorHandlingTab',
        'emailAddressValidationTab',
        'emailTuningTab',
        'licenseTab',
      ],
    },
    {
      selectedMenu: 'errorHandlingSettingsMenuSelected',
      visibleTabs: ['errorHandlingTab', 'licenseTab'],
    },
  ];

  isModalAttachmentVisible = false;

  modalAttachmentInfo = {
    mode: 'new',
    attachmentFilePath: '',
  };

  isModalSMSVisible = false;

  modalSMSInfo = {
    fromNumber: '',
    toNumber: '',
  };

  xmlSettings = {
    documentburster: {
      settings: null,
    },
  };

  /*
      this initial declaration is required otherwise the view will generate "NullPointExceptions" until the async data will be
      loaded and ready from the XML file; having this initialization defined here avoids all these "NullPointExceptions"
  xmlSettings = {
    documentburster: {
      settings: {
        version: '',
        template: '',
        burstfilename: '',
        mergefilename: '',
        outputfolder: '',
        //backupfolder: '',
        quarantinefolder: '',
        quarantinefiles: false,
        //logsarchivesfolder: '',
        //statsfilename: '',
        capabilities: {
          reportdistribution: false,
          reportgenerationmailmerge: false,
        },
        sendfiles: {
          email: false,
          upload: false,
          web: false,
          sms: false,
        },
        deletefiles: false,
        emailserver: {
          useconn: false,
          conncode: '',
          host: '',
          port: '',
          userid: '',
          userpassword: '',
          usessl: false,
          usetls: false,
          fromaddress: '',
          name: '',
        },
        htmlemail: true,
        htmlemaileditcode: false,
        emailsettings: {
          to: '',
          cc: '',
          bcc: '',
          subject: '',
          text: '',
          html: '',
        },
        attachments: {
          items: { attachment: <any>[] },
          archive: { archiveattachments: false, archivefilename: '' },
        },
        emailrfc2822validator: {
          allowquotedidentifiers: true,
          allowparensinlocalpart: true,
          allowdomainliterals: false,
          allowdotinatext: false,
          allowsquarebracketsinatext: false,
          skipvalidationfor: '',
        },
        simplejavamail: {
          active: false,
          replytoaddress: '',
          replytoname: '',
          bouncetoaddress: '',
          bouncetoname: '',
          receipttoaddress: '',
          receipttoname: '',
          dispositionnotificationtoaddress: '',
          dispositionnotificationtoname: '',
          customemailheaders: '',
          customsessionproperties: '',
          javaxmaildebug: false,
          transportmodeloggingonly: false,
          proxy: {
            host: '',
            port: '',
            username: '',
            password: '',
            socks5bridgeport: '',
          },
        },
        uploadsettings: {
          ftpcommand: '',
          filesharecommand: '',
          ftpscommand: '',
          sftpcommand: '',
          httpcommand: '',
          cloudcommand: '',
        },
        webuploadsettings: {
          documentbursterwebcommand: '',
          mssharepointcommand: '',
          wordpresscommand: '',
          drupalcommand: '',
          joomlacommand: '',
          otherwebcommand: '',
        },
        smssettings: {
          twilio: {
            accountsid: '',
            authtoken: '',
          },
          fromtelephonenumber: '',
          totelephonenumber: '',
          text: '',
        },
        qualityassurance: {
          emailserver: {
            host: 'localhost',
            port: '1025',
            userid: '',
            userpassword: '',
            usessl: false,
            usetls: false,
            fromaddress: 'from@emailaddress.com',
            name: 'From Name',
            //weburl: 'http://localhost:8025',
          },
        },
        split2ndtime: false,
        bursttokendelimiters: {
          start: '',
          end: '',
          start2nd: '',
          end2nd: '',
        },
        numberofuservariables: 10,
        delayeachdistributionby: 0,
        reusetokenswhennotfound: false,
        failjobifanydistributionfails: false,
        enableretrypolicy: false,
        retrypolicy: {
          delay: 3,
          maxdelay: 30,
          maxretries: 3,
        },
        enableincubatingfeatures: false,
        visibility: 'visible',
      },
    },
  };  
  */

  xmlReporting = {
    documentburster: null,
  };

  settingsChanged: Subject<any> = new Subject<any>();
  selectedEmailConnectionFile: ExtConnection;
  selectedReportTemplateFile = {
    fileName: '',
    filePath: '',
    type: '',
    folderName: '',
    relativeFilePath: '',
  };

  constructor(
    protected settingsService: SettingsService,
    protected executionStatsService: ExecutionStatsService,
    protected shellService: ShellService,
    protected stateStore: StateStoreService,
    protected confirmService: ConfirmService,
    protected infoService: InfoService,
    protected messagesService: ToastrMessagesService,
    protected askForFeatureService: AskForFeatureService,
    protected route: ActivatedRoute,
    protected changeDetectorRef: ChangeDetectorRef,
  ) {}

  currentLeftMenu: string;

  settingsChangedEventHandler(newValue: any) {
    this.settingsChanged.next(newValue);
  }

  settingsChangedQuillEventHandler(newValue: any) {
    //console.log(`settingsChangedQuillEventHandler: newValue: ${newValue}`);
    this.xmlSettings.documentburster.settings.emailsettings.html = newValue;
    this.settingsChanged.next(this.xmlSettings.documentburster.settings);
  }

  editor: Quill;
  editorCaretPosition: number = 0;

  onEditorCreated(qlEvent: { editor: Quill }) {
    this.editor = qlEvent.editor;
    this.editor.focus();
  }

  onEditorSelectionChanged(qlEvent: {
    range: RangeStatic;
    oldRange: RangeStatic;
    source: string;
  }) {
    if (qlEvent.range) this.editorCaretPosition = qlEvent.range.index;
  }

  async ngOnInit() {
    this.route.params.subscribe(async (params) => {
      if (params.leftMenu) {
        this.currentLeftMenu = params.leftMenu;
      } else {
        this.currentLeftMenu = 'generalSettingsMenuSelected';
      }

      //make sure that the XML file is loaded only once
      if (
        this.currentLeftMenu === 'generalSettingsMenuSelected' ||
        params.reloadConfiguration
      ) {
        this.settingsService.currentConfigurationTemplatePath = Utilities.slash(
          params.configurationFilePath,
        );

        this.settingsService.currentConfigurationTemplateName =
          params.configurationFileName;

        this.xmlSettings = await this.settingsService.loadSettingsFileAsync(
          this.settingsService.currentConfigurationTemplatePath,
        );

        this.stateStore.configSys.currentConfigFile.configuration.settings = {
          ...this.xmlSettings.documentburster.settings,
        };

        //console.log(
        //  `1. ConfigurationComponent onInit - this.xmlSettings.documentburster.settings = ${JSON.stringify(this.xmlSettings.documentburster.settings)}`,
        //);
      }

      if (this.currentLeftMenu === 'emailSettingsMenuSelected') {
        await this.settingsService.loadAllConnectionFilesAsync();
        //console.log(
        //   `this.settingsService.defaultEmailConnectionFile = ${JSON.stringify(
        //     this.settingsService.defaultEmailConnectionFile,
        //   )}`,
        // );

        if (!this.xmlSettings.documentburster.settings.emailserver.conncode)
          this.xmlSettings.documentburster.settings.emailserver.conncode =
            this.settingsService.defaultEmailConnectionFile.connectionCode;

        //console.log(
        //  `this.xmlSettings.documentburster.settings.emailserver.conncode = ${this.xmlSettings.documentburster.settings.emailserver.conncode}`,
        //);
        if (this.xmlSettings.documentburster.settings.emailserver.conncode) {
          this.selectedEmailConnectionFile =
            this.settingsService.connectionFiles.find(
              (connection) =>
                connection.connectionType == 'email-connection' &&
                connection.connectionCode ==
                  this.xmlSettings.documentburster.settings.emailserver
                    .conncode,
            );
          //console.log(
          //  `this.selectedEmailConnectionFile = ${JSON.stringify(
          //    this.settingsService.connectionFiles,
          //  )}`,
          //);
          if (this.xmlSettings.documentburster.settings.emailserver.useconn)
            this.fillExistingEmailConnectionDetails(
              this.selectedEmailConnectionFile.connectionCode,
            );
        }
      } else if (this.currentLeftMenu === 'reportingSettingsMenuSelected') {
        await this.settingsService.loadAllReportTemplatesFilesAsync();

        this.xmlReporting.documentburster =
          await this.settingsService.loadReportingFileAsync(
            this.settingsService.currentConfigurationTemplatePath,
          );

        //console.log(`this.xmlReporting = ${JSON.stringify(this.xmlReporting)}`);

        this.onReportOutputTypeChanged();
      }

      this.settingsService.numberOfUserVariables =
        this.xmlSettings.documentburster.settings.numberofuservariables;

      this.refreshTabs();

      this.messagesService.showInfo(
        'Showing configuration ' +
          this.settingsService.currentConfigurationTemplateName,
      );
      // wait 300ms after the last event before emitting last event
      this.settingsChanged
        .pipe(debounceTime(30))
        .subscribe(async (newValue) => {
          await this.settingsService.saveSettingsFileAsync(
            this.settingsService.currentConfigurationTemplatePath,
            this.xmlSettings,
          );

          if (
            this.xmlSettings.documentburster.settings.capabilities
              .reportgenerationmailmerge &&
            this.xmlReporting.documentburster
          )
            await this.settingsService.saveReportingFileAsync(
              this.settingsService.currentConfigurationTemplatePath,
              this.xmlReporting,
            );

          this.messagesService.showInfo('Saved');
          this.changeDetectorRef.detectChanges();
        });
    });
  }

  refreshTabs() {
    this.visibleTabs = [];

    this.changeDetectorRef.detectChanges();

    const visibleTabsIds = this.MENU_SELECTED_X_VISIBLE_TABS.find((item) => {
      return item.selectedMenu === this.currentLeftMenu;
    }).visibleTabs;

    //const enableincubatingfeatures = this.xmlSettings.documentburster.settings.enableincubatingfeatures;

    this.visibleTabs = this.ALL_TABS.filter((item) => {
      let shouldShow = true;
      if (
        !this.xmlSettings.documentburster.settings?.capabilities
          ?.reportdistribution
      ) {
        if (item.visibleWhenCapability == 'reportdistribution')
          shouldShow = false;
      }

      return visibleTabsIds.includes(item.id) && shouldShow;
    });
  }

  async onSelectOutputFolderPath(filePath: string) {
    this.xmlSettings.documentburster.settings.outputfolder =
      Utilities.slash(filePath);
    await this.settingsService.saveSettingsFileAsync(
      this.settingsService.currentConfigurationTemplatePath,
      this.xmlSettings,
    );
    this.messagesService.showInfo('Saved');
  }

  async onSelectQuarantineFolderPath(filePath: string) {
    this.xmlSettings.documentburster.settings.quarantinefolder = filePath;
    await this.settingsService.saveSettingsFileAsync(
      this.settingsService.currentConfigurationTemplatePath,
      this.xmlSettings,
    );
    this.messagesService.showInfo('Saved');
  }

  async onSelectAttachmentFilePath(filePath: string) {
    this.modalAttachmentInfo.attachmentFilePath = Utilities.slash(filePath);
  }

  onUseExistingEmailConnectionClick(event: Event) {
    if (event instanceof Event) {
      if ((event.target as HTMLInputElement).checked)
        this.fillExistingEmailConnectionDetails(
          this.selectedEmailConnectionFile.connectionCode,
        );
      this.settingsService.refreshConnectionsUsedByInformation(
        this.settingsService.currentConfigurationTemplatePath,
        this.xmlSettings,
      );
    }
  }

  async onUsedExistingEmailConnectionChanged(code: string, name: string) {
    let dialogQuestion = `Use ${name} email connection?`;

    this.confirmService.askConfirmation({
      message: dialogQuestion,
      confirmAction: async () => {
        this.fillExistingEmailConnectionDetails(code);

        await this.settingsService.saveSettingsFileAsync(
          this.settingsService.currentConfigurationTemplatePath,
          this.xmlSettings,
        );

        this.settingsService.refreshConnectionsUsedByInformation(
          this.settingsService.currentConfigurationTemplatePath,
          this.xmlSettings,
        );

        this.messagesService.showInfo('Saved');
      },
    });
  }

  fillExistingEmailConnectionDetails(code: string) {
    //this.xmlSettings.documentburster.settings.emailserver.useconn = true;
    this.xmlSettings.documentburster.settings.emailserver.conncode = code;

    const emailConnection = this.settingsService.connectionFiles.filter(
      (connection) => connection.connectionCode === code,
    )[0];

    this.selectedEmailConnectionFile = emailConnection;

    let connFiled = false;
    const asDefined = `As defined by ${name}`;

    if (emailConnection.emailserver.name) connFiled = true;

    this.xmlSettings.documentburster.settings.emailserver.name = connFiled
      ? emailConnection.emailserver.name
      : asDefined;
    this.xmlSettings.documentburster.settings.emailserver.fromaddress =
      connFiled ? emailConnection.emailserver.fromaddress : asDefined;
    this.xmlSettings.documentburster.settings.emailserver.host = connFiled
      ? emailConnection.emailserver.host
      : asDefined;
    this.xmlSettings.documentburster.settings.emailserver.userid = connFiled
      ? emailConnection.emailserver.userid
      : asDefined;
    this.xmlSettings.documentburster.settings.emailserver.userpassword =
      connFiled ? emailConnection.emailserver.userpassword : asDefined;
    this.xmlSettings.documentburster.settings.emailserver.port = connFiled
      ? emailConnection.emailserver.port
      : asDefined;

    this.xmlSettings.documentburster.settings.emailserver.usessl =
      emailConnection.emailserver.usessl;
    this.xmlSettings.documentburster.settings.emailserver.usetls =
      emailConnection.emailserver.usetls;
  }

  async onSaveHTMLTemplateClick(filePath: string) {
    await this.settingsService.saveTemplateFileAsync(
      filePath + '.html',
      this.xmlSettings.documentburster.settings.emailsettings.html,
    );
    this.messagesService.showInfo('HTML template was saved.');
  }

  async onLoadHTMLTemplateClick(filePath: string) {
    const data = await this.settingsService.loadTemplateFileAsync(filePath);

    (
      document.getElementById('htmlCodeEmailMessage') as HTMLInputElement
    ).value = data;

    document
      .getElementById('htmlCodeEmailMessage')
      .dispatchEvent(new Event('input', { bubbles: true }));
  }
  // attachments

  onAttachmentSelected(attachment: { selected: boolean }) {
    //console.log('=== DEBUG attachment selection ===');

    if (
      this.xmlSettings.documentburster.settings.attachments.items
        .attachmentItems
    ) {
      this.xmlSettings.documentburster.settings.attachments.items.attachmentItems.forEach(
        (item: { selected: boolean }) => {
          item.selected = false;
        },
      );
    }

    attachment.selected = true;
    this.selectedAttachment = attachment;
  }

  onDeleteSelectedAttachment() {
    let dialogQuestion = 'Send emails without any attachment?';
    if (
      this.xmlSettings.documentburster.settings.attachments.items
        .attachmentItems.length > 1
    ) {
      dialogQuestion = 'Delete selected item?';
    }

    this.confirmService.askConfirmation({
      message: dialogQuestion,
      confirmAction: async () => {
        //console.log(
        //  `this.selectedAttachment = ${JSON.stringify(this.selectedAttachment)}`,
        //);
        _.remove(
          this.xmlSettings.documentburster.settings.attachments.items
            .attachmentItems,
          (attachment: any) => attachment.path === this.selectedAttachment.path,
        );

        delete this.selectedAttachment;
        await this.settingsService.saveSettingsFileAsync(
          this.settingsService.currentConfigurationTemplatePath,
          this.xmlSettings,
        );
        this.messagesService.showInfo('Saved');
      },
    });
  }

  onClearAttachments() {
    const dialogQuestion = 'Send emails without any attachment?';

    this.confirmService.askConfirmation({
      message: dialogQuestion,
      confirmAction: async () => {
        delete this.selectedAttachment;

        this.xmlSettings.documentburster.settings.attachments.items.attachmentItems =
          [];

        await this.settingsService.saveSettingsFileAsync(
          this.settingsService.currentConfigurationTemplatePath,
          this.xmlSettings,
        );
        this.messagesService.showInfo('Saved');
      },
    });
  }

  async onSelectedAttachmentUp() {
    const index = _.indexOf(
      this.xmlSettings.documentburster.settings.attachments.items
        .attachmentItems,
      this.selectedAttachment,
    );

    if (index > 0) {
      // Decrement the 'order' of the selected attachment and increment the 'order' of the one above it
      this.xmlSettings.documentburster.settings.attachments.items
        .attachmentItems[index].order--;
      this.xmlSettings.documentburster.settings.attachments.items
        .attachmentItems[index - 1].order++;

      this.onAttachmentSelected(this.selectedAttachment);
      await this.settingsService.saveSettingsFileAsync(
        this.settingsService.currentConfigurationTemplatePath,
        this.xmlSettings,
      );
      this.messagesService.showInfo('Saved');
    }
  }

  async onSelectedAttachmentDown() {
    const index = _.indexOf(
      this.xmlSettings.documentburster.settings.attachments.items
        .attachmentItems,
      this.selectedAttachment,
    );

    if (
      index <
      this.xmlSettings.documentburster.settings.attachments.items
        .attachmentItems.length -
        1
    ) {
      // Increment the 'order' of the selected attachment and decrement the 'order' of the one below it
      this.xmlSettings.documentburster.settings.attachments.items
        .attachmentItems[index].order++;
      this.xmlSettings.documentburster.settings.attachments.items
        .attachmentItems[index + 1].order--;

      this.onAttachmentSelected(this.selectedAttachment);
      await this.settingsService.saveSettingsFileAsync(
        this.settingsService.currentConfigurationTemplatePath,
        this.xmlSettings,
      );
      this.messagesService.showInfo('Saved');
    }
  }

  moveItemInArray(array: [], from: number, to: number): void {
    array.splice(to, 0, array.splice(from, 1)[0]);
  }

  getSortedAttachments() {
    if (this.xmlSettings.documentburster.settings) {
      return this.xmlSettings.documentburster.settings.attachments.items.attachmentItems.sort(
        (attach1: any, attach2: any): number => {
          return attach1.order - attach2.order;
        },
      );
    } else {
      return [];
    }
  }

  onNewEditAttachment(newOrEditMode) {
    this.modalAttachmentInfo.mode = newOrEditMode;
    if (newOrEditMode === 'edit') {
      this.modalAttachmentInfo.attachmentFilePath =
        this.selectedAttachment.path;
    }

    this.isModalAttachmentVisible = true;
  }

  async onOKAttachmentModal() {
    if (this.modalAttachmentInfo.mode === 'edit') {
      const index = _.indexOf(
        this.xmlSettings.documentburster.settings.attachments.items
          .attachmentItems,
        this.selectedAttachment,
      );
      this.xmlSettings.documentburster.settings.attachments.items.attachmentItems[
        index
      ].path = this.modalAttachmentInfo.attachmentFilePath;
      this.selectedAttachment.path =
        this.modalAttachmentInfo.attachmentFilePath;
    } else if (this.modalAttachmentInfo.mode === 'new') {
      this.xmlSettings.documentburster.settings.attachments.items.attachmentItems.push(
        {
          path: this.modalAttachmentInfo.attachmentFilePath,
          order:
            this.xmlSettings.documentburster.settings.attachments.items
              .attachmentItems.length,
        },
      );
      this.modalAttachmentInfo.attachmentFilePath = '';
    }

    //console.log(
    //  `this.settingsService.currentConfigurationTemplatePath = ${this.settingsService.currentConfigurationTemplatePath}`,
    //);
    //console.log(`this.xmlSettings = ${JSON.stringify(this.xmlSettings)}`);

    await this.settingsService.saveSettingsFileAsync(
      this.settingsService.currentConfigurationTemplatePath,
      this.xmlSettings,
    );
    this.isModalAttachmentVisible = false;

    this.messagesService.showInfo('Saved');
  }

  onCancelAttachmentModal() {
    this.isModalAttachmentVisible = false;
    this.modalAttachmentInfo.attachmentFilePath = '';
  }

  // end attachments

  updateFormControlWithSelectedVariable(
    id: string,
    selectedVariableValue: string,
  ) {
    const formControl = document.getElementById(id) as HTMLInputElement;
    const caretPos = formControl.selectionStart;
    const oldValue = formControl.value;
    formControl.value =
      oldValue.substring(0, caretPos) +
      selectedVariableValue +
      oldValue.substring(caretPos);

    formControl.dispatchEvent(new Event('input'));
  }

  async updateQuillFormControlWithSelectedVariable(
    selectedVariableValue: string,
  ) {
    this.editor.insertText(
      this.editorCaretPosition,
      selectedVariableValue,
      'user',
    );
  }

  async updateSMTPFormControlsWithSelectedProviderSettings(
    selectedProviderSettings: EmailProviderSettings,
  ) {
    this.xmlSettings.documentburster.settings.emailserver.usessl = false;
    this.xmlSettings.documentburster.settings.emailserver.usetls = false;

    this.xmlSettings.documentburster.settings.emailserver.host =
      selectedProviderSettings.host;
    this.xmlSettings.documentburster.settings.emailserver.port =
      selectedProviderSettings.port;

    if (selectedProviderSettings.secure === true) {
      this.xmlSettings.documentburster.settings.emailserver.usessl = true;
    }

    if (selectedProviderSettings.tls) {
      this.xmlSettings.documentburster.settings.emailserver.usetls = true;
    }

    await this.settingsService.saveSettingsFileAsync(
      this.settingsService.currentConfigurationTemplatePath,
      this.xmlSettings,
    );
    this.messagesService.showInfo('Saved');
  }

  doTestSMTPConnection() {
    if (this.executionStatsService.logStats.foundDirtyLogFiles) {
      const dialogMessage =
        'Log files are not empty. You need to press the Clear Logs button first.';

      this.infoService.showInformation({
        message: dialogMessage,
      });
    } else {
      const dialogQuestion = 'Send test email?';

      this.confirmService.askConfirmation({
        message: dialogQuestion,
        confirmAction: async () => {
          this.shellService.runBatFile([
            '-cec',
            '-c',
            '"' +
              Utilities.slash(
                this.settingsService.currentConfigurationTemplatePath,
              ).replace('/config/', 'PORTABLE_EXECUTABLE_DIR_PATH/config/') +
              '"',
          ]);
        },
      });
    }
  }

  onShowSendTestSMSModal() {
    if (this.executionStatsService.logStats.foundDirtyLogFiles) {
      const dialogMessage =
        'Log files are not empty. You need to press the Clear Logs button first.';

      this.infoService.showInformation({
        message: dialogMessage,
      });
    } else {
      this.isModalSMSVisible = true;
    }
  }

  onCloseSMSModal() {
    //console.log(`this.modalSMSInfo = ${JSON.stringify(this.modalSMSInfo)}`);
    this.isModalSMSVisible = false;
  }

  onSendTestSMS() {
    this.shellService.runBatFile([
      '-ctwlc',
      '-from',
      this.modalSMSInfo.fromNumber,
      '-to',
      this.modalSMSInfo.toNumber,
      '-c',
      '"' +
        Utilities.slash(
          this.settingsService.currentConfigurationTemplatePath,
        ).replace('/config/', 'PORTABLE_EXECUTABLE_DIR_PATH/config/') +
        '"',
    ]);
  }

  //reporting
  async onReportOutputTypeChanged() {
    /*
    console.log(
      'ALL TEMPLATE FILES:',
      this.settingsService.templateFiles
        .filter(
          (t) => t.fileName.endsWith('.html') || t.fileName.endsWith('.docx'),
        )
        .map((t) => ({
          fileName: t.fileName,
          filePath: t.filePath,
          folderName: t.folderName,
        })),
    );
    */

    if (
      this.xmlReporting.documentburster.report.template.outputtype ==
      'output.none'
    )
      this.xmlReporting.documentburster.report.template.documentpath = '';
    else if (
      ['output.docx', 'output.html', 'output.pdf'].includes(
        this.xmlReporting.documentburster.report.template.outputtype,
      )
    ) {
      const reportTemplateFilePath =
        this.xmlReporting.documentburster.report.template.documentpath;

      if (reportTemplateFilePath) {
        //console.log(
        //  `this.settingsService.templateFiles = ${JSON.stringify(this.settingsService.templateFiles)}`,
        //);

        this.selectedReportTemplateFile =
          this.settingsService.templateFiles.find((tplFile) =>
            tplFile.filePath.includes(reportTemplateFilePath),
          );

        //console.log(
        //  `this.selectedReportTemplateFile = ${JSON.stringify(
        //    this.selectedReportTemplateFile,
        //  )}`,
        //);
      } else if (!reportTemplateFilePath) {
        this.settingsService.currentConfigurationTemplate = this.settingsService
          .getConfigurations()
          .find(
            (confTemplate) =>
              confTemplate.filePath ==
              this.settingsService.currentConfigurationTemplatePath,
          );

        // First, filter by the selected output type
        const templatesOfCorrectType = this.settingsService.getReportTemplates(
          this.xmlReporting.documentburster.report.template.outputtype,
          { samples: false },
        );

        /*
        console.log(
          'OUTPUT TYPE:',
          this.xmlReporting.documentburster.report.template.outputtype,
        );
        console.log(
          'CONFIG FOLDER NAME:',
          this.settingsService.currentConfigurationTemplate.folderName,
        );
        console.log(
          'FILTERED TEMPLATES:',
          JSON.stringify(templatesOfCorrectType),
        );
        */

        // Then find one with matching folder/file name
        const reportTemplateSameFolderNameOrFileName =
          templatesOfCorrectType.find((tplFile) => {
            return (
              tplFile.folderName ==
                this.settingsService.currentConfigurationTemplate.folderName ||
              tplFile.fileName.includes(
                this.settingsService.currentConfigurationTemplate.folderName,
              )
            );
          });

        if (reportTemplateSameFolderNameOrFileName) {
          this.selectedReportTemplateFile =
            reportTemplateSameFolderNameOrFileName;
          this.xmlReporting.documentburster.report.template.documentpath =
            reportTemplateSameFolderNameOrFileName.filePath;

          await this.settingsService.saveReportingFileAsync(
            this.settingsService.currentConfigurationTemplatePath,
            this.xmlReporting,
          );
        }
      }
    }

    this.onAskForFeatureModalShow(event);
  }

  onAskForFeatureModalShow(event: Event | string) {
    let requestedFeature: string;

    if (event instanceof Event)
      requestedFeature = (event.target as HTMLSelectElement).value;
    else requestedFeature = event;

    //console.log(`requestedFeature = ${requestedFeature}`);

    if (
      requestedFeature &&
      !this.askForFeatureService.alreadyImplementedFeatures.includes(
        requestedFeature,
      )
    ) {
      this.askForFeatureService.showAskForFeature({
        requestedFeature: requestedFeature,
      });
    }
  }

  onDataSourceTypeChange() {
    const newValue = this.xmlReporting?.documentburster.report.datasource.type;
    //console.log('New data source type selected:', newValue);

    if (newValue === 'ds.tsvfile') {
      this.xmlReporting.documentburster.report.datasource.csvoptions.separatorchar =
        '→ [tab character]';
    }

    if (newValue === 'ds.csvfile') {
      this.xmlReporting.documentburster.report.datasource.csvoptions.separatorchar =
        ',';
    }

    this.settingsChangedEventHandler(newValue);
    this.onAskForFeatureModalShow(newValue);
  }

  onSelectCsvHeader() {
    this.xmlReporting.documentburster.report.datasource.csvoptions.skiplines = 0;

    if (
      this.xmlReporting.documentburster.report.datasource.csvoptions.header ==
      'firstline'
    )
      this.xmlReporting.documentburster.report.datasource.csvoptions.skiplines = 1;
    else if (
      this.xmlReporting.documentburster.report.datasource.csvoptions.header ==
      'multiline'
    )
      this.xmlReporting.documentburster.report.datasource.csvoptions.skiplines = 2;
  }

  onSelectIdColumn() {
    if (
      this.xmlReporting.documentburster.report.datasource.csvoptions.idcolumn ==
      'letmespecify'
    )
      this.xmlReporting.documentburster.report.datasource.csvoptions.idcolumnindex = 0;
  }

  toggleShowMoreCsvOptions() {
    this.xmlReporting.documentburster.report.datasource.showmorecsvoptions =
      !this.xmlReporting.documentburster.report.datasource.showmorecsvoptions;
    this.changeDetectorRef.detectChanges();
  }

  onSelectTemplateFileChanged(event: any) {
    if (event)
      this.xmlReporting.documentburster.report.template.documentpath =
        event.filePath;
    else this.xmlReporting.documentburster.report.template.documentpath = '';

    this.settingsChangedEventHandler(event);
  }
  //end reporting
}
