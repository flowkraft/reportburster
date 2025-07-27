import * as path from 'path';
const slash = require('slash');

import { test } from '@playwright/test';
import { electronBeforeAfterAllTest } from '../../utils/common-setup';
import { Constants } from '../../utils/constants';
import { FluentTester } from '../../helpers/fluent-tester';
import { ConfTemplatesTestHelper } from '../../helpers/areas/conf-templates-test-helper';
import * as PATHS from '../../utils/paths';
import { siEightsleep } from 'simple-icons';
import _ from 'lodash';
import { ConnectionsTestHelper } from '../../helpers/areas/connections-test-helper';

const dataSourceTypeDisplayMap: Record<string, string> = {
  'ds.sqlquery': 'SQL Query',
  'ds.scriptfile': 'Script File',
  'ds.xmlfile': 'XML',
  'ds.csvfile': 'CSV',
  'ds.tsvfile': 'TSV',
  'ds.fixedwidthfile': 'Fixed-Width',
  'ds.excelfile': 'Excel',
  // add more if needed
};

//DONE2
test.describe('', async () => {

  // --- XML Data Source Test ---
  electronBeforeAfterAllTest(
    'should generate Freemarker XML report from XML datasource',
    async ({ beforeAfterEach: firstPage }) => {
      test.setTimeout(Constants.DELAY_FIVE_THOUSANDS_SECONDS);
      let ft = new FluentTester(firstPage);
      ft = ConfTemplatesTestHelper.createNewTemplate(ft, 'Payslips', 'enableMailMergeCapability');

      ft = configureAndRunReportGeneration(ft, {
        dataSourceType: 'ds.xmlfile',
        dataSourceFilePath: '/samples/reports/payslips/Payslips.xml',
        outputType: 'output.any',
        outputExtension: 'xml',
        templateConfig: {
          useHtmlContent: true,
          templatePath: '/samples/reports/payslips/payslips-template-xml.ftl',
        },
        dataSourceConfig: {
          xmlRepeatingNodeXPath: '/payslips/payslip',
        },
      });

      ft = ConfTemplatesTestHelper.deleteTemplate(ft, 'payslips');
      return ft;
    },
  );



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
          dataSourceType: 'ds.csvfile',
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
          dataSourceType: 'ds.csvfile',
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
          dataSourceType: 'ds.csvfile',
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
          dataSourceType: 'ds.csvfile',
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
          dataSourceType: 'ds.excelfile',
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
          dataSourceType: 'ds.excelfile',
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
          dataSourceType: 'ds.tsvfile',
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
          dataSourceType: 'ds.fixedwidthfile',
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

function configureAndRunReportGeneration2(
  ft: FluentTester,
  testName: string,
  params: {
    dataSourceType: 'ds.sqlquery' | 'ds.scriptfile';
    dataSourceFilePath?: string;
    dbConnectionType?: 'dbcon-plain-schema-only' | 'dbcon-domaingrouped-schema' | 'dbcon-all-features';
    dbConnections?: { connectionName: string, dbConnectionType: 'dbcon-no-schema' | 'dbcon-plain-schema-only' | 'dbcon-domaingrouped-schema' | 'dbcon-all-features', defaultDbConnection: boolean }[];
    outputType: string;
    outputExtension: string;
    templateConfig: {
      useHtmlContent: boolean;
      templatePath?: string;
      templateFileName?: string;
      templateContent?: string;
    };
    dataSourceConfig?: {
      sqlQuery?: string;
      groovyScript?: string;
      reportParametersScript?: string;
      testViewData?: boolean;
      showFileExplorer?: boolean;
      transformationScript?: string;
    };
    exerciseAiButtons?: {
      sql?: boolean;
      script?: boolean;
      transformation?: boolean;
    };
  },
): FluentTester {

  const IDS = {
    'ds.sqlquery': {
      aiHelp: '#btnHelpWithSqlQueryAI',
      test: '#btnTestSqlQuery',
      codeEditor: '#sqlQueryEditor',
      paramsTab: '#tabSqlReportParameters-link',
      codeTab: '#tabSqlCode-link',
      prompt1: 'You are an expert SQL Developer',
      prompt2TableNameProducts: '"tableName": "Products"',
      prompt3ColumnNameDiscontinued: '"columnName": "Discontinued"',
      prompt4TableNameOrders: '"tableName": "Orders"',
      prompt5TableNameOrderDetails: '"tableName": "Order Details"',
    },
    'ds.scriptfile': {
      aiHelp: '#btnHelpWithScriptAI',
      test: '#btnTestScript',
      codeEditor: '#groovyScriptEditor',
      paramsTab: '#tabScriptReportParameters-link',
      codeTab: '#tabScriptCode-link',
      prompt1: 'You are an expert Groovy Developer',
      prompt2TableNameProducts: 'write a complete Groovy script',
      prompt3ColumnNameDiscontinued: 'This script will be used as the "Input Source" for a report',
      prompt4TableNameOrders: 'CRITICAL INSTRUCTIONS',
      prompt5TableNameOrderDetails: 'Golden Rules',
    }

  };

  const ids = IDS[params.dataSourceType];

  ft = ft
    .gotoConfiguration()
    .click(`#topMenuConfigurationLoad_${_.kebabCase(testName)}_${PATHS.SETTINGS_CONFIG_FILE}`)
    .waitOnElementToBecomeVisible('#leftMenuReportingSettings')
    .waitOnElementToBecomeEnabled('#leftMenuReportingSettings')
    .sleep(3 * Constants.DELAY_ONE_SECOND)
    .click('#leftMenuReportingSettings')
    .waitOnElementToBecomeVisible('#dsTypes')
    .waitOnElementToBecomeEnabled('#dsTypes');

  // Set data source type based on type parameter
  switch (params.dataSourceType) {
    case 'ds.sqlquery':
      ft = ft.dropDownSelectOptionHavingValue('#dsTypes', 'ds.sqlquery');
      if (params.dataSourceConfig?.sqlQuery) {
        ft = ft
          .waitOnElementToBecomeVisible(ids.codeEditor)
          .setCodeJarContentSingleShot(ids.codeEditor, params.dataSourceConfig.sqlQuery);
      }
      break;
    case 'ds.scriptfile':
      ft = ft.dropDownSelectOptionHavingValue('#dsTypes', 'ds.scriptfile');
      if (params.dataSourceConfig?.groovyScript) {
        ft = ft
          .waitOnElementToBecomeVisible(ids.codeEditor)
          .setCodeJarContentSingleShot(
            ids.codeEditor,
            params.dataSourceConfig.groovyScript,
          );
      }
      break;
    // CSV is default, no need for explicit case
  }

  if (['ds.sqlquery', 'ds.scriptfile'].includes(params.dataSourceType)) {

    ft = ft.waitOnElementToContainText('#databaseConnection', '(default)');

    let shouldExerciseAiButtons = params.exerciseAiButtons?.sql || params.exerciseAiButtons?.script;
    if (shouldExerciseAiButtons) {

      for (const dbConnection of params.dbConnections || []) {

        if (dbConnection.defaultDbConnection) {
          ft = ft.waitOnElementToContainText('#databaseConnection', dbConnection.connectionName);
          ft = ft.waitOnElementToBecomeEnabled(ids.aiHelp);
          ft = ft.click(ids.aiHelp);

          if (params.dataSourceType === 'ds.sqlquery') {
            ft = ft.waitOnElementToBecomeVisible('#btnTestDbConnectionDbSchema');
            ft = ft.waitOnElementToBecomeEnabled('#btnTestDbConnectionDbSchema');

            ft = ft.click('#btnTestDbConnectionDbSchema');

            ft = ft.waitOnElementToBecomeVisible('#btnTestDbConnection');
            ft = ft.waitOnElementToBecomeEnabled('#btnTestDbConnection');

            ft = ft.click('#btnTestDbConnection')
              .infoDialogShouldBeVisible()
              .clickYesDoThis()
              .click('#btnClearLogsDbConnection')
              .confirmDialogShouldBeVisible()
              .clickYesDoThis()
              .waitOnElementToBecomeDisabled('#btnClearLogsDbConnection')
              .waitOnElementToBecomeVisible('#btnGreatNoErrorsNoWarnings')
              .appStatusShouldBeGreatNoErrorsNoWarnings()
              .click('#btnTestDbConnection')
              .confirmDialogShouldBeVisible()
              .clickYesDoThis()
              .waitOnToastToBecomeVisible(
                'success',
                'Successfully connected to the database', Constants.DELAY_HUNDRED_SECONDS
              )

            ft = ft.click('#databaseSchemaTab-link')
              .waitOnElementToBecomeInvisible('#btnTestDbConnectionDbSchema')
              .waitOnElementToBecomeVisible('#databaseSchemaPicklistContainer')
              .waitOnElementToBecomeEnabled(
                '#btnCloseDbConnectionModal',
              )
              .waitOnElementToBecomeVisible('#btnGenerateWithAIDbSchema')
              .elementShouldBeDisabled('#btnGenerateWithAIDbSchema') //because no tables are selected yet 
              .click('#treeNodeCategoriessourceTreedatabaseSchemaPicklist')
              .click('#treeNodeProductssourceTreedatabaseSchemaPicklist')
              .click('#btnMoveToTargetdatabaseSchemaPicklist')
              .waitOnElementToBecomeInvisible('#chooseTableLabelDbSchema')
              .waitOnElementToBecomeEnabled('#btnGenerateWithAIDbSchema')
              .click('#btnGenerateWithAIDbSchema')
          }

          ft = ft.waitOnElementToBecomeVisible('#btnCopyPromptText')
            .click('#btnCopyPromptText')
            .waitOnElementToBecomeVisible('.dburst-button-question-confirm')
            .click('.dburst-button-question-confirm')
            .waitOnElementToBecomeInvisible('.dburst-button-question-confirm')
            .clipboardShouldContainText(ids.prompt1)
            .clipboardShouldContainText(ids.prompt2TableNameProducts)
            .clipboardShouldContainText(ids.prompt3ColumnNameDiscontinued)
            .click('#btnCloseAiCopilotModal')
            .waitOnElementToBecomeInvisible('#btnCopyPromptText');

          if (params.dataSourceType === 'ds.sqlquery') ft = ft.click('#btnCloseDbConnectionModal');

        } else {

          ft = ft.dropDownSelectOptionHavingLabel('#databaseConnection', dbConnection.connectionName);
          ft = ft.waitOnElementToContainText('#databaseConnection', dbConnection.connectionName);
          ft = ft.waitOnElementToBecomeEnabled(ids.aiHelp);
          ft = ft.click(ids.aiHelp);

          if (dbConnection.dbConnectionType === 'dbcon-plain-schema-only') {

            if (params.dataSourceType === 'ds.sqlquery') {
              ft = ft.waitOnElementToBecomeVisible('#databaseSchemaPicklistContainer')
                .waitOnElementToBecomeEnabled(
                  '#btnCloseDbConnectionModal',
                )
                .waitOnElementToBecomeVisible('#btnGenerateWithAIDbSchema')
                .elementShouldBeDisabled('#btnGenerateWithAIDbSchema') //because no tables are selected yet 
                .click('#treeNodeCategoriessourceTreedatabaseSchemaPicklist')
                .click('#treeNodeProductssourceTreedatabaseSchemaPicklist')
                .click('#btnMoveToTargetdatabaseSchemaPicklist')
                .waitOnElementToBecomeInvisible('#chooseTableLabelDbSchema')
                .waitOnElementToBecomeEnabled('#btnGenerateWithAIDbSchema')
                .click('#btnGenerateWithAIDbSchema');
            }
            ft = ft.waitOnElementToBecomeVisible('#btnCopyPromptText')
              .click('#btnCopyPromptText')
              .waitOnElementToBecomeVisible('.dburst-button-question-confirm')
              .click('.dburst-button-question-confirm')
              .waitOnElementToBecomeInvisible('.dburst-button-question-confirm')
              .clipboardShouldContainText(ids.prompt1)
              .clipboardShouldContainText(ids.prompt2TableNameProducts)
              .clipboardShouldContainText(ids.prompt3ColumnNameDiscontinued)
              .click('#btnCloseAiCopilotModal')
              .waitOnElementToBecomeInvisible('#btnCopyPromptText');
            if (params.dataSourceType === 'ds.sqlquery') ft.click('#btnCloseDbConnectionModal');

          }
          else if (dbConnection.dbConnectionType === 'dbcon-domaingrouped-schema') {

            if (params.dataSourceType === 'ds.sqlquery') {
              ft = ft.waitOnElementToBecomeVisible('#domainGroupedSchemaPicklist')
                .waitOnElementToBecomeVisible('#chooseTableLabelDomainGroupedSchema')
                .waitOnElementToBecomeEnabled(
                  '#btnCloseDbConnectionModal',
                )
                .elementShouldNotBeVisible('#btnToggleDomainGroupedCodeView')
                .elementShouldNotBeVisible('#btnGenerateWithAIDomainGroupedSchema')
                .elementShouldBeDisabled('#btnGenerateSqlQueryWithAIDomainGroupedSchema')
                .click('#treeNodedomain_SalessourceTreedomainGroupedSchemaPicklist') // select "Sales" group
                .click('#btnMoveToTargetdomainGroupedSchemaPicklist')
                .waitOnElementToBecomeInvisible('#chooseTableLabelDomainGroupedSchema')
                .waitOnElementToBecomeEnabled('#btnGenerateSqlQueryWithAIDomainGroupedSchema')
                .click('#btnGenerateSqlQueryWithAIDomainGroupedSchema')
            }
            ft = ft.waitOnElementToBecomeVisible('#btnCopyPromptText')
              .click('#btnCopyPromptText')
              .waitOnElementToBecomeVisible('.dburst-button-question-confirm')
              .click('.dburst-button-question-confirm')
              .waitOnElementToBecomeInvisible('.dburst-button-question-confirm')
              .clipboardShouldContainText(ids.prompt1)
              .clipboardShouldContainText(ids.prompt4TableNameOrders)
              .clipboardShouldContainText(ids.prompt5TableNameOrderDetails)
              .click('#btnCloseAiCopilotModal')
              .waitOnElementToBecomeInvisible('#btnCopyPromptText');

            if (params.dataSourceType === 'ds.sqlquery') {
              ft = ft.click('#databaseSchemaTab-link')
                .waitOnElementToBecomeVisible('#databaseSchemaPicklistContainer')
                //.waitOnElementToBecomeVisible('#btnRefreshDatabaseSchema')
                .click('#btnCloseDbConnectionModal');
            }

          } else if (dbConnection.dbConnectionType === 'dbcon-all-features') {

            if (params.dataSourceType === 'ds.sqlquery') {
              ft = ft.waitOnElementToBecomeVisible('#domainGroupedSchemaPicklist')
                .waitOnElementToBecomeVisible('#chooseTableLabelDomainGroupedSchema')
                .waitOnElementToBecomeEnabled(
                  '#btnCloseDbConnectionModal',
                )
                .elementShouldNotBeVisible('#btnToggleDomainGroupedCodeView')
                .elementShouldBeDisabled('#btnGenerateSqlQueryWithAIDomainGroupedSchema')
                .click('#treeNodedomain_SalessourceTreedomainGroupedSchemaPicklist') // select "Sales" group
                .click('#btnMoveToTargetdomainGroupedSchemaPicklist')
                .waitOnElementToBecomeInvisible('#chooseTableLabelDomainGroupedSchema')
                .waitOnElementToBecomeEnabled('#btnGenerateSqlQueryWithAIDomainGroupedSchema')
                .click('#btnGenerateSqlQueryWithAIDomainGroupedSchema')
            }

            ft = ft.waitOnElementToBecomeVisible('#btnCopyPromptText')
              .click('#btnCopyPromptText')
              .waitOnElementToBecomeVisible('.dburst-button-question-confirm')
              .click('.dburst-button-question-confirm')
              .waitOnElementToBecomeInvisible('.dburst-button-question-confirm')
              .clipboardShouldContainText(ids.prompt1)
              .clipboardShouldContainText(ids.prompt4TableNameOrders)
              .clipboardShouldContainText(ids.prompt5TableNameOrderDetails)
              .click('#btnCloseAiCopilotModal')
              .waitOnElementToBecomeInvisible('#btnCopyPromptText')


            if (params.dataSourceType === 'ds.sqlquery') {
              ft = ft.waitOnElementToBecomeEnabled('#databaseSchemaTab-link')
                .click('#databaseSchemaTab-link')
                .waitOnElementToBecomeVisible('#databaseSchemaPicklistContainer')
                //.waitOnElementToBecomeVisible('#btnRefreshDatabaseSchema')
                .waitOnElementToBecomeEnabled('#connectionDetailsTab-link')
                .waitOnElementToBecomeEnabled('#databaseDiagramTab-link')
                .waitOnElementToBecomeEnabled('#databaseUbiquitousLanguageTab-link')
                .waitOnElementToBecomeEnabled('#toolsTab-link')
                .click('#connectionDetailsTab-link')
                .waitOnElementToBecomeVisible('#btnTestDbConnection')
                .click('#databaseDiagramTab-link')
                .waitOnElementToBecomeVisible('#plantUmlDiagram')
                .waitOnElementToBecomeEnabled('#btnDatabaseDiagramViewInBrowserLink')
                .elementShouldNotBeVisible('#btnDatabaseDiagramShowCode')
                .elementShouldNotBeVisible('#btnGenerateWithAIErDiagram')
                .click('#databaseUbiquitousLanguageTab-link')
                .waitOnElementToBecomeVisible('#ubiquitousLanguageViewer')
                .elementShouldNotBeVisible('#noUbiquitousLanguageContentInfo')
                .elementShouldNotBeVisible('#btnUbiquitousLanguageStartEditing')
                .elementShouldNotBeVisible('#ubiquitousLanguageEditor')
                .click('#toolsTab-link')
                .waitOnElementToBecomeEnabled('#btnToggleVannaAi')
                .waitOnElementToBecomeVisible('#btnChatWithDb')
                .elementShouldBeDisabled('#btnChatWithDb')
                .elementShouldNotBeVisible('#schemaNotLoadedChat2DB')
                .elementShouldNotBeVisible('#btnGenerateVannaTrainingPlan')
                .elementShouldNotBeVisible('#btnTrainVannaAi')

                .elementShouldNotBeVisible('#vannaTrainingIncludeDbSchema')
                .elementShouldNotBeVisible('#vannaTrainingIncludeDomainGroupedSchema')
                .elementShouldNotBeVisible('#vannaTrainingIncludeErDiagram')
                .elementShouldNotBeVisible('#vannaTrainingIncludeUbiquitousLanguage')

                .click('#btnCloseDbConnectionModal');
            }

          }

        }

      }

    }

  }

  if (params.dataSourceConfig?.reportParametersScript) {
    ft = ft
      .waitOnElementToBecomeEnabled(ids.paramsTab)
      .click(ids.paramsTab) // Use dynamic tab ID
      .sleep(Constants.DELAY_ONE_SECOND) // Wait for the tab to be ready
      .waitOnElementToBecomeVisible('#paramsSpecEditor')
      .setCodeJarContentSingleShot('#paramsSpecEditor', params.dataSourceConfig.reportParametersScript).sleep(Constants.DELAY_ONE_SECOND)
      .click(ids.codeTab)
      .waitOnElementToBecomeVisible(ids.codeEditor)
      .sleep(Constants.DELAY_ONE_SECOND); // Switch back to code tab;
  }


  // Configure transformation script if provided

  if (params.dataSourceConfig?.transformationScript) {
    ft = ft
      .click('#lblShowAdditionalTransformation')
      .waitOnElementToBecomeVisible('#transformationCodeEditor')
      .setCodeJarContentSingleShot('#transformationCodeEditor', params.dataSourceConfig.transformationScript).sleep(Constants.DELAY_ONE_SECOND);
  }

  if (params.exerciseAiButtons?.transformation) {
    ft = ft.waitOnElementToBecomeVisible('#btnHelpWithTransformationAI').click('#btnHelpWithTransformationAI');

    ft = ft.waitOnElementToBecomeVisible('#btnCloseAiCopilotModal').waitOnElementToBecomeVisible('#btnCloseAiCopilotModal')
      .pageShouldContainText('Your task is to write a complete Groovy script that performs **additional data transformation**')
      .click('#btnCloseAiCopilotModal')
      .waitOnElementToBecomeInvisible('#btnCloseAiCopilotModal');

  }

  if (['ds.sqlquery', 'ds.scriptfile'].includes(params.dataSourceType)) {
    ft = ft
      .waitOnElementToBecomeVisible(ids.test)
      .click(ids.test)
      .infoDialogShouldBeVisible()
      .clickYesDoThis()
      .click('#btnClearLogs')
      .confirmDialogShouldBeVisible()
      .clickYesDoThis()
      .waitOnElementToBecomeDisabled('#btnClearLogs')
      .waitOnElementToBecomeVisible('#btnGreatNoErrorsNoWarnings')
      .appStatusShouldBeGreatNoErrorsNoWarnings()
      .click(ids.test)
      .confirmDialogShouldBeVisible()
      .clickYesDoThis()
      .waitOnElementToBecomeVisible('#formReportParameters')
      .waitOnElementToBecomeVisible('#btnTestQueryRun')
      .setValue('#startDate', '1991-01-01')
      .waitOnElementToBecomeEnabled('#btnTestQueryRun')
      .click('#btnTestQueryRun')
      .waitOnToastToBecomeVisible(
        'success',
        'SQL query executed successfully, go to the Tabulator', Constants.DELAY_HUNDRED_SECONDS
      )

      .waitOnElementToBecomeVisible('#reportingTabulatorTab-link')
      .click('#reportingTabulatorTab-link')
      .waitOnTabulatorToBecomeVisible()
      .waitOnTabulatorToHaveRowCount(1)
      .tabulatorCellShouldHaveText(0, "FirstName", "Andrew")
      .tabulatorCellShouldHaveText(0, "LastName", "Fuller")
      .tabulatorCellShouldHaveText(0, "HireDate", "1992-08-14")
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
      .sleep(3 * Constants.DELAY_ONE_SECOND);

    if (params.templateConfig.templatePath)
      ft = ft.setCodeJarContentFromFile(
        '#codeJarHtmlTemplateEditor',
        slash(
          path.resolve(
            process.env.PORTABLE_EXECUTABLE_DIR +
            params.templateConfig.templatePath,
          ),
        ),
      );

    if (params.templateConfig.templateContent)
      ft = ft.setCodeJarContentSingleShot(
        '#codeJarHtmlTemplateEditor',
        params.templateConfig.templateContent,
      );
  }

  const displayType = dataSourceTypeDisplayMap[params.dataSourceType];

  // Run report generation
  ft = ft
    .sleep(3 * Constants.DELAY_ONE_SECOND)
    .gotoReportGenerationScreen()
    .click('#selectMailMergeClassicReport')
    .waitOnElementToBecomeVisible(
      `span.ng-option-label:has-text("${testName} (input ${displayType})")`,
    )
    .click(
      `span.ng-option-label:has-text("${testName} (input ${displayType})")`,
    );


  if (params.dataSourceConfig.reportParametersScript && params.dataSourceConfig.reportParametersScript.includes('startDate')) {
    ft = ft
      .waitOnElementToBecomeEnabled('#startDate')
      .setValue('#startDate', '1991-01-01')
      .waitOnElementToBecomeEnabled('#btnViewData')
      .waitOnElementToBecomeEnabled('#btnGenerateReports');
  }

  // Test "View Data" for SQL and Script if requested
  if (params.dataSourceConfig?.testViewData) {
    ft = ft
      .waitOnElementToBecomeVisible('#btnViewData')
      .click('#btnViewData')
      .confirmDialogShouldBeVisible()
      .clickYesDoThis()
      .waitOnToastToBecomeVisible(
        'success',
        'SQL query executed successfully', Constants.DELAY_HUNDRED_SECONDS
      )
      .waitOnTabulatorToBecomeVisible()
      .waitOnTabulatorToHaveRowCount(1)
      .tabulatorCellShouldHaveText(0, "FirstName", "Andrew")
      .tabulatorCellShouldHaveText(0, "LastName", "Fuller")
      .tabulatorCellShouldHaveText(0, "HireDate", "1992-08-14");
  }

  ft = ft
    .click('#btnGenerateReports')
    .clickYesDoThis()
    .waitOnProcessingToStart(Constants.CHECK_PROCESSING_JAVA)
    .waitOnProcessingToFinish(Constants.CHECK_PROCESSING_LOGS);

  if (params.outputType === 'output.fop2pdf') {
    ft = ft
      .processingShouldHaveGeneratedNFilesHavingSuffix(
        1,
        '.pdf',
      )
  } else {
    ft = ft
      .processingShouldHaveGeneratedNFilesHavingSuffix(
        1,
        params.outputExtension,
      )
  }

  ft = ft.appStatusShouldBeGreatNoErrorsNoWarnings();

  return ft;

}


function configureAndRunReportGeneration(
  ft: FluentTester,
  params: {
    dataSourceType: 'ds.csvfile' | 'ds.tsvfile' | 'ds.excelfile' | 'ds.fixedwidthfile' | 'ds.xmlfile';
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
      xmlRepeatingNodeXPath?: string;
    };
  },
): FluentTester {
  // Configure reporting settings
  ft = ft
    .gotoConfiguration()
    .click(`#topMenuConfigurationLoad_payslips_${PATHS.SETTINGS_CONFIG_FILE}`)
    .waitOnElementToBecomeVisible('#leftMenuReportingSettings')
    .waitOnElementToBecomeEnabled('#leftMenuReportingSettings')
    .sleep(3 * Constants.DELAY_ONE_SECOND)
    .click('#leftMenuReportingSettings')
    .waitOnElementToBecomeVisible('#dsTypes')
    .waitOnElementToBecomeEnabled('#dsTypes');

  // Set data source type based on type parameter
  switch (params.dataSourceType) {
    case 'ds.excelfile':
      ft = ft.dropDownSelectOptionHavingValue('#dsTypes', 'ds.excelfile');
      break;
    case 'ds.tsvfile':
      ft = ft.dropDownSelectOptionHavingValue('#dsTypes', 'ds.tsvfile');
      break;
    case 'ds.fixedwidthfile':
      ft = ft.dropDownSelectOptionHavingValue('#dsTypes', 'ds.fixedwidthfile');
      // For Fixed Width, configure column definitions if provided
      if (params.dataSourceConfig?.fixedWidthColumnDefinitions) {
        ft = ft.setValue(
          '#fixedWidthColumns',
          params.dataSourceConfig.fixedWidthColumnDefinitions,
        );
      }
      break;
    case 'ds.xmlfile':
      ft = ft.dropDownSelectOptionHavingValue('#dsTypes', 'ds.xmlfile');
      if (params.dataSourceConfig?.xmlRepeatingNodeXPath) {
        ft = ft.setValue(
          '#xmlRepeatingNodeXPath',
          params.dataSourceConfig.xmlRepeatingNodeXPath,
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
    .dropDownSelectOptionHavingValue('#reportOutputType', params.outputType)
    .sleep(3 * Constants.DELAY_ONE_SECOND);

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

  const displayType = dataSourceTypeDisplayMap[params.dataSourceType];

  // Run report generation
  ft = ft
    //.waitOnElementWithTextToBecomeVisible('Saved')
    .sleep(3 * Constants.DELAY_ONE_SECOND)
    .gotoReportGenerationScreen()
    .click('#selectMailMergeClassicReport')
    .waitOnElementToBecomeVisible(
      `span.ng-option-label:has-text("Payslips (input ${displayType})")`,
    )
    .click(
      `span.ng-option-label:has-text("Payslips (input ${displayType})")`,
    )
    .waitOnElementToBecomeVisible('#browseMailMergeClassicReportInputFile')
    .sleep(3 * Constants.DELAY_ONE_SECOND)
    .setInputFiles(
      '#reportingFileUploadInput',
      slash(
        path.resolve(
          process.env.PORTABLE_EXECUTABLE_DIR + params.dataSourceFilePath,
        ),
      ),
    )
    .sleep(Constants.DELAY_ONE_SECOND)
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

function createDbConnection(
  ft: FluentTester,
  testName: string,
  dbConnectionType: 'dbcon-no-schema' | 'dbcon-plain-schema-only' | 'dbcon-domaingrouped-schema' | 'dbcon-all-features' = 'dbcon-no-schema',
  dbVendor: string = 'sqlite',
  clearLogs: boolean = true,
): { ft: FluentTester, connectionName: string, dbConnectionType: 'dbcon-no-schema' | 'dbcon-plain-schema-only' | 'dbcon-domaingrouped-schema' | 'dbcon-all-features' } {
  const connectionName = `${testName}-${dbVendor}-${dbConnectionType}`;

  // Create base connection
  ft = ConnectionsTestHelper.createAndAssertNewDatabaseConnection(
    ft,
    connectionName,
    dbVendor
  );


  if (
    dbConnectionType !== 'dbcon-no-schema') {

    ft = ft
      .clickAndSelectTableRow(`#db-${_.kebabCase(connectionName)}\\.xml`)
      .waitOnElementToBecomeEnabled('#btnEdit')
      .click('#btnEdit')
      .waitOnElementToBecomeEnabled('#btnTestDbConnection')
      .click('#btnTestDbConnection');

    if (clearLogs) {

      ft = ft.infoDialogShouldBeVisible()
        .clickYesDoThis()
        .click('#btnClearLogsDbConnection')
        .confirmDialogShouldBeVisible()
        .clickYesDoThis()
        .waitOnElementToBecomeVisible('#btnGreatNoErrorsNoWarnings')
        .appStatusShouldBeGreatNoErrorsNoWarnings()
        .click('#btnTestDbConnection')
    }

    ft = ft.confirmDialogShouldBeVisible()
      .clickYesDoThis()
      .waitOnToastToBecomeVisible(
        'success',
        'Successfully connected to the database', Constants.DELAY_HUNDRED_SECONDS
      )

  }

  // Add Domain Grouped Schema if needed
  if (
    dbConnectionType === 'dbcon-domaingrouped-schema' || dbConnectionType === 'dbcon-all-features'
  ) {
    ft = ft
      .waitOnElementToBecomeVisible('#domainGroupedDatabaseSchemaTab-link')
      .click('#domainGroupedDatabaseSchemaTab-link') // Ensure the tab is active
      .waitOnElementToBecomeInvisible(
        'span:has-text("To load the schema, please ensure your connection details are configured")',
      )
      .waitOnElementToBecomeVisible('#btnToggleDomainGroupedCodeView')
      .click('#btnToggleDomainGroupedCodeView')
      .waitOnElementToBecomeVisible('#domainGroupedCodeEditor')
      .setCodeJarContentSingleShot(
        '#domainGroupedCodeEditor',
        JSON.stringify({
          domainGroups: [
            {
              label: "Sales",
              tables: [
                {
                  tableName: "Orders",
                  columns: [
                    { name: "OrderID" },
                    { name: "CustomerID" },
                    { name: "OrderDate" }
                  ]
                },
                {
                  tableName: "Order Details",
                  columns: [
                    { name: "OrderID" },
                    { name: "ProductID" },
                    { name: "Quantity" }
                  ]
                }
              ]
            },
            {
              label: "Products",
              tables: [
                {
                  tableName: "Products",
                  columns: [
                    { name: "ProductID" },
                    { name: "ProductName" },
                    { name: "SupplierID" },
                    { name: "CategoryID" }
                  ]
                },
                {
                  tableName: "Categories",
                  columns: [
                    { name: "CategoryID" },
                    { name: "CategoryName" }
                  ]
                }
              ]
            },
            {
              label: "Customers",
              tables: [
                {
                  tableName: "Customers",
                  columns: [
                    { name: "CustomerID" },
                    { name: "CompanyName" },
                    { name: "ContactName" }
                  ]
                }
              ]
            }
          ]
        }, null, 2)
      )
      .click('#btnToggleDomainGroupedCodeView')
      .waitOnElementToBecomeVisible('#domainGroupedSchemaPicklist');
  }

  // Add all features if requested
  if (dbConnectionType === 'dbcon-all-features') {
    // ER Diagram (PlantUML)
    ft = ft
      .waitOnElementToBecomeVisible('#databaseDiagramTab-link')
      .click('#databaseDiagramTab-link')
      .waitOnElementToBecomeVisible('#btnDatabaseDiagramShowCode')
      .click('#btnDatabaseDiagramShowCode')
      .waitOnElementToBecomeVisible('#plantUmlEditor')
      .setCodeJarContentSingleShot(
        '#plantUmlEditor',
        `@startuml
entity "Orders" {
  *OrderID : int
  CustomerID : string
  OrderDate : date
}
entity "Order Details" {
  *OrderID : int
  *ProductID : int
  Quantity : int
}
entity "Products" {
  *ProductID : int
  ProductName : string
  SupplierID : int
  CategoryID : int
}
entity "Categories" {
  *CategoryID : int
  CategoryName : string
}
entity "Customers" {
  *CustomerID : string
  CompanyName : string
  ContactName : string
}
Orders ||--o{ "Order Details" : contains
Products ||--o{ "Order Details" : referenced
Categories ||--o{ Products : categorized
Customers ||--o{ Orders : places
@enduml`
      )
      .click('#btnDatabaseDiagramViewDiagram')
      .waitOnElementToBecomeVisible('#btnDatabaseDiagramShowCode');

    // Ubiquitous Language (Markdown)
    ft = ft
      .waitOnElementToBecomeVisible('#databaseUbiquitousLanguageTab-link')
      .click('#databaseUbiquitousLanguageTab-link')
      .waitOnElementToBecomeVisible('#btnUbiquitousLanguageStartEditing')
      .click('#btnUbiquitousLanguageStartEditing')
      .waitOnElementToBecomeVisible('#ubiquitousLanguageEditor')
      .setCodeJarContentSingleShot(
        '#ubiquitousLanguageEditor',
        `# Northwind Domain Ubiquitous Language

**Order**: A request by a customer for products.

**Order Details**: Line items in an order, specifying product and quantity.

**Product**: An item available for sale.

**Category**: A grouping for products.

**Customer**: An entity placing orders.

**Supplier**: An entity providing products.

**Relationships**:
- Customers place Orders.
- Orders contain "Order Details".
- "Order Details" reference Products.
- Products belong to Categories.
- Products are supplied by Suppliers.
`
      )
      .click('#btnUbiquitousLanguageEditDone')
      .waitOnElementToBecomeVisible('#btnUbiquitousLanguageEdit')
  }

  if (
    dbConnectionType !== 'dbcon-no-schema')
    ft = ft.click('#btnOKConfirmationDbConnectionModal')
      .waitOnElementToBecomeInvisible('#btnOKConfirmationDbConnectionModal');

  return { ft, connectionName, dbConnectionType };
}
