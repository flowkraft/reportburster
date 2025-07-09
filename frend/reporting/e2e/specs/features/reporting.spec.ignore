import * as path from 'path';
const slash = require('slash');

import { test } from '@playwright/test';
import { electronBeforeAfterAllTest } from '../../utils/common-setup';
import { Constants } from '../../utils/constants';
import { FluentTester } from '../../helpers/fluent-tester';
import { ConfTemplatesTestHelper } from '../../helpers/areas/conf-templates-test-helper';
import * as PATHS from '../../utils/paths';

//DONE2
test.describe('', async () => {
  /*
  electronBeforeAfterAllTest(
    'should correctly generate DOCX output from DOCX template using CSV as datasource (csv2docx_from_docx_template)',
    async ({ beforeAfterEach: firstPage }) => {
      test.setTimeout(Constants.DELAY_FIVE_THOUSANDS_SECONDS);

      let ft = new FluentTester(firstPage);

      ft = ConfTemplatesTestHelper.createNewTemplate(
        ft,
        'Payslips',
        'enableMailMergeCapability',
      );

      ft = configureAndRunReportGeneration(ft, {
        dataSourceType: 'CSV',
        dataSourceFilePath: '/samples/reports/payslips/Payslips.csv',
        outputType: 'output.docx',
        outputExtension: 'docx',
        templateConfig: {
          useHtmlContent: false,
          templateFileName: 'payslips-template.docx',
        },
      });

      ft = ConfTemplatesTestHelper.deleteTemplate(ft, 'payslips');

      return ft;
    },
  );

  electronBeforeAfterAllTest(
    'should correctly generate HTML output from HTML template using CSV as datasource (csv2html_from_html_template)',
    async ({ beforeAfterEach: firstPage }) => {
      test.setTimeout(Constants.DELAY_FIVE_THOUSANDS_SECONDS);

      let ft = new FluentTester(firstPage);

      ft = ConfTemplatesTestHelper.createNewTemplate(
        ft,
        'Payslips',
        'enableMailMergeCapability',
      );

      ft = configureAndRunReportGeneration(ft, {
        dataSourceType: 'CSV',
        dataSourceFilePath: '/samples/reports/payslips/Payslips.csv',
        outputType: 'output.html',
        outputExtension: 'html',
        templateConfig: {
          useHtmlContent: true,
          templatePath: '/samples/reports/payslips/payslips-template.html',
        },
      });

      ft = ConfTemplatesTestHelper.deleteTemplate(ft, 'payslips');

      return ft;
    },
  );

  electronBeforeAfterAllTest(
    'should correctly generate PDF output from HTML template using CSV as datasource (csv2pdf_from_html_template)',
    async ({ beforeAfterEach: firstPage }) => {
      test.setTimeout(Constants.DELAY_FIVE_THOUSANDS_SECONDS);

      let ft = new FluentTester(firstPage);

      ft = ConfTemplatesTestHelper.createNewTemplate(
        ft,
        'Payslips',
        'enableMailMergeCapability',
      );

      ft = configureAndRunReportGeneration(ft, {
        dataSourceType: 'CSV',
        dataSourceFilePath: '/samples/reports/payslips/Payslips.csv',
        outputType: 'output.pdf',
        outputExtension: 'pdf',
        templateConfig: {
          useHtmlContent: true,
          templatePath: '/samples/reports/payslips/payslips-template.html',
        },
      });

      ft = ConfTemplatesTestHelper.deleteTemplate(ft, 'payslips');

      return ft;
    },
  );

  electronBeforeAfterAllTest(
    'should correctly generate Excel output from HTML template using CSV as datasource (csv2excel_from_html_template)',
    async ({ beforeAfterEach: firstPage }) => {
      test.setTimeout(Constants.DELAY_FIVE_THOUSANDS_SECONDS);

      let ft = new FluentTester(firstPage);

      ft = ConfTemplatesTestHelper.createNewTemplate(
        ft,
        'Payslips',
        'enableMailMergeCapability',
      );

      ft = configureAndRunReportGeneration(ft, {
        dataSourceType: 'CSV',
        dataSourceFilePath: '/samples/reports/payslips/Payslips.csv',
        outputType: 'output.xlsx',
        outputExtension: 'xlsx',
        templateConfig: {
          useHtmlContent: true,
          templatePath:
            '/samples/reports/payslips/payslips-template-excel.html',
        },
      });

      ft = ConfTemplatesTestHelper.deleteTemplate(ft, 'payslips');

      return ft;
    },
  );
  
  electronBeforeAfterAllTest(
    'should correctly generate DOCX output from DOCX template using Excel as datasource (excel2docx_from_docx_template)',
    async ({ beforeAfterEach: firstPage }) => {
      test.setTimeout(Constants.DELAY_FIVE_THOUSANDS_SECONDS);

      let ft = new FluentTester(firstPage);

      ft = ConfTemplatesTestHelper.createNewTemplate(
        ft,
        'Payslips',
        'enableMailMergeCapability',
      );

      ft = configureAndRunReportGeneration(ft, {
        dataSourceType: 'Excel',
        dataSourceFilePath: '/samples/reports/payslips/Payslips.xlsx',
        outputType: 'output.docx',
        outputExtension: 'docx',
        templateConfig: {
          useHtmlContent: false,
          templateFileName: 'payslips-template.docx',
        },
      });

      ft = ConfTemplatesTestHelper.deleteTemplate(ft, 'payslips');

      return ft;
    },
  );
  
  electronBeforeAfterAllTest(
    'should correctly generate HTML output from HTML template using Excel as datasource (excel2html_from_html_template)',
    async ({ beforeAfterEach: firstPage }) => {
      test.setTimeout(Constants.DELAY_FIVE_THOUSANDS_SECONDS);

      let ft = new FluentTester(firstPage);

      ft = ConfTemplatesTestHelper.createNewTemplate(
        ft,
        'Payslips',
        'enableMailMergeCapability',
      );

      ft = configureAndRunReportGeneration(ft, {
        dataSourceType: 'Excel',
        dataSourceFilePath: '/samples/reports/payslips/Payslips.xlsx',
        outputType: 'output.html',
        outputExtension: 'html',
        templateConfig: {
          useHtmlContent: true,
          templatePath: '/samples/reports/payslips/payslips-template.html',
        },
      });

      ft = ConfTemplatesTestHelper.deleteTemplate(ft, 'payslips');

      return ft;
    },
  );

  electronBeforeAfterAllTest(
    'should correctly generate PDF output from HTML template using TSV as datasource (tsv2pdf_from_html_template)',
    async ({ beforeAfterEach: firstPage }) => {
      test.setTimeout(Constants.DELAY_FIVE_THOUSANDS_SECONDS);

      let ft = new FluentTester(firstPage);

      ft = ConfTemplatesTestHelper.createNewTemplate(
        ft,
        'Payslips',
        'enableMailMergeCapability',
      );

      ft = configureAndRunReportGeneration(ft, {
        dataSourceType: 'TSV',
        dataSourceFilePath: '/samples/reports/payslips/Payslips.tab',
        outputType: 'output.pdf',
        outputExtension: 'pdf',
        templateConfig: {
          useHtmlContent: true,
          templatePath: '/samples/reports/payslips/payslips-template.html',
        },
      });

      ft = ConfTemplatesTestHelper.deleteTemplate(ft, 'payslips');

      return ft;
    },
  );

  electronBeforeAfterAllTest(
    'should correctly generate Excel output from HTML template using Fixed Width as datasource (fixedwidth2excel_from_html_template)',
    async ({ beforeAfterEach: firstPage }) => {
      test.setTimeout(Constants.DELAY_FIVE_THOUSANDS_SECONDS);

      let ft = new FluentTester(firstPage);

      ft = ConfTemplatesTestHelper.createNewTemplate(
        ft,
        'Payslips',
        'enableMailMergeCapability',
      );

      ft = configureAndRunReportGeneration(ft, {
        dataSourceType: 'Fixed-Width',
        dataSourceFilePath: '/samples/reports/payslips/Payslips.txt',
        dataSourceConfig: {
          fixedWidthColumnDefinitions:
            'Name, 19\nID, 5\nSSN, 12\nDate, 12\nDepartment, 10\nPosition, 20\nBasicSalary, 6\nBonuses, 6\nFederalTax, 6\nSocialTax, 6\nMedicareTax, 6\nStateTax, 6\nMedical, 6\nDental, 6\nTotalEarnings, 6\nTotalDeductions, 6\nNetPay, 6\nEmail, 40',
        },
        outputType: 'output.xlsx',
        outputExtension: 'xlsx',
        templateConfig: {
          useHtmlContent: true,
          templatePath:
            '/samples/reports/payslips/payslips-template-excel.html',
        },
      });

      ft = ConfTemplatesTestHelper.deleteTemplate(ft, 'payslips');

      return ft;
    },
  );

*/
});

function configureAndRunReportGeneration(
  ft: FluentTester,
  params: {
    dataSourceType: 'CSV' | 'TSV' | 'Excel' | 'Fixed-Width';
    dataSourceFilePath: string;
    outputType: string;
    outputExtension: string;
    templateConfig: {
      useHtmlContent: boolean;
      templatePath?: string;
      templateFileName?: string;
    };
    dataSourceConfig?: {
      fixedWidthColumnDefinitions?: string;
    };
  },
): FluentTester {
  // Configure reporting settings
  ft = ft
    .gotoConfiguration()
    .click(`#topMenuConfigurationLoad_payslips_${PATHS.SETTINGS_CONFIG_FILE}`)
    .click('#leftMenuReportingSettings')
    .waitOnElementToBecomeVisible('#dsTypes');

  // Set data source type based on type parameter
  switch (params.dataSourceType) {
    case 'Excel':
      ft = ft.dropDownSelectOptionHavingValue('#dsTypes', 'ds.excelfile');
      break;
    case 'TSV':
      ft = ft.dropDownSelectOptionHavingValue('#dsTypes', 'ds.tsvfile');
      break;
    case 'Fixed-Width':
      ft = ft.dropDownSelectOptionHavingValue('#dsTypes', 'ds.fixedwidthfile');
      // For Fixed Width, configure column definitions if provided
      if (params.dataSourceConfig?.fixedWidthColumnDefinitions) {
        ft = ft.setValue(
          '#fixedWidthColumns',
          params.dataSourceConfig.fixedWidthColumnDefinitions,
        );
      }
      break;
    // CSV is default, no need for explicit case
  }

  // Configure output type and template
  ft = ft
    .sleep(Constants.DELAY_ONE_SECOND)
    .click('#reportingTemplateOutputTab-link')
    .waitOnElementToBecomeVisible('#reportOutputType')
    .dropDownSelectOptionHavingValue('#reportOutputType', params.outputType);

  // Handle template configuration based on type
  if (params.templateConfig.useHtmlContent) {
    ft = ft
      .waitOnElementToBecomeVisible('#codeJarHtmlTemplateEditor')
      .setCodeJarContentFromFile(
        '#codeJarHtmlTemplateEditor',
        slash(
          path.resolve(
            process.env.PORTABLE_EXECUTABLE_DIR +
              params.templateConfig.templatePath,
          ),
        ),
      );
  } else {
    ft = ft
      .waitOnElementToBecomeVisible('#reportTemplateContainer')
      .waitOnElementToBecomeVisible('#selectTemplateFile')
      .waitOnElementToContainText(
        '#selectTemplateFile',
        params.templateConfig.templateFileName,
      );
    //.waitOnElementWithTextToBecomeVisible(
    //  params.templateConfig.templateFileName,
    //);
  }

  // Run report generation
  ft = ft
    //.waitOnElementWithTextToBecomeVisible('Saved')
    .sleep(Constants.DELAY_ONE_SECOND)
    .gotoReportGenerationScreen()
    .click('#selectMailMergeClassicReport')
    .waitOnElementToBecomeVisible(
      `span.ng-option-label:has-text("Payslips (input ${params.dataSourceType})")`,
    )
    .click(
      `span.ng-option-label:has-text("Payslips (input ${params.dataSourceType})")`,
    )
    .waitOnElementToBecomeVisible('#browseMailMergeClassicReportInputFile')
    .setInputFiles(
      '#reportingFileUploadInput',
      slash(
        path.resolve(
          process.env.PORTABLE_EXECUTABLE_DIR + params.dataSourceFilePath,
        ),
      ),
    )
    .click('#btnGenerateReports')
    .clickYesDoThis()
    .waitOnProcessingToStart(Constants.CHECK_PROCESSING_JAVA)
    .waitOnProcessingToFinish(Constants.CHECK_PROCESSING_LOGS)
    .processingShouldHaveGeneratedOutputFiles(
      [
        '0.' + params.outputExtension,
        '1.' + params.outputExtension,
        '2.' + params.outputExtension,
      ],
      params.outputExtension,
    )
    .appStatusShouldBeGreatNoErrorsNoWarnings();

  return ft;
}
