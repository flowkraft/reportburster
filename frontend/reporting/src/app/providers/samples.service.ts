import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ElectronService } from '../core/services/electron/electron.service';
import Utilities from '../helpers/utilities';
import { SettingsService } from './settings.service';

export interface SampleInfo {
  id: string;
  name: string;
  visibility: string;
  jobType: string;
  input: {
    data: string[];
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
  configFilePath: string;
  notes: string;
  recipientType: string;
  documentType: string;
  activeClicked: boolean;
  capReportDistribution: boolean;
  capReportGenerationMailMerge: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class SamplesService {
  constructor(
    protected translateService: TranslateService,
    protected settingsService: SettingsService,
    protected electronService: ElectronService
  ) {}

  countVisibleSamples = -1;

  samples: Array<SampleInfo> = [
    {
      id: 'MONTHLY-PAYSLIPS-SPLIT-ONLY',
      name: '1. Monthly Payslips (split only)',
      visibility: 'visible',
      jobType: 'burst',
      input: {
        data: ['file:samples/burst/Payslips.pdf'],
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
      configFilePath: `${this.electronService.PORTABLE_EXECUTABLE_DIR}/config/samples/burst-pdf-monthly-payslips-split-only/settings.xml`,
      notes: ``,
      recipientType: 'employee',
      documentType: 'payslip',
      capReportDistribution: false,
      capReportGenerationMailMerge: false,
      activeClicked: false,
    },
  ];

  samplesNotYetImplemented: Array<SampleInfo> = [
    ,
    {
      id: 'MERGE-SPLIT-EMAIL-INVOICES',
      name: '2. Customers with One Invoice Each',
      visibility: 'hidden',
      jobType: 'merge-burst',
      input: {
        data: [
          'file:samples/All-Invoices-Oct.pd',
          'file:samples/All-Invoices-Nov.pdf',
          'file:samples/All-Invoices-Dec.pdf',
        ],
        numberOfPages: -1,
        tokens: [],
      },
      step1: 'merge',
      step2: 'split',
      step3: 'email',
      output: {
        data: [
          'email-file-attached:0011.pdf',
          'email-file-attached:0012.pdf',
          'email-file-attached:0013.pdf',
          'email-file-attached:0014.pdf',
          'email-file-attached:0015.pdf',
          'email-file-attached:0016.pdf',
          'email-file-attached:0017.pdf',
          'email-file-attached:0018.pdf',
          'email-file-attached:0019.pdf',
        ],
        folder:
          "output/${input_document_name}/${timestamp?format['yyyy.MM.dd_HH.mm.ss.SSS']}",
      },
      outputHtmlHardcoded: '',
      configFilePath: `${this.electronService.PORTABLE_EXECUTABLE_DIR}/config/samples/customers-with-one-invoice-each-burst-pdf/settings.xml`,
      notes: ``,
      recipientType: 'customer',
      documentType: 'invoice',
      capReportDistribution: false,
      capReportGenerationMailMerge: false,
      activeClicked: false,
    },
    {
      id: 'SPLIT2TIMES-EMAIL-INVOICES',
      name: '3. Customers with Multiple Invoices Each',
      visibility: 'hidden',
      jobType: 'burst',
      step1: 'split',
      step2: 'split',
      step3: 'email',
      input: {
        data: ['file:samples/Split2Times.pdf'],
        numberOfPages: -1,
        tokens: [],
      },
      output: {
        data: [
          'email-files-attached:10.pdf, 9.pdf, 8.pdf and 7.pdf',
          'email-files-attached:6.pdf, 5.pdf and 4.pdf',
          'email-files-attached:3.pdf and 2.pdf',
        ],
        folder:
          "output/${input_document_name}/${timestamp?format['yyyy.MM.dd_HH.mm.ss.SSS']}",
      },
      outputHtmlHardcoded: '',
      configFilePath: `${this.electronService.PORTABLE_EXECUTABLE_DIR}/config/samples/customers-with-multiple-invoices-each-merge-burst-pdf/settings.xml`,
      notes: ``,
      recipientType: 'customer',
      documentType: 'invoices',
      capReportDistribution: false,
      capReportGenerationMailMerge: false,
      activeClicked: false,
    },
    {
      id: 'EXCEL-DISTINCT-SHEETS',
      name: '4. Split Excel File by Distinct Sheets',
      visibility: 'hidden',
      jobType: 'burst',
      step1: 'split',
      step2: '',
      step3: '',
      input: {
        data: ['file:samples/Payslips-Distinct-Sheets.xls'],
        numberOfPages: -1,
        tokens: [
          'clyde.grew@northridgehealth.org',
          'kyle.butford@northridgehealth.org.pdf',
          'alfreda.waldback@northridgehealth.org',
        ],
      },
      output: {
        data: [
          'email-file-attached:clyde.grew@northridgehealth.org.xls',
          'email-file-attached:kyle.butford@northridgehealth.org.xls',
          'email-file-attached:alfreda.waldback@northridgehealth.org.xls',
        ],
        folder:
          "output/${input_document_name}/${timestamp?format['yyyy.MM.dd_HH.mm.ss.SSS']}",
      },
      outputHtmlHardcoded:
        '<i class="fa fa-file-excel-o"></i> clyde.grew@northridgehealth.org.xls<br><i class="fa fa-file-excel-o"></i> kyle.butford@northridgehealth.org.xls<br><i class="fa fa-file-excel-o"></i> alfreda.waldback@northridgehealth.org.xls',
      configFilePath: `${this.electronService.PORTABLE_EXECUTABLE_DIR}/config/samples/excel-split-by-distinct-sheets/settings.xml`,
      notes: ``,
      recipientType: 'employee',
      documentType: 'payslip',
      capReportDistribution: false,
      capReportGenerationMailMerge: false,
      activeClicked: false,
    },
    {
      id: 'EXCEL-DISTINCT-COLUMN-VALUES',
      name: '5. Split Excel File by Distinct Column Values',
      visibility: 'hidden',
      jobType: 'burst',
      step1: 'split',
      step2: '',
      step3: '',
      input: {
        data: ['file:samples/Customers-Distinct-Column-Values.xls'],
        numberOfPages: -1,
        tokens: [],
      },
      output: {
        data: [],
        folder:
          "output/${input_document_name}/${timestamp?format['yyyy.MM.dd_HH.mm.ss.SSS']}",
      },
      outputHtmlHardcoded:
        '<i class="fa fa-file-excel-o"></i> Germany.xls<br><i class="fa fa-file-excel-o"></i> USA.xls<br><i class="fa fa-file-excel-o"></i> UK.xls<br><i class="fa fa-file-excel-o"></i> Australia.xls<br><i class="fa fa-file-excel-o"></i> Canada.xls<br>etc... (separate file containing customer list for each country)',
      configFilePath: `${this.electronService.PORTABLE_EXECUTABLE_DIR}/config/samples/excel-split-by-distinct-column-values/settings.xml`,
      notes: ``,
      recipientType: 'customer',
      documentType: 'invoices',
      capReportDistribution: false,
      capReportGenerationMailMerge: false,
      activeClicked: false,
    },
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
      configFilePath: `${this.electronService.PORTABLE_EXECUTABLE_DIR}/config/samples/monthly-payslips-generate-docx/settings.xml`,
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
      configFilePath: `${this.electronService.PORTABLE_EXECUTABLE_DIR}/config/samples/mail-merge-emails/settings.xml`,
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
      configFilePath: `${this.electronService.PORTABLE_EXECUTABLE_DIR}/config/samples/newsletter-1/settings.xml`,
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
    let inputLabel = inputs[0].replace('file:', '');

    //let inputLabel = inputs[0];

    let inputFileIcon = 'fa-file-pdf-o';
    if (inputLabel.endsWith('.xls')) {
      inputFileIcon = 'fa-file-excel-o';
    } else if (inputLabel.endsWith('.csv')) {
      inputFileIcon = 'fa-file-text-o';
    }

    let inputHtml = `<i class="fa ${inputFileIcon}"></i> ${inputLabel}`;
    if (fullDetails)
      inputHtml = `<i class="fa ${inputFileIcon}"></i> ${this.settingsService.PORTABLE_EXECUTABLE_DIR}/${inputLabel}`;

    for (let index = 1; index < inputs.length; index++) {
      inputLabel = inputs[index].replace('file:', '');
      //inputLabel = inputs[index];
      let currentHtml = `<i class="fa ${inputFileIcon}"></i> ${inputLabel}`;

      if (fullDetails)
        currentHtml = `<i class="fa ${inputFileIcon}"></i> ${this.settingsService.PORTABLE_EXECUTABLE_DIR}/${inputLabel}`;

      inputHtml = `${inputHtml}<br>${currentHtml}`;
    }

    return inputHtml;
  }

  getOutputHtml(id: string, fullDetails?: boolean) {
    const sample = this.samples.find((sample) => sample.id == id);

    console.log(`sample = ${JSON.stringify(sample)}`);

    if (sample.outputHtmlHardcoded) return sample.outputHtmlHardcoded;

    const outputs: string[] = sample.output.data;
    let outputLabel = outputs[0].replace('file:', '');

    let attachmentFileIcon = 'fa-file-pdf-o';
    if (outputLabel.endsWith('.docx')) attachmentFileIcon = 'fa-file-word-o';
    let outputHtml = '';
    if (fullDetails) {
      const inputs: string[] = sample.input.data;
      if (inputs.length == 1) {
        const inputFileName = this.electronService.path.basename(inputs[0]);

        outputHtml = `<strong>Folder</strong><br>${this.settingsService.PORTABLE_EXECUTABLE_DIR}/output/${inputFileName}/\${now?format["yyyy.MM.dd_HH.mm.ss.SSS"]}<br>${outputHtml}`;
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
            return sample.configFilePath.endsWith(configuration.filePath);
          }
        );

        if (sampleConfigurationValues) {
          sample.capReportDistribution =
            sampleConfigurationValues.capReportDistribution;
          sample.capReportGenerationMailMerge =
            sampleConfigurationValues.capReportGenerationMailMerge;
          sample.visibility = sampleConfigurationValues.visibility;
        }

        const notes = await this.translateService.instant(
          `SAMPLES.${sample.id}.NOTES.INNER-HTML`
        );
        sample.notes = notes;
      }

      this.countVisibleSamples = this.samples.filter(
        (sample) => sample.visibility == 'visible'
      ).length;
    }
  }

  async toggleSampleVisibility(sample: SampleInfo, visibility: string) {
    const settingsXmlConfigurationValues =
      await this.settingsService.loadSettingsFileAsync(sample.configFilePath);

    settingsXmlConfigurationValues.documentburster.settings.visibility =
      visibility;

    await this.settingsService.saveSettingsFileAsync(
      settingsXmlConfigurationValues,
      sample.configFilePath
    );

    sample.visibility = visibility;

    const sampleConfiguration = this.settingsService
      .getSampleConfigurations()
      .find((configuration) =>
        sample.configFilePath.endsWith(configuration.filePath)
      );
    sampleConfiguration.visibility = visibility;
    this.countVisibleSamples = this.samples.filter(
      (sample) => sample.visibility == 'visible'
    ).length;
  }

  async hideAllSamples() {
    for (let sample of this.samples) {
      this.toggleSampleVisibility(sample, 'hidden');
    }
  }
}
