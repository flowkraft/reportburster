import {
  Component,
  OnInit,
  ChangeDetectorRef,
  ViewChild,
  TemplateRef,
  ElementRef,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { interval, Subscription } from 'rxjs';

import * as _ from 'lodash';

import { ExecutionStatsService } from '../../providers/execution-stats.service';

import { leftMenuTemplate } from './templates/_left-menu';
import { tabsTemplate } from './templates/_tabs';

import { tabBurstTemplate } from './templates/tab-burst';
import { tabReportGenerationMailMergeTemplate } from './templates/tab-reporting-mailmerge-classicreports';

import { tabMergeBurstTemplate } from './templates/tab-merge-burst';
import { tabQualityAssuranceTemplate } from './templates/tab-quality-assurance';
import { tabLogsTemplate } from './templates/tab-logs';
import { tabSamplesTemplate } from './templates/tab-samples';
import { modalSamplesLearnMoreTemplate } from './templates/modal-samples-learn-more';

import { tabLicenseTemplate } from './templates/tab-license';

import { resumeJobsTemplate } from './templates/resume-jobs';

import Utilities from '../../helpers/utilities';
import { ConfirmService } from '../../components/dialog-confirm/confirm.service';
import { InfoService } from '../../components/dialog-info/info.service';
import { SampleInfo, SamplesService } from '../../providers/samples.service';
import {
  CfgTmplFileInfo,
  SettingsService,
} from '../../providers/settings.service';
import { ShellService } from '../../providers/shell.service';
import { ApiService } from '../../providers/api.service';
import { FsService } from '../../providers/fs.service';
import { ProcessingService } from '../../providers/processing.service';
import { StateStoreService } from '../../providers/state-store.service';

@Component({
  selector: 'dburst-processing',
  template: `
    <aside class="main-sidebar">
      <section class="sidebar">${leftMenuTemplate}</section>
    </aside>
    <div class="content-wrapper">
      <section class="content"><div>${tabsTemplate}</div></section>
    </div>
    ${tabBurstTemplate} ${tabReportGenerationMailMergeTemplate}
    ${tabMergeBurstTemplate} ${tabQualityAssuranceTemplate} ${tabLogsTemplate}
    ${tabSamplesTemplate} ${modalSamplesLearnMoreTemplate} ${tabLicenseTemplate}
    ${resumeJobsTemplate}
  `,
})
export class ProcessingComponent implements OnInit {
  isModalSamplesLearnMoreVisible = false;

  modalSampleInfo = {
    id: '',
    title: '',
    capReportSplitting: false,
    capReportDistribution: false,
    capReportGenerationMailMerge: false,
    inputDetails: '',
    outputDetails: '',
    notes: '',
    configurationFilePath: '',
    configurationFileName: '',
    documentation: '',
  };

  subscriptionCheckIfTestEmailServerIsStarted: Subscription;

  @ViewChild('tabBurstTemplate', { static: true })
  tabBurstTemplate: TemplateRef<any>;

  @ViewChild('tabReportGenerationMailMergeTemplate', { static: true })
  tabReportGenerationMailMergeTemplate: TemplateRef<any>;

  @ViewChild('tabMergeBurstTemplate', { static: true })
  tabMergeBurstTemplate: TemplateRef<any>;

  @ViewChild('tabQualityAssuranceTemplate', { static: true })
  tabQualityAssuranceTemplate: TemplateRef<any>;
  @ViewChild('tabLogsTemplate', { static: true })
  tabLogsTemplate: TemplateRef<any>;

  @ViewChild('tabSamplesTemplate', { static: true })
  tabSamplesTemplate: TemplateRef<any>;

  @ViewChild('tabLicenseTemplate', { static: true })
  tabLicenseTemplate: TemplateRef<any>;
  @ViewChild('resumeJobsTemplate', { static: true })
  resumeJobsTemplate: TemplateRef<any>;

  @ViewChild('burstFileUploadInput') burstFileUploadInput: ElementRef;
  @ViewChild('reportingFileUploadInput') reportingFileUploadInput: ElementRef;

  @ViewChild('qaFileUploadInput') qaFileUploadInput: ElementRef;
  @ViewChild('mergeFilesUploadInput') mergeFilesUploadInput: ElementRef;

  visibleTabs: {
    id: string;
    heading: string;
    ngTemplateOutlet: string;
    active: boolean;
  }[];

  ALL_TABS = [
    {
      id: 'burstTab',
      heading: 'AREAS.PROCESSING.TABS.BURST',
      ngTemplateOutlet: 'tabBurstTemplate',
    },
    {
      id: 'reportGenerationMailMergeTab',
      heading: 'AREAS.PROCESSING.TABS.MAILMERGE-CLASSICREPORTS',
      ngTemplateOutlet: 'tabReportGenerationMailMergeTemplate',
    },
    {
      id: 'mergeBurstTab',
      heading: 'AREAS.PROCESSING.TABS.MERGE-BURST',
      ngTemplateOutlet: 'tabMergeBurstTemplate',
    },
    {
      id: 'procQualityTab',
      heading: 'AREAS.PROCESSING.TABS.QUALITY-ASSURANCE',
      ngTemplateOutlet: 'tabQualityAssuranceTemplate',
    },
    {
      id: 'procSamplesTab',
      heading: 'AREAS.PROCESSING.TABS.SAMPLES',
      ngTemplateOutlet: 'tabSamplesTemplate',
    },
    {
      id: 'logsTab',
      heading: 'AREAS.PROCESSING.TABS.LOGGING-TRACING',
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
      selectedMenu: 'burstMenuSelected',
      visibleTabs: [
        'burstTab',
        'reportGenerationMailMergeTab',
        'logsTab',
        'licenseTab',
      ],
    },
    {
      selectedMenu: 'mergeBurstMenuSelected',
      visibleTabs: ['mergeBurstTab', 'logsTab', 'licenseTab'],
    },
    {
      selectedMenu: 'qualityMenuSelected',
      visibleTabs: ['procQualityTab', 'logsTab', 'licenseTab'],
    },
    {
      selectedMenu: 'logsMenuSelected',
      visibleTabs: ['logsTab', 'licenseTab'],
    },
    {
      selectedMenu: 'samplesMenuSelected',
      visibleTabs: ['procSamplesTab', 'logsTab', 'licenseTab'],
    },
  ];

  protected xmlSettings = {
    documentburster: {
      settings: null,
    },
  };
  currentLeftMenu: string;

  protected reportgenerationmailmerge = [
    { id: 'payslips.xml', name: 'Payslips' },
    { id: 'invoices.xml', name: 'Invoices' },
    { id: 'bills.xml', name: 'Bills' },
  ];

  constructor(
    protected processingService: ProcessingService,
    protected apiService: ApiService,
    protected settingsService: SettingsService,
    protected confirmService: ConfirmService,
    protected infoService: InfoService,
    protected route: ActivatedRoute,
    protected router: Router,
    protected changeDetectorRef: ChangeDetectorRef,
    protected storeService: StateStoreService,
    protected shellService: ShellService,
    protected executionStatsService: ExecutionStatsService,
    protected fsService: FsService,
    protected samplesService: SamplesService,
  ) {}

  ngOnDestroy() {
    if (this.subscriptionCheckIfTestEmailServerIsStarted) {
      this.subscriptionCheckIfTestEmailServerIsStarted.unsubscribe();
    }
  }

  async ngOnInit() {
    if (this.subscriptionCheckIfTestEmailServerIsStarted) {
      this.subscriptionCheckIfTestEmailServerIsStarted.unsubscribe();
    }

    this.settingsService.currentConfigurationTemplateName = '';
    this.settingsService.currentConfigurationTemplatePath = '';

    await this.settingsService.loadAllConnectionFilesAsync();

    this.settingsService.configurationFiles =
      await this.settingsService.loadAllSettingsFilesAsync();

    await this.samplesService.fillSamplesNotes();

    this.route.params.subscribe(async (params) => {
      let processingMode = 'processing';
      this.processingService.procReportingMailMergeInfo.isSample = false;
      this.processingService.procBurstInfo.isSample = false;

      if (params.prefilledInputFilePath) {
        processingMode = 'processing-sample-burst';
        this.processingService.procBurstInfo.isSample = true;
      }

      if (params.prefilledSelectedMailMergeClassicReport) {
        processingMode = 'processing-sample-generate';
        this.processingService.procReportingMailMergeInfo.isSample = true;

        this.processingService.procReportingMailMergeInfo.selectedMailMergeClassicReport =
          this.settingsService
            .getMailMergeConfigurations({
              visibility: 'visible',
              samples: true,
            })
            .find((configuration: CfgTmplFileInfo) =>
              configuration.filePath.includes(
                params.prefilledSelectedMailMergeClassicReport,
              ),
            );
      }

      if (params.leftMenu) {
        this.currentLeftMenu = params.leftMenu;
      } else {
        this.currentLeftMenu = 'burstMenuSelected';
      }

      if (this.currentLeftMenu == 'qualityMenuSelected') {
        if (params.prefilledInputFilePath) {
          this.processingService.procQualityAssuranceInfo.prefilledInputFilePath =
            params.prefilledInputFilePath;
        }

        if (params.prefilledConfigurationFilePath) {
          this.processingService.procQualityAssuranceInfo.prefilledConfigurationFilePath =
            params.prefilledConfigurationFilePath;
        }

        if (params.whichAction) {
          this.processingService.procQualityAssuranceInfo.whichAction =
            params.whichAction;
        }

        const repeat = interval(1000);
        this.subscriptionCheckIfTestEmailServerIsStarted = repeat.subscribe(
          (val) => {
            this.checkIfTestEmailServerIsStarted();
          },
        );
      } else {
        if (
          processingMode == 'processing-sample-burst' ||
          processingMode == 'processing-sample-generate'
        ) {
          if (this.currentLeftMenu != 'mergeBurstMenuSelected') {
            if (processingMode == 'processing-sample-burst')
              this.processingService.procBurstInfo.prefilledInputFilePath =
                params.prefilledInputFilePath;

            if (processingMode == 'processing-sample-generate')
              this.processingService.procReportingMailMergeInfo.prefilledInputFilePath =
                params.prefilledInputFilePath;
          }

          if (this.currentLeftMenu == 'mergeBurstMenuSelected') {
            //console.log(
            //  `params.prefilledInputFilePath = ${params.prefilledInputFilePath}`,
            //);

            let pFilledInputFilePath = params.prefilledInputFilePath;

            this.processingService.procMergeBurstInfo.shouldBurstResultedMergedFile =
              pFilledInputFilePath.endsWith('#burst-merged-file');

            if (
              this.processingService.procMergeBurstInfo
                .shouldBurstResultedMergedFile
            )
              pFilledInputFilePath = pFilledInputFilePath.replace(
                '#burst-merged-file',
                '',
              );
            const filePaths = pFilledInputFilePath.split('#');

            filePaths.forEach((filePath: string) => {
              this.processingService.procMergeBurstInfo.inputFiles.push({
                name: Utilities.basename(filePath),
                path: filePath,
              });
            });
          }
        }

        if (processingMode == 'processing-sample-burst')
          this.processingService.procBurstInfo.prefilledConfigurationFilePath =
            params.prefilledConfigurationFilePath;
        if (processingMode == 'processing-sample-generate')
          this.processingService.procReportingMailMergeInfo.prefilledConfigurationFilePath =
            params.prefilledSelectedMailMergeClassicReport;
      }

      this.refreshTabs();

      if (processingMode == 'processing-sample-generate') {
        this.visibleTabs[1].active = true;
        this.visibleTabs[0].active = false;
      } else {
        this.visibleTabs[0].active = true;
        this.visibleTabs[1].active = false;
      }

      this.changeDetectorRef.detectChanges();
    });

    this.xmlSettings = await this.settingsService.loadSettingsFileAsync(
      this.settingsService.getMyReportsConfigurationValuesFilePath(),
    );

    //console.log(
    //  `processing.component.xmlSettings: ${JSON.stringify(this.xmlSettings)}`
    //);
    if (this.xmlSettings && this.xmlSettings.documentburster)
      this.processingService.procMergeBurstInfo.mergedFileName =
        this.xmlSettings.documentburster.settings.mergefilename;

    /*
    console.log(
      'QA Tab Init procBurstInfo:',
      JSON.stringify(this.processingService.procBurstInfo),
    );

    console.log(
      'QA Tab Init procQualityAssuranceInfo:',
      JSON.stringify(this.processingService.procQualityAssuranceInfo),
    );
    */
  }

  refreshTabs() {
    this.visibleTabs = [];
    this.changeDetectorRef.detectChanges();

    let visibleTabsIds = this.MENU_SELECTED_X_VISIBLE_TABS.find((item) => {
      return item.selectedMenu === this.currentLeftMenu;
    }).visibleTabs;

    //if (this.currentLeftMenu == 'burstMenuSelected') {
    const mailMergeConfigurations =
      this.settingsService.getMailMergeConfigurations({
        visibility: 'visible',
        samples: this.processingService.procReportingMailMergeInfo.isSample,
      });

    //console.log(
    //  `refreshTabs mailMergeConfigurations = ${JSON.stringify(mailMergeConfigurations)}`,
    //);

    if (!mailMergeConfigurations?.length) {
      visibleTabsIds = visibleTabsIds.filter(
        (tab) => tab != 'reportGenerationMailMergeTab',
      );
    }
    //}

    this.visibleTabs = this.ALL_TABS.filter((item) =>
      visibleTabsIds.includes(item.id),
    ).map((tab) => ({
      ...tab,
      active: false,
    }));
  }

  // tab Burst

  onBurstFileSelected(event: Event) {
    /*
    console.log(
      'onBurstFileSelected Before selection procBurstInfo:',
      this.processingService.procBurstInfo,
    );

    console.log(
      'onBurstFileSelected Before selection procQualityAssuranceInfo:',
      this.processingService.procQualityAssuranceInfo,
    );
    */
    const target = event.target as HTMLInputElement;

    // Set burst info
    this.processingService.procBurstInfo.inputFile = target.files[0];
    this.processingService.procBurstInfo.inputFileName = target.files[0].name;
    this.processingService.procBurstInfo.isSample = false;
    this.processingService.procBurstInfo.prefilledInputFilePath = '';

    // Set QA info
    this.processingService.procQualityAssuranceInfo.inputFile =
      this.processingService.procBurstInfo.inputFile;
    this.processingService.procQualityAssuranceInfo.inputFileName =
      this.processingService.procBurstInfo.inputFileName;
    this.processingService.procQualityAssuranceInfo.prefilledInputFilePath = '';
    this.processingService.procQualityAssuranceInfo.whichAction = 'burst';
    /*
    console.log(
      `processingService.procQualityAssuranceInfo.inputFileName ( onBurstFileSelected) = ${this.processingService.procQualityAssuranceInfo.inputFileName}`,
    );

    console.log(
      'onBurstFileSelected After selection procBurstInfo:',
      JSON.stringify(this.processingService.procBurstInfo),
    );

    console.log(
      'onBurstFileSelected After selection procQualityAssuranceInfo:',
      JSON.stringify(this.processingService.procQualityAssuranceInfo),
    );
    */
  }

  resetProcInfo() {
    this.processingService.procBurstInfo.inputFile = null;
    this.processingService.procBurstInfo.prefilledInputFilePath = null;

    this.processingService.procBurstInfo.inputFileName = '';

    this.processingService.procBurstInfo.prefilledConfigurationFilePath = '';
    this.processingService.procBurstInfo.isSample = false;

    this.processingService.procQualityAssuranceInfo.inputFile = null;
    this.processingService.procQualityAssuranceInfo.inputFileName = '';
    this.processingService.procQualityAssuranceInfo.prefilledInputFilePath = '';

    this.processingService.procMergeBurstInfo.inputFiles = [];
    this.processingService.procMergeBurstInfo.inputFilesNames = [];
    this.processingService.procMergeBurstInfo.shouldBurstResultedMergedFile =
      false;
    this.processingService.procMergeBurstInfo.mergedFileName = 'merged.pdf';

    this.processingService.procReportingMailMergeInfo.selectedMailMergeClassicReport =
      null;

    this.processingService.procReportingMailMergeInfo.inputFile = null;
    this.processingService.procReportingMailMergeInfo.inputFileName = '';

    this.processingService.procReportingMailMergeInfo.prefilledInputFilePath =
      '';
    this.processingService.procReportingMailMergeInfo.prefilledConfigurationFilePath =
      '';
    //this.processingService.procReportingMailMergeInfo.isSample = false;

    if (this.burstFileUploadInput?.nativeElement) {
      (this.burstFileUploadInput.nativeElement as HTMLInputElement).value = '';
    }

    if (this.reportingFileUploadInput?.nativeElement) {
      (this.reportingFileUploadInput.nativeElement as HTMLInputElement).value =
        '';
    }

    if (this.qaFileUploadInput?.nativeElement) {
      (this.qaFileUploadInput.nativeElement as HTMLInputElement).value = '';
    }
    if (this.mergeFilesUploadInput?.nativeElement) {
      (this.mergeFilesUploadInput.nativeElement as HTMLInputElement).value = '';
    }

    //console.log('resetProcInfo:');
  }

  async onMailMergeClassicReportFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;

    this.processingService.procReportingMailMergeInfo.inputFile =
      target.files[0];
    this.processingService.procReportingMailMergeInfo.inputFileName =
      this.processingService.procReportingMailMergeInfo.inputFile.name;

    this.processingService.procReportingMailMergeInfo.prefilledConfigurationFilePath =
      Utilities.slash(
        this.processingService.procReportingMailMergeInfo
          .selectedMailMergeClassicReport.filePath,
      );

    this.processingService.procQualityAssuranceInfo.inputFile =
      this.processingService.procReportingMailMergeInfo.inputFile;
    this.processingService.procQualityAssuranceInfo.inputFileName =
      this.processingService.procReportingMailMergeInfo.inputFileName;

    this.processingService.procQualityAssuranceInfo.prefilledConfigurationFilePath =
      this.processingService.procReportingMailMergeInfo.prefilledConfigurationFilePath;

    this.processingService.procQualityAssuranceInfo.whichAction =
      'csv-generate-reports';
  }

  disableRunTest() {}

  noActiveJobs() {}

  doBurst() {
    if (this.executionStatsService.logStats.foundDirtyLogFiles) {
      const dialogMessage =
        'Log files are not empty. You need to press the Clear Logs button first.';

      this.infoService.showInformation({
        message: dialogMessage,
      });
    } else {
      //console.log(
      //  `this.processingService.procBurstInfo.isSample = ${this.processingService.procBurstInfo.isSample}`,
      //);

      if (this.processingService.procBurstInfo.isSample) {
        this.processingService.procBurstInfo.inputFileName = Utilities.basename(
          this.processingService.procBurstInfo.prefilledInputFilePath,
        );
      }
      const dialogQuestion = `Burst file ${this.processingService.procBurstInfo.inputFileName}?`;

      this.confirmService.askConfirmation({
        message: dialogQuestion,
        confirmAction: async () => {
          let inputFilePath =
            this.processingService.procBurstInfo.prefilledInputFilePath;
          let configFilePath =
            this.processingService.procBurstInfo.prefilledConfigurationFilePath;

          if (!this.processingService.procBurstInfo.isSample) {
            const formData = new FormData();
            formData.append(
              'file',
              this.processingService.procBurstInfo.inputFile,
              this.processingService.procBurstInfo.inputFileName,
            );
            const customHeaders = new Headers({
              Accept: 'application/json',
            });
            const uploadedFilesInfo = await this.apiService.post(
              '/jobman/upload/process-single',
              formData,
              customHeaders,
            );

            if (!uploadedFilesInfo || !uploadedFilesInfo.length) {
              return;
            }

            inputFilePath = uploadedFilesInfo[0].filePath;
          }

          if (!configFilePath)
            this.shellService.runBatFile(
              ['-f', `"${inputFilePath}"`],
              this.processingService.procBurstInfo.inputFileName,
            );
          else {
            if (!configFilePath.includes('PORTABLE_EXECUTABLE_DIR_PATH'))
              configFilePath = Utilities.slash(configFilePath).replace(
                '/config/',
                'PORTABLE_EXECUTABLE_DIR_PATH/config/',
              );

            this.shellService.runBatFile(
              ['-f', `"${inputFilePath}"`, '-c', `"${configFilePath}"`],
              this.processingService.procBurstInfo.inputFileName,
            );
          }

          this.resetProcInfo();
        },
      });
    }
  }

  doGenerateReports() {
    if (this.executionStatsService.logStats.foundDirtyLogFiles) {
      const dialogMessage =
        'Log files are not empty. You need to press the Clear Logs button first.';

      this.infoService.showInformation({
        message: dialogMessage,
      });
    } else {
      //console.log(
      //  `doGenerateReports procReportingMailMergeInfo = ${JSON.stringify(this.processingService.procReportingMailMergeInfo)}`,
      //);

      if (this.processingService.procReportingMailMergeInfo.isSample) {
        this.processingService.procReportingMailMergeInfo.inputFileName =
          Utilities.basename(
            this.processingService.procReportingMailMergeInfo
              .prefilledInputFilePath,
          );
      }
      const dialogQuestion = `Burst file ${this.processingService.procReportingMailMergeInfo.inputFileName}?`;
      this.confirmService.askConfirmation({
        message: dialogQuestion,
        confirmAction: async () => {
          let inputFilePath =
            this.processingService.procReportingMailMergeInfo
              .prefilledInputFilePath;
          let configFilePath =
            this.processingService.procReportingMailMergeInfo
              .prefilledConfigurationFilePath;
          if (!this.processingService.procReportingMailMergeInfo.isSample) {
            const formData = new FormData();
            formData.append(
              'file',
              this.processingService.procReportingMailMergeInfo.inputFile,
              this.processingService.procReportingMailMergeInfo.inputFileName,
            );
            const customHeaders = new Headers({
              Accept: 'application/json',
            });
            const uploadedFilesInfo = await this.apiService.post(
              '/jobman/upload/process-single',
              formData,
              customHeaders,
            );

            if (!uploadedFilesInfo || !uploadedFilesInfo.length) {
              return;
            }

            inputFilePath = uploadedFilesInfo[0].filePath;
          }

          //console.log(`doGenerateReports configFilePath = ${configFilePath}`);

          if (!configFilePath)
            this.shellService.runBatFile(
              ['-f', `"${inputFilePath}"`],
              this.processingService.procReportingMailMergeInfo.inputFileName,
            );
          else {
            if (!configFilePath.includes('PORTABLE_EXECUTABLE_DIR_PATH'))
              configFilePath = Utilities.slash(configFilePath).replace(
                '/config/',
                'PORTABLE_EXECUTABLE_DIR_PATH/config/',
              );

            this.shellService.runBatFile(
              ['-f', `"${inputFilePath}"`, '-c', `"${configFilePath}"`],
              this.processingService.procReportingMailMergeInfo.inputFileName,
            );
          }

          this.resetProcInfo();
        },
      });
    }
  }

  // end tab Burst

  // tab Merge -> Burst
  doMergeBurst() {
    if (this.executionStatsService.logStats.foundDirtyLogFiles) {
      const dialogMessage =
        'Log files are not empty. You need to press the Clear Logs button first.';

      this.infoService.showInformation({
        message: dialogMessage,
      });
    } else {
      const dialogQuestion = 'Post a new job?';

      this.confirmService.askConfirmation({
        message: dialogQuestion,
        confirmAction: async () => {
          let mergeFilePath = '';

          if (!this.processingService.procBurstInfo.isSample) {
            const formData = new FormData();
            this.processingService.procMergeBurstInfo.inputFiles.forEach(
              (inputFile, index) => {
                formData.append('files', inputFile.file, inputFile.name);
              },
            );

            const customHeaders = new Headers({
              Accept: 'application/json',
            });

            const uploadedFilesInfo = await this.apiService.post(
              '/jobman/upload/process-multiple',
              formData,
              customHeaders,
            );
            if (!uploadedFilesInfo || !uploadedFilesInfo.length) {
              return;
            }

            mergeFilePath =
              await this.shellService.generateMergeFileInTempFolder(
                uploadedFilesInfo.map(
                  (fileInfo: { filePath: string }) => fileInfo.filePath,
                ),
              );
          } else if (this.processingService.procBurstInfo.isSample) {
            mergeFilePath =
              await this.shellService.generateMergeFileInTempFolder(
                this.processingService.procMergeBurstInfo.inputFiles.map(
                  (fileInfo: { path: string }) => fileInfo.path,
                ),
              );
          }

          const arrguments = [
            '-mf',
            '"' + mergeFilePath + '"',
            '-o',
            this.processingService.procMergeBurstInfo.mergedFileName,
          ];

          if (
            this.processingService.procMergeBurstInfo
              .shouldBurstResultedMergedFile
          ) {
            arrguments.push('-b');
          }

          this.shellService.runBatFile(
            arrguments,
            this.processingService.procMergeBurstInfo.mergedFileName,
          );

          this.resetProcInfo();
        },
      });
    }
  }

  onFilesAdded(event: Event) {
    const target = event.target as HTMLInputElement;
    const files = Array.from(target.files);

    //alert('test');

    //console.log(`onFilesAdded files = ${JSON.stringify(files)}`);

    files.forEach((file) => {
      this.processingService.procMergeBurstInfo.inputFiles.push({
        id: this.processingService.procMergeBurstInfo.inputFiles.length,
        name: file.name,
        //path: file.path,
        file: file,
      });
    });

    /*
    console.log(
      `onFilesAdded - inputFiles: ${JSON.stringify(
        this.processingService.procMergeBurstInfo.inputFiles.map(
          (inputFile) => ({
            name: inputFile.name,
            path: inputFile.path,
            fileName: inputFile.file.name,
            fileSize: inputFile.file.size,
          }),
        ),
      )}`,
    );
    */

    target.value = '';
  }

  onFileSelected(file: { id: string }) {
    this.processingService.procMergeBurstInfo.inputFiles.forEach((each) => {
      if (each.id === file.id) {
        //console.log(`selected id = ${file.id}`);
        each.selected = true;
        this.processingService.procMergeBurstInfo.selectedFile = file;
      } else {
        each.selected = false;
      }
    });
  }

  onSelectedFileDelete() {
    const dialogQuestion = 'Delete selected item?';

    this.confirmService.askConfirmation({
      message: dialogQuestion,
      confirmAction: () => {
        _.remove(
          this.processingService.procMergeBurstInfo.inputFiles,
          (o) =>
            o.id === this.processingService.procMergeBurstInfo.selectedFile.id,
        );
      },
    });
  }

  onSelectedFileUp() {
    const index = _.indexOf(
      this.processingService.procMergeBurstInfo.inputFiles,
      this.processingService.procMergeBurstInfo.selectedFile,
    );

    if (index > 0) {
      this.moveItemInArray(
        this.processingService.procMergeBurstInfo.inputFiles,
        index,
        index - 1,
      );
      this.onFileSelected(
        this.processingService.procMergeBurstInfo.selectedFile,
      );
    }

    //console.log(
    //  JSON.stringify(
    //    this.processingService.procMergeBurstInfo.inputFiles.map(
    //      (inputFile) => inputFile.name,
    //    ),
    //  ),
    //);
  }

  onSelectedFileDown() {
    const index = _.indexOf(
      this.processingService.procMergeBurstInfo.inputFiles,
      this.processingService.procMergeBurstInfo.selectedFile,
    );

    if (
      index <
      this.processingService.procMergeBurstInfo.inputFiles.length - 1
    ) {
      this.moveItemInArray(
        this.processingService.procMergeBurstInfo.inputFiles,
        index,
        index + 1,
      );
      this.onFileSelected(
        this.processingService.procMergeBurstInfo.selectedFile,
      );
    }
    //console.log(
    //  JSON.stringify(
    //    this.processingService.procMergeBurstInfo.inputFiles.map(
    //      (inputFile) => inputFile.name,
    //    ),
    //  ),
    //);
  }

  onClearFiles() {
    const dialogQuestion = 'Clear all items?';

    this.confirmService.askConfirmation({
      message: dialogQuestion,
      confirmAction: () => {
        this.processingService.procMergeBurstInfo.inputFiles = [];
      },
    });
    //console.log(
    //   JSON.stringify(
    //     this.processingService.procMergeBurstInfo.inputFiles.map(
    //       (inputFile) => inputFile.name,
    //     ),
    //   ),
    //);
  }

  async saveMergedFileSetting() {
    const xmlSettings = await this.settingsService.loadSettingsFileAsync(
      this.settingsService.getMyReportsConfigurationValuesFilePath(),
    );

    xmlSettings.documentburster.settings.mergefilename =
      this.processingService.procMergeBurstInfo.mergedFileName;

    this.settingsService.saveSettingsFileAsync(
      this.settingsService.getMyReportsConfigurationValuesFilePath(),
      xmlSettings,
    );
  }

  moveItemInArray<T>(array: T[], from: number, to: number): void {
    array.splice(to, 0, array.splice(from, 1)[0]);
  }

  // end tab Merge -> Burst

  // tab Quality Assurance
  onQAFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    this.processingService.procQualityAssuranceInfo.inputFile = target.files[0];
    this.processingService.procQualityAssuranceInfo.inputFileName =
      this.processingService.procQualityAssuranceInfo.inputFile.name;
  }

  doRunTest() {
    if (this.executionStatsService.logStats.foundDirtyLogFiles) {
      const dialogMessage =
        'Log files are not empty. You need to press the Clear Logs button first.';

      this.infoService.showInformation({
        message: dialogMessage,
      });
    } else {
      if (this.processingService.procBurstInfo.isSample) {
        this.processingService.procQualityAssuranceInfo.inputFileName =
          Utilities.basename(
            this.processingService.procQualityAssuranceInfo
              .prefilledInputFilePath,
          );
      }

      const dialogQuestion = `Test file ${this.processingService.procQualityAssuranceInfo.inputFileName}?`;

      this.confirmService.askConfirmation({
        message: dialogQuestion,
        confirmAction: async () => {
          let inputFilePath =
            this.processingService.procQualityAssuranceInfo
              .prefilledInputFilePath;
          const configFilePath =
            this.processingService.procQualityAssuranceInfo
              .prefilledConfigurationFilePath;

          let arrguments = [];

          if (
            this.processingService.procQualityAssuranceInfo.whichAction ==
            'burst'
          )
            arrguments = [
              '-' + this.processingService.procQualityAssuranceInfo.mode,
            ];
          else if (
            this.processingService.procQualityAssuranceInfo.whichAction ==
            'csv-generate-reports'
          )
            arrguments = [
              '-c',
              '"' +
                Utilities.slash(configFilePath).replace(
                  '/config/',
                  'PORTABLE_EXECUTABLE_DIR_PATH/config/',
                ) +
                '"',
              '-' + this.processingService.procQualityAssuranceInfo.mode,
            ];

          if (this.processingService.procQualityAssuranceInfo.mode === 'tl') {
            arrguments.push(
              '"' +
                this.processingService.procQualityAssuranceInfo.listOfTokens
                  .toString()
                  .replace(/, +/g, ',') +
                '"',
            );
          } else if (
            this.processingService.procQualityAssuranceInfo.mode === 'tr'
          ) {
            arrguments.push(
              this.processingService.procQualityAssuranceInfo
                .numberOfRandomTokens,
            );
          }

          if (!this.processingService.procBurstInfo.isSample) {
            const formData = new FormData();
            formData.append(
              'file',
              this.processingService.procQualityAssuranceInfo.inputFile,
              this.processingService.procQualityAssuranceInfo.inputFileName,
            );

            const customHeaders = new Headers({
              Accept: 'application/json',
            });
            const uploadedFilesInfo = await this.apiService.post(
              '/jobman/upload/process-qa',
              formData,
              customHeaders,
            );
            inputFilePath = uploadedFilesInfo[0].filePath;
          }

          this.shellService.runBatFile(
            ['-f', inputFilePath].concat(arrguments),
            Utilities.basename(inputFilePath),
          );

          this.resetProcInfo();
        },
      });
    }
  }

  onDifferentQualityAssuranceModeFocus(mode) {
    switch (mode) {
      case 'tl':
        document.getElementById('listOfTokens').focus();
        break;
      case 'tr':
        document.getElementById('numberOfRandomTokens').focus();
        break;
      case 'listOfTokens':
        this.processingService.procQualityAssuranceInfo.mode = 'tl';
        break;
      case 'numberOfRandomTokens':
        this.processingService.procQualityAssuranceInfo.mode = 'tr';
        break;
      default:
        document.getElementById('listOfTokens').focus();
        this.processingService.procQualityAssuranceInfo.mode = 'ta';
    }
  }

  runTestShouldBeDisabled() {
    let disableRunTest = true;

    let isInputFileSelected = false;
    if (
      this.processingService.procQualityAssuranceInfo.inputFile ||
      (this.processingService.procBurstInfo.isSample &&
        this.processingService.procQualityAssuranceInfo.prefilledInputFilePath)
    ) {
      isInputFileSelected = true;
    }

    if (isInputFileSelected) {
      switch (this.processingService.procQualityAssuranceInfo.mode) {
        case 'ta':
          disableRunTest = false;
          break;
        case 'tl':
          if (this.processingService.procQualityAssuranceInfo.listOfTokens) {
            disableRunTest = false;
          }
          break;
        case 'tr':
          if (
            Utilities.isPositiveInteger(
              this.processingService.procQualityAssuranceInfo
                .numberOfRandomTokens,
            )
          ) {
            disableRunTest = false;
          }
          break;
        default:
          disableRunTest = true;
      }
    }
    return disableRunTest;
  }

  async checkIfTestEmailServerIsStarted() {
    //console.log(
    //  `this.xmlSettings.documentburster.settings.qualityassurance.emailserver.weburl = ${this.xmlSettings.documentburster.settings.qualityassurance.emailserver.weburl}`,
    //);

    let testEmailServerStatus = 'stopped';
    const qaEmailServerStarted = await this.apiService.get(
      '/jobman/system/check-url',
      {
        url: encodeURIComponent(
          this.xmlSettings.documentburster.settings.qualityassurance.emailserver
            .weburl,
        ),
      },
    );

    //console.log(`qaEmailServerStarted = ${qaEmailServerStarted}`);

    if (qaEmailServerStarted) testEmailServerStatus = 'started';

    if (
      this.processingService.procQualityAssuranceInfo.testEmailServerStatus !==
      testEmailServerStatus
    )
      this.processingService.procQualityAssuranceInfo.testEmailServerStatus =
        testEmailServerStatus;

    //console.log(
    //  `this.processingService.procQualityAssuranceInfo.testEmailServerStatus = ${this.processingService.procQualityAssuranceInfo.testEmailServerStatus}`,
    //);
  }

  doStartStopTestEmailServer(command: string) {
    let dialogQuestion = 'Start Test Email Server?';

    if (command === 'shut') {
      dialogQuestion = 'Stop Test Email Server?';
    }

    this.confirmService.askConfirmation({
      message: dialogQuestion,
      confirmAction: () => {
        this.processingService.procQualityAssuranceInfo.testEmailServerStatus =
          'starting';
        if (command === 'shut') {
          this.processingService.procQualityAssuranceInfo.testEmailServerStatus =
            'stopping';
        }

        this.shellService.startStopTestEmailServer(command);
      },
    });
  }

  // end tab Quality Assurance

  // stop / cancel / resume
  doResumeJob(jobFilePath: string) {
    if (this.executionStatsService.logStats.foundDirtyLogFiles) {
      const dialogMessage =
        'Log files are not empty. You need to press the Clear Logs button first.';

      this.infoService.showInformation({
        message: dialogMessage,
      });
    } else {
      const dialogQuestion = 'Resume processing this job?';

      this.confirmService.askConfirmation({
        message: dialogQuestion,
        confirmAction: () => {
          this.executionStatsService.jobStats.jobsToResume = [];
          //console.log(`jobFilePath = ${jobFilePath}`);
          this.shellService.runBatFile(
            ['-rf', '"' + jobFilePath + '"'],
            Utilities.basename(jobFilePath),
          );

          this.executionStatsService.jobStats.jobsToResume = [];
        },
      });
    }
  }

  clearResumeJob(jobFilePath: string) {
    const dialogQuestion = 'Clear this job?';

    this.confirmService.askConfirmation({
      message: dialogQuestion,
      confirmAction: async () => {
        await this.shellService.clearResumeJob(jobFilePath);
        this.executionStatsService.jobStats.jobsToResume = [];
      },
    });
  }

  // end stop / cancel / resume

  //start Mail Merge
  groupByMailMergeHelper(report: any) {
    if (report.type == 'config-reports') return 'Reports';
    else return 'Samples';
  }
  //end Mail Merge

  //start samples
  async doShowSamplesLearnMoreModal(clickedSample: SampleInfo) {
    this.modalSampleInfo.id = clickedSample.id;

    this.modalSampleInfo.title = clickedSample.name;

    this.modalSampleInfo.capReportSplitting = clickedSample.capReportSplitting;
    this.modalSampleInfo.capReportDistribution =
      clickedSample.capReportDistribution;
    this.modalSampleInfo.capReportGenerationMailMerge =
      clickedSample.capReportGenerationMailMerge;

    this.modalSampleInfo.notes = clickedSample.notes;

    this.modalSampleInfo.configurationFilePath =
      clickedSample.configurationFilePath;

    this.modalSampleInfo.configurationFileName =
      clickedSample.configurationFileName;

    this.modalSampleInfo.inputDetails = this.samplesService.getInputHtml(
      clickedSample.id,
      true,
    );
    this.modalSampleInfo.outputDetails = this.samplesService.getOutputHtml(
      clickedSample.id,
      true,
    );

    this.modalSampleInfo.outputDetails = this.samplesService.getOutputHtml(
      clickedSample.id,
      true,
    );

    this.modalSampleInfo.documentation = clickedSample.documentation;

    this.isModalSamplesLearnMoreVisible = true;
  }

  async doCloseSamplesLearnMoreModal() {
    this.isModalSamplesLearnMoreVisible = false;
  }

  onSampleClick(clickedSample: { id: string }) {
    for (const sample of this.samplesService.samples) {
      sample.activeClicked = sample.id === clickedSample.id ? true : false;
    }
  }

  getSelectedSample() {
    return this.samplesService.samples.find((sample: SampleInfo) => {
      return sample.activeClicked;
    });
  }

  doToggleSampleVisibility(visibility: string) {
    const selectedSample = this.getSelectedSample();

    let dialogQuestion = `Show '${selectedSample.name}' sample in the menu?`;

    if (visibility == 'hidden')
      dialogQuestion = `Hide '${selectedSample.name}' sample from the menu?`;

    this.confirmService.askConfirmation({
      message: dialogQuestion,
      confirmAction: async () => {
        await this.samplesService.toggleSampleVisibility(
          selectedSample,
          visibility,
        );
      },
    });
  }

  doHideAllSamples() {
    const dialogQuestion = `Hide all samples from the menu and other places in the user interface?`;

    this.confirmService.askConfirmation({
      message: dialogQuestion,
      confirmAction: async () => {
        await this.samplesService.hideAllSamples();
      },
    });
  }

  doSampleViewConfigurationFile(
    configFilePath: string,
    configFileName: string,
  ) {
    this.router.navigate(
      [
        '/configuration',
        'generalSettingsMenuSelected',
        configFilePath,
        configFileName,
      ],
      { skipLocationChange: true },
    );
  }

  doSampleTryIt(clickedSample: SampleInfo) {
    //console.log(`clickedSample = ${JSON.stringify(clickedSample)}`);

    const dialogQuestion = clickedSample.notes;
    this.confirmService.askConfirmation({
      message: dialogQuestion,
      confirmLabel: "OK and I'll click 'Burst' in the following screen",
      declineLabel: "No, I'll do it later",
      confirmAction: () => {
        this.processingService.procBurstInfo.isSample = false;
        this.processingService.procReportingMailMergeInfo.isSample = false;

        if (['burst', 'merge-burst'].includes(clickedSample.jobType)) {
          this.processingService.procBurstInfo.isSample = true;

          if (clickedSample.jobType == 'burst') {
            const inputDocumentShortPath = clickedSample.input.data[0].replace(
              'file:',
              '',
            );

            //console.log(`navigate /processingSampleBurst 'burstMenuSelected'`);

            this.router.navigate(
              [
                '/processingSampleBurst',
                'burstMenuSelected',
                Utilities.slash(
                  //`${this.settingsService.PORTABLE_EXECUTABLE_DIR}/${inputDocumentShortPath}`,
                  `${inputDocumentShortPath}`,
                ),
                Utilities.slash(clickedSample.configurationFilePath),
              ],
              { skipLocationChange: true },
            );
          }

          if (clickedSample.jobType == 'merge-burst') {
            let diezSeparatedListOfFilePathsToMerge = '';
            const filesToMerge = clickedSample.input.data;
            filesToMerge.forEach((fileToMerge: string) => {
              //const filePath = Utilities.slash(
              //  `${
              //    this.settingsService.PORTABLE_EXECUTABLE_DIR
              //  }/${fileToMerge.replace('file:', '')}`,
              //);
              const filePath = Utilities.slash(
                `${fileToMerge.replace('file:', '')}`,
              );
              if (diezSeparatedListOfFilePathsToMerge.length == 0) {
                diezSeparatedListOfFilePathsToMerge = filePath;
              } else {
                diezSeparatedListOfFilePathsToMerge = `${diezSeparatedListOfFilePathsToMerge}#${filePath}`;
              }
            });

            diezSeparatedListOfFilePathsToMerge = `${diezSeparatedListOfFilePathsToMerge}#burst-merged-file`;
            //console.log(
            //  `diezSeparatedListOfFilePathsToMerge = ${diezSeparatedListOfFilePathsToMerge}`,
            //);
            this.router.navigate(
              [
                '/processingSampleBurst',
                'mergeBurstMenuSelected',
                diezSeparatedListOfFilePathsToMerge,
                Utilities.slash(clickedSample.configurationFilePath),
              ],
              { skipLocationChange: true },
            );
          }
        }

        if (clickedSample.jobType == 'generate') {
          this.processingService.procReportingMailMergeInfo.isSample = true;

          const inputDocumentShortPath = clickedSample.input.data[0].replace(
            'file:',
            '',
          );

          this.processingService.procReportingMailMergeInfo.inputFileName =
            Utilities.basename(inputDocumentShortPath);

          this.router.navigate(
            [
              '/processingSampleGenerate',
              'burstMenuSelected',
              Utilities.slash(
                //`${this.settingsService.PORTABLE_EXECUTABLE_DIR}/${inputDocumentShortPath}`,
                `${clickedSample.configurationFilePath}`,
              ),
              Utilities.slash(inputDocumentShortPath),
            ],
            { skipLocationChange: true },
          );
        }
      },
    });
  }

  //end samples
}
