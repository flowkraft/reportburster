import {
  Component,
  OnInit,
  ChangeDetectorRef,
  ViewChild,
  TemplateRef,
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

import { ShellService } from '../../providers/shell.service';
import {
  CfgTmplFileInfo,
  SettingsService,
} from '../../providers/settings.service';
import Utilities from '../../helpers/utilities';
import { ConfirmService } from '../../components/dialog-confirm/confirm.service';
import { InfoService } from '../../components/dialog-info/info.service';
import { ElectronService } from '../../core/services';
import { SampleInfo, SamplesService } from '../../providers/samples.service';

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

  visibleTabs: {
    id: string;
    heading: string;
    ngTemplateOutlet: string;
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

  procBurstInfo = {
    inputFilePath: '',
    mailMergeClassicReportInputFilePath: '',
    configurationFilePath: '',
  };

  procMergeBurstInfo = {
    mergeFiles: [],
    shouldBurstResultedMergedFile: false,
    mergedFileName: 'merged.pdf',
    selectedFile: null,
  };

  procQualityAssuranceInfo = {
    inputFilePath: '',
    configurationFilePath: '',
    whichAction: 'burst',
    mode: 'ta',
    listOfTokens: '',
    numberOfRandomTokens: '2',
    testEmailServerStatus: 'stopped',
    testEmailServerUrl: '',
  };
  protected xmlSettings;
  currentLeftMenu: string;

  protected selectedMailMergeClassicReport: CfgTmplFileInfo;

  protected reportgenerationmailmerge = [
    { id: 'payslips.xml', name: 'Payslips' },
    { id: 'invoices.xml', name: 'Invoices' },
    { id: 'bills.xml', name: 'Bills' },
  ];

  constructor(
    protected settingsService: SettingsService,
    protected confirmService: ConfirmService,
    protected infoService: InfoService,
    protected route: ActivatedRoute,
    protected router: Router,
    protected changeDetectorRef: ChangeDetectorRef,
    protected shellService: ShellService,
    protected executionStatsService: ExecutionStatsService,
    protected electronService: ElectronService,
    protected samplesService: SamplesService
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
      if (params.leftMenu) {
        this.currentLeftMenu = params.leftMenu;
      } else {
        this.currentLeftMenu = 'burstMenuSelected';
      }

      if (this.currentLeftMenu == 'qualityMenuSelected') {
        if (params.prefilledInputFilePath) {
          this.procQualityAssuranceInfo.inputFilePath =
            params.prefilledInputFilePath;
        }

        if (params.prefilledConfigurationFilePath) {
          this.procQualityAssuranceInfo.configurationFilePath =
            params.prefilledConfigurationFilePath;
        }

        if (params.whichAction) {
          this.procQualityAssuranceInfo.whichAction = params.whichAction;
        }

        const repeat = interval(1000);
        this.subscriptionCheckIfTestEmailServerIsStarted = repeat.subscribe(
          (val) => {
            this.checkIfTestEmailServerIsStarted();
          }
        );
      } else {
        if (params.prefilledInputFilePath) {
          if (this.currentLeftMenu != 'mergeBurstMenuSelected')
            this.procBurstInfo.inputFilePath = params.prefilledInputFilePath;
          else if (this.currentLeftMenu == 'mergeBurstMenuSelected') {
            let pFilledInputFilePath = params.prefilledInputFilePath;

            this.procMergeBurstInfo.shouldBurstResultedMergedFile =
              pFilledInputFilePath.endsWith('#burst-merged-file');

            if (this.procMergeBurstInfo.shouldBurstResultedMergedFile)
              pFilledInputFilePath = pFilledInputFilePath.replace(
                '#burst-merged-file',
                ''
              );
            const filePaths = pFilledInputFilePath.split('#');

            filePaths.forEach((filePath: string) => {
              this.procMergeBurstInfo.mergeFiles.push({
                name: this.electronService.path.basename(filePath),
                path: filePath,
              });
            });
          }
        }
        if (params.prefilledConfigurationFilePath) {
          this.procBurstInfo.configurationFilePath =
            params.prefilledConfigurationFilePath;
        }
      }

      this.refreshTabs();
    });

    this.xmlSettings = await this.settingsService.loadSettingsFileAsync(
      this.settingsService.getDefaultsConfigurationValuesFilePath()
    );

    this.procMergeBurstInfo.mergedFileName =
      this.xmlSettings.documentburster.settings.mergefilename;
  }

  refreshTabs() {
    this.visibleTabs = [];
    this.changeDetectorRef.detectChanges();

    let visibleTabsIds = this.MENU_SELECTED_X_VISIBLE_TABS.find((item) => {
      return item.selectedMenu === this.currentLeftMenu;
    }).visibleTabs;

    //if (this.currentLeftMenu == 'burstMenuSelected') {
    let mailMergeConfigurations =
      this.settingsService.getMailMergeConfigurations('visible');

    if (!mailMergeConfigurations.length) {
      visibleTabsIds = visibleTabsIds.filter(
        (tab) => tab != 'reportGenerationMailMergeTab'
      );
    }
    //}

    this.visibleTabs = this.ALL_TABS.filter((item) => {
      return visibleTabsIds.includes(item.id);
    });
  }

  // tab Burst

  onBurstFileSelected(filePath: string) {
    this.procBurstInfo.inputFilePath = Utilities.slash(filePath);
  }

  onMailMergeClassicReportFileSelected(filePath: string) {
    this.procBurstInfo.mailMergeClassicReportInputFilePath = Utilities.slash(
      this.electronService.path.resolve(filePath)
    );

    this.procBurstInfo.configurationFilePath = Utilities.slash(
      this.electronService.path.resolve(
        this.selectedMailMergeClassicReport.filePath
      )
    );
  }

  disableRunTest() {}

  noActiveJobs() {}

  doBurst() {
    if (this.executionStatsService.foundDirtyLogFiles()) {
      const dialogMessage =
        'Log files are not empty. You need to press the Clear Logs button first.';

      this.infoService.showInformation({
        message: dialogMessage,
      });
    } else {
      const dialogQuestion =
        'Burst file ' + this.procBurstInfo.inputFilePath + '?';

      this.confirmService.askConfirmation({
        message: dialogQuestion,
        confirmAction: () => {
          const fileName = this.electronService.path.basename(
            this.procBurstInfo.inputFilePath
          );

          if (!this.procBurstInfo.configurationFilePath)
            this.shellService.runBatFile(
              ['-f', `"${this.procBurstInfo.inputFilePath}"`],
              fileName
            );
          else {
            const configFilePath = this.procBurstInfo.configurationFilePath;
            this.procBurstInfo.configurationFilePath = '';
            this.shellService.runBatFile(
              [
                '-f',
                `"${this.procBurstInfo.inputFilePath}"`,
                '-c',
                `"${configFilePath}"`,
              ],
              fileName
            );
          }
        },
      });
    }
  }

  doGenerateReports() {
    if (this.executionStatsService.foundDirtyLogFiles()) {
      const dialogMessage =
        'Log files are not empty. You need to press the Clear Logs button first.';

      this.infoService.showInformation({
        message: dialogMessage,
      });
    } else {
      const inputFileName = this.electronService.path.basename(
        this.procBurstInfo.mailMergeClassicReportInputFilePath
      );

      const dialogQuestion = `Process file '${inputFileName}'?`;

      this.confirmService.askConfirmation({
        message: dialogQuestion,
        confirmAction: () => {
          const configFilePath = this.procBurstInfo.configurationFilePath;
          this.procBurstInfo.configurationFilePath = '';

          this.shellService.runBatFile(
            [
              '-f',
              `"${this.procBurstInfo.mailMergeClassicReportInputFilePath}"`,
              '-c',
              `"${configFilePath}"`,
            ],
            inputFileName
          );
        },
      });
    }
  }

  // end tab Burst

  // tab Merge -> Burst
  doMergeBurst() {
    if (this.executionStatsService.foundDirtyLogFiles()) {
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
          const mergeFilePath =
            await this.shellService.generateMergeFileInTempFolder(
              this.procMergeBurstInfo.mergeFiles
            );

          const arrguments = [
            '-mf',
            '"' + mergeFilePath + '"',
            '-o',
            this.procMergeBurstInfo.mergedFileName,
          ];

          if (this.procMergeBurstInfo.shouldBurstResultedMergedFile) {
            arrguments.push('-b');
          }

          this.shellService.runBatFile(
            arrguments,
            this.procMergeBurstInfo.mergedFileName
          );
        },
      });
    }
  }

  onFilesAdded(filePaths: string[]) {
    //FIXME Name column should display filename (currently it shows filePath)
    if (this.electronService.RUNNING_IN_E2E) {
      this.procMergeBurstInfo.mergeFiles.push({
        name: this.electronService.path.basename(
          this.procMergeBurstInfo.mergedFileName
        ),
        path: this.procMergeBurstInfo.mergedFileName,
      });
    } else {
      filePaths.forEach((filePath) => {
        this.procMergeBurstInfo.mergeFiles.push({
          name: this.electronService.path.basename(filePath),
          path: filePath,
        });
      });
    }
  }

  onFileSelected(file: { path: string }) {
    this.procMergeBurstInfo.mergeFiles.forEach((each) => {
      if (each.path === file.path) {
        each.selected = true;
        this.procMergeBurstInfo.selectedFile = file;
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
          this.procMergeBurstInfo.mergeFiles,
          (o) => o.path === this.procMergeBurstInfo.selectedFile.path
        );
      },
    });
  }

  onSelectedFileUp() {
    const index = _.indexOf(
      this.procMergeBurstInfo.mergeFiles,
      this.procMergeBurstInfo.selectedFile
    );

    if (index > 0) {
      this.moveItemInArray(
        this.procMergeBurstInfo.mergeFiles,
        index,
        index - 1
      );
      this.onFileSelected(this.procMergeBurstInfo.selectedFile);
    }
  }

  onSelectedFileDown() {
    const index = _.indexOf(
      this.procMergeBurstInfo.mergeFiles,
      this.procMergeBurstInfo.selectedFile
    );

    if (index < this.procMergeBurstInfo.mergeFiles.length - 1) {
      this.moveItemInArray(
        this.procMergeBurstInfo.mergeFiles,
        index,
        index + 1
      );
      this.onFileSelected(this.procMergeBurstInfo.selectedFile);
    }
  }

  onClearFiles() {
    const dialogQuestion = 'Clear all items?';

    this.confirmService.askConfirmation({
      message: dialogQuestion,
      confirmAction: () => {
        this.procMergeBurstInfo.mergeFiles = [];
      },
    });
  }

  async saveMergedFileSetting() {
    const xmlSettings = await this.settingsService.loadSettingsFileAsync(
      this.settingsService.getDefaultsConfigurationValuesFilePath()
    );

    xmlSettings.documentburster.settings.mergefilename =
      this.procMergeBurstInfo.mergedFileName;

    this.settingsService.saveSettingsFileAsync(
      xmlSettings,
      this.settingsService.getDefaultsConfigurationValuesFilePath()
    );
  }

  moveItemInArray(array, from, to) {
    array.splice(to, 0, array.splice(from, 1)[0]);
  }
  // end tab Merge -> Burst

  // tab Quality Assurance
  onQAFileSelected(filePath: string) {
    this.procQualityAssuranceInfo.inputFilePath = filePath;
  }

  doRunTest() {
    if (this.executionStatsService.foundDirtyLogFiles()) {
      const dialogMessage =
        'Log files are not empty. You need to press the Clear Logs button first.';

      this.infoService.showInformation({
        message: dialogMessage,
      });
    } else {
      const fileName = this.electronService.path.basename(
        this.procQualityAssuranceInfo.inputFilePath
      );
      const dialogQuestion = `Test file ${fileName}?`;

      this.confirmService.askConfirmation({
        message: dialogQuestion,
        confirmAction: () => {
          let arrguments = [];

          if (this.procQualityAssuranceInfo.whichAction == 'burst')
            arrguments = [
              '-f',
              '"' + this.procQualityAssuranceInfo.inputFilePath + '"',
              '-' + this.procQualityAssuranceInfo.mode,
            ];
          else if (
            this.procQualityAssuranceInfo.whichAction == 'csv-generate-reports'
          )
            arrguments = [
              '-f',
              '"' + this.procQualityAssuranceInfo.inputFilePath + '"',
              '-c',
              '"' + this.procQualityAssuranceInfo.configurationFilePath + '"',
              '-' + this.procQualityAssuranceInfo.mode,
            ];

          if (this.procQualityAssuranceInfo.mode === 'tl') {
            arrguments.push(
              '"' +
                this.procQualityAssuranceInfo.listOfTokens
                  .toString()
                  .replace(/, +/g, ',') +
                '"'
            );
          } else if (this.procQualityAssuranceInfo.mode === 'tr') {
            arrguments.push(this.procQualityAssuranceInfo.numberOfRandomTokens);
          }
          this.shellService.runBatFile(arrguments, fileName);
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
        this.procQualityAssuranceInfo.mode = 'tl';
        break;
      case 'numberOfRandomTokens':
        this.procQualityAssuranceInfo.mode = 'tr';
        break;
      default:
        document.getElementById('listOfTokens').focus();
        this.procQualityAssuranceInfo.mode = 'ta';
    }
  }

  runTestShouldBeDisabled() {
    let disableRunTest = true;

    if (this.procQualityAssuranceInfo.inputFilePath) {
      switch (this.procQualityAssuranceInfo.mode) {
        case 'ta':
          disableRunTest = false;
          break;
        case 'tl':
          if (this.procQualityAssuranceInfo.listOfTokens) {
            disableRunTest = false;
          }
          break;
        case 'tr':
          if (
            Utilities.isPositiveInteger(
              this.procQualityAssuranceInfo.numberOfRandomTokens
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
    let testEmailServerStatus = 'stopped';
    try {
      //FIXME procQualityAssuranceInfo.testEmailServerStatus
      const qaEmailServerStarted = await Utilities.urlExists(
        this.xmlSettings.documentburster.settings.qualityassurance.emailserver
          .weburl
      );

      if (qaEmailServerStarted) testEmailServerStatus = 'started';
    } catch (e) {
      testEmailServerStatus = 'stopped';
    }
    if (
      this.procQualityAssuranceInfo.testEmailServerStatus !==
      testEmailServerStatus
    )
      this.procQualityAssuranceInfo.testEmailServerStatus =
        testEmailServerStatus;
  }

  doStartStopTestEmailServer(command: string) {
    let dialogQuestion = 'Start Test Email Server?';

    if (command === 'shut') {
      dialogQuestion = 'Stop Test Email Server?';
    }

    this.confirmService.askConfirmation({
      message: dialogQuestion,
      confirmAction: () => {
        this.procQualityAssuranceInfo.testEmailServerStatus = 'starting';
        if (command === 'shut') {
          this.procQualityAssuranceInfo.testEmailServerStatus = 'stopping';
        }

        this.shellService.startStopTestEmailServer(command);
      },
    });
  }

  // end tab Quality Assurance

  // stop / cancel / resume
  doResumeJob(jobFilePath: string) {
    if (this.executionStatsService.foundDirtyLogFiles()) {
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
          this.shellService.runBatFile(
            ['-rf', '"' + this.electronService.path.resolve(jobFilePath) + '"'],
            this.electronService.path.basename(jobFilePath)
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
      true
    );
    this.modalSampleInfo.outputDetails = this.samplesService.getOutputHtml(
      clickedSample.id,
      true
    );

    this.modalSampleInfo.outputDetails = this.samplesService.getOutputHtml(
      clickedSample.id,
      true
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
          visibility
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
    configFileName: string
  ) {
    this.router.navigate([
      '/configuration',
      'generalSettingsMenuSelected',
      configFilePath,
      configFileName,
    ]);
  }

  doSampleTryIt(clickedSample: SampleInfo) {
    const dialogQuestion = clickedSample.notes;
    this.confirmService.askConfirmation({
      message: dialogQuestion,
      confirmLabel: "OK and I'll click 'Burst' in the following screen",
      declineLabel: "No, I'll do it later",
      confirmAction: () => {
        if (clickedSample.input.data.length == 1) {
          const inputDocumentShortPath = clickedSample.input.data[0].replace(
            'file:',
            ''
          );

          this.router.navigate([
            '/processingSample',
            'burstMenuSelected',
            Utilities.resolve(
              Utilities.slash(
                `${this.settingsService.PORTABLE_EXECUTABLE_DIR}/${inputDocumentShortPath}`
              )
            ),
            Utilities.resolve(
              Utilities.slash(clickedSample.configurationFilePath)
            ),
          ]);
        } else if (clickedSample.input.data.length > 1) {
          let diezSeparatedListOfFilePathsToMerge = '';
          const filesToMerge = clickedSample.input.data;
          filesToMerge.forEach((fileToMerge: string) => {
            const filePath = Utilities.resolve(
              Utilities.slash(
                `${
                  this.settingsService.PORTABLE_EXECUTABLE_DIR
                }/${fileToMerge.replace('file:', '')}`
              )
            );
            if (diezSeparatedListOfFilePathsToMerge.length == 0) {
              diezSeparatedListOfFilePathsToMerge = filePath;
            } else {
              diezSeparatedListOfFilePathsToMerge = `${diezSeparatedListOfFilePathsToMerge}#${filePath}`;
            }
          });

          diezSeparatedListOfFilePathsToMerge = `${diezSeparatedListOfFilePathsToMerge}#burst-merged-file`;

          this.router.navigate([
            '/processingSample',
            'mergeBurstMenuSelected',
            diezSeparatedListOfFilePathsToMerge,
            Utilities.resolve(
              Utilities.slash(clickedSample.configurationFilePath)
            ),
          ]);
        }
      },
    });
  }

  //end samples
}
