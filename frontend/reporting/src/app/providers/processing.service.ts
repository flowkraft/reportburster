import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ProcessingService {
  procBurstInfo = {
    inputFile: null,
    inputFileName: '',
    prefilledInputFilePath: '',
    prefilledConfigurationFilePath: '',
    mailMergeClassicReportInputFilePath: '',
    isSample: false,
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
