import {
  Component,
  OnInit,
  ViewChild,
  ChangeDetectorRef,
  TemplateRef,
  ViewChildren,
  QueryList,
  ElementRef,
} from '@angular/core';

import { ActivatedRoute } from '@angular/router';

import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import * as _ from 'lodash';

//import * as path from 'path';

import { leftMenuTemplate } from './templates/_left-menu';
import { tabsTemplate } from './templates/_tabs';

import {
  ExtConnection,
  ReportParameter,
} from '../../providers/settings.service';
import { ToastrMessagesService } from '../../providers/toastr-messages.service';

import { tabGeneralSettingsTemplate } from './templates/tab-general-settings';
import { tabReportingDataSourceDataTablesTemplate } from './templates/tab-reporting-datasource-datatables';
import { tabReportingTemplateOutputTemplate } from './templates/tab-reporting-template-output';
import { tabReportingTabulatorTemplate } from './templates/tab-reporting-tabulator';
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
import { CodeJarContainer } from 'ngx-codejar';
import Prism from 'prismjs';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-groovy';
import 'prismjs/components/prism-ftl';

import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import {
  HtmlDocTemplateDisplay,
  HtmlDocTemplateInfo,
  SamplesService,
} from '../../providers/samples.service';
import { ConfirmationService } from 'primeng/api';
import { TranslateService } from '@ngx-translate/core';
import { FsService } from '../../providers/fs.service';
import { Position } from 'codejar/.';
import { ConnectionDetailsComponent } from '../../components/connection-details/connection-details.component';
import {
  AiCopilotComponent,
  AiCopilotLaunchConfig,
} from '../../components/ai-copilot/ai-copilot.component';
import { ReportingService } from '../../providers/reporting.service';

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
    ${tabReportingTemplateOutputTemplate} ${tabReportingTabulatorTemplate}
    ${tabEnableDisableDeliveryTemplate} ${tabEmailCloudProvidersTemplate}
    ${tabEmailConnectionSettingsTemplate} ${tabEmailMessageTemplate}
    ${tabAttachmentsTemplate} ${tabUploadFTPTemplate}
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

  @ViewChild('tabReportingTabulatorTemplate', { static: true })
  tabReportingTabulatorTemplate: TemplateRef<any>;

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

  @ViewChild('templateCarousel') templateCarousel: any;
  @ViewChildren('templateIframe') templateIframes: QueryList<ElementRef>;

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
      id: 'reportingTabulatorTab',
      heading: 'AREAS.CONFIGURATION.TABS.REPORTING-TABULATOR',
      ngTemplateOutlet: 'tabReportingTabulatorTemplate',
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
        'reportingTabulatorTab',
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

  // Add these properties to your component class
  emailPreviewVisible = false;
  sanitizedEmailPreview: SafeHtml;

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
    protected fsService: FsService,
    protected executionStatsService: ExecutionStatsService,
    protected shellService: ShellService,
    protected reportingService: ReportingService,
    protected stateStore: StateStoreService,
    protected confirmService: ConfirmService,
    protected primeNgConfirmService: ConfirmationService,
    protected infoService: InfoService,
    protected samplesService: SamplesService,
    protected messagesService: ToastrMessagesService,
    protected translateService: TranslateService,
    protected askForFeatureService: AskForFeatureService,
    protected route: ActivatedRoute,
    protected changeDetectorRef: ChangeDetectorRef,
    protected sanitizer: DomSanitizer,
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

  // ID column selection variables for each data source type
  xmlIdColumnSelection: string = 'notused';
  csvIdColumnSelection: string = 'notused';
  excelIdColumnSelection: string = 'notused';
  fixedWidthIdColumnSelection: string = 'notused';

  sqlIdColumnSelection: string = 'notused';

  scriptIdColumnSelection: string = 'notused';
  scriptFileExplorerSelection: string = 'notused';

  // Add to ngOnInit or where appropriate
  initIdColumnSelections() {
    // XML selection
    const xmlValue =
      this.xmlReporting?.documentburster.report.datasource.xmloptions?.idcolumn;
    if (xmlValue === 'notused' || !xmlValue) {
      this.xmlIdColumnSelection = 'notused';
    } else {
      this.xmlIdColumnSelection = 'custom';
    }

    // CSV/TSV selection
    const csvValue =
      this.xmlReporting?.documentburster.report.datasource.csvoptions?.idcolumn;
    if (csvValue === 'notused' || !csvValue) {
      this.csvIdColumnSelection = 'notused';
    } else if (csvValue === 'firstcolumn') {
      // Corrected from 'first' to 'firstcolumn' if your XML/Java uses 'firstcolumn'
      this.csvIdColumnSelection = 'firstcolumn';
    } else if (csvValue === 'lastcolumn') {
      // Corrected from 'last' to 'lastcolumn' if your XML/Java uses 'lastcolumn'
      this.csvIdColumnSelection = 'lastcolumn';
    } else {
      this.csvIdColumnSelection = 'custom';
    }

    // Excel selection
    const excelValue =
      this.xmlReporting?.documentburster.report.datasource.exceloptions
        ?.idcolumn;
    if (excelValue === 'notused' || !excelValue) {
      this.excelIdColumnSelection = 'notused';
    } else if (excelValue === 'firstcolumn') {
      // Corrected
      this.excelIdColumnSelection = 'firstcolumn';
    } else if (excelValue === 'lastcolumn') {
      // Corrected
      this.excelIdColumnSelection = 'lastcolumn';
    } else {
      this.excelIdColumnSelection = 'custom';
    }

    // Fixed Width selection
    const fixedWidthValue =
      this.xmlReporting?.documentburster.report.datasource.fixedwidthoptions
        ?.idcolumn;
    if (fixedWidthValue === 'notused' || !fixedWidthValue) {
      this.fixedWidthIdColumnSelection = 'notused';
    } else if (fixedWidthValue === 'firstcolumn') {
      // Corrected
      this.fixedWidthIdColumnSelection = 'firstcolumn';
    } else if (fixedWidthValue === 'lastcolumn') {
      // Corrected
      this.fixedWidthIdColumnSelection = 'lastcolumn';
    } else {
      this.fixedWidthIdColumnSelection = 'custom';
    }

    // Corrected SQL idcolumn initialization
    const sqlIdColumnValue =
      this.xmlReporting?.documentburster.report.datasource.sqloptions.idcolumn;
    if (sqlIdColumnValue === 'notused' || !sqlIdColumnValue) {
      this.sqlIdColumnSelection = 'notused';
    } else if (sqlIdColumnValue === 'firstcolumn') {
      this.sqlIdColumnSelection = 'firstcolumn';
    } else if (sqlIdColumnValue === 'lastcolumn') {
      this.sqlIdColumnSelection = 'lastcolumn';
    } else {
      // If it's none of the above, it's a numeric string representing a custom index
      this.sqlIdColumnSelection = 'custom';
    }

    // Corrected Script idcolumn initialization
    const scriptIdColumnValue =
      this.xmlReporting?.documentburster.report.datasource.scriptoptions
        .idcolumn;
    if (scriptIdColumnValue === 'notused' || !scriptIdColumnValue) {
      this.scriptIdColumnSelection = 'notused';
    } else if (scriptIdColumnValue === 'firstcolumn') {
      this.scriptIdColumnSelection = 'firstcolumn';
    } else if (scriptIdColumnValue === 'lastcolumn') {
      this.scriptIdColumnSelection = 'lastcolumn';
    } else {
      // If it's none of the above, it's a numeric string representing a custom index
      this.scriptIdColumnSelection = 'custom';
    }

    // Corrected Script fileexplorer initialization
    const scriptFileExplorerValue =
      this.xmlReporting?.documentburster.report.datasource.scriptoptions
        .selectfileexplorer;
    if (scriptFileExplorerValue === 'notused' || !scriptFileExplorerValue) {
      this.scriptFileExplorerSelection = 'notused';
    } else if (
      scriptFileExplorerValue &&
      scriptFileExplorerValue != 'notused'
    ) {
      // If it contains wildcard pattern
      this.scriptFileExplorerSelection = 'globpattern';
    } else {
      // If it's a specific file or other pattern
      this.scriptFileExplorerSelection = scriptFileExplorerValue;
    }
  }

  onXmlIdColumnSelectionChange(newValue: any) {
    this.xmlIdColumnSelection = newValue;
    if (newValue !== 'custom') {
      this.xmlReporting.documentburster.report.datasource.xmloptions.idcolumn =
        newValue;
    } else {
      // When "custom" is selected, clear the value for user input
      this.xmlReporting.documentburster.report.datasource.xmloptions.idcolumn =
        '';
    }
    this.settingsChangedEventHandler(newValue);
  }

  // Handler for CSV/TSV dropdown
  onCsvIdColumnSelectionChange(newValue: any) {
    this.csvIdColumnSelection = newValue;
    if (newValue !== 'custom') {
      this.xmlReporting.documentburster.report.datasource.csvoptions.idcolumn =
        newValue;
    } else {
      // When "custom" is selected, ensure the underlying model value is a number string (e.g., "0")
      // if it was previously "notused", "firstcolumn", or "lastcolumn".
      // The actual number input is bound via [(ngModel)] to csvCustomIdColumnIndex.
      const currentCustomValue =
        this.xmlReporting.documentburster.report.datasource.csvoptions.idcolumn;
      if (!/^\d+$/.test(currentCustomValue)) {
        // Check if it's not already a number string
        this.xmlReporting.documentburster.report.datasource.csvoptions.idcolumn =
          '0';
      }
    }
    this.settingsChangedEventHandler(newValue);
  }

  // Handler for Excel dropdown
  onExcelIdColumnSelectionChange(newValue: any) {
    this.excelIdColumnSelection = newValue;
    if (newValue !== 'custom') {
      this.xmlReporting.documentburster.report.datasource.exceloptions.idcolumn =
        newValue;
    } else {
      const currentCustomValue =
        this.xmlReporting.documentburster.report.datasource.exceloptions
          .idcolumn;
      if (!/^\d+$/.test(currentCustomValue)) {
        this.xmlReporting.documentburster.report.datasource.exceloptions.idcolumn =
          '0';
      }
    }
    this.settingsChangedEventHandler(newValue);
  }

  // Handler for Fixed Width dropdown
  onFixedWidthIdColumnSelectionChange(newValue: any) {
    this.fixedWidthIdColumnSelection = newValue;
    if (newValue !== 'custom') {
      this.xmlReporting.documentburster.report.datasource.fixedwidthoptions.idcolumn =
        newValue;
    } else {
      const currentCustomValue =
        this.xmlReporting.documentburster.report.datasource.fixedwidthoptions
          .idcolumn;
      if (!/^\d+$/.test(currentCustomValue)) {
        this.xmlReporting.documentburster.report.datasource.fixedwidthoptions.idcolumn =
          '0';
      }
    }
    this.settingsChangedEventHandler(newValue);
  }

  // Methods to handle selection changes
  public onSqlIdColumnSelectionChange(newValue: any) {
    this.sqlIdColumnSelection = newValue; // Update the UI-bound model for the dropdown

    if (newValue !== 'custom') {
      // If "notused", "firstcolumn", or "lastcolumn" is selected, update the model directly
      this.xmlReporting.documentburster.report.datasource.sqloptions.idcolumn =
        newValue;
    } else {
      // If "custom" is selected, the input field for the index is bound to
      // xmlReporting.documentburster.report.datasource.sqloptions.idcolumn.
      // We need to ensure that if the previous value was "notused", "firstcolumn", or "lastcolumn",
      // we set a default numeric string like "0" to `xmlReporting.documentburster.report.datasource.sqloptions.idcolumn`.
      const currentCustomValue =
        this.xmlReporting.documentburster.report.datasource.sqloptions.idcolumn;
      if (
        ['notused', 'firstcolumn', 'lastcolumn'].includes(currentCustomValue) ||
        !/^\d+$/.test(currentCustomValue)
      ) {
        this.xmlReporting.documentburster.report.datasource.sqloptions.idcolumn =
          '0';
      }
      // If it was already a valid number string, the [(ngModel)] on the input field will handle it.
    }
    this.settingsChangedEventHandler(newValue);
  }

  public onScriptIdColumnSelectionChange(newValue: any) {
    this.scriptIdColumnSelection = newValue; // Update the UI-bound model for the dropdown

    if (newValue !== 'custom') {
      this.xmlReporting.documentburster.report.datasource.scriptoptions.idcolumn =
        newValue;
    } else {
      const currentCustomValue =
        this.xmlReporting.documentburster.report.datasource.scriptoptions
          .idcolumn;
      if (
        ['notused', 'firstcolumn', 'lastcolumn'].includes(currentCustomValue) ||
        !/^\d+$/.test(currentCustomValue)
      ) {
        this.xmlReporting.documentburster.report.datasource.scriptoptions.idcolumn =
          '0';
      }
    }
    this.settingsChangedEventHandler(newValue);
  }

  public onScriptFileExplorerSelectionChange(newValue: any) {
    this.scriptFileExplorerSelection = newValue; // Update the UI-bound model for the dropdown

    // Set the XML configuration with appropriate value
    if (newValue === 'notused') {
      this.xmlReporting.documentburster.report.datasource.scriptoptions.selectfileexplorer =
        'notused';
    } else if (newValue === 'globpattern') {
      // If it's currently 'notused', set to default value
      const currentValue =
        this.xmlReporting.documentburster.report.datasource.scriptoptions
          .selectfileexplorer;
      if (currentValue === 'notused' || !currentValue) {
        this.xmlReporting.documentburster.report.datasource.scriptoptions.selectfileexplorer =
          '*.xml';
      }
      // Otherwise keep existing value (don't overwrite user's pattern)
    }

    // Notify that settings have changed
    this.settingsChangedEventHandler(newValue);
  }

  async onReportOutputTypeChanged() {
    // Clear gallery templates but keep allAvailableTemplates
    this.galleryTemplates = [];

    // Check if the current path is a sample path that should be preserved
    const currentPath =
      this.xmlReporting.documentburster.report.template.documentpath;
    const isSamplePath =
      currentPath &&
      (currentPath.includes('/samples/') ||
        currentPath.startsWith('samples/') ||
        currentPath.includes('\\samples\\') ||
        currentPath.startsWith('samples\\'));

    // Get the PREVIOUS output type (before the change)
    let previousOutputType = '';
    let previousExtension = '';
    if (currentPath) {
      const match = currentPath.match(/-(\w+)\.(html|xsl)$/);
      if (match) {
        previousOutputType = match[1];
        previousExtension = match[2];
      }
    }

    // Get the NEW output type and config name
    const newOutputType =
      this.xmlReporting.documentburster.report.template.outputtype.replace(
        'output.',
        '',
      );
    const configName =
      this.settingsService.currentConfigurationTemplate?.folderName ||
      'template';

    // Now handle the new output type
    if (
      this.xmlReporting.documentburster.report.template.outputtype ==
      'output.none'
    ) {
      this.xmlReporting.documentburster.report.template.documentpath = '';
      this.activeReportTemplateContent = '';
      this.sanitizedReportPreview = this.sanitizer.bypassSecurityTrustHtml('');
    } else if (
      ['output.docx', 'output.pdf', 'output.xlsx', 'output.html'].includes(
        this.xmlReporting.documentburster.report.template.outputtype,
      )
    ) {
      this.reportPreviewVisible = true;

      // Generate appropriate path for this output type
      let newPath = '';

      // For sample paths, preserve the original path
      if (isSamplePath) {
        newPath = currentPath;
      }
      // For non-sample paths, calculate a conventional path
      else if (newOutputType === 'docx') {
        if (!currentPath || !currentPath.toLowerCase().endsWith('.docx')) {
          newPath = `/${this.settingsService.CONFIGURATION_TEMPLATES_FOLDER_PATH}/reports/${configName}/${configName}-template.docx`;
        } else {
          newPath = currentPath;
        }
        this.activeReportTemplateContent = '';
        this.sanitizedReportPreview =
          this.sanitizer.bypassSecurityTrustHtml('');
      } else {
        newPath = `${this.settingsService.CONFIGURATION_TEMPLATES_FOLDER_PATH}/reports/${configName}/${configName}-${newOutputType}.html`;

        // Reset and force change detection to ensure CodeJar updates correctly
        this.activeReportTemplateContent = '';
        this.changeDetectorRef.detectChanges();
        await Utilities.sleep(10);

        // Always load from disk (no cache)
        try {
          const fileExists = await this.fsService.existsAsync(newPath);
          if (fileExists) {
            const content =
              await this.settingsService.loadTemplateFileAsync(newPath);
            if (content) {
              this.activeReportTemplateContent = content;
            }
          } else {
            // Create with default content for NEW output type
            const defaultContent = `<html>\n<head>\n<title>${configName} ${newOutputType} Template</title>\n</head>\n<body>\n<h1>${configName} ${newOutputType} Report</h1>\n</body>\n</html>`;
            await this.settingsService.saveTemplateFileAsync(
              newPath,
              defaultContent,
            );
            this.activeReportTemplateContent = defaultContent;
          }
        } catch (error) {
          console.error(`Error loading template for ${newOutputType}:`, error);
        }
      }

      // Update path if needed - but never update for sample paths
      if (
        !isSamplePath &&
        this.xmlReporting.documentburster.report.template.documentpath !==
          newPath
      ) {
        this.xmlReporting.documentburster.report.template.documentpath =
          newPath;
        await this.settingsService.saveReportingFileAsync(
          this.settingsService.currentConfigurationTemplatePath,
          this.xmlReporting,
        );
      }

      if (newOutputType === 'docx') {
        this.selectedReportTemplateFile =
          this.settingsService.templateFiles.find(
            (tplFile) => tplFile.filePath === newPath,
          );
      }
    } else if (
      this.xmlReporting.documentburster.report.template.outputtype ===
      'output.fop2pdf'
    ) {
      this.reportPreviewVisible = false; // No preview for XSL-FO
      let newPath = '';
      if (isSamplePath) {
        newPath = currentPath;
      } else {
        newPath = `${this.settingsService.CONFIGURATION_TEMPLATES_FOLDER_PATH}/reports/${configName}/${configName}-fop2pdf.xsl`;
        this.activeReportTemplateContent = '';
        this.changeDetectorRef.detectChanges();
        await Utilities.sleep(10);

        // Always load from disk (no cache)
        try {
          const fileExists = await this.fsService.existsAsync(newPath);
          if (fileExists) {
            const content =
              await this.settingsService.loadTemplateFileAsync(newPath);
            if (content) {
              this.activeReportTemplateContent = content;
            }
          } else {
            // Default XSL-FO template
            const defaultContent = `<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">\n<!-- XSL-FO template for FOP2PDF -->\n</xsl:stylesheet>`;
            await this.settingsService.saveTemplateFileAsync(
              newPath,
              defaultContent,
            );
            this.activeReportTemplateContent = defaultContent;
          }
        } catch (error) {
          console.error(`Error loading template for fop2pdf:`, error);
        }
      }
      // Update path if needed
      if (
        !isSamplePath &&
        this.xmlReporting.documentburster.report.template.documentpath !==
          newPath
      ) {
        this.xmlReporting.documentburster.report.template.documentpath =
          newPath;
        await this.settingsService.saveReportingFileAsync(
          this.settingsService.currentConfigurationTemplatePath,
          this.xmlReporting,
        );
      }
    } else if (
      this.xmlReporting.documentburster.report.template.outputtype ===
      'output.any'
    ) {
      this.reportPreviewVisible = false; // No preview for FreeMarker
      let newPath = '';
      if (isSamplePath) {
        newPath = currentPath;
      } else {
        newPath = `${this.settingsService.CONFIGURATION_TEMPLATES_FOLDER_PATH}/reports/${configName}/${configName}-any.ftl`;
        this.activeReportTemplateContent = '';
        this.changeDetectorRef.detectChanges();
        await Utilities.sleep(10);

        // Always load from disk (no cache)
        try {
          const fileExists = await this.fsService.existsAsync(newPath);
          if (fileExists) {
            const content =
              await this.settingsService.loadTemplateFileAsync(newPath);
            if (content) {
              this.activeReportTemplateContent = content;
            }
          } else {
            // Default FreeMarker template
            const defaultContent = `<#-- FreeMarker template for arbitrary text output -->\n<#-- Use FreeMarker syntax to generate your output -->`;
            await this.settingsService.saveTemplateFileAsync(
              newPath,
              defaultContent,
            );
            this.activeReportTemplateContent = defaultContent;
          }
        } catch (error) {
          console.error(`Error loading template for freemarker:`, error);
        }
      }
      // Update path if needed
      if (
        !isSamplePath &&
        this.xmlReporting.documentburster.report.template.documentpath !==
          newPath
      ) {
        this.xmlReporting.documentburster.report.template.documentpath =
          newPath;
        await this.settingsService.saveReportingFileAsync(
          this.settingsService.currentConfigurationTemplatePath,
          this.xmlReporting,
        );
      }
    }

    await this.loadAbsoluteTemplatePath();
    if (this.reportPreviewVisible) {
      this.refreshHtmlPreview();
    }
    this.changeDetectorRef.detectChanges();

    this.onAskForFeatureModalShow(
      this.xmlReporting.documentburster.report.template.outputtype,
    );
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

        this.settingsService.currentConfigurationTemplate = this.settingsService
          .getConfigurations()
          .find(
            (confTemplate) =>
              confTemplate.filePath ==
              this.settingsService.currentConfigurationTemplatePath,
          );
      }

      if (this.currentLeftMenu === 'emailSettingsMenuSelected') {
        await this.settingsService.loadAllConnectionFilesAsync();

        if (!this.xmlSettings.documentburster.settings.emailserver.conncode)
          this.xmlSettings.documentburster.settings.emailserver.conncode =
            this.settingsService.defaultEmailConnectionFile.connectionCode;

        if (this.xmlSettings.documentburster.settings.emailserver.conncode) {
          this.selectedEmailConnectionFile =
            this.settingsService.connectionFiles.find(
              (connection) =>
                connection.connectionType == 'email-connection' &&
                connection.connectionCode ==
                  this.xmlSettings.documentburster.settings.emailserver
                    .conncode,
            );

          if (this.xmlSettings.documentburster.settings.emailserver.useconn)
            this.fillExistingEmailConnectionDetails(
              this.selectedEmailConnectionFile.connectionCode,
            );
        }
      } else if (this.currentLeftMenu === 'reportingSettingsMenuSelected') {
        // Load all template files and reporting configuration
        await this.settingsService.loadAllReportTemplatesFilesAsync();

        this.xmlReporting.documentburster =
          await this.settingsService.loadReportingFileAsync(
            this.settingsService.currentConfigurationTemplatePath,
          );

        if (this.xmlReporting?.documentburster?.report?.datasource) {
          const dsType =
            this.xmlReporting.documentburster.report.datasource.type;
          if (dsType === 'ds.scriptfile') {
            await this.loadExternalReportingScript('datasourceScript');
          }
          // Parameters spec can be relevant for SQL and Script
          if (dsType === 'ds.scriptfile' || dsType === 'ds.sqlquery') {
            await this.loadExternalReportingScript('paramsSpecScript');
          }
          // Transformation script is always potentially relevant
          await this.loadExternalReportingScript('transformScript');
        }

        this.initIdColumnSelections();

        // Initialize the reporting tab with appropriate content for the current output type
        if (this.xmlReporting?.documentburster?.report?.template?.outputtype) {
          const outputType =
            this.xmlReporting.documentburster.report.template.outputtype;
          const configName =
            this.settingsService.currentConfigurationTemplate?.folderName ||
            'template';

          // Check if the template path is properly set for the current output type
          await this.onReportOutputTypeChanged();
        }
      }

      this.settingsService.numberOfUserVariables =
        this.xmlSettings.documentburster.settings.numberofuservariables;

      this.refreshTabs();

      this.messagesService.showInfo(
        'Showing configuration ' +
          this.settingsService.currentConfigurationTemplateName,
      );

      // wait 30ms after the last event before emitting last event
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

  highlightEmailMethod(editor: CodeJarContainer) {
    if (editor.textContent !== null && editor.textContent !== undefined) {
      // Set language to HTML markup
      editor.innerHTML = Prism.highlight(
        editor.textContent,
        Prism.languages.markup,
        'markup',
      );
    }
  }

  // Add this method to ConfigurationComponent
  openEmailTemplateGallery() {
    // Temporarily set the tab to reporting template output tab and call the existing method
    // Store current output type
    const currentOutputType =
      this.xmlReporting?.documentburster?.report?.template?.outputtype;

    // Set to HTML output type temporarily
    if (this.xmlReporting?.documentburster?.report?.template) {
      this.xmlReporting.documentburster.report.template.outputtype =
        'output.html';
    }

    // Call the existing method
    this.openTemplateGallery();

    // Restore the original output type after gallery opens
    setTimeout(() => {
      if (this.xmlReporting?.documentburster?.report?.template) {
        this.xmlReporting.documentburster.report.template.outputtype =
          currentOutputType;
      }
    }, 100);
  }

  // Toggle preview visibility
  toggleEmailPreview() {
    this.emailPreviewVisible = !this.emailPreviewVisible;
    if (this.emailPreviewVisible) {
      this.updateEmailPreview();
    }
  }

  // Update the preview when code changes
  onEmailHtmlContentChanged(newContent: string) {
    if (this.xmlSettings) {
      this.xmlSettings.documentburster.settings.emailsettings.html = newContent;
      this.settingsChangedEventHandler(newContent);
      this.updateEmailPreview();
    }
  }

  // Update the sanitized HTML for the preview
  updateEmailPreview() {
    if (
      this.emailPreviewVisible &&
      this.xmlSettings?.documentburster.settings.emailsettings.html
    ) {
      this.sanitizedEmailPreview = this.sanitizer.bypassSecurityTrustHtml(
        this.xmlSettings.documentburster.settings.emailsettings.html,
      );
    }
  }

  // Open email in browser window
  openEmailInBrowser() {
    if (this.xmlSettings?.documentburster.settings.emailsettings.html) {
      const htmlContent =
        this.xmlSettings.documentburster.settings.emailsettings.html;
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    }
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

  doRunTestScript() {}

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
            'system',
            'test-email',
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
      'system',
      'test-sms',
      '--from',
      this.modalSMSInfo.fromNumber,
      '--to',
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

  activeReportTemplateContent: string = '';
  reportPreviewVisible = true;
  sanitizedReportPreview: SafeHtml = '';
  templateSanitizedHtmlCache = new Map<string, SafeHtml>();

  activeDatasourceScriptGroovy: string = '';
  activeParamsSpecScriptGroovy: string = '';
  activeTransformScriptGroovy: string = '';

  // With this single state variable:
  templateGalleryState: string = 'closed'; // Possible values: 'closed', 'examples-gallery', 'hey-ai', 'readme', 'ai-prompt'

  selectedTemplateAiPrompt: string = '';
  selectedPromptType: 'modify' | 'rebuild' | null = null;
  galleryDialogTitle = 'Examples (Gallery)';

  galleryTemplates: HtmlDocTemplateDisplay[] = [];
  allAvailableTemplates: HtmlDocTemplateInfo[] = []; // Store all templates once loaded
  templatesLoaded = false;

  selectedGalleryTemplateIndex = 0;

  templatePreviewFadeState: string = 'visible';

  selectedTemplateReadme: string = '';
  previousStateBeforeReadme: any = null;
  previousStateBeforeAiPrompt: any = null;

  selectedTemplateModifyPrompt: string = '';
  selectedTemplateScratchPrompt: string = '';

  galleryAiInstructions: string = '';

  absoluteTemplateFolderPath: string = '';

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

  async onDataSourceTypeChange(newValue: any) {
    this.xmlReporting.documentburster.report.datasource.showmoreoptions = false; // Reset UI state

    const previousDsType =
      this.xmlReporting.documentburster.report.datasource.type;

    // Save content of scripts related to the *previous* data source type
    // This ensures that any pending changes in the editors are saved to their respective files
    // before the UI potentially clears them or loads new content.
    if (previousDsType === 'ds.scriptfile') {
      if (
        this.activeDatasourceScriptGroovy &&
        this.activeDatasourceScriptGroovy.trim() !== '' &&
        this.activeDatasourceScriptGroovy.trim() !==
          '// Groovy Datasource Script\n// Ensure this file is saved in the report configuration folder.'.trim()
      ) {
        await this.saveExternalReportingScript('datasourceScript');
      }
    }
    // Parameters spec might have been used by SQL or Script
    if (
      previousDsType === 'ds.scriptfile' ||
      previousDsType === 'ds.sqlquery'
    ) {
      if (
        this.activeParamsSpecScriptGroovy &&
        this.activeParamsSpecScriptGroovy.trim() !== '' &&
        this.activeParamsSpecScriptGroovy.trim() !==
          this.exampleParamsSpecScript.trim()
      ) {
        await this.saveExternalReportingScript('paramsSpecScript');
      }
    }
    // Transformation script is always potentially relevant, save it if it has non-default content
    if (
      this.activeTransformScriptGroovy &&
      this.activeTransformScriptGroovy.trim() !== '' &&
      this.activeTransformScriptGroovy.trim() !==
        '// Groovy Additional Transformation Script\n// Ensure this file is saved in the report configuration folder.'.trim()
    ) {
      await this.saveExternalReportingScript('transformScript');
    }

    // Update the datasource type in the XML model
    this.xmlReporting.documentburster.report.datasource.type = newValue;

    // Load content for the *new* data source type into the UI models
    if (newValue === 'ds.scriptfile') {
      await this.loadExternalReportingScript('datasourceScript');
      // Parameters spec is also relevant for scriptfile
      await this.loadExternalReportingScript('paramsSpecScript', {
        defaultContent: this.exampleParamsSpecScript,
      });
    } else if (newValue === 'ds.sqlquery') {
      // SQL Query type does not use the main datasource script editor
      this.activeDatasourceScriptGroovy = ''; // Clear the UI model
      // Parameters spec is relevant for sqlquery
      await this.loadExternalReportingScript('paramsSpecScript', {
        defaultContent: this.exampleParamsSpecScript,
      });
    } else {
      // For other types (CSV, Excel, etc.), clear both script UI models
      this.activeDatasourceScriptGroovy = '';
      this.activeParamsSpecScriptGroovy = '';
    }

    // Transformation script is always potentially relevant, load its content for the new type
    await this.loadExternalReportingScript('transformScript');

    if (
      newValue !== 'ds.scriptfile' &&
      this.xmlReporting.documentburster.report.datasource.scriptoptions
    ) {
      // If scriptoptions contains fields like 'scriptpath' or 'scriptcontent' from other non-conventional uses,
      // you might clear them here if they are truly not applicable.
      // However, the primary goal is to *not set them* for ds.scriptfile.
      // e.g., this.xmlReporting.documentburster.report.datasource.scriptoptions.scriptname = '';
      // e.g., this.xmlReporting.documentburster.report.datasource.scriptoptions.scriptcontent = '';
      // Only do this if these fields actually exist in your XML structure for non-scriptfile types
      // and need explicit clearing.
    }

    this.settingsChangedEventHandler(this.xmlReporting.documentburster.report); // Triggers saving of reporting.xml
    this.onAskForFeatureModalShow(newValue); // Handle UI for feature requests
    this.changeDetectorRef.detectChanges();
  }

  onSqlQueryChanged(event: string) {
    this.xmlReporting.documentburster.report.datasource.sqloptions.query =
      event;
    this.settingsChangedEventHandler(event);
  }

  async onScriptContentChanged(event: string) {
    this.activeDatasourceScriptGroovy = event;
    await this.saveExternalReportingScript('datasourceScript');
    this.settingsChangedEventHandler(event);
  }

  async onTransformationCodeChanged(event: string) {
    this.activeTransformScriptGroovy = event;
    await this.saveExternalReportingScript('transformScript');
    this.settingsChangedEventHandler(event);
  }

  highlightGroovyCode = (editor: CodeJarContainer) => {
    if (!editor) return;
    const code = this.getRawCode(editor);
    if (!code) return;

    try {
      if (Prism.languages.groovy) {
        const html = Prism.highlight(code, Prism.languages.groovy, 'groovy');
        editor.style.whiteSpace = 'pre-wrap';
        editor.innerHTML = html;
      } else {
        console.error(
          'Groovy language not available in Prism for highlighting. Please ensure prism-groovy component is loaded.',
        );
        editor.style.whiteSpace = 'pre-wrap';
        editor.innerHTML = code; // Fallback to unhighlighted code
      }
    } catch (error) {
      console.error('Error during Groovy script highlighting:', error);
      editor.style.whiteSpace = 'pre-wrap';
      editor.innerHTML = code; // Fallback to unhighlighted code
    }
  };

  private getRawCode(editor: CodeJarContainer): string {
    // Fallback to innerText (preserves newlines)
    return editor.innerText || '';
  }

  highlightSqlCode = (editor: CodeJarContainer) => {
    if (!editor) return;
    const code = this.getRawCode(editor);
    try {
      const html = Prism.highlight(code, Prism.languages.sql, 'sql');
      editor.style.whiteSpace = 'pre-wrap';
      editor.innerHTML = html;
    } catch (e) {
      console.error('Error during SQL highlighting:', e);
      editor.style.whiteSpace = 'pre-wrap';
      editor.innerHTML = code;
    }
  };

  // Add ViewChild for the SQL editor
  @ViewChild('sqlEditor') sqlEditorRef: ElementRef;

  // Method to focus the editor when placeholder is clicked
  focusSqlEditor() {
    if (this.sqlEditorRef && this.sqlEditorRef['codejarInstance']) {
      this.sqlEditorRef['codejarInstance'].focus();
    } else if (document.getElementById('sqlQueryEditor')) {
      // Fallback if direct reference isn't available
      document.getElementById('sqlQueryEditor').click();
    }
  }

  onDatabaseConnectionChanged(connectionCode: string) {
    // Logic when SQL database connection changes
    this.settingsChangedEventHandler(connectionCode);
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

  // Fixed Width Header Selection Handler
  onSelectFixedWidthHeader() {
    this.xmlReporting.documentburster.report.datasource.fixedwidthoptions.skiplines = 0;

    if (
      this.xmlReporting.documentburster.report.datasource.fixedwidthoptions
        .header == 'firstline'
    ) {
      this.xmlReporting.documentburster.report.datasource.fixedwidthoptions.skiplines = 1;
    }

    this.settingsChangedEventHandler(
      this.xmlReporting.documentburster.report.datasource.fixedwidthoptions
        .header,
    );
  }

  // Excel Header Selection Handler
  onSelectExcelHeader() {
    this.xmlReporting.documentburster.report.datasource.exceloptions.skiplines = 0;

    if (
      this.xmlReporting.documentburster.report.datasource.exceloptions.header ==
      'firstline'
    ) {
      this.xmlReporting.documentburster.report.datasource.exceloptions.skiplines = 1;
    } else if (
      this.xmlReporting.documentburster.report.datasource.exceloptions.header ==
      'multiline'
    ) {
      this.xmlReporting.documentburster.report.datasource.exceloptions.skiplines = 2;
    }

    this.settingsChangedEventHandler(
      this.xmlReporting.documentburster.report.datasource.exceloptions.header,
    );
  }

  toggleShowMoreCsvOptions() {
    this.xmlReporting.documentburster.report.datasource.showmorecsvoptions =
      !this.xmlReporting.documentburster.report.datasource.showmorecsvoptions;
    //this.changeDetectorRef.detectChanges();
  }

  onSelectTemplateFileChanged(event: any) {
    if (event)
      this.xmlReporting.documentburster.report.template.documentpath =
        event.filePath;
    else this.xmlReporting.documentburster.report.template.documentpath = '';

    this.settingsChangedEventHandler(event);
  }

  // Add these methods
  toggleHtmlPreview() {
    const outputType =
      this.xmlReporting?.documentburster?.report?.template?.outputtype;

    if (['output.html', 'output.pdf', 'output.xlsx'].includes(outputType)) {
      this.reportPreviewVisible = !this.reportPreviewVisible;
      if (this.reportPreviewVisible) this.refreshHtmlPreview();
    }
  }

  refreshHtmlPreview() {
    this.sanitizedReportPreview = this.sanitizer.bypassSecurityTrustHtml(
      this.activeReportTemplateContent,
    );
  }

  async loadGalleryTemplates() {
    this.galleryTemplates = [];

    // Reset display properties
    this.selectedTemplateReadme = '';

    // Get current output type
    const currentOutputType =
      this.xmlReporting?.documentburster?.report?.template?.outputtype;

    //console.log(
    //  'Current output type when loading examples:',
    //  currentOutputType,
    //);

    // Load templates only once
    if (!this.templatesLoaded) {
      this.allAvailableTemplates =
        await this.samplesService.getHtmlDocTemplates();
      this.templatesLoaded = true;
    }

    // Filter templates based on current output type
    const filteredTemplates = this.allAvailableTemplates.filter((template) => {
      //console.log(
      //  `Evaluating template: ${template.name}, tags:`,
      //  template.tags,
      //);

      // For Excel mode, only keep Excel templates
      if (currentOutputType?.includes('xlsx')) {
        if (!template.tags?.includes('excel')) {
          //console.log(
          //  `Skipping non-Excel template ${template.name} because we're in Excel mode`,
          //);
          return false;
        }
        //console.log(`Keeping Excel template: ${template.name}`);
        return true;
      }
      // For non-Excel modes, filter out Excel templates
      else {
        if (template.tags?.includes('excel')) {
          //console.log(
          //  `Skipping Excel template ${template.name} because we're not in Excel mode`,
          //);
          return false;
        }
        //console.log(`Keeping non-Excel template: ${template.name}`);
        return true;
      }
    });

    //console.log(`Filtered templates count: ${filteredTemplates.length}`);

    // Process filtered templates
    filteredTemplates.forEach((template) => {
      //console.log(`Adding template to gallery: ${template.name}`);

      if (template.templateFilePaths.length > 1) {
        // For multi-file templates, create variants
        template.templateFilePaths.forEach((path, index) => {
          const variantTemplate: HtmlDocTemplateDisplay = {
            ...template,
            templateFilePaths: [path], // Keep only the current path
            displayName: `${template.name} (${index + 1} of ${template.templateFilePaths.length})`,
            originalTemplate: template,
            collectionIndex: index + 1,
            currentVariantIndex: 0,
            isLoaded: false,
            htmlContent: [],
            category: this.deriveCategoryFromTags(template.tags),
          };
          this.galleryTemplates.push(variantTemplate);
        });
      } else {
        // Single template handling
        this.galleryTemplates.push({
          ...template,
          displayName: template.name,
          isLoaded: false,
          htmlContent: [],
          currentVariantIndex: 0,
          category: this.deriveCategoryFromTags(template.tags),
        });
      }
    });

    // Rest of the method remains the same
    if (this.galleryTemplates.length > 0) {
      this.selectedGalleryTemplateIndex = 0;
      await Promise.all(
        this.galleryTemplates.map((_, index) =>
          this.loadGalleryTemplateContent(index),
        ),
      );
      const firstTemplate = this.galleryTemplates[0];
      if (firstTemplate) {
        this.selectedTemplateReadme = firstTemplate.readmeContent || '';
        this.selectedTemplateModifyPrompt =
          firstTemplate.selectedTemplateModifyPrompt || '';
        this.selectedTemplateScratchPrompt =
          firstTemplate.selectedTemplateScratchPrompt || '';
      }
    }
  }

  async openTemplateGallery() {
    // Reset template index
    this.selectedGalleryTemplateIndex = 0;

    // Set state to examples-gallery with instructions
    this.templateGalleryState = 'examples-gallery';

    // Set initial dialog header
    this.galleryDialogTitle = 'Examples (Gallery)';

    // Clear the HTML cache to ensure fresh rendering
    this.templateSanitizedHtmlCache.clear();

    // Load general AI instructions content
    const content = await this.settingsService.loadTemplateFileAsync(
      'templates/gallery/readme-examples-gallery.md',
    );

    // Set the content
    this.galleryAiInstructions = String(content);

    // Reset examples and reload
    this.galleryTemplates = [];
    await this.loadGalleryTemplates();

    if (this.templateCarousel) {
      this.templateCarousel.page = 0;
    }
  }

  async loadGalleryTemplateContent(index: number) {
    const template = this.galleryTemplates[index];
    if (!template) return;
    if (template.isLoaded) return; // do not reload if already loaded

    // Reset loading state
    template.isLoaded = false;
    template.htmlContent = [];
    template.currentVariantIndex = 0;

    try {
      // Load each HTML file of the template and pre-cache it
      for (let i = 0; i < template.templateFilePaths.length; i++) {
        const path = template.templateFilePaths[i];
        const content = await this.settingsService.loadTemplateFileAsync(path);
        if (content) {
          template.htmlContent.push(content);
          if (!this.templateSanitizedHtmlCache.has(path)) {
            const safeHtml = this.sanitizeHtmlForIframe(content, path);
            this.templateSanitizedHtmlCache.set(path, safeHtml);
          }
        }
      }

      // With the first (main) template file, load associated README and AI prompts
      if (template.templateFilePaths.length > 0) {
        const path = template.templateFilePaths[0];
        const lastSlashIndex = path.lastIndexOf('/');
        const lastDotIndex = path.lastIndexOf('.');
        if (lastSlashIndex !== -1 && lastDotIndex !== -1) {
          const templateName = path.substring(lastSlashIndex + 1, lastDotIndex);
          const dirPath = path.substring(0, lastSlashIndex);

          // Load README
          try {
            const readmePath = `${dirPath}/${templateName}-readme.md`;
            const readmeContent =
              await this.settingsService.loadTemplateFileAsync(readmePath);
            template.readmeContent =
              readmeContent && readmeContent.length > 0 ? readmeContent : '';
          } catch (error) {
            template.readmeContent = '';
          }

          // Load AI prompt for “modify”
          try {
            const promptModifyPath = `${dirPath}/${templateName}-ai_prompt_modify.md`;
            const promptModifyContent =
              await this.settingsService.loadTemplateFileAsync(
                promptModifyPath,
              );
            template.selectedTemplateModifyPrompt =
              promptModifyContent && promptModifyContent.length > 0
                ? promptModifyContent
                : '';
          } catch (error) {
            template.selectedTemplateModifyPrompt = '';
          }

          // Load AI prompt for “scratch”
          try {
            const promptScratchPath = `${dirPath}/${templateName}-ai_prompt_scratch.md`;
            const promptScratchContent =
              await this.settingsService.loadTemplateFileAsync(
                promptScratchPath,
              );
            template.selectedTemplateScratchPrompt =
              promptScratchContent && promptScratchContent.length > 0
                ? promptScratchContent
                : '';
          } catch (error) {
            template.selectedTemplateScratchPrompt = '';
          }
        }
      }

      template.isLoaded = true;
      //this.changeDetectorRef.detectChanges();
    } catch (error) {
      console.error('Error loading template content:', error);
      template.isLoaded = false;
    }
  }

  getSelectedGalleryTemplate(): HtmlDocTemplateDisplay {
    if (!this.galleryTemplates || this.galleryTemplates.length === 0) {
      return null;
    }

    const template =
      this.galleryTemplates[this.selectedGalleryTemplateIndex || 0];

    // Update display name for multi-file templates
    if (template?.originalTemplate?.templateFilePaths?.length > 1) {
      const total = template.originalTemplate.templateFilePaths.length;
      const current = template.collectionIndex || 1;
      template.displayName = `${template.name} (${current} of ${total})`;
    }

    return template;
  }

  async onGalleryTemplateSelected(event: any): Promise<void> {
    // Update the index and template data
    this.selectedGalleryTemplateIndex = event.page;
    const currentTemplate = this.getSelectedGalleryTemplate();

    if (!currentTemplate) return;

    // Update dialog header
    this.galleryDialogTitle = `Examples (Gallery) - ${currentTemplate.name || currentTemplate.displayName}`;

    if (this.selectedGalleryTemplateIndex === event.page) {
      return;
    }

    // First hide the current content
    this.templatePreviewFadeState = 'hidden';

    // Update display information
    this.updateGalleryTemplateVariantInfo(currentTemplate);
    this.selectedTemplateReadme = currentTemplate.readmeContent || '';
    this.selectedTemplateModifyPrompt =
      currentTemplate.selectedTemplateModifyPrompt || '';
    this.selectedTemplateScratchPrompt =
      currentTemplate.selectedTemplateScratchPrompt || '';

    // After a short delay, show the new content and force rescale
    setTimeout(() => {
      this.templatePreviewFadeState = 'visible';
      setTimeout(() => {
        // This will ensure scaling is recalculated
        window.dispatchEvent(new Event('resize'));
      }, 50);
    }, 100);
  }

  closeTemplateReadme() {
    // Always restore the previous state - will always be 'templates'
    this.templateGalleryState = this.previousStateBeforeReadme.previousState;

    // Restore the specific template index
    this.selectedGalleryTemplateIndex =
      this.previousStateBeforeReadme.templateIndex;

    // Update the carousel position if needed
    if (this.templateCarousel) {
      this.templateCarousel.page = this.selectedGalleryTemplateIndex;
    }

    // Update the dialog header to reflect the template name
    const currentTemplate = this.getSelectedGalleryTemplate();
    if (currentTemplate) {
      this.galleryDialogTitle = `Examples (Gallery) - ${currentTemplate.name || currentTemplate.displayName}`;
    }
  }

  private updateGalleryTemplateVariantInfo(
    template: HtmlDocTemplateDisplay,
  ): void {
    if (!template) return;
    if (template.originalTemplate?.templateFilePaths?.length > 1) {
      const total = template.originalTemplate.templateFilePaths.length;
      const current = (template.currentVariantIndex || 0) + 1;
      template.displayName = `${template.name} (${current} of ${total})`;
    }
    //this.changeDetectorRef.detectChanges();
  }

  useSelectedTemplate(template: HtmlDocTemplateDisplay) {
    if (
      !template ||
      !template.htmlContent ||
      template.htmlContent.length === 0
    ) {
      return;
    }

    // Check if current output type is DOCX
    if (
      this.xmlReporting?.documentburster.report.template.outputtype ===
      'output.docx'
    ) {
      // Show warning toast for DOCX mode
      this.messagesService.showWarning(
        this.translateService.instant(
          'AREAS.CONFIGURATION.TAB-REPORT-TEMPLATE-OUTPUT.DOCX-HTML-WARNING',
        ),
        this.translateService.instant(
          'AREAS.CONFIGURATION.TAB-REPORT-TEMPLATE-OUTPUT.CANNOT-USE-TEMPLATE',
        ),
      );
      return;
    }

    this.primeNgConfirmService.confirm({
      message:
        'Are you sure you want to use this template and override your existing one?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Yes',
      rejectLabel: 'No',
      acceptButtonStyleClass: 'p-button-primary p-button-text',
      rejectButtonStyleClass: 'p-button-secondary p-button-text',
      // This key property reverses the button order:
      acceptVisible: true,
      rejectVisible: true,
      // Remove the styleClass property
      accept: () => {
        const variantIndex = template.currentVariantIndex || 0;
        const htmlContent = template.htmlContent[variantIndex] || '';

        this.activeReportTemplateContent = htmlContent;
        this.onTemplateContentChanged(htmlContent);
        this.templateGalleryState = 'closed';
        this.messagesService.showInfo('Template applied successfully');
      },
    });
  }

  // Component method to add
  escKeyHandler: any;

  addDialogEscapeHandler() {
    // Handle ESC key
    const escHandler = (event) => {
      if (event.key === 'Escape' && this.templateGalleryState !== 'closed') {
        this.closeTemplateGallery();
        // Remove the event listener after closing
        document.removeEventListener('keydown', escHandler);
      }
    };

    // Add event listener
    document.addEventListener('keydown', escHandler);

    // Store for cleanup if needed
    this.escKeyHandler = escHandler;
  }

  closeTemplateGallery() {
    // Simply set state to closed
    this.templateGalleryState = 'closed';

    // Clear content caches that might influence next open
    this.selectedTemplateReadme = '';
    this.selectedTemplateAiPrompt = '';
    this.previousStateBeforeReadme = null;
    this.previousStateBeforeAiPrompt = null;

    // Clear cached HTML
    this.templateSanitizedHtmlCache.clear();
  }

  private deriveCategoryFromTags(tags: string[]): string {
    if (tags.includes('invoice')) return 'Invoice';
    if (tags.includes('report')) return 'Report';
    if (tags.includes('letter')) return 'Letter';
    return 'Other';
  }

  async onTemplateContentChanged(event: any) {
    // Get content from event or active property, ensuring we have something to work with
    const htmlContent =
      typeof event === 'string' ? event : this.activeReportTemplateContent;

    // Skip saving if content is empty or not provided - prevents accidental blank templates
    if (!htmlContent || htmlContent.trim().length === 0) {
      console.warn('Cannot save empty template content');
      return;
    }

    // Get current output type and template information
    const outputType =
      this.xmlReporting.documentburster.report.template.outputtype.replace(
        'output.',
        '',
      );
    const configName =
      this.settingsService.currentConfigurationTemplate?.folderName ||
      'template';

    //console.log(
    //  `Saving ${outputType} template content (${htmlContent.length} bytes)`,
    //);

    // Template path using structure: reports/{configName}/{configName}-{outputType}.html
    let templatePath = `${this.settingsService.CONFIGURATION_TEMPLATES_FOLDER_PATH}/reports/${configName}/${configName}-${outputType}.html`;

    if (outputType === 'fop2pdf')
      templatePath = `${this.settingsService.CONFIGURATION_TEMPLATES_FOLDER_PATH}/reports/${configName}/${configName}-${outputType}.xsl`;

    if (outputType === 'any')
      templatePath = `${this.settingsService.CONFIGURATION_TEMPLATES_FOLDER_PATH}/reports/${configName}/${configName}-${outputType}.ftl`;

    try {
      // Save to disk
      await this.settingsService.saveTemplateFileAsync(
        templatePath,
        htmlContent,
      );

      // Ensure the path is updated in the configuration
      if (
        this.xmlReporting.documentburster.report.template.documentpath !==
        templatePath
      ) {
        this.xmlReporting.documentburster.report.template.documentpath =
          templatePath;
        await this.settingsService.saveReportingFileAsync(
          this.settingsService.currentConfigurationTemplatePath,
          this.xmlReporting,
        );
      }

      // Update preview if visible
      if (
        this.reportPreviewVisible &&
        ['output.html', 'output.pdf', 'output.xlsx'].includes(outputType)
      ) {
        this.refreshHtmlPreview();
      }

      // Update absolute path for display
      await this.loadAbsoluteTemplatePath();

      // Notification only for significant changes to avoid too many toasts
      if (event && typeof event === 'string' && event.length > 10) {
        this.messagesService.showInfo('Template saved successfully');
      }
    } catch (error) {
      //console.error('Error saving template:', error);
      this.messagesService.showError('Error saving template');
    }
  }

  async loadTemplateContent(outputType: string) {
    //console.log(`Loading HTML template content for ${outputType}`);

    // Clear all content if output type is not supported
    if (
      !['output.html', 'output.pdf', 'output.xlsx', 'output.fop2pdf'].includes(
        outputType,
      )
    ) {
      this.activeReportTemplateContent = '';
      this.selectedTemplateReadme = '';
      this.selectedTemplateModifyPrompt = '';
      this.selectedTemplateScratchPrompt = '';
      return;
    }

    const path = this.xmlReporting.documentburster.report.template.documentpath;
    if (path) {
      try {
        // Load the HTML template content
        const content = await this.settingsService.loadTemplateFileAsync(path);

        // Only update if we got valid content
        if (content && content.length > 0) {
          //console.log(
          //  `Loaded ${content.length} bytes of HTML content from ${path}`,
          //);
          this.activeReportTemplateContent = content;
        } else {
          //console.warn(`File exists but is empty or couldn't be read: ${path}`);
        }
      } catch (error) {
        //console.error('Error loading HTML template:', error);
        // Don't clear existing content on error - keep what we have
        return;
      }

      // Get the folder path and base name for the template
      const lastSlashIndex = path.lastIndexOf('/');
      const dirPath = path.substring(0, lastSlashIndex);
      const fileName = path.substring(lastSlashIndex + 1);
      const baseName = fileName.split('-')[0]; // Get name part before first hyphen

      // Build paths for associated files using the base name
      const readmePath = `${dirPath}/${baseName}-readme.md`;
      const promptModifyPath = `${dirPath}/${baseName}-ai_prompt_modify.md`;
      const promptScratchPath = `${dirPath}/${baseName}-ai_prompt_scratch.md`;

      // Try to read README file
      try {
        const readmeContent =
          await this.settingsService.loadTemplateFileAsync(readmePath);
        this.selectedTemplateReadme =
          readmeContent && readmeContent.length > 0 ? readmeContent : '';
      } catch (error) {
        //console.log(`No README found at ${readmePath}`);
        this.selectedTemplateReadme = '';
      }

      // Try to read modify prompt file
      try {
        const promptModifyContent =
          await this.settingsService.loadTemplateFileAsync(promptModifyPath);
        this.selectedTemplateModifyPrompt =
          promptModifyContent && promptModifyContent.length > 0
            ? promptModifyContent
            : '';
      } catch (error) {
        //console.log(`No AI modify prompt found at ${promptModifyPath}`);
        this.selectedTemplateModifyPrompt = '';
      }

      // Try to read scratch prompt file
      try {
        const promptScratchContent =
          await this.settingsService.loadTemplateFileAsync(promptScratchPath);
        this.selectedTemplateScratchPrompt =
          promptScratchContent && promptScratchContent.length > 0
            ? promptScratchContent
            : '';
      } catch (error) {
        //console.log(`No AI scratch prompt found at ${promptScratchPath}`);
        this.selectedTemplateScratchPrompt = '';
      }

      // Update preview after loading content
      this.refreshHtmlPreview();
    } else {
      //console.warn(`Template path invalid or doesn't exist: ${path}`);

      // If path exists but doesn't end with .html, or if path doesn't exist
      if (
        !this.activeReportTemplateContent ||
        this.activeReportTemplateContent.length === 0
      ) {
        // Create default template only if current content is empty
        const configName =
          this.settingsService.currentConfigurationTemplate?.folderName ||
          'template';
        const outputTypeClean = outputType.replace('output.', '');
        this.activeReportTemplateContent = `<html>\n<head>\n<title>${configName} ${outputTypeClean} Template</title>\n</head>\n<body>\n<h1>${configName} ${outputTypeClean} Report</h1>\n</body>\n</html>`;

        // If path exists but content couldn't be loaded, save default content
        if (path) {
          try {
            await this.settingsService.saveTemplateFileAsync(
              path,
              this.activeReportTemplateContent,
            );
            //console.log(
            //  `Created new template file with default content at: ${path}`,
            //);
          } catch (saveError) {
            //console.error(
            //  `Failed to save default template to ${path}:`,
            //  saveError,
            //);
          }
        }
      }

      // Clear associated content
      this.selectedTemplateReadme = '';
      this.selectedTemplateModifyPrompt = '';
      this.selectedTemplateScratchPrompt = '';
    }
  }

  openTemplateInBrowser(template?, templatePath?: string) {
    // Case 1: Direct path provided (from editor "View in Browser" button)
    if (templatePath) {
      const url = `/api/cfgman/rb/view-template?path=${encodeURIComponent(templatePath)}`;
      window.open(url, '_blank');
      return;
    }

    // Case 2: Template object provided (from template gallery)
    if (!template) return;

    // Get the template path from the template object
    const currentVariantIndex = template.currentVariantIndex || 0;
    const templateObjectPath =
      template.templateFilePaths?.[currentVariantIndex];

    if (!templateObjectPath) {
      this.messagesService.showError(
        'Cannot view template: Missing template path',
      );
      return;
    }

    // Use the new view-template endpoint specifically designed for browser viewing
    const url = `/api/cfgman/rb/view-template?path=${encodeURIComponent(templateObjectPath)}`;
    window.open(url, '_blank');
  }

  @ViewChild(AiCopilotComponent) private aiCopilotInstance!: AiCopilotComponent;

  async askAiForHelp(outputTypeCode: string) {
    console.log(`Asking AI for help with output type: ${outputTypeCode}`);

    if (outputTypeCode === 'output.docx' || outputTypeCode === 'output.none') {
      // Set state to hey-ai
      this.templateGalleryState = 'hey-ai';

      // Set appropriate header
      this.galleryDialogTitle = 'Ask Artificial Intelligence To Help You';

      // Clear cache to ensure fresh rendering
      this.templateSanitizedHtmlCache.clear();

      // Load the AI help content
      const content = await this.settingsService.loadTemplateFileAsync(
        'templates/gallery/readme-hey-ai.md',
      );

      // Set the content
      this.galleryAiInstructions = String(content);
    }

    if (outputTypeCode === 'output.pdf') {
      const launchConfig: AiCopilotLaunchConfig = {
        initialActiveTabKey: 'PROMPTS',
        initialSelectedCategory: 'PDF Report Generation',
        initialExpandedPromptId: 'PDF_CORE_OPTIMIZATION',
      };

      if (this.aiCopilotInstance) {
        this.aiCopilotInstance.launchWithConfiguration(launchConfig);
      }
    }

    if (outputTypeCode === 'output.xlsx') {
      const launchConfig: AiCopilotLaunchConfig = {
        initialActiveTabKey: 'PROMPTS',
        initialSelectedCategory: 'Excel Report Generation',
        initialExpandedPromptId: 'EXCEL_TEMPLATE_GENERATOR',
      };

      if (this.aiCopilotInstance) {
        this.aiCopilotInstance.launchWithConfiguration(launchConfig);
      }
    }

    if (outputTypeCode === 'output.html') {
      const launchConfig: AiCopilotLaunchConfig = {
        initialActiveTabKey: 'PROMPTS',
        initialSelectedCategory: 'Template Creation/Modification',
        initialExpandedPromptId: 'BUILD_TEMPLATE_FROM_SCRATCH',
      };

      if (this.aiCopilotInstance) {
        this.aiCopilotInstance.launchWithConfiguration(launchConfig);
      }
    }
  }

  openBingAICopilot() {
    window.open('https://copilot.microsoft.com', '_blank');
  }

  closeGeneralAiInstructions() {
    if (this.templateGalleryState === 'examples-gallery') {
      this.templateGalleryState = 'templates';
      this.onGalleryTemplateSelected({ page: 0 });
    }
  }

  sanitizeHtmlForIframe(html: string, templatePath?: string): SafeHtml {
    if (!html) {
      return this.sanitizer.bypassSecurityTrustHtml('');
    }
    const cacheKey = templatePath || '';
    if (this.templateSanitizedHtmlCache.has(cacheKey)) {
      return this.templateSanitizedHtmlCache.get(cacheKey);
    }
    const baseDirUrl = templatePath
      ? templatePath.substring(0, templatePath.lastIndexOf('/') + 1)
      : '';
    const tempDoc = document.implementation.createHTMLDocument('');
    const tempDiv = tempDoc.createElement('div');
    tempDiv.innerHTML = html;

    // Process regular images
    const images = tempDiv.querySelectorAll('img');
    images.forEach((img) => {
      const src = img.getAttribute('src');
      if (src && !src.startsWith('http') && !src.startsWith('data:')) {
        const assetPath = `${baseDirUrl}${src}`;
        img.setAttribute(
          'src',
          `/api/cfgman/rb/serve-asset?path=${encodeURIComponent(assetPath)}`,
        );
      }
    });

    // Process background images
    const elementsWithStyle = tempDiv.querySelectorAll(
      '[style*="background-image"]',
    );
    elementsWithStyle.forEach((el) => {
      const style = el.getAttribute('style');
      if (style) {
        const bgMatch = style.match(
          /background-image:\s*url\(['"]?([^'")]+)['"]?\)/i,
        );
        if (
          bgMatch &&
          bgMatch[1] &&
          !bgMatch[1].startsWith('http') &&
          !bgMatch[1].startsWith('data:')
        ) {
          const assetPath = `${baseDirUrl}${bgMatch[1]}`;
          const newStyle = style.replace(
            bgMatch[0],
            `background-image: url('/api/cfgman/rb/serve-asset?path=${encodeURIComponent(assetPath)}')`,
          );
          el.setAttribute('style', newStyle);
        }
      }
    });

    const processedHtml = tempDiv.innerHTML;
    const safeHtml = this.sanitizer.bypassSecurityTrustHtml(processedHtml);
    this.templateSanitizedHtmlCache.set(cacheKey, safeHtml);
    return safeHtml;
  }

  private processImages(element: HTMLElement, baseDirUrl: string): void {
    // Process regular images
    const images = element.querySelectorAll('img');
    images.forEach((img) => {
      const src = img.getAttribute('src');
      if (src && !src.startsWith('http') && !src.startsWith('data:')) {
        const assetPath = `${baseDirUrl}${src}`;
        img.setAttribute(
          'src',
          `/api/cfgman/rb/serve-asset?path=${encodeURIComponent(assetPath)}`,
        );
      }
    });

    // Process background images
    const elementsWithStyle = element.querySelectorAll(
      '[style*="background-image"]',
    );
    elementsWithStyle.forEach((el) => {
      const style = el.getAttribute('style');
      if (style) {
        const bgMatch = style.match(
          /background-image:\s*url\(['"]?([^'")]+)['"]?\)/i,
        );
        if (
          bgMatch &&
          bgMatch[1] &&
          !bgMatch[1].startsWith('http') &&
          !bgMatch[1].startsWith('data:')
        ) {
          const assetPath = `${baseDirUrl}${bgMatch[1]}`;
          const newStyle = style.replace(
            bgMatch[0],
            `background-image: url('/api/cfgman/rb/serve-asset?path=${encodeURIComponent(assetPath)}')`,
          );
          el.setAttribute('style', newStyle);
        }
      }
    });
  }

  closeTemplateAiPrompt() {
    // Always restore the previous state - will always be 'templates'
    this.templateGalleryState = this.previousStateBeforeAiPrompt.previousState;

    // Restore the specific template index
    this.selectedGalleryTemplateIndex =
      this.previousStateBeforeAiPrompt.templateIndex;

    // Update the carousel position if needed
    if (this.templateCarousel) {
      this.templateCarousel.page = this.selectedGalleryTemplateIndex;
    }

    // Update the dialog header to reflect the template name
    const currentTemplate = this.getSelectedGalleryTemplate();
    if (currentTemplate) {
      this.galleryDialogTitle = `Examples (Gallery) - ${currentTemplate.name || currentTemplate.displayName}`;
    }

    // Clear the backup state after using it
    this.previousStateBeforeAiPrompt = null;
    this.selectedPromptType = null;
  }

  showTemplateAiPrompt(
    template: HtmlDocTemplateDisplay,
    promptType: 'modify' | 'rebuild',
  ): void {
    if (!template) return;
    this.selectedPromptType = promptType;

    // Set appropriate dialog header based on prompt type
    if (promptType === 'modify') {
      this.galleryDialogTitle =
        'prompt 1: modify this HTML template with some changes, as needed';
    } else {
      this.galleryDialogTitle =
        "prompt 2: build your HTML template from scratch, using this template's (full) prompt as a guide";
    }

    const content =
      promptType === 'modify'
        ? template.selectedTemplateModifyPrompt
        : template.selectedTemplateScratchPrompt;

    if (!content) {
      this.messagesService.showInfo(
        'No AI prompt available for this template.',
        'Information',
      );
      return;
    }

    this.previousStateBeforeAiPrompt = {
      previousState: this.templateGalleryState,
      templateIndex: this.selectedGalleryTemplateIndex, // Also store the current template index
    };

    this.selectedTemplateAiPrompt = content;
    this.templateGalleryState = 'ai-prompt';
  }

  showTemplateReadme(template: HtmlDocTemplateDisplay): void {
    if (!template || !template.readmeContent) {
      this.messagesService.showInfo(
        'No README available for this template.',
        'Information',
      );
      return;
    }

    // Store the current template index explicitly when opening README
    if (this.templateGalleryState !== 'readme') {
      this.previousStateBeforeReadme = {
        previousState: this.templateGalleryState,
        templateIndex: this.selectedGalleryTemplateIndex,
      };
    }

    this.selectedTemplateReadme = template.readmeContent;
    this.templateGalleryState = 'readme';
    this.galleryDialogTitle = 'README';
  }

  getTemplateRelativeFolderPath(): string {
    const relativePath =
      this.xmlReporting?.documentburster.report.template.documentpath;
    if (!relativePath) return '';

    // Extract the directory part only by removing the file name
    const lastSlashIndex = relativePath.lastIndexOf('/');
    if (lastSlashIndex === -1) return relativePath; // No slashes found

    // Return just the folder path
    return relativePath.substring(0, lastSlashIndex);
  }

  async loadAbsoluteTemplatePath(): Promise<void> {
    const relativePath = this.getTemplateRelativeFolderPath();
    if (!relativePath) {
      this.absoluteTemplateFolderPath = '';
      return;
    }

    this.absoluteTemplateFolderPath =
      await this.settingsService.resolveAbsolutePath(relativePath);

    this.absoluteTemplateFolderPath = Utilities.slash(
      this.absoluteTemplateFolderPath,
    );

    //console.log(
    //  `relativePath = ${relativePath}, absolutePath = ${this.absoluteTemplateFolderPath}`,
    //);
  }

  async copyTemplatePathToClipboard(): Promise<void> {
    // Copy to clipboard
    await navigator.clipboard.writeText(this.absoluteTemplateFolderPath);
    this.messagesService.showInfo(
      'Folder path was copied to clipboard!',
      'Success',
    );
  }

  async copyTemplatePromptToClipboard(): Promise<void> {
    if (!this.selectedTemplateAiPrompt) {
      this.messagesService.showInfo('No prompt content to copy', 'Information');
      return;
    }

    await navigator.clipboard.writeText(this.selectedTemplateAiPrompt);
    this.messagesService.showInfo('Prompt copied to clipboard!', 'Success');
  }

  // After the other methods in your component
  highlightHtmlCode = (editor: CodeJarContainer) => {
    if (!editor) return;
    const code = this.getRawCode(editor);
    if (!code) return;

    editor.style.whiteSpace = 'pre-wrap';
    try {
      // note: use `markup` not `html`
      const highlighted = Prism.highlight(
        code,
        Prism.languages.markup,
        'markup',
      );
      editor.innerHTML = highlighted;
    } catch (e) {
      console.error('Error during HTML highlighting:', e);
      editor.innerHTML = code;
    }
  };

  highlightFreeMarkerCode = (editor: CodeJarContainer) => {
    if (!editor) return;
    const code = this.getRawCode(editor);
    editor.style.whiteSpace = 'pre-wrap';
    try {
      const highlighted = Prism.highlight(code, Prism.languages.ftl, 'ftl');
      editor.innerHTML = highlighted;
    } catch (e) {
      editor.innerHTML = code;
    }
  };

  highlightXmlCode = (editor: CodeJarContainer) => {
    if (!editor) return;
    const code = this.getRawCode(editor);
    editor.style.whiteSpace = 'pre-wrap';
    try {
      const highlighted = Prism.highlight(code, Prism.languages.xml, 'xml');
      editor.innerHTML = highlighted;
    } catch (e) {
      editor.innerHTML = code;
    }
  };

  //DBCONNECTIONS START
  @ViewChild('connectionDetailsModal')
  connectionDetailsModalInstance!: ConnectionDetailsComponent;

  getSelectedDbConnection(): ExtConnection | undefined {
    const selectedDbConnectionCode =
      this.xmlReporting?.documentburster?.report?.datasource?.sqloptions
        ?.conncode;
    if (!selectedDbConnectionCode) {
      // No connection code is selected in the model
      return undefined;
    }
    // getDatabaseConnectionFiles() should return an array of ExtConnection objects
    const databaseConnections =
      this.settingsService.getDatabaseConnectionFiles();
    return databaseConnections.find(
      (conn) => conn.connectionCode === selectedDbConnectionCode,
    );
  }

  async showDbConnectionModal() {
    console.log('ConfigurationConnectionsComponet: showCrudModal()');
    this.connectionDetailsModalInstance.showCrudModal(
      'update',
      'database-connection',
      false,
      this.getSelectedDbConnection(),
    );
  }
  //DBCONNECTIONS END

  getAiHelpButtonLabel(outputType: string): string {
    if (outputType === 'output.docx' || outputType === 'output.none') {
      return 'Hey, You Smart AI, Help Me ...';
    }
    return 'Hey, You Smart AI, Help Me With This Template ...';
  }

  exampleParamsSpecScript = `
import java.time.LocalDate
import java.time.LocalDateTime

reportParameters {
  // Core date range parameters with constraints
  parameter(
    id:           'startDate',
    type:         LocalDate,
    label:        'Start Date',
    description:  'Report start date',
    defaultValue: LocalDate.now().minusDays(30)
  ) {
    constraints(
      required: true,
      min:      LocalDate.now().minusDays(365),
      max:      endDate
    )
    ui(
      control: 'date',
      format:  'yyyy-MM-dd'
    )
  }

  parameter(
    id:           'endDate',
    type:         LocalDate,
    label:        'End Date',
    defaultValue: LocalDate.now()
  ) {
    constraints(
      required: true,
      min:      startDate,
      max:      LocalDate.now()
    )
    ui(
      control: 'date',
      format:  'yyyy-MM-dd'
    )
  }

  parameter(
    id:    'customerId',
    type:  String,
    label: 'Customer ID'
  ) {
    constraints(
      required:  true,
      maxLength: 10,
      pattern:   '[A-Z0-9]+'
    )
  }

  parameter(
    id:    'customer',
    type:  String,
    label: 'Customer'
  ) {
    constraints(required: true)
    ui(
      control: 'select',
      options: "SELECT id, name FROM customers WHERE status = 'active'"
    )
  }

  parameter(
    id:           'maxRecords',
    type:         Integer,
    label:        'Max Records',
    defaultValue: 100
  ) {
    constraints(min: 1, max: 1000)
  }

  parameter(
    id:           'includeInactive',
    type:         Boolean,
    label:        'Include Inactive',
    defaultValue: false
  )

  parameter(
    id:           'processingTime',
    type:         LocalDateTime,
    label:        'Processing Time',
    defaultValue: LocalDateTime.now()
  ) {
    ui(
      control: 'datetime',
      format:  "yyyy-MM-dd'T'HH:mm:ss"
    )
  }
}

if (reportParametersProvided) {
  log.info("--- Report Parameter Values ---")
  log.info("startDate          : \${startDate ?: 'NOT_SET'}")
  log.info("endDate            : \${endDate   ?: 'NOT_SET'}")
  log.info("customer           : \${customer ?: 'NOT_SET'}")
  log.info("maxRecords         : \${maxRecords ?: 'NOT_SET'}")
  log.info("includeInactive    : \${includeInactive ?: 'false'}")
  log.info("processingTime     : \${processingTime ?: 'NOT_SET'}")
}
`;

  generateParametersSpecUsingAI() {}

  copyToClipboardParametersSpecExample() {}

  async onParametersSpecChanged(event: string) {
    this.activeParamsSpecScriptGroovy = event;
    await this.saveExternalReportingScript('paramsSpecScript');
    this.settingsChangedEventHandler(event);
  }
  //REPORT PARAMETERS END

  private getCurrentConfigName(): string {
    return (
      this.settingsService.currentConfigurationTemplate?.folderName ||
      'unknown_config'
    );
  }

  private getCurrentConfigReportsPath(): string {
    const configName = this.getCurrentConfigName();
    if (
      configName === 'unknown_config' &&
      !this.settingsService.currentConfigurationTemplatePath?.includes(
        'samples',
      )
    ) {
      // Only log error if not a sample and config name is unknown.
      // Samples might not have a folderName in the same way initially.
      console.error(
        'Configuration folder name is not available to determine base path.',
      );
      return '';
    }
    // For samples, the path might be directly to the samples folder, adjust if necessary
    // This logic assumes 'currentConfigurationTemplate.folderName' is reliable for non-samples
    return `${this.settingsService.CONFIGURATION_REPORTS_FOLDER_PATH}/${configName}`;
  }

  private getDatasourceScriptPath(): string {
    const basePath = this.getCurrentConfigReportsPath();
    const configName = this.getCurrentConfigName();
    // Expected name: e.g., payslips-datasource-script.groovy or [configName]-script.groovy
    // Based on your screenshot, it seems to be [configName]-script.groovy
    return basePath ? `${basePath}/${configName}-script.groovy` : '';
  }

  private getParamsSpecScriptPath(): string {
    const basePath = this.getCurrentConfigReportsPath();
    const configName = this.getCurrentConfigName();
    return basePath
      ? `${basePath}/${configName}-report-parameters-spec.groovy`
      : '';
  }

  private getTransformScriptPath(): string {
    const basePath = this.getCurrentConfigReportsPath();
    const configName = this.getCurrentConfigName();
    return basePath
      ? `${basePath}/${configName}-additional-transformation.groovy`
      : '';
  }

  private async loadExternalReportingScript(
    scriptType: 'datasourceScript' | 'paramsSpecScript' | 'transformScript',
    options?: { defaultContent?: string },
  ): Promise<void> {
    const configName = this.getCurrentConfigName();

    let path: string;
    let cacheKeySuffix: string;
    let targetProperty: keyof ConfigurationComponent;
    let defaultFileContent = options?.defaultContent || '';

    switch (scriptType) {
      case 'datasourceScript':
        path = this.getDatasourceScriptPath();
        cacheKeySuffix = 'datasourceScript';
        targetProperty = 'activeDatasourceScriptGroovy';
        if (!defaultFileContent)
          defaultFileContent =
            '// Groovy Datasource Script\n// Ensure this file is saved in the report configuration folder.';
        break;
      case 'paramsSpecScript':
        path = this.getParamsSpecScriptPath();
        cacheKeySuffix = 'paramsSpecScript';
        targetProperty = 'activeParamsSpecScriptGroovy';
        if (!defaultFileContent)
          defaultFileContent = this.exampleParamsSpecScript; // Use existing example
        break;
      case 'transformScript':
        path = this.getTransformScriptPath();
        cacheKeySuffix = 'transformScript';
        targetProperty = 'activeTransformScriptGroovy';
        if (!defaultFileContent)
          defaultFileContent =
            '// Groovy Additional Transformation Script\n// Ensure this file is saved in the report configuration folder.';
        break;
      default:
        console.error('Unknown script type for loading:', scriptType);
        return;
    }

    let content = await this.settingsService.loadTemplateFileAsync(path);
    (this as any)[targetProperty] = content;

    this.changeDetectorRef.detectChanges();
  }

  private async saveExternalReportingScript(
    scriptType: 'datasourceScript' | 'paramsSpecScript' | 'transformScript',
  ): Promise<void> {
    const configName = this.getCurrentConfigName();

    let path: string;
    let cacheKeySuffix: string;
    let sourceProperty: keyof ConfigurationComponent;
    let contentToSave: string;

    switch (scriptType) {
      case 'datasourceScript':
        path = this.getDatasourceScriptPath();
        cacheKeySuffix = 'datasourceScript';
        sourceProperty = 'activeDatasourceScriptGroovy';
        break;
      case 'paramsSpecScript':
        path = this.getParamsSpecScriptPath();
        cacheKeySuffix = 'paramsSpecScript';
        sourceProperty = 'activeParamsSpecScriptGroovy';
        break;
      case 'transformScript':
        path = this.getTransformScriptPath();
        cacheKeySuffix = 'transformScript';
        sourceProperty = 'activeTransformScriptGroovy';
        break;
      default:
        console.error('Unknown script type for saving:', scriptType);
        return;
    }

    contentToSave = (this as any)[sourceProperty];

    let isEmptyContent = !contentToSave || contentToSave.trim() === '';

    if (isEmptyContent) return;

    // Skip saving if content is essentially empty (e.g., just comments or whitespace)
    // You might want to refine this check based on what you consider "empty" for a script.
    // Forcing a save of an empty string might be desired to clear a file.
    // if (!contentToSave || contentToSave.trim().length === 0 || contentToSave.trim() === '// Groovy Datasource Script' || contentToSave.trim() === '// Groovy Additional Transformation Script') {
    //     console.log(`Skipping save for empty or default placeholder ${scriptType} to ${path}.`);
    //     return;
    // }
    await this.settingsService.saveTemplateFileAsync(path, contentToSave);
  }

  reportParameters: ReportParameter[];
  isModalParametersVisible = false; // Changed from showParamsModal
  reportParamsValid = false;
  reportParamsValue: { [key: string]: any } = {};

  onReportParamsValidChange(isValid: boolean) {
    this.reportParamsValid = isValid;
    console.log('Report parameters form validity:', isValid);
  }

  // Add handler for the form's value
  onReportParamsValueChange(values: { [key: string]: any }) {
    console.log('Form parameter values:', values);
    this.reportParamsValue = values;
  }

  async onRunQueryWithParams() {
    try {
      const result = await this.runQueryWithParams(this.reportParameters);
      this.infoService.showInformation({
        message: `SQL query executed successfully`,
      });
      this.isModalParametersVisible = false;
    } catch (error) {
      this.infoService.showInformation({
        message: `Error executing SQL query: ${error.message}`,
      });
    }
  }

  async runQueryWithParams(parameters: ReportParameter[]) {
    // Convert parameters to key-value pairs with proper types
    const paramsObject = parameters.reduce(
      (acc, param) => {
        acc[param.id] = this.convertParamValue(
          param.type,
          this.reportParamsValue[param.id],
        );
        return acc;
      },
      {} as { [key: string]: any },
    );

    return this.reportingService.testSqlQuery(
      this.xmlReporting.documentburster.report.datasource.sqloptions.query,
      paramsObject,
    );
  }

  async doTestSqlQuery() {
    if (this.executionStatsService.logStats.foundDirtyLogFiles) {
      const dialogMessage =
        'Log files are not empty. You need to press the Clear Logs button first.';
      this.infoService.showInformation({ message: dialogMessage });
      return;
    }

    const dbConnectionCode =
      this.xmlReporting.documentburster.report.datasource.sqloptions.conncode;

    const dialogQuestion = `Test SQL query with connection ${dbConnectionCode}?`;

    this.confirmService.askConfirmation({
      message: dialogQuestion,
      confirmAction: async () => {
        // Parse Groovy DSL to get parameters
        const parameters =
          await this.reportingService.processGroovyParametersDsl(
            this.activeParamsSpecScriptGroovy,
          );

        // Access user-provided values
        const paramValues = this.reportParamsValue;

        // Convert values to correct types based on parameter definitions
        const typedParams = parameters.map((param) => {
          return {
            ...param,
            value: this.convertParamValue(param.type, paramValues[param.id]),
          };
        });

        console.log(`typedParams = ${JSON.stringify(typedParams)}`);

        console.log('Parameters before execution:', {
          parameters,
          values: this.reportParamsValue,
        });
        // Show modal if parameters exist
        if (parameters && parameters.length > 0) {
          this.reportParameters = parameters;
          this.isModalParametersVisible = true;
        }
      },
    });
  }

  // Helper function to convert parameter values
  private convertParamValue(type: string, value: any): any {
    switch (type) {
      case 'LocalDate':
        return new Date(value);
      case 'Integer':
        return parseInt(value, 10);
      case 'Boolean':
        return Boolean(value);
      case 'LocalDateTime':
        return new Date(value);
      default:
        return value;
    }
  }
}
