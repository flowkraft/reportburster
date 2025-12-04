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
import { tabReportingChartTemplate } from './templates/tab-reporting-chart';
import { tabReportingPivotTableTemplate } from './templates/tab-reporting-pivot-table';
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
import 'prismjs/plugins/keep-markup/prism-keep-markup';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-groovy';

// DO NOT UNCOMMENT uncommenting 'prism-ftl' would break other highlighting;
// import 'prismjs/components/prism-ftl';

import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import {
  HtmlDocTemplateDisplay,
} from '../../providers/samples.service';
import { TranslateService } from '@ngx-translate/core';
import { FsService } from '../../providers/fs.service';
import { ConnectionDetailsComponent } from '../../components/connection-details/connection-details.component';
import {
  AiManagerComponent,
  AiManagerLaunchConfig,
} from '../../components/ai-manager/ai-manager.component';
import {
  ReportingService,
  ReportDataResult,
} from '../../providers/reporting.service';
import { modalTemplatesGalleryTemplate } from './templates/modal-gallery';

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
    ${tabReportingChartTemplate} ${tabReportingPivotTableTemplate} ${tabEnableDisableDeliveryTemplate} 
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
    ${tabLogsTemplate} ${tabLicenseTemplate} ${modalAttachmentTemplate} ${modalTemplatesGalleryTemplate}
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

  @ViewChild('tabReportingChartTemplate', { static: true })
  tabReportingChartTemplate: TemplateRef<any>;

  @ViewChild('tabReportingPivotTableTemplate', { static: true })
  tabReportingPivotTableTemplate: TemplateRef<any>;

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

  @ViewChildren('templateIframe') templateIframes: QueryList<ElementRef>;

  selectedAttachment;

  isTestingEmailConnection: boolean = false;

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
      id: 'reportingChartTab',
      heading: 'AREAS.CONFIGURATION.TABS.REPORTING-CHART',
      ngTemplateOutlet: 'tabReportingChartTemplate',
    },
    {
      id: 'reportingPivotTableTab',
      heading: 'AREAS.CONFIGURATION.TABS.REPORTING-PIVOT-TABLE',
      ngTemplateOutlet: 'tabReportingPivotTableTemplate',
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
        'reportingChartTab',
        'reportingPivotTableTab',
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

  autosaveEnabled = false;

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
    protected infoService: InfoService,
    protected messagesService: ToastrMessagesService,
    protected translateService: TranslateService,
    protected askForFeatureService: AskForFeatureService,
    protected route: ActivatedRoute,
    protected changeDetectorRef: ChangeDetectorRef,
    protected sanitizer: DomSanitizer,
  ) { }

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

    this.autosaveEnabled = false;
    try {
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

      if (newOutputType === 'fop2pdf' || newOutputType === 'any') {
        const prevValue = this.xmlSettings?.documentburster?.settings?.burstfilename || '';
        const baseName = prevValue.replace(/\.[^\.]+$/, ''); // removes last extension (e.g. .pdf, .xlsx, .docx, etc.)
        if (newOutputType === 'fop2pdf') this.xmlSettings.documentburster.settings.burstfilename = baseName + '.pdf';
        if (newOutputType === 'any') this.xmlSettings.documentburster.settings.burstfilename = baseName + '.xml';
      }

      const configName =
        this.settingsService.currentConfigurationTemplate?.folderName ||
        'template';

      // Now handle the new output type
      if (
        this.xmlReporting.documentburster.report.template.outputtype ==
        'output.none'
      ) {
        this.xmlReporting.documentburster.report.template.documentpath = '';
        //this.activeReportTemplateContent = '';
        //this.sanitizedReportPreview = this.sanitizer.bypassSecurityTrustHtml('');
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
          //this.activeReportTemplateContent = '';
          //this.sanitizedReportPreview =
          //  this.sanitizer.bypassSecurityTrustHtml('');
        } else {
          newPath = `${this.settingsService.CONFIGURATION_TEMPLATES_FOLDER_PATH}/reports/${configName}/${configName}-${newOutputType}.html`;

          // Reset and force change detection to ensure CodeJar updates correctly
          // this.activeReportTemplateContent = '';
          // this.changeDetectorRef.detectChanges();
          // await Utilities.sleep(10);


        }

        // Always load from disk (no cache)
        try {
          const fileExists = await this.fsService.existsAsync(newPath);
          //console.log(`Checking file: ${newPath}, exists: ${fileExists}`);
          if (fileExists) {
            const content =
              await this.settingsService.loadTemplateFileAsync(newPath);
            //console.log(`Loaded content for ${newPath}:`, content);
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
          this.changeDetectorRef.detectChanges();
        } catch (error) {
          console.error(`Error loading template for ${newOutputType}:`, error);
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
          //this.activeReportTemplateContent = '';
          //this.changeDetectorRef.detectChanges();
          //await Utilities.sleep(10);
        }
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
          this.changeDetectorRef.detectChanges();
        } catch (error) {
          console.error(`Error loading template for fop2pdf:`, error);
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
          // this.activeReportTemplateContent = '';
          //this.changeDetectorRef.detectChanges();
          // await Utilities.sleep(10);
        }
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
          this.changeDetectorRef.detectChanges();
        } catch (error) {
          console.error(`Error loading template for freemarker:`, error);
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
    } finally {
      //console.log(`Autosave enabled after output type change: ${this.autosaveEnabled}`);
      // Re-enable
      this.autosaveEnabled = true;
    }

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
          // Parameters spec is only relevant for SQL and Script (you need a query/script to apply parameters to)
          if (dsType === 'ds.scriptfile' || dsType === 'ds.sqlquery') {
            // Load params spec script - do NOT auto-populate with example
            await this.loadExternalReportingScript('paramsSpecScript');
          }
          // Tabulator and Chart config are relevant for ALL data sources
          // since they all produce reportData (List<LinkedHashMap<String, Object>>)
          // that can be displayed in a table or chart - CSV, XML, SQL, Script, Excel, etc.
          await this.loadExternalReportingScript('tabulatorConfigScript');
          await this.loadExternalReportingScript('chartConfigScript');
          await this.loadExternalReportingScript('pivotTableConfigScript');
          // Transformation script is always potentially relevant
          await this.loadExternalReportingScript('transformScript');
          
          // Initialize parsed options from the pre-loaded configuration template
          // (backend already parsed DSLs when loading all configs)
          const configTemplate = this.settingsService.currentConfigurationTemplate;
          if (configTemplate?.tabulatorOptions) {
            this.activeTabulatorConfigOptions = configTemplate.tabulatorOptions;
          }
          if (configTemplate?.chartOptions) {
            this.activeChartConfigOptions = configTemplate.chartOptions;
          }
          if (configTemplate?.pivotTableOptions) {
            this.activePivotTableConfigOptions = configTemplate.pivotTableOptions;
          }
        }

        this.initIdColumnSelections();

        // Initialize the reporting tab with appropriate content for the current output type
        if (this.xmlReporting?.documentburster?.report?.template?.outputtype) {
          const outputType =
            this.xmlReporting.documentburster.report.template.outputtype;
          const configName =
            this.settingsService.currentConfigurationTemplate?.folderName ||
            'template';

          //console.log(`ngOnInit before this.onReportOutputTypeChanged() - reporting output type: ${outputType}`);

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

  async doRunTestScript() {
    if (this.executionStatsService.logStats.foundDirtyLogFiles) {
      const dialogMessage =
        'Log files are not empty. You need to press the Clear Logs button first.';
      this.infoService.showInformation({ message: dialogMessage });
      return;
    }

    const dialogQuestion = `Test this script?`;

    this.confirmService.askConfirmation({
      message: dialogQuestion,
      confirmAction: async () => {
        // console.log('[DEBUG] doRunTestScript: confirmAction started');
        let parameters = [];

        // Parse Groovy DSL to get parameters
        if (this.activeParamsSpecScriptGroovy &&
          this.activeParamsSpecScriptGroovy.trim() !== '') {
          // console.log('[DEBUG] doRunTestScript: parsing parameters DSL');
          parameters =
            await this.reportingService.processGroovyParametersDsl(
              this.activeParamsSpecScriptGroovy,
            );
          // console.log('[DEBUG] doRunTestScript: parsed parameters:', parameters);

          // Access user-provided values
          const paramValues = this.reportParamsValues;

          // Convert values to correct types based on parameter definitions
          const typedParams = parameters.map((param) => {
            return {
              ...param,
              value: this.convertParamValue(param.type, paramValues[param.id]),
            };
          });

          //console.log(`typedParams = ${JSON.stringify(typedParams)}`);

          //console.log('Parameters before execution:', {
          //  parameters,
          //  values: this.reportParamsValues,
          //});
          // Only update if different
          if (!_.isEqual(this.reportParameters, parameters)) {
            this.reportParameters = parameters;
          }
        }
        // console.log('[DEBUG] doRunTestScript: checking parameters count:', parameters?.length);
        if (parameters && parameters.length > 0) {
          // console.log('[DEBUG] doRunTestScript: showing parameters modal');
          this.isModalParametersVisible = true;
        }
        else {
          // console.log('[DEBUG] doRunTestScript: no parameters, calling executeTestQuery');
          return this.executeTestQuery([]);
        }
      },
    });
  }

  doTestSMTPConnection() {
    if (this.executionStatsService.logStats.foundDirtyLogFiles) {
      const dialogMessage = 'Log files are not empty. You need to press the Clear Logs button first.';
      this.infoService.showInformation({ message: dialogMessage });
      return;
    }

    const dialogQuestion = 'Send test email?';
    this.confirmService.askConfirmation({
      message: dialogQuestion,
      confirmAction: async () => {
        this.isTestingEmailConnection = true;

        // 1) Determine which file to test:
        let fileToTest: string;
        if (this.xmlSettings.documentburster.settings.emailserver.useconn) {
          // reuse existing email connection
          fileToTest = this.selectedEmailConnectionFile.filePath;
        } else {
          // inline SMTP details in the config template
          fileToTest = this.settingsService.currentConfigurationTemplatePath;
        }

        // 2) Build the CLI argument and run
        const execPath = `"${Utilities.slash(fileToTest)
          .replace('/config/', 'PORTABLE_EXECUTABLE_DIR_PATH/config/')}"`;

        this.shellService.runBatFile(
          ['system', 'test-email', '--email-connection-file', execPath],
          'testing SMTP connection',
          (result) => {
            // Reset flag when done - this will enable the button
            this.isTestingEmailConnection = false;

            if (result.success) {
              this.messagesService.showSuccess('Test email sent successfully');
            } else {
              this.messagesService.showError('Test email failed');
              console.error(result.error);
            }
          }
        );
      },
    });
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
  // Tabulator configuration script (Groovy DSL)
  activeTabulatorConfigScriptGroovy: string = '';
  activeTabulatorConfigOptions: any = null; // { layoutOptions, columns, data }
  private tabulatorTableInstance: any = null;

  // Chart configuration script (Groovy DSL)
  activeChartConfigScriptGroovy: string = '';
  activeChartConfigOptions: any = null; // { type, labelField, options, labels, datasets }
  private chartInstance: any = null;

  // Pivot Table configuration script (Groovy DSL)
  activePivotTableConfigScriptGroovy: string = '';
  activePivotTableConfigOptions: any = null; // { rows, cols, vals, aggregatorName, rendererName, etc. }

  // Minimal runtime handler registry - keys referenced from the DSL
  private tabulatorHandlerRegistry: { [name: string]: (payload: any, params?: any, table?: any) => void } = {
    HIGHLIGHT_URGENT: (payload, params, table) => {
      try {
        const row = payload?.row;
        if (row && typeof row.getElement === 'function') {
          const el = row.getElement();
          el.style.backgroundColor = params?.color || '#ffdddd';
        }
      } catch (e) {
        console.warn('HIGHLIGHT_URGENT handler error', e);
      }
    },
    LOG_DATA: (payload, params, table) => {
      const level = params?.level || 'info';
      console[level](payload?.data || payload?.rowData || payload);
    }
  };


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


    if (newValue === 'ds.tsvfile') {
      this.xmlReporting.documentburster.report.datasource.csvoptions.separatorchar =
        '→ [tab character]';
    }

    if (newValue === 'ds.csvfile') {
      this.xmlReporting.documentburster.report.datasource.csvoptions.separatorchar =
        ',';
    }

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
        '// Groovy Datasource Script\n'.trim()
      ) {
        await this.saveExternalReportingScript('datasourceScript');
      }
    }
    // Parameters spec might have been used by SQL or Script
    if (
      previousDsType === 'ds.scriptfile' ||
      previousDsType === 'ds.sqlquery'
    ) {


      if (!this.xmlReporting.documentburster.report.datasource.sqloptions.conncode) {
        const defaultDbConn = this.settingsService.defaultDatabaseConnectionFile;
        if (defaultDbConn && defaultDbConn.connectionCode) {
          this.xmlReporting.documentburster.report.datasource.sqloptions.conncode = defaultDbConn.connectionCode;
        }

        //console.log(`Default DB connection code set: ${this.xmlReporting.documentburster.report.datasource.sqloptions.conncode}`);
      }

      if (!this.xmlReporting.documentburster.report.datasource.scriptoptions.conncode) {
        const defaultDbConn = this.settingsService.defaultDatabaseConnectionFile;
        if (defaultDbConn && defaultDbConn.connectionCode) {
          this.xmlReporting.documentburster.report.datasource.scriptoptions.conncode = defaultDbConn.connectionCode;
        }

        //console.log(`Default DB connection code set: ${this.xmlReporting.documentburster.report.datasource.scriptoptions.conncode}`);
      }

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
      await this.loadExternalReportingScript('paramsSpecScript');
    } else if (newValue === 'ds.sqlquery') {
      // SQL Query type does not use the main datasource script editor
      this.activeDatasourceScriptGroovy = ''; // Clear the UI model
      // Parameters spec is relevant for sqlquery
      await this.loadExternalReportingScript('paramsSpecScript');
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
    // Prefer textContent (raw text including newlines) to preserve multiple blank lines
    // Fallback to innerText if textContent not available.
    try {
      if ((editor as any).textContent !== undefined && (editor as any).textContent !== null) {
        return (editor as any).textContent as string;
      }
    } catch (err) {
      // ignore and use innerText
    }
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
  @ViewChild('tabulatorConfigEditor') tabulatorConfigEditorRef: ElementRef;
  @ViewChild('chartConfigEditor') chartConfigEditorRef: ElementRef;
  @ViewChild('pivotTableConfigEditor') pivotTableConfigEditorRef: ElementRef;

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

  get selectedDbConnCode(): string {
    const dsType = this.xmlReporting?.documentburster.report.datasource.type;
    if (dsType === 'ds.sqlquery') {
      return this.xmlReporting.documentburster.report.datasource.sqloptions.conncode;
    }
    if (dsType === 'ds.scriptfile') {
      return this.xmlReporting.documentburster.report.datasource.scriptoptions.conncode;
    }
    return '';
  }

  set selectedDbConnCode(value: string) {
    const dsType = this.xmlReporting?.documentburster.report.datasource.type;
    if (dsType === 'ds.sqlquery') {
      this.xmlReporting.documentburster.report.datasource.sqloptions.conncode = value;
    }
    if (dsType === 'ds.scriptfile') {
      this.xmlReporting.documentburster.report.datasource.scriptoptions.conncode = value;
    }
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
    //console.log(`this.sanitizedReportPreview = ${this.sanitizedReportPreview}`);

  }


  async onTemplateContentChanged(event: any) {

    if (!this.autosaveEnabled) return;

    // Get content from event or active property, ensuring we have something to work with
    this.activeReportTemplateContent = typeof event === 'string' ? event : this.activeReportTemplateContent;

    // Get current output type and template information
    const outputType =
      this.xmlReporting.documentburster.report.template.outputtype.replace(
        'output.',
        '',
      );

    // Update preview if visible
    if (
      this.reportPreviewVisible &&
      ['html', 'pdf', 'xlsx'].includes(outputType)
    ) {
      this.refreshHtmlPreview();
      this.changeDetectorRef.detectChanges();
    }


    const currentPath = this.xmlReporting.documentburster.report.template.documentpath;
    const isSamplePath =
      currentPath &&
      (currentPath.includes('/samples/') ||
        currentPath.startsWith('samples/') ||
        currentPath.includes('\\samples\\') ||
        currentPath.startsWith('samples\\'));

    if (isSamplePath) return;

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
        this.activeReportTemplateContent,
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

  openTemplateInBrowser(template?, templatePath?: string) {

    //alert(templatePath);

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

  @ViewChild(AiManagerComponent) private aiManagerInstance!: AiManagerComponent;

  async askAiForHelp(outputTypeCode: string) {

    //console.log(`Asking AI for help with output type: ${outputTypeCode}`);

    if (outputTypeCode === 'output.pdf') {
      const launchConfig: AiManagerLaunchConfig = {
        initialActiveTabKey: 'PROMPTS',
        initialSelectedCategory: 'PDF Generation (from HTML)',
        initialExpandedPromptId: 'PDF_SAMPLE_A4_ORDER_SUMMARY',
      };

      if (this.aiManagerInstance) {
        this.aiManagerInstance.launchWithConfiguration(launchConfig);
      }
    }

    if (outputTypeCode === 'output.xlsx') {
      const launchConfig: AiManagerLaunchConfig = {
        initialActiveTabKey: 'PROMPTS',
        initialSelectedCategory: 'Excel Report Generation',
        initialExpandedPromptId: 'EXCEL_TEMPLATE_GENERATOR',
      };

      if (this.aiManagerInstance) {
        this.aiManagerInstance.launchWithConfiguration(launchConfig);
      }
    }

    if (outputTypeCode === 'output.html') {
      const launchConfig: AiManagerLaunchConfig = {
        initialActiveTabKey: 'PROMPTS',
        initialSelectedCategory: 'Template Creation/Modification',
        initialExpandedPromptId: 'BUILD_TEMPLATE_FROM_SCRATCH',
      };

      if (this.aiManagerInstance) {
        this.aiManagerInstance.launchWithConfiguration(launchConfig);
      }
    }

    if (outputTypeCode === 'output.fop2pdf') {
      const launchConfig: AiManagerLaunchConfig = {
        initialActiveTabKey: 'PROMPTS',
        initialSelectedCategory: 'PDF Generation (from XSL-FO)',
        initialExpandedPromptId: 'PDF_SAMPLE_A4_PAYSLIP_XSLFO',
      };

      if (this.aiManagerInstance) {
        this.aiManagerInstance.launchWithConfiguration(launchConfig);
      }
    }

    if (outputTypeCode === 'output.any' || outputTypeCode === 'output.docx') {
      const launchConfig: AiManagerLaunchConfig = {
        initialActiveTabKey: 'PROMPTS',
        initialSelectedCategory: 'Template Creation/Modification',
      };

      if (this.aiManagerInstance) {
        this.aiManagerInstance.launchWithConfiguration(launchConfig);
      }
    }

    if (outputTypeCode === 'email.message') {
      const launchConfig: AiManagerLaunchConfig = {
        initialActiveTabKey: 'PROMPTS',
        initialSelectedCategory: 'Email Templates (Responsive)',
      };

      if (this.aiManagerInstance) {
        this.aiManagerInstance.launchWithConfiguration(launchConfig);
      }
    }

    if (outputTypeCode === 'script.additionaltransformation') {
      const launchConfig: AiManagerLaunchConfig = {
        initialActiveTabKey: 'PROMPTS',
        initialSelectedCategory: 'Script Writing Assistance',
        initialExpandedPromptId: 'GROOVY_SCRIPT_ADDITIONAL_TRANSFORMATION',
      };

      if (this.aiManagerInstance) {
        this.aiManagerInstance.launchWithConfiguration(launchConfig);
      }
    }

    if (outputTypeCode === 'script.ds') {
      const launchConfig: AiManagerLaunchConfig = {
        initialActiveTabKey: 'PROMPTS',
        initialSelectedCategory: 'Script Writing Assistance',
        initialExpandedPromptId: 'GROOVY_SCRIPT_INPUT_SOURCE',
      };

      if (this.aiManagerInstance) {
        this.aiManagerInstance.launchWithConfiguration(launchConfig);
      }
    }

    if (outputTypeCode === 'cms.webportal') {
      const launchConfig: AiManagerLaunchConfig = {
        initialActiveTabKey: 'PROMPTS',
        initialSelectedCategory: 'Web Portal / CMS',
      };

      if (this.aiManagerInstance) {
        this.aiManagerInstance.launchWithConfiguration(launchConfig);
      }
    }

  }

  absoluteTemplateFolderPath: string = '';

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
    if (!code) return;

    editor.style.whiteSpace = 'pre-wrap';
    try {
      // Use markup (HTML/XML) highlighting for FreeMarker templates
      const highlighted = Prism.highlight(
        code,
        Prism.languages.markup,
        'markup'
      );
      editor.innerHTML = highlighted;
    } catch (e) {
      editor.innerHTML = code;
      console.error('Error during FreeMarker (markup) highlighting:', e);
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
    //console.log('ConfigurationConnectionsComponet: showCrudModal()');
    this.connectionDetailsModalInstance.showCrudModal(
      'update',
      'database-connection',
      false,
      this.getSelectedDbConnection(),
    );
  }
  //DBCONNECTIONS END

  getAiHelpButtonLabel(outputType: string): string {
    return `Hey AI, Help Me Build This ${outputType.replace('output.', '').toUpperCase()} Template!`;
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

  exampleTabulatorConfigScript = `/*
 Tabulator Groovy DSL - aligned with tabulator.info API
 Docs: https://tabulator.info/docs/6.3/columns
 Data comes from ctx.reportData by default - no need to specify it
*/

tabulator {
  // ─────────────────────────────────────────────────────────────────────────────
  // TABLE-LEVEL OPTIONS (layoutOptions block)
  // ─────────────────────────────────────────────────────────────────────────────
  layoutOptions {
    layout "fitColumns"       // fitData|fitDataFill|fitDataStretch|fitDataTable|fitColumns
    height "400px"            // table height (px, %, or number)
    width "100%"              // table width
    autoColumns false         // true = auto-generate columns from data
    renderVertical "virtual"  // virtual|basic - virtual DOM rendering
    renderHorizontal "basic"  // virtual|basic - horizontal rendering
    layoutColumnsOnNewData true  // recalc column widths on new data
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // COLUMN DEFINITIONS - mirrors tabulator.info column API
  // ─────────────────────────────────────────────────────────────────────────────
  columns {
    // Full-featured column example
    column { 
      // Required
      title "Name"
      field "name"
      
      // Alignment: hozAlign (left|center|right), vertAlign (top|middle|bottom)
      hozAlign "left"
      vertAlign "middle"
      headerHozAlign "center"  // header text alignment
      
      // Width: width, minWidth, maxWidth (px or number)
      width 200
      minWidth 100
      maxWidth 400
      widthGrow 1              // flex grow factor
      widthShrink 1            // flex shrink factor
      
      // Visibility & Layout
      visible true             // false to hide column
      frozen false             // true to freeze column (left/right)
      responsive 0             // responsive priority (lower = hidden first)
      resizable true           // user can resize column
      
      // Sorting: sorter (string|number|alphanum|boolean|exists|date|time|datetime|array)
      sorter "string"
      sorterParams([])         // sorter-specific params
      headerSort true          // enable header click sorting
      
      // Filtering
      headerFilter "input"     // input|number|list|textarea|tick|star|select|autocomplete
      headerFilterParams([values: ["A", "B", "C"]])  // filter-specific params
      headerFilterPlaceholder "Search..."
      
      // Formatting: formatter (plaintext|textarea|html|money|image|link|datetime|tickCross|star|progress|etc)
      formatter "plaintext"
      formatterParams([:])     // formatter-specific params
      cssClass "my-class"      // custom CSS class
      tooltip true             // show cell tooltip
      
      // Editing: editor (input|textarea|number|range|tick|star|select|autocomplete|date|time|datetime)
      editor "input"
      editorParams([:])        // editor-specific params
      editable true            // cell is editable
      validator "required"     // required|unique|integer|float|numeric|string|min|max|etc
      
      // Header customization
      headerTooltip "Column description"
      headerVertical false     // rotate header text
    }
    
    // Compact shorthand examples
    column { title "Age"; field "age"; hozAlign "right"; sorter "number"; formatter "number" }
    column { title "Status"; field "status"; headerFilter "list"; headerFilterParams([values: ["Active", "Pending"]]) }
    column { title "Amount"; field "amount"; formatter "money"; width 120 }
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // OPTIONAL: Data override (90% of the time you don't need this)
  // By default, data comes from ctx.reportData. Uncomment to use custom data:
  // ─────────────────────────────────────────────────────────────────────────────
  // data ctx.reportData                                    // explicit default
  // data ctx.reportData.findAll { it.status == 'Active' }  // filtered
  // data ctx.reportData.take(100)                          // first 100 rows
  // data ctx.reportData.collect { it + [computed: it.a + it.b] }  // with computed column
}
`;
  // Example Chart configuration Groovy DSL
  exampleChartConfigScript = `/*
 Chart Groovy DSL - aligned with Chart.js
 Docs: https://www.chartjs.org/docs/latest/configuration/
 Data comes from ctx.reportData by default - no need to specify it
*/

chart {
  // ─────────────────────────────────────────────────────────────────────────────
  // CHART TYPE
  // ─────────────────────────────────────────────────────────────────────────────
  // Types: line, bar, pie, doughnut, radar, polarArea, scatter, bubble
  type 'bar'
  
  // ─────────────────────────────────────────────────────────────────────────────
  // LABEL FIELD - Which column to use for X-axis labels
  // ─────────────────────────────────────────────────────────────────────────────
  // Optional - auto-detected from first column if not specified
  labelField 'region'
  
  // ─────────────────────────────────────────────────────────────────────────────
  // SERIES CONFIGURATION - which data columns to chart
  // ─────────────────────────────────────────────────────────────────────────────
  series {
    // Full-featured series example
    series {
      // Core properties
      field 'revenue'                 // data column name (required)
      label 'Revenue'                 // legend label
      color '#4e79a7'                 // shorthand for backgroundColor + borderColor
      backgroundColor 'rgba(78, 121, 167, 0.5)'  // fill color (can use rgba)
      borderColor '#4e79a7'           // line/border color
      type 'bar'                      // override chart type for this series (mixed charts)
      
      // Axis assignment (for multiple axes)
      yAxisID 'y'                     // which Y axis to use
      xAxisID 'x'                     // which X axis to use
      
      // Line/Area chart options
      borderWidth 2                   // line thickness
      fill false                      // fill area under line (true|false|'origin'|'start'|'end')
      tension 0.4                     // line curve tension (0 = straight, 1 = very curved)
      pointRadius 4                   // data point size
      pointStyle 'circle'             // circle|cross|crossRot|dash|line|rect|rectRounded|rectRot|star|triangle
      
      // Display options
      hidden false                    // hide series initially
      order 0                         // drawing order (lower = drawn first)
    }
    
    // Compact shorthand examples
    series field: 'sales', label: 'Sales', color: '#4e79a7'
    series field: 'profit', label: 'Profit', color: '#e15759', type: 'line'
    series field: 'cost', label: 'Cost', color: '#59a14f', fill: true, tension: 0.3
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // CHART.JS OPTIONS - full passthrough to Chart.js configuration
  // ─────────────────────────────────────────────────────────────────────────────
  options {
    responsive true
    maintainAspectRatio true
    
    plugins {
      title { display true; text 'Sales by Region' }
      legend { position 'bottom' }    // top|bottom|left|right
      tooltip { enabled true }
      datalabels { display false }    // requires chartjs-plugin-datalabels
    }
    
    scales {
      y { 
        beginAtZero true
        title { display true; text 'Value' }
        // For secondary axis: y2 { position 'right'; beginAtZero true }
      }
      x { 
        title { display true; text 'Region' }
      }
    }
    
    // Animation
    animation { duration 1000 }
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // OPTIONAL: Data override (90% of the time you don't need this)
  // By default, data comes from ctx.reportData. Uncomment to use custom data:
  // ─────────────────────────────────────────────────────────────────────────────
  // data ctx.reportData                                    // explicit default
  // data ctx.reportData.findAll { it.status == 'Active' }  // filtered
  // data ctx.reportData.take(10)                           // top 10 only
  // data ctx.reportData.groupBy { it.category }.collect { k, v -> [category: k, total: v.sum { it.amount }] }
}
`;

  // Example Pivot Table configuration Groovy DSL
  examplePivotTableConfigScript = `/*
 Pivot Table Groovy DSL - aligned with react-pivottable API
 Docs: https://github.com/plotly/react-pivottable
 Data comes from ctx.reportData by default - no need to specify it
*/

pivotTable {
  // ─────────────────────────────────────────────────────────────────────────────
  // ROW FIELDS - which columns to use as row headers (group by)
  // ─────────────────────────────────────────────────────────────────────────────
  rows 'region', 'country'
  
  // ─────────────────────────────────────────────────────────────────────────────
  // COLUMN FIELDS - which columns to pivot across horizontally
  // ─────────────────────────────────────────────────────────────────────────────
  cols 'year', 'quarter'
  
  // ─────────────────────────────────────────────────────────────────────────────
  // VALUE FIELDS - which columns to aggregate
  // ─────────────────────────────────────────────────────────────────────────────
  vals 'revenue'
  
  // ─────────────────────────────────────────────────────────────────────────────
  // AGGREGATOR - how to combine values
  // ─────────────────────────────────────────────────────────────────────────────
  // Available aggregators:
  // Count, Count Unique Values, List Unique Values, Sum, Integer Sum, Average, Median,
  // Sample Variance, Sample Standard Deviation, Minimum, Maximum, First, Last,
  // Sum over Sum, Sum as Fraction of Total, Sum as Fraction of Rows, Sum as Fraction of Columns,
  // Count as Fraction of Total, Count as Fraction of Rows, Count as Fraction of Columns
  aggregatorName 'Sum'
  
  // ─────────────────────────────────────────────────────────────────────────────
  // RENDERER - how to display the pivot table
  // ─────────────────────────────────────────────────────────────────────────────
  // Available renderers:
  // Table, Table Heatmap, Table Col Heatmap, Table Row Heatmap, Exportable TSV
  // (Plotly renderers if available: Grouped Column Chart, Stacked Column Chart, etc.)
  rendererName 'Table'
  
  // ─────────────────────────────────────────────────────────────────────────────
  // SORTING - row and column sort order
  // ─────────────────────────────────────────────────────────────────────────────
  // Options: key_a_to_z (alphabetical), value_a_to_z (by value ascending), value_z_to_a (by value descending)
  rowOrder 'key_a_to_z'
  colOrder 'key_a_to_z'
  
  // ─────────────────────────────────────────────────────────────────────────────
  // VALUE FILTER - exclude specific values from the pivot
  // ─────────────────────────────────────────────────────────────────────────────
  valueFilter {
    // Exclude specific values from a column
    // filter 'status', exclude: ['Inactive', 'Pending']
    // filter 'region', exclude: ['Unknown']
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // OPTIONS - additional pivot table options
  // ─────────────────────────────────────────────────────────────────────────────
  options {
    menuLimit 500  // max values to show in filter dropdowns
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // OPTIONAL: Data override (90% of the time you don't need this)
  // By default, data comes from ctx.reportData. Uncomment to use custom data:
  // ─────────────────────────────────────────────────────────────────────────────
  // data ctx.reportData                                    // explicit default
  // data ctx.reportData.findAll { it.status == 'Active' }  // filtered
  // data ctx.reportData.take(100)                          // first 100 rows
}
`;

  private getTransformScriptPath(): string {
    const basePath = this.getCurrentConfigReportsPath();
    const configName = this.getCurrentConfigName();
    return basePath ? `${basePath}/${configName}-additional-transformation.groovy` : '';
  }

  private getTabulatorScriptPath(): string {
    const basePath = this.getCurrentConfigReportsPath();
    const configName = this.getCurrentConfigName();
    return basePath ? `${basePath}/${configName}-tabulator-config.groovy` : '';
  }

  private getChartScriptPath(): string {
    const basePath = this.getCurrentConfigReportsPath();
    const configName = this.getCurrentConfigName();
    return basePath ? `${basePath}/${configName}-chart-config.groovy` : '';
  }

  private getPivotTableScriptPath(): string {
    const basePath = this.getCurrentConfigReportsPath();
    const configName = this.getCurrentConfigName();
    return basePath ? `${basePath}/${configName}-pivot-config.groovy` : '';
  }

  generateParametersSpecUsingAI() { }

  copyToClipboardParametersSpecExample() {
    if (this.exampleParamsSpecScript) {
      navigator.clipboard
        .writeText(this.exampleParamsSpecScript)
        .then(() => {
          this.messagesService.showInfo('Example parameters script copied to clipboard!', 'Success');
        })
        .catch((err) => {
          console.error('Failed to copy example parameters script: ', err);
          this.messagesService.showInfo('Failed to copy example parameters script.', 'Error');
        });
    }
  }

  copyToClipboardTabulatorConfigExample() {
    if (this.exampleTabulatorConfigScript) {
      navigator.clipboard
        .writeText(this.exampleTabulatorConfigScript)
        .then(() => {
          this.messagesService.showInfo('Example Tabulator config script copied to clipboard!', 'Success');
        })
        .catch((err) => {
          console.error('Failed to copy example Tabulator config script: ', err);
          this.messagesService.showInfo('Failed to copy example Tabulator config script.', 'Error');
        });
    }
  }

  copyToClipboardChartConfigExample() {
    if (this.exampleChartConfigScript) {
      navigator.clipboard
        .writeText(this.exampleChartConfigScript)
        .then(() => {
          this.messagesService.showInfo('Example Chart config script copied to clipboard!', 'Success');
        })
        .catch((err) => {
          console.error('Failed to copy example Chart config script: ', err);
          this.messagesService.showInfo('Failed to copy example Chart config script.', 'Error');
        });
    }
  }

  copyToClipboardPivotTableConfigExample() {
    if (this.examplePivotTableConfigScript) {
      navigator.clipboard
        .writeText(this.examplePivotTableConfigScript)
        .then(() => {
          this.messagesService.showInfo('Example Pivot Table config script copied to clipboard!', 'Success');
        })
        .catch((err) => {
          console.error('Failed to copy example Pivot Table config script: ', err);
          this.messagesService.showInfo('Failed to copy example Pivot Table config script.', 'Error');
        });
    }
  }

  async onParametersSpecChanged(event: string) {
    this.activeParamsSpecScriptGroovy = event;
    await this.saveExternalReportingScript('paramsSpecScript');
    this.settingsChangedEventHandler(event);
  }
  async onTabulatorConfigChanged(event: string) {
    // Try to read the raw textContent from the underlying CodeJar contenteditable element
    let content = event;
    try {
      if (this.tabulatorConfigEditorRef && this.tabulatorConfigEditorRef.nativeElement) {
        const root = this.tabulatorConfigEditorRef.nativeElement as HTMLElement;
        const contentEditable = root.querySelector('[contenteditable]');
        const text = contentEditable?.textContent;
        if (typeof text === 'string' && text.length > 0) {
          content = text;
        }
      }
    } catch (err) {
      // ignore and fallback to provided event string
    }
    this.activeTabulatorConfigScriptGroovy = content;
    // Debug info (keeps logs concise)
    try {
      console.debug('Tabulator content saved length:', content.length, 'lines:', (content || '').split(/\r?\n/).length);
    } catch (e) {}
    await this.saveExternalReportingScript('tabulatorConfigScript');
    this.settingsChangedEventHandler(event);
    // Only parse if content is non-empty (skip parsing empty/whitespace-only scripts)
    if (content && content.trim().length > 0) {
      try {
        const parsed = await this.reportingService.processGroovyTabulatorDsl(content);
        this.activeTabulatorConfigOptions = parsed;
        this.changeDetectorRef.detectChanges();
      } catch (err) {
        console.warn('Tabulator DSL parse error', err);
        this.activeTabulatorConfigOptions = null;
      }
    } else {
      // Clear parsed options when content is empty
      this.activeTabulatorConfigOptions = null;
    }
  }

  async onChartConfigChanged(event: string) {
    let content = event;
    try {
      if (this.chartConfigEditorRef && this.chartConfigEditorRef.nativeElement) {
        const root = this.chartConfigEditorRef.nativeElement as HTMLElement;
        const contentEditable = root.querySelector('[contenteditable]');
        const text = contentEditable?.textContent;
        if (typeof text === 'string' && text.length > 0) {
          content = text;
        }
      }
    } catch (err) {
      // ignore and fallback to provided event string
    }
    this.activeChartConfigScriptGroovy = content;
    try {
      console.debug('Chart content saved length:', content.length, 'lines:', (content || '').split(/\r?\n/).length);
    } catch (e) {}
    await this.saveExternalReportingScript('chartConfigScript');
    this.settingsChangedEventHandler(event);
    // Only parse if content is non-empty (skip parsing empty/whitespace-only scripts)
    if (content && content.trim().length > 0) {
      try {
        // Try to parse chart DSL using backend service
        const parsed = await this.reportingService.processGroovyChartDsl(content);
        this.activeChartConfigOptions = parsed;
        this.changeDetectorRef.detectChanges();
      } catch (err) {
        console.warn('Chart DSL parse error', err);
        this.activeChartConfigOptions = null;
      }
    } else {
      // Clear parsed options when content is empty
      this.activeChartConfigOptions = null;
    }
  }

  onChartReady(ev: any) {
    try {
      this.chartInstance = ev?.detail?.chart || ev?.detail || ev;
    } catch (e) {
      console.warn('chart ready handler: cannot determine chart instance', e);
    }
  }

  onChartError(err: any) {
    console.warn('Chart component reported an error', err);
  }

  async onPivotTableConfigChanged(event: string) {
    let content = event;
    try {
      if (this.pivotTableConfigEditorRef && this.pivotTableConfigEditorRef.nativeElement) {
        const root = this.pivotTableConfigEditorRef.nativeElement as HTMLElement;
        const contentEditable = root.querySelector('[contenteditable]');
        const text = contentEditable?.textContent;
        if (typeof text === 'string' && text.length > 0) {
          content = text;
        }
      }
    } catch (err) {
      // ignore and fallback to provided event string
    }
    this.activePivotTableConfigScriptGroovy = content;
    try {
      console.debug('Pivot Table content saved length:', content.length, 'lines:', (content || '').split(/\r?\n/).length);
    } catch (e) {}
    await this.saveExternalReportingScript('pivotTableConfigScript');
    this.settingsChangedEventHandler(event);
    // Only parse if content is non-empty (skip parsing empty/whitespace-only scripts)
    if (content && content.trim().length > 0) {
      try {
        const parsed = await this.reportingService.processGroovyPivotTableDsl(content);
        this.activePivotTableConfigOptions = parsed;
        this.changeDetectorRef.detectChanges();
      } catch (err) {
        console.warn('Pivot Table DSL parse error', err);
        this.activePivotTableConfigOptions = null;
      }
    } else {
      // Clear parsed options when content is empty
      this.activePivotTableConfigOptions = null;
    }
  }

  // Tabulator ready handler - optional event argument

  onRbRowClick(ev: any) {
    try {
      const cb = this.activeTabulatorConfigOptions?.callbacks?.rowClick;
      const handlerName = typeof cb === 'string' ? cb : (cb?.handler || cb);
      const params = typeof cb === 'object' ? cb?.params : undefined;
      if (handlerName && this.tabulatorHandlerRegistry[handlerName]) {
        this.tabulatorHandlerRegistry[handlerName](ev.detail, params, this.tabulatorTableInstance);
      }
    } catch (e) {
      console.warn('Error executing row click handler', e);
    }
  }

  onRbDataLoaded(ev: any) {
    try {
      const cb = this.activeTabulatorConfigOptions?.callbacks?.dataLoaded;
      const handlerName = typeof cb === 'string' ? cb : (cb?.handler || cb);
      const params = typeof cb === 'object' ? cb?.params : undefined;
      if (handlerName && this.tabulatorHandlerRegistry[handlerName]) {
        this.tabulatorHandlerRegistry[handlerName](ev.detail, params, this.tabulatorTableInstance);
      }
    } catch (e) {
      console.warn('Error executing dataLoaded handler', e);
    }
  }
  //REPORT PARAMETERS END

  private getCurrentConfigName(): string {
    // Prefer explicit metadata, otherwise try to derive from the configured path
    const explicit = this.settingsService.currentConfigurationTemplate?.folderName;
    if (explicit && explicit.trim() !== '') return explicit;
    const derived = this.deriveConfigFolderFromPath();
    return derived || 'unknown_config';
  }

  private getCurrentConfigReportsPath(): string {
    // determine folder name (explicit metadata or derived from path)
    const folderName = this.getCurrentConfigName();
    const folderFromPath = this.deriveConfigFolderFromPath();

    // Decide whether this is a samples path (prefer explicit path checks)
    const samplePathIndicator =
      (this.settingsService.currentConfigurationTemplatePath || '')
        .toString()
        .toLowerCase()
        .includes('/samples/') ||
      (this.xmlReporting?.documentburster?.report?.template?.documentpath || '')
        .toString()
        .toLowerCase()
        .includes('/samples/');

    const basePath = samplePathIndicator
      ? this.settingsService.CONFIGURATION_SAMPLES_FOLDER_PATH
      : this.settingsService.CONFIGURATION_REPORTS_FOLDER_PATH;

    // pick folder name preferring explicit metadata then derived folder
    const finalFolder = folderName && folderName !== 'unknown_config' ? folderName : folderFromPath;
    if (!finalFolder) {
      console.error('Configuration folder name is not available to determine base path.');
      return '';
    }
    return `${basePath}/${finalFolder}`;
  }

  // Derive the config folder name from the configured path (works for normal + samples)
  private deriveConfigFolderFromPath(): string {
    const p =
      this.settingsService.currentConfigurationTemplatePath ||
      this.xmlReporting?.documentburster?.report?.template?.documentpath ||
      '';
    if (!p) return '';
    const normalized = p.replace(/\\/g, '/').replace(/\/+$/, '');
    const parts = normalized.split('/');
    if (parts.length < 2) return '';
    // Usually the parent folder of the file is the config folder
    return parts[parts.length - 2] || '';
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

  // (single getTransformScriptPath is declared earlier)

  private async loadExternalReportingScript(
    scriptType: 'datasourceScript' | 'paramsSpecScript' | 'transformScript' | 'tabulatorConfigScript' | 'chartConfigScript' | 'pivotTableConfigScript'
  ): Promise<void> {
    const configName = this.getCurrentConfigName();

    let path: string;
    let cacheKeySuffix: string;
    let targetProperty: keyof ConfigurationComponent;
    let defaultFileContent = '';

    switch (scriptType) {
      case 'datasourceScript':
        path = this.getDatasourceScriptPath();
        cacheKeySuffix = 'datasourceScript';
        targetProperty = 'activeDatasourceScriptGroovy';
        defaultFileContent =
            '// Groovy Datasource Script';
        break;
      case 'paramsSpecScript':
        path = this.getParamsSpecScriptPath();
        cacheKeySuffix = 'paramsSpecScript';
        targetProperty = 'activeParamsSpecScriptGroovy';
        // Intentionally do not substitute the example script as a default.
        // If the user did not save a params spec, the editor should remain empty.
        break;
      case 'transformScript':
        path = this.getTransformScriptPath();
        cacheKeySuffix = 'transformScript';
        targetProperty = 'activeTransformScriptGroovy';
        defaultFileContent = '';
        break;
      case 'tabulatorConfigScript':
        path = this.getTabulatorScriptPath();
        cacheKeySuffix = 'tabulatorConfigScript';
        targetProperty = 'activeTabulatorConfigScriptGroovy';
        // Intentionally do not substitute the example script as a default.
        // If the user did not save a Tabulator config, the editor should remain empty.
        break;
      case 'chartConfigScript':
        path = this.getChartScriptPath();
        cacheKeySuffix = 'chartConfigScript';
        targetProperty = 'activeChartConfigScriptGroovy';
        // Intentionally do not substitute an example here; the editor should be empty if the user hasn't configured a chart.
        break;
      case 'pivotTableConfigScript':
        path = this.getPivotTableScriptPath();
        cacheKeySuffix = 'pivotTableConfigScript';
        targetProperty = 'activePivotTableConfigScriptGroovy';
        // Intentionally do not substitute an example here; the editor should be empty if the user hasn't configured a pivot table.
        break;
      default:
        console.error('Unknown script type for loading:', scriptType);
        return;
    }

    let content = await this.settingsService.loadTemplateFileAsync(path);
    // If there is no content on disk, prefer the default example provided
    if (!content || content.trim().length === 0) {
      content = defaultFileContent || '';
    }
    (this as any)[targetProperty] = content;
    try {
      console.debug(`Loaded ${scriptType} from ${path}, length:`, content.length, 'lines:', (content || '').split(/\r?\n/).length);
    } catch (e) {}

    this.changeDetectorRef.detectChanges();
  }

  private async saveExternalReportingScript(
    scriptType: 'datasourceScript' | 'paramsSpecScript' | 'transformScript' | 'tabulatorConfigScript' | 'chartConfigScript' | 'pivotTableConfigScript',
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
      case 'tabulatorConfigScript':
        path = this.getTabulatorScriptPath();
        cacheKeySuffix = 'tabulatorConfigScript';
        sourceProperty = 'activeTabulatorConfigScriptGroovy';
        break;
      case 'chartConfigScript':
        path = this.getChartScriptPath();
        cacheKeySuffix = 'chartConfigScript';
        sourceProperty = 'activeChartConfigScriptGroovy';
        break;
      case 'pivotTableConfigScript':
        path = this.getPivotTableScriptPath();
        cacheKeySuffix = 'pivotTableConfigScript';
        sourceProperty = 'activePivotTableConfigScriptGroovy';
        break;
      default:
        console.error('Unknown script type for saving:', scriptType);
        return;
    }

    contentToSave = (this as any)[sourceProperty];

    let isEmptyContent = !contentToSave || contentToSave.trim() === '';

    // For safety we normally skip saving empty content (avoid accidental deletions).
    // However, for Tabulator config we want to persist emptiness (clear file) when the
    // editor was intentionally cleared by the user; therefore allow saving empty
    // content only for tabulatorConfigScript.
    // if (isEmptyContent && scriptType !== 'tabulatorConfigScript') return;

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
  reportParamsValues: { [key: string]: any } = {};

  reportDataResult: ReportDataResult | null = null;
  isReportDataLoading = false;
  reportDataResultIsError = false;

  /*
  reportColumns: any[] = [];
  
  @ViewChild('tabulator') tabulatorRef: ElementRef;
  
  async refreshTabulatorTable() {
    const tabulator = this.tabulatorRef.nativeElement;
    if (tabulator && typeof tabulator.updateTable === 'function') {
      return tabulator.updateTable();
    }
  }

  */

  onReportParamsValidChange(isValid: boolean) {
    this.reportParamsValid = isValid;
    //this.changeDetectorRef.detectChanges();
    //console.log('Report parameters form validity:', isValid);
  }

  // Add handler for the form's value
  onReportParamsValuesChange(values: { [key: string]: any }) {
    //console.log('Form parameter values:', values);
    this.reportParamsValues = values;
  }

  async onRunQueryWithParams() {
    // console.log('[DEBUG] onRunQueryWithParams: modal confirm clicked');
    this.isModalParametersVisible = false;
    // console.log('[DEBUG] onRunQueryWithParams: calling executeTestQuery with params:', this.reportParameters);
    await this.executeTestQuery(this.reportParameters);
  }

  async runQueryWithParams(parameters: ReportParameter[]) {
    // console.log('[DEBUG] runQueryWithParams: entering with parameters:', parameters);
    // Convert parameters to key-value pairs with proper types
    const paramsObject = parameters.reduce(
      (acc, param) => {
        acc[param.id] = this.convertParamValue(
          param.type,
          this.reportParamsValues[param.id],
        );
        return acc;
      },
      {} as { [key: string]: any },
    );
    // console.log('[DEBUG] runQueryWithParams: paramsObject=', paramsObject);
    // console.log('[DEBUG] runQueryWithParams: calling testFetchData...');
    const result = await this.reportingService.testFetchData(paramsObject);
    // console.log('[DEBUG] runQueryWithParams: testFetchData returned:', result);
    return result;
  }

  async executeTestQuery(parameters: ReportParameter[]) {
    try {
      // console.log('[DEBUG] executeTestQuery: starting, parameters:', parameters);
      this.isReportDataLoading = true;
      // console.log('[DEBUG] executeTestQuery: calling runQueryWithParams...');
      this.reportDataResult = await this.runQueryWithParams(parameters);
      // console.log('[DEBUG] executeTestQuery: received result:', this.reportDataResult);

      // detect error payload (single column named ERROR_MESSAGE)
      const isErrorPayload =
        this.reportDataResult &&
        Array.isArray(this.reportDataResult.reportColumnNames) &&
        this.reportDataResult.reportColumnNames.length === 1 &&
        (this.reportDataResult.reportColumnNames[0] === 'ERROR_MESSAGE' ||
          this.reportDataResult.reportColumnNames[0].toUpperCase() ===
            'ERROR_MESSAGE');

      // Extract the error message if present and perform special-case checks
      let errorMsg = '';
      if (isErrorPayload && Array.isArray(this.reportDataResult.reportData) && this.reportDataResult.reportData.length > 0) {
        errorMsg = (this.reportDataResult.reportData[0]['ERROR_MESSAGE'] || '').toString();
      }
      const lowerMsg = (errorMsg || '').toLowerCase();

      // Treat "no burst tokens were provided or fetched for the document" as NOT an error (no rows)
      const isNoBurstTokensMsg = lowerMsg.includes('no burst tokens were provided or fetched for the document');

      // Final flag - it's an error payload only if it is the ERROR_MESSAGE column and not the "no burst tokens" informational message
      const finalIsError = isErrorPayload && !isNoBurstTokensMsg;
      this.reportDataResultIsError = !!finalIsError;

      if (isNoBurstTokensMsg) {
        // Show a milder warning - it's not an SQL syntax error, it just returned no rows
        this.messagesService.showWarning('Query executed successfully but returned no rows.');
        // Optional: replace ERROR_MESSAGE payload with empty data so Tabulator shows "no rows"
        this.reportDataResult.reportData = [];
        this.reportDataResult.reportColumnNames = [];
        this.reportDataResult.totalRows = 0;
      } else if (finalIsError) {
        // Show red toast for real errors
        this.messagesService.showError(
          'Error executing SQL query. View details in the Errors Log / Tabulator preview.',
        );
      } else {
        // Show green toast on success
        this.messagesService.showSuccess(
          'SQL query executed successfully, go to the Tabulator tab to see results.',
        );
      }
    } catch (error) {
      // console.log('[DEBUG] executeTestQuery: caught error:', error);
      // Show red toast on error
      this.reportDataResultIsError = true;
      this.messagesService.showError(
        `Error executing SQL query: ${error.message}, check the Errors Log/Tabulator to view the exact error.`,
      );
    } finally {
      // console.log('[DEBUG] executeTestQuery: finally block, setting isReportDataLoading = false');
      this.isReportDataLoading = false;
    }
  }

  async doTestSqlQuery() {
    // console.log('[DEBUG] doTestSqlQuery: BUTTON CLICKED - method entered');
    if (this.executionStatsService.logStats.foundDirtyLogFiles) {
      // console.log('[DEBUG] doTestSqlQuery: dirty log files found, showing info');
      const dialogMessage =
        'Log files are not empty. You need to press the Clear Logs button first.';
      this.infoService.showInformation({ message: dialogMessage });
      return;
    }

    const dbConnectionCode =
      this.xmlReporting.documentburster.report.datasource.sqloptions.conncode;
    // console.log('[DEBUG] doTestSqlQuery: dbConnectionCode=', dbConnectionCode);

    const dialogQuestion = `Test SQL query with connection ${dbConnectionCode}?`;

    this.confirmService.askConfirmation({
      message: dialogQuestion,
      confirmAction: async () => {
        // console.log('[DEBUG] doTestSqlQuery: confirmAction callback started');

        let parameters = [];

        // Parse Groovy DSL to get parameters
        if (this.activeParamsSpecScriptGroovy &&
          this.activeParamsSpecScriptGroovy.trim() !== '') {
          parameters =
            await this.reportingService.processGroovyParametersDsl(
              this.activeParamsSpecScriptGroovy,
            );

          // Access user-provided values
          const paramValues = this.reportParamsValues;

          // Convert values to correct types based on parameter definitions
          const typedParams = parameters.map((param) => {
            return {
              ...param,
              value: this.convertParamValue(param.type, paramValues[param.id]),
            };
          });

          //console.log(`typedParams = ${JSON.stringify(typedParams)}`);

          //console.log('Parameters before execution:', {
          //  parameters,
          //  values: this.reportParamsValues,
          //});
          // Only update if different
          if (!_.isEqual(this.reportParameters, parameters)) {
            this.reportParameters = parameters;
          }
        }
        if (parameters && parameters.length > 0) {
          // console.log('[DEBUG] doTestSqlQuery: parameters.length > 0, showing modal');
          this.isModalParametersVisible = true;
        }
        else {
          // console.log('[DEBUG] doTestSqlQuery: no parameters, calling executeTestQuery directly');
          return this.executeTestQuery([]);
        }
      },
    });
  }

  private convertParamValue(type: string, value: any): any {
    switch (type) {
      case 'LocalDate':
      case 'LocalDateTime':
        return value; // Return the raw ISO string
      case 'Integer':
        return parseInt(value, 10);
      case 'Boolean':
        return Boolean(value);
      default:
        return value;
    }
  }

  onTabReady(event?: any) {
    // optional argument with table instance
    if (event && event?.detail?.table) this.tabulatorTableInstance = event.detail.table;
    //console.log('📊 Tabulator ready', !!this.tabulatorTableInstance);
  }

  onTabError(msg: string) {
    //console.error('❌ Tabulator error:', msg);
  }

  getTabulatorColumns(
    columnNames: string[],
  ): { title: string; field: string }[] {
    if (!columnNames || !Array.isArray(columnNames)) {
      return [];
    }

    return columnNames
      .map((name) => {
        if (typeof name !== 'string') {
          console.warn('Invalid column name:', name);
          return null;
        }
        return {
          title: name.replace(/([A-Z])/g, ' $1').trim(),
          field: name,
        };
      })
      .filter(Boolean); // Remove any null values
  }

  @ViewChild('templatesGalleryModal') templatesGalleryModal: any;

  templatesGalleryTags: string[] | null = null;
  istemplatesGalleryModalVisible = false;

  getGalleryTagsForOutputType(outputType: string): string[] | null {
    switch (outputType) {
      case 'output.xlsx':
        return ['excel'];
      case 'output.pdf':
      case 'output.html':
      case 'output.docx':
        return null; // Show all except 'excel'
      case 'email.message':
        return ['mailchimp-email-blueprints', 'email'];
      default:
        return null;
    }
  }

  showGalleryModalForCurrentOutputType(outputType?: string) {
    // Use the provided outputType or fall back to the report's outputType
    const type = outputType || this.xmlReporting?.documentburster?.report?.template?.outputtype;
    const tags = this.getGalleryTagsForOutputType(type);
    if (tags !== undefined) {
      this.showGalleryModal(tags);
    } else {
      this.messagesService.showInfo('No gallery available for this output type.');
    }
  }

  // Update showGalleryModal to accept tags instead of context
  showGalleryModal(tags: string[] | null) {
    this.templatesGalleryTags = tags;
    this.istemplatesGalleryModalVisible = true;
    setTimeout(() => {
      this.templatesGalleryModal.openTemplateGallery();
    });
  }

  onGalleryTemplateUsed(template: HtmlDocTemplateDisplay) {

    let outputType = this.xmlReporting?.documentburster?.report?.template?.outputtype;
    if (!outputType && this.currentLeftMenu === 'emailSettingsMenuSelected') {
      outputType = 'email.message';
    }

    if (outputType === 'output.xlsx' || outputType === 'output.pdf' || outputType === 'output.html') {
      this.activeReportTemplateContent = template.htmlContent[template.currentVariantIndex || 0];
      this.settingsChangedEventHandler(this.activeReportTemplateContent);
    } else if (outputType === 'output.docx') {
      // Show warning toast for DOCX mode
      this.messagesService.showWarning(
        this.translateService.instant(
          'AREAS.CONFIGURATION.TAB-REPORT-TEMPLATE-OUTPUT.DOCX-HTML-WARNING',
        ),
        this.translateService.instant(
          'AREAS.CONFIGURATION.TAB-REPORT-TEMPLATE-OUTPUT.CANNOT-USE-TEMPLATE',
        ),
      );
    } else if (outputType === 'email.message') {
      this.xmlSettings.documentburster.settings.emailsettings.html = template.htmlContent[template.currentVariantIndex || 0];
      this.settingsChangedEventHandler(this.xmlSettings.documentburster.settings.emailsettings.html);
    }
    this.istemplatesGalleryModalVisible = false;
  }

  public get isSampleReport(): boolean {
    const dsType = this.xmlReporting?.documentburster?.report?.datasource?.type;
    const sqlConn = this.xmlReporting?.documentburster?.report?.datasource?.sqloptions?.conncode || '';
    const scriptConn = this.xmlReporting?.documentburster?.report?.datasource?.scriptoptions?.conncode || '';
    const codeLower = (sqlConn || scriptConn).toString().toLowerCase();
    return (
      (dsType === 'ds.sqlquery' || dsType === 'ds.scriptfile') &&
      (codeLower.includes('rbt-sample-northwind-sqlite-4f2'))
    );
  }

  public getDatabaseConnectionFilesForUI(): ExtConnection[] {

    const dsType = this.xmlReporting?.documentburster?.report?.datasource?.type;

    // get conncode from sqloptions OR scriptoptions
    const sqlConn = this.xmlReporting?.documentburster?.report?.datasource?.sqloptions?.conncode;
    const scriptConn = this.xmlReporting?.documentburster?.report?.datasource?.scriptoptions?.conncode;
    const connCode = (sqlConn || scriptConn || '').toString();

    const isSample = this.isSampleReport

    if (isSample)
      return [{
        connectionCode: connCode,
        connectionName: 'Sample Northwind (SQLite)',
        connectionType: 'database-connection',
        fileName: 'northwind.db',
        filePath: 'db/sample-northwind-sqlite/northwind.db',
        activeClicked: false,
        defaultConnection: true,
        usedBy: '',
      }];

    return this.settingsService.getDatabaseConnectionFiles();
  }
}
