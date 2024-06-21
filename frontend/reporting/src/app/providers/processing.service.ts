import { Injectable } from '@angular/core';
import { CfgTmplFileInfo } from './settings.service';

@Injectable({
  providedIn: 'root',
})
export class ProcessingService {
  procBurstInfo = {
    inputFile: null,
    inputFileName: '',
    prefilledInputFilePath: '',
    prefilledConfigurationFilePath: '',
    isSample: false,
  };

  procReportingMailMergeInfo = {
    inputFile: null,
    inputFileName: '',
    prefilledInputFilePath: '',
    prefilledConfigurationFilePath: '',
    isSample: false,
    selectedMailMergeClassicReport: {} as CfgTmplFileInfo,
  };

  procMergeBurstInfo = {
    inputFiles: [],
    inputFilesNames: [],
    shouldBurstResultedMergedFile: false,
    mergedFileName: 'merged.pdf',
    selectedFile: null,
  };

  procQualityAssuranceInfo = {
    inputFile: null,
    inputFileName: '',
    prefilledInputFilePath: '',
    prefilledConfigurationFilePath: '',
    whichAction: 'burst',
    mode: 'ta',
    listOfTokens: '',
    numberOfRandomTokens: '2',
    testEmailServerStatus: 'stopped',
    testEmailServerUrl: '',
  };
}
