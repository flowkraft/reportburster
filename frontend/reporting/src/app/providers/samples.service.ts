import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { SettingsService } from './settings.service';
import Utilities from '../helpers/utilities';

export interface SampleInfo {
  id: string;
  name: string;
  visibility: string;
  jobType: string;
  input: {
    data: string[];
    dataUrl?: string[];
    numberOfPages: number;
    tokens: string[];
  };
  step1: string;
  step2: string;
  step3: string;
  output: {
    data: string[];
    folder: string;
  };
  outputHtmlHardcoded: string;
  configurationFilePath: string;
  configurationFileName: string;
  notes: string;
  recipientType: string;
  documentType: string;
  activeClicked: boolean;
  capReportDistribution: boolean;
  capReportGenerationMailMerge: boolean;
  documentation?: string;
}

@Injectable({
  providedIn: 'root',
})
export class SamplesService {
  constructor(
    protected translateService: TranslateService,
    protected settingsService: SettingsService,
  ) {}

  countVisibleSamples = -1;

  samples: Array<SampleInfo> = [
    {
      id: 'MONTHLY-PAYSLIPS-SPLIT-ONLY',
      name: '1. Monthly Payslips PDF (split only)',
      visibility: 'visible',
      jobType: 'burst',
      input: {
        data: ['file:samples/burst/Payslips.pdf'],
        dataUrl: ['file:https://www.pdfburst.com/samples/Payslips.pdf'],
        numberOfPages: 3,
        tokens: [
          'clyde.grew@northridgehealth.org',
          'kyle.butford@northridgehealth.org',
          'alfreda.waldback@northridgehealth.org',
        ],
      },
      step1: 'split',
      step2: '',
      step3: '',
      output: {
        data: [
          'file:clyde.grew@northridgehealth.org.pdf',
          'file:kyle.butford@northridgehealth.org.pdf',
          'file:alfreda.waldback@northridgehealth.org.pdf',
        ],
        folder:
          "output/Payslips.pdf/${timestamp?format['yyyy.MM.dd_HH.mm.ss.SSS']}",
      },
      outputHtmlHardcoded: '',
      //configurationFilePath: `${this.settingsService.PORTABLE_EXECUTABLE_DIR}/config/samples/split-only/settings.xml`,
      configurationFilePath: `config/samples/split-only/settings.xml`,
      configurationFileName: 'split-only',
      notes: ``,
      recipientType: 'employee',
      documentType: 'payslip',
      capReportDistribution: false,
      capReportGenerationMailMerge: false,
      activeClicked: false,
      documentation:
        'https://www.pdfburst.com/docs/html/userguide/chapter.pdf.html#chapter.pdf.bursting',
    },
    {
      id: 'EXCEL-DISTINCT-SHEETS-SPLIT-ONLY',
      name: '2. Monthly Payslips Excel - split Excel file by distinct sheets (split only)',
      visibility: 'visible',
      jobType: 'burst',
      step1: 'split',
      step2: '',
      step3: '',
      input: {
        data: ['file:samples/burst/Payslips-Distinct-Sheets.xls'],
        dataUrl: [
          'file:https://www.pdfburst.com/samples/Payslips-Distinct-Sheets.xls',
        ],
        numberOfPages: -1,
        tokens: [
          'clyde.grew@northridgehealth.org',
          'kyle.butford@northridgehealth.org.pdf',
          'alfreda.waldback@northridgehealth.org',
        ],
      },
      output: {
        data: [
          'file:clyde.grew@northridgehealth.org.xls',
          'file:kyle.butford@northridgehealth.org.xls',
          'file:alfreda.waldback@northridgehealth.org.xls',
        ],
        folder:
          "output/${input_document_name}/${timestamp?format['yyyy.MM.dd_HH.mm.ss.SSS']}",
      },
      outputHtmlHardcoded:
        '<i class="fa fa-file-excel-o"></i> clyde.grew@northridgehealth.org.xls employee payslip<br><i class="fa fa-file-excel-o"></i> kyle.butford@northridgehealth.org.xls employee payslip<br><i class="fa fa-file-excel-o"></i> alfreda.waldback@northridgehealth.org.xls employee payslip',
      //configurationFilePath: `${this.settingsService.PORTABLE_EXECUTABLE_DIR}/config/samples/split-only/settings.xml`,
      configurationFilePath: `config/samples/split-only/settings.xml`,
      configurationFileName: 'split-only',
      notes: ``,
      recipientType: 'employee',
      documentType: 'payslip',
      capReportDistribution: false,
      capReportGenerationMailMerge: false,
      activeClicked: false,
      documentation:
        'https://www.pdfburst.com/docs/html/userguide/chapter.excel.html#chapter.excel.bursting.by.distinct.sheets',
    },
    {
      id: 'EXCEL-DISTINCT-COLUMN-VALUES-SPLIT-ONLY',
      name: '3. Customer List/Country Excel - split Excel file by distinct column values (split only)',
      visibility: 'visible',
      jobType: 'burst',
      step1: 'split',
      step2: '',
      step3: '',
      input: {
        data: ['file:samples/burst/Customers-Distinct-Column-Values.xls'],
        dataUrl: [
          'file:https://www.pdfburst.com/samples/Customers-Distinct-Column-Values.xls',
        ],
        numberOfPages: -1,
        tokens: [],
      },
      output: {
        data: [],
        folder:
          "output/${input_document_name}/${timestamp?format['yyyy.MM.dd_HH.mm.ss.SSS']}",
      },
      outputHtmlHardcoded:
        '<i class="fa fa-file-excel-o"></i> United States of America.xls<br><i class="fa fa-file-excel-o"></i> Australia.xls<br><i class="fa fa-file-excel-o"></i> Canada.xls<br><i class="fa fa-file-excel-o"></i> United Kingdom.xls<br><i class="fa fa-file-excel-o"></i> Germany.xls<br>etc... (separate file containing customer list for each country)',
      //configurationFilePath: `${this.settingsService.PORTABLE_EXECUTABLE_DIR}/config/samples/split-only/settings.xml`,
      configurationFilePath: `config/samples/split-only/settings.xml`,
      configurationFileName: 'split-only',
      notes: ``,
      recipientType: 'customer',
      documentType: 'invoices',
      capReportDistribution: false,
      capReportGenerationMailMerge: false,
      activeClicked: false,
      documentation:
        'https://www.pdfburst.com/docs/html/userguide/chapter.excel.html#chapter.excel.bursting.by.distinct.column.values',
    },
    {
      id: 'INVOICES-SPLIT-ONCE-MORE-SPLIT-ONLY',
      name: '4. Customers with Multiple Invoices PDF (split only)',
      visibility: 'visible',
      jobType: 'burst',
      step1: 'split',
      step2: '',
      step3: '',
      input: {
        data: ['file:samples/burst/Split2Times.pdf'],
        dataUrl: ['file:https://www.pdfburst.com/samples/Split2Times.pdf'],
        numberOfPages: -1,
        tokens: [],
      },
      output: {
        data: [
          'file:10.pdf (for accounting@alphainsurance.biz)',
          'file:9.pdf (for accounting@alphainsurance.biz)',
          'file:8.pdf (for accounting@alphainsurance.biz)',
          'file:7.pdf (for accounting@alphainsurance.biz)',
          'file:6.pdf (for accounting@betainsurance.biz)',
          'file:5.pdf (for accounting@betainsurance.biz)',
          'file:4.pdf (for accounting@betainsurance.biz)',
          'file:3.pdf (for accounting@gammahealth.biz)',
          'file:2.pdf (for accounting@gammahealth.biz)',
        ],
        folder:
          "output/Payslips.pdf/${timestamp?format['yyyy.MM.dd_HH.mm.ss.SSS']}",
      },
      outputHtmlHardcoded: '',
      //configurationFilePath: `${this.settingsService.PORTABLE_EXECUTABLE_DIR}/config/samples/split-two-times-split-only/settings.xml`,
      configurationFilePath: `config/samples/split-two-times-split-only/settings.xml`,
      configurationFileName: 'split-two-times-split-only',
      notes: ``,
      recipientType: 'customer',
      documentType: 'invoice',
      capReportDistribution: false,
      capReportGenerationMailMerge: false,
      activeClicked: false,
      documentation:
        'http://www.pdfburst.com/docs/html/userguide/chapter.pdf.html#chapter.config.advanced',
    },
    {
      id: 'INVOICES-MERGE-THEN-SPLIT',
      name: '5. Customer Invoices PDF - Merge and then Process Multiple Files Together',
      visibility: 'visible',
      jobType: 'merge-burst',
      input: {
        data: [
          'file:samples/burst/Invoices-Oct.pdf',
          'file:samples/burst/Invoices-Nov.pdf',
          'file:samples/burst/Invoices-Dec.pdf',
        ],
        dataUrl: [
          'file:https://www.pdfburst.com/samples/Invoices-Oct.pdf',
          'file:https://www.pdfburst.com/samples/Invoices-Nov.pdf',
          'file:https://www.pdfburst.com/samples/Invoices-Dec.pdf',
        ],
        numberOfPages: -1,
        tokens: [],
      },
      step1: 'merge',
      step2: 'split',
      step3: '',
      output: {
        data: [
          'file:0011.pdf',
          'file:0012.pdf',
          'file:0013.pdf',
          'file:0014.pdf',
          'file:0015.pdf',
          'file:0016.pdf',
          'file:0017.pdf',
          'file:0018.pdf',
          'file:0019.pdf',
        ],
        folder:
          "output/${input_document_name}/${timestamp?format['yyyy.MM.dd_HH.mm.ss.SSS']}",
      },
      outputHtmlHardcoded: '',
      //configurationFilePath: `${this.settingsService.PORTABLE_EXECUTABLE_DIR}/config/samples/split-only/settings.xml`,
      configurationFilePath: `config/samples/split-only/settings.xml`,
      configurationFileName: 'split-only',
      notes: ``,
      recipientType: 'customer',
      documentType: 'invoice',
      capReportDistribution: false,
      capReportGenerationMailMerge: false,
      activeClicked: false,
    },
  ];

  samplesNotYetImplemented: Array<SampleInfo> = [
    {
      id: 'GENERATE-EMAIL-PAYSLIPS',
      name: '6. Monthly Payslips (again)',
      visibility: 'hidden',
      jobType: 'burst',
      input: {
        data: ['file:samples/All-Payslips.csv'],
        numberOfPages: -1,
        tokens: [
          'clyde.grew@northridgehealth.org',
          'kyle.butford@northridgehealth.org.pdf',
          'alfreda.waldback@northridgehealth.org',
        ],
      },
      step1: 'generate',
      step2: 'email',
      step3: '',
      output: {
        data: [
          'email-file-attached:clyde.grew@northridgehealth.org.docx',
          'email-file-attached:kyle.butford@northridgehealth.org.docx',
          'email-file-attached:alfreda.waldback@northridgehealth.org.docx',
        ],
        folder:
          "output/${input_document_name}/${timestamp?format['yyyy.MM.dd_HH.mm.ss.SSS']}",
      },
      outputHtmlHardcoded: '',
      //configurationFilePath: `${this.settingsService.PORTABLE_EXECUTABLE_DIR}/config/samples/monthly-payslips-generate-docx/settings.xml`,
      configurationFilePath: `config/samples/monthly-payslips-generate-docx/settings.xml`,
      configurationFileName: 'split-only',
      notes: ``,
      recipientType: 'employee',
      documentType: 'payslip',
      capReportDistribution: false,
      capReportGenerationMailMerge: false,
      activeClicked: false,
    },
    {
      id: 'MAIL-MERGE-EMAIL-LETTERS-TO-STUDENTS',
      name: '7. Mail Merge Email Letters to All Students',
      visibility: 'hidden',
      jobType: 'burst',
      input: {
        data: ['file:samples/All-Payslips.csv'],
        numberOfPages: -1,
        tokens: [
          'clyde.grew@northridgehealth.org',
          'kyle.butford@northridgehealth.org.pdf',
          'alfreda.waldback@northridgehealth.org',
        ],
      },
      step1: 'mail-merge-emails',
      step2: 'email',
      step3: '',
      output: {
        data: [
          'email:clyde.grew@northridgeschool.edu',
          'email:kyle.butford@northridgeschool.edu',
          'email:alfreda.waldback@northridgeschool.edu',
        ],
        folder:
          "output/${input_document_name}/${timestamp?format['yyyy.MM.dd_HH.mm.ss.SSS']}",
      },
      outputHtmlHardcoded:
        '<i class="fa fa-envelope-o"></i> letter to student clyde.grew@northridgeschool.edu<br><i class="fa fa-envelope-o"></i> letter to student kyle.butford@northridgeschool.edu<br><i class="fa fa-envelope-o"></i> letter to student alfreda.waldback@northridgeschool.edu',
      //configurationFilePath: `${this.settingsService.PORTABLE_EXECUTABLE_DIR}/config/samples/mail-merge-emails/settings.xml`,
      configurationFilePath: `config/samples/mail-merge-emails/settings.xml`,
      configurationFileName: 'split-only',
      notes: ``,
      recipientType: 'student',
      documentType: 'letter',
      capReportDistribution: false,
      capReportGenerationMailMerge: false,
      activeClicked: false,
    },
    {
      id: 'NEWSLETTER1',
      name: '9. Newsletter 1',
      visibility: 'hidden',
      jobType: 'burst',
      input: {
        data: ['file:samples/All-Payslips.csv'],
        numberOfPages: -1,
        tokens: [
          'clyde.grew@northridgehealth.org',
          'kyle.butford@northridgehealth.org.pdf',
          'alfreda.waldback@northridgehealth.org',
        ],
      },
      step1: 'mail-merge-documents',
      step2: 'email',
      step3: '',
      output: {
        data: [
          'email-file-attached:clyde.grew@northridgeschool.edu.docx',
          'email-file-attached:kyle.butford@northridgeschool.edu.docx',
          'email-file-attached:alfreda.waldback@northridgeschool.edu.docx',
        ],
        folder:
          "output/${input_document_name}/${timestamp?format['yyyy.MM.dd_HH.mm.ss.SSS']}",
      },
      outputHtmlHardcoded: '',
      //configurationFilePath: `${this.settingsService.PORTABLE_EXECUTABLE_DIR}/config/samples/newsletter-1/settings.xml`,
      configurationFilePath: `config/samples/newsletter-1/settings.xml`,
      configurationFileName: 'split-only',
      notes: ``,
      recipientType: 'student',
      documentType: 'letter',
      capReportDistribution: false,
      capReportGenerationMailMerge: false,
      activeClicked: false,
    },
  ];

  getInputHtml(id: string, fullDetails?: boolean) {
    const sample = this.samples.find((sample) => sample.id == id);
    const inputs: string[] = sample.input.data;
    const inputsUrl: string[] = sample.input.dataUrl;

    let inputLabel = inputs[0].replace('file:', '');
    let inputUrl: string;

    if (inputsUrl && inputsUrl.length) {
      inputUrl = inputsUrl[0].replace('file:', '');
    }

    //let inputLabel = inputs[0];

    let inputFileIcon = 'fa-file-pdf-o';
    if (inputLabel.endsWith('.xls')) {
      inputFileIcon = 'fa-file-excel-o';
    } else if (inputLabel.endsWith('.csv')) {
      inputFileIcon = 'fa-file-text-o';
    }

    let inputHtml = `<i class="fa ${inputFileIcon}"></i>&nbsp;${inputLabel}`;
    if (fullDetails)
      //inputHtml = `<i class="fa ${inputFileIcon}"></i>&nbsp;${this.settingsService.PORTABLE_EXECUTABLE_DIR}/${inputLabel}`;
      inputHtml = `<i class="fa ${inputFileIcon}"></i>&nbsp;${inputLabel}`;

    if (inputUrl) {
      inputHtml = `<i class="fa ${inputFileIcon}"></i>&nbsp;<a href="${inputUrl}" target="_blank">${inputLabel}</a>`;
      if (fullDetails)
        //inputHtml = `<i class="fa ${inputFileIcon}"></i>&nbsp;<a href="${inputUrl}" target="_blank">${this.settingsService.PORTABLE_EXECUTABLE_DIR}/${inputLabel}</a>`;
        inputHtml = `<i class="fa ${inputFileIcon}"></i>&nbsp;<a href="${inputUrl}" target="_blank">${inputLabel}</a>`;
    }

    for (let index = 1; index < inputs.length; index++) {
      inputLabel = inputs[index].replace('file:', '');
      //inputLabel = inputs[index];
      let currentHtml = `<i class="fa ${inputFileIcon}"></i>&nbsp;${inputLabel}`;
      if (fullDetails)
        //currentHtml = `<i class="fa ${inputFileIcon}"></i>&nbsp;${this.settingsService.PORTABLE_EXECUTABLE_DIR}/${inputLabel}`;
        currentHtml = `<i class="fa ${inputFileIcon}"></i>&nbsp;${inputLabel}`;

      //console.log(`inputsUrl = ${JSON.stringify(inputsUrl)}`);

      if (inputUrl) {
        inputUrl = inputsUrl[index].replace('file:', '');
        currentHtml = `<i class="fa ${inputFileIcon}"></i>&nbsp;<a href="${inputUrl}" target="_blank">${inputLabel}</a>`;
        if (fullDetails)
          //currentHtml = `<i class="fa ${inputFileIcon}"></i>&nbsp;<a href="${inputUrl}" target="_blank>${this.settingsService.PORTABLE_EXECUTABLE_DIR}/${inputLabel}</a>`;
          currentHtml = `<i class="fa ${inputFileIcon}"></i>&nbsp;<a href="${inputUrl}" target="_blank>${inputLabel}</a>`;
      }

      inputHtml = `${inputHtml}<br>${currentHtml}`;
    }

    return inputHtml;
  }

  getOutputHtml(id: string, fullDetails?: boolean) {
    const sample = this.samples.find((sample) => sample.id == id);

    //console.log(`sample = ${JSON.stringify(sample)}`);

    if (sample.outputHtmlHardcoded) return sample.outputHtmlHardcoded;

    const outputs: string[] = sample.output.data;
    let outputLabel = outputs[0].replace('file:', '');

    let attachmentFileIcon = 'fa-file-pdf-o';
    if (outputLabel.endsWith('.docx')) attachmentFileIcon = 'fa-file-word-o';
    let outputHtml = '';
    if (fullDetails) {
      const inputs: string[] = sample.input.data;
      if (inputs.length == 1) {
        const inputFileName = Utilities.basename(inputs[0]);

        //outputHtml = `<strong>Folder</strong><br>${this.settingsService.PORTABLE_EXECUTABLE_DIR}/output/${inputFileName}/\${now?format["yyyy.MM.dd_HH.mm.ss.SSS"]}<br>${outputHtml}`;
        outputHtml = `<strong>Folder</strong><br>output/${inputFileName}/\${now?format["yyyy.MM.dd_HH.mm.ss.SSS"]}<br>${outputHtml}`;
      }
    } else {
      if (sample.capReportDistribution)
        outputHtml = `<i class="fa fa-envelope-o"></i> ${sample.recipientType} with <i class="fa fa-at"></i> ${sample.documentType} <i class="fa ${attachmentFileIcon}"></i> ${outputLabel}`;
      else
        outputHtml = `<i class="fa ${attachmentFileIcon}"></i> ${outputLabel} ${sample.recipientType} ${sample.documentType}`;
    }

    //console.log(`outputHtml = ${outputHtml}`);

    if (!fullDetails) {
      for (let index = 1; index < outputs.length; index++) {
        outputLabel = outputs[index].replace('file:', '');
        let currentHtml = `<i class="fa fa-envelope-o"></i> ${sample.recipientType} with <i class="fa fa-at"></i> ${sample.documentType} <i class="fa ${attachmentFileIcon}"></i> ${outputLabel}`;
        if (!sample.capReportDistribution)
          currentHtml = `<i class="fa ${attachmentFileIcon}"></i> ${outputLabel} ${sample.recipientType} ${sample.documentType}`;

        outputHtml = `${outputHtml}<br>${currentHtml}`;
      }
    } else {
      outputHtml = `${outputHtml}<strong>Files</strong>`;

      for (let index = 0; index < outputs.length; index++) {
        outputLabel = outputs[index].replace('file:', '');
        //console.log(`outputLabel = ${outputLabel}`);

        let currentHtml = `<i class="fa fa-envelope-o"></i> ${sample.recipientType} with <i class="fa fa-at"></i> ${sample.documentType} <i class="fa ${attachmentFileIcon}"></i> ${outputLabel}`;
        if (!sample.capReportDistribution)
          currentHtml = `<i class="fa ${attachmentFileIcon}"></i> ${outputLabel} ${sample.recipientType} ${sample.documentType}`;

        outputHtml = `${outputHtml}<br>${currentHtml}`;
      }

      if (sample.capReportDistribution) {
        outputHtml = `${outputHtml}<br><strong>Emails</strong>`;

        for (let index = 0; index < outputs.length; index++) {
          outputLabel = outputs[index].replace('file:', '');
          let currentHtml = `<i class="fa fa-envelope-o"></i> ${sample.recipientType} with <i class="fa fa-at"></i> ${sample.documentType} <i class="fa ${attachmentFileIcon}"></i> ${outputLabel}`;
          outputHtml = `${outputHtml}<br>${currentHtml}`;
        }
      }
    }

    return outputHtml;
  }

  async fillSamplesNotes() {
    //if not yet loaded
    if (this.samples[0].notes.length == 0) {
      const sampleConfigurations =
        this.settingsService.getSampleConfigurations();

      for (let sample of this.samples) {
        //console.log(JSON.stringify(sampleConfigurations));
        const sampleConfigurationValues = sampleConfigurations.find(
          (configuration) => {
            return sample.configurationFilePath.endsWith(
              configuration.filePath,
            );
          },
        );

        if (sampleConfigurationValues) {
          sample.capReportDistribution =
            sampleConfigurationValues.capReportDistribution;
          sample.capReportGenerationMailMerge =
            sampleConfigurationValues.capReportGenerationMailMerge;
          sample.visibility = sampleConfigurationValues.visibility;
        }

        const notes = await this.translateService.instant(
          `SAMPLES.${sample.id}.NOTES.INNER-HTML`,
        );
        sample.notes = notes;
      }

      this.countVisibleSamples = this.samples.filter(
        (sample) => sample.visibility == 'visible',
      ).length;
    }
  }

  async toggleSampleVisibility(sample: SampleInfo, visibility: string) {
    const settingsXmlConfigurationValues =
      await this.settingsService.loadSettingsFileAsync(
        sample.configurationFilePath,
      );

    settingsXmlConfigurationValues.documentburster.settings.visibility =
      visibility;

    await this.settingsService.saveSettingsFileAsync(
      sample.configurationFilePath,
      settingsXmlConfigurationValues,
    );

    sample.visibility = visibility;

    const sampleConfiguration = this.settingsService
      .getSampleConfigurations()
      .find((configuration) =>
        sample.configurationFilePath.endsWith(configuration.filePath),
      );
    sampleConfiguration.visibility = visibility;
    this.countVisibleSamples = this.samples.filter(
      (sample) => sample.visibility == 'visible',
    ).length;
  }

  async hideAllSamples() {
    for (let sample of this.samples) {
      this.toggleSampleVisibility(sample, 'hidden');
    }
  }
}
