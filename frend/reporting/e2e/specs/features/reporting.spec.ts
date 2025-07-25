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
  // add more if needed
};

//DONE2
test.describe('', async () => {

  electronBeforeAfterAllTest(
    'should generate FOP2PDF report from SQL datasource with parameters and transformation',
    async ({ beforeAfterEach: firstPage }) => {
      test.setTimeout(Constants.DELAY_FIVE_THOUSANDS_SECONDS);

      const TEST_NAME = 'SQLPayslips';

      const dbConnectionType = 'dbcon-plain-schema-only'; // or any other type you need

      const dbVendor = 'sqlite';

      let ft = new FluentTester(firstPage);

      // Create 4 different DB connections with clear names
      const dbConnections = [];

      const dbConnNoSchema = createDbConnection(ft, TEST_NAME, 'dbcon-no-schema', dbVendor);
      ft = dbConnNoSchema.ft;
      const connectionNameNoSchema = dbConnNoSchema.connectionName;
      dbConnections.push({ connectionName: connectionNameNoSchema, dbConnectionType: 'dbcon-no-schema', defaultDbConnection: true });

      const dbConnPlainSchema = createDbConnection(ft, TEST_NAME, 'dbcon-plain-schema-only', dbVendor);
      ft = dbConnPlainSchema.ft;
      const connectionNamePlainSchema = dbConnPlainSchema.connectionName;
      dbConnections.push({ connectionName: connectionNamePlainSchema, dbConnectionType: 'dbcon-plain-schema-only', defaultDbConnection: false });

      const dbConnDomainGrouped = createDbConnection(ft, TEST_NAME, 'dbcon-domaingrouped-schema', dbVendor);
      ft = dbConnDomainGrouped.ft;
      const connectionNameDomainGrouped = dbConnDomainGrouped.connectionName;
      dbConnections.push({ connectionName: connectionNameDomainGrouped, dbConnectionType: 'dbcon-domaingrouped-schema', defaultDbConnection: false });

      const dbConnAllFeatures = createDbConnection(ft, TEST_NAME, 'dbcon-all-features', dbVendor);
      ft = dbConnAllFeatures.ft;
      const connectionNameAllFeatures = dbConnAllFeatures.connectionName;
      dbConnections.push({ connectionName: connectionNameAllFeatures, dbConnectionType: 'dbcon-all-features', defaultDbConnection: false });

      ft = ConfTemplatesTestHelper.createNewTemplate(ft, TEST_NAME, 'enableMailMergeCapability');

      ft = configureAndRunReportGeneration2(ft, TEST_NAME, {
        dataSourceType: 'ds.sqlquery',
        dbConnectionType: dbConnectionType,
        dbConnections: dbConnections,
        outputType: 'output.fop2pdf',
        outputExtension: 'pdf',
        templateConfig: {
          useHtmlContent: true,
          templateContent: `
<fo:root xmlns:fo="http://www.w3.org/1999/XSL/Format">
  <fo:layout-master-set>
    <fo:simple-page-master master-name="A4"
      page-height="29.7cm"
      page-width="21cm"
      margin-top="1cm"
      margin-bottom="1cm"
      margin-left="1.5cm"
      margin-right="1.5cm">
      <fo:region-body/>
    </fo:simple-page-master>
  </fo:layout-master-set>
  <fo:page-sequence master-reference="A4">
    <fo:flow flow-name="xsl-region-body">

      <fo:block font-size="16pt" font-weight="bold" text-align="center" space-after="15pt">
        Employee Details
      </fo:block>

      <fo:table table-layout="fixed" width="100%" font-size="10pt">
        <fo:table-column column-width="4cm"/>
        <fo:table-column column-width="5cm"/>
        <fo:table-column column-width="5cm"/>
        <fo:table-column column-width="4cm"/>
        <fo:table-body>
          <fo:table-row background-color="#f2f2f2">
            <fo:table-cell border="1pt solid black" padding="4pt">
              <fo:block font-weight="bold" text-align="center">Employee ID</fo:block>
            </fo:table-cell>
            <fo:table-cell border="1pt solid black" padding="4pt">
              <fo:block font-weight="bold" text-align="center">First Name</fo:block>
            </fo:table-cell>
            <fo:table-cell border="1pt solid black" padding="4pt">
              <fo:block font-weight="bold" text-align="center">Last Name</fo:block>
            </fo:table-cell>
            <fo:table-cell border="1pt solid black" padding="4pt">
              <fo:block font-weight="bold" text-align="center">Hire Date</fo:block>
            </fo:table-cell>
          </fo:table-row>
          <fo:table-row>
            <fo:table-cell border="1pt solid black" padding="4pt">
              <fo:block text-align="center">\${EmployeeID!}</fo:block>
            </fo:table-cell>
            <fo:table-cell border="1pt solid black" padding="4pt">
              <fo:block>\${FirstName!}</fo:block>
            </fo:table-cell>
            <fo:table-cell border="1pt solid black" padding="4pt">
              <fo:block>\${LastName!}</fo:block>
            </fo:table-cell>
            <fo:table-cell border="1pt solid black" padding="4pt">
              <fo:block>
                <#if HireDate?is_date>
                  \${HireDate?string("yyyy-MM-dd")}
                <#else>
                  \${HireDate!}
                </#if>
              </fo:block>
            </fo:table-cell>
          </fo:table-row>
        </fo:table-body>
      </fo:table>

    </fo:flow>
  </fo:page-sequence>
</fo:root>
`,
        },
        dataSourceConfig: {
          sqlQuery: `
              SELECT 
        "EmployeeID", 
        "FirstName", 
        "LastName", 
        date("HireDate" / 1000, 'unixepoch') AS "HireDate"
    FROM "Employees"
    WHERE date("HireDate" / 1000, 'unixepoch') BETWEEN :startDate AND :endDate
    ORDER BY "HireDate"
        `,
          reportParametersScript: `
import java.time.LocalDate
import java.time.LocalDateTime

reportParameters {
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
}
if (reportParametersProvided) {
  log.info("--- Report Parameter Values ---")
  log.info("startDate          : \${startDate ?: 'NOT_SET'}")
  log.info("endDate            : \${endDate   ?: 'NOT_SET'}")
}
        `,
          testViewData: true,
          transformationScript: `import java.util.stream.Collectors

log.info("Starting additional data transformation: filter for HireDate after June 1992...")

def filteredData = ctx.reportData.stream()
    .filter { row ->
        def hireDate = row['HireDate']?.toString()
        hireDate && hireDate > '1992-06-30'
    }
    .collect(Collectors.toList())

ctx.reportData = filteredData
if (!filteredData.isEmpty()) {
    ctx.reportColumnNames = new ArrayList<>(filteredData.get(0).keySet())
}
log.info("Transformation complete. Rows after filter: {}", ctx.reportData.size())`,
        },
        exerciseAiButtons: {
          sql: true,
          transformation: true,
        },
      });

      ft = ConfTemplatesTestHelper.deleteTemplate(ft, 'SQLPayslips');

      // Delete all 4 DB connections
      ft = ConnectionsTestHelper.deleteAndAssertDatabaseConnection(ft, connectionNameNoSchema, dbVendor);
      ft = ConnectionsTestHelper.deleteAndAssertDatabaseConnection(ft, connectionNamePlainSchema, dbVendor);
      ft = ConnectionsTestHelper.deleteAndAssertDatabaseConnection(ft, connectionNameDomainGrouped, dbVendor);
      ft = ConnectionsTestHelper.deleteAndAssertDatabaseConnection(ft, connectionNameAllFeatures, dbVendor);

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
  
    
    
    // --- Script Data Source Test ---
    electronBeforeAfterAllTest(
      'should generate XLSX report from Groovy script datasource with file explorer and parameters',
      async ({ beforeAfterEach: firstPage }) => {
        test.setTimeout(Constants.DELAY_FIVE_THOUSANDS_SECONDS);
        let ft = new FluentTester(firstPage);
        ft = ConfTemplatesTestHelper.createNewTemplate(ft, 'ScriptPayslips', 'enableMailMergeCapability');
  
        ft = configureAndRunReportGeneration2(ft, {
          dataSourceType: 'ds.scriptfile',
          dataSourceFilePath: '/samples/reports/payslips/Payslips.csv',
          outputType: 'output.xlsx',
          outputExtension: 'xlsx',
          templateConfig: {
            useHtmlContent: true,
            templatePath: '/samples/reports/payslips/payslips-template.html',
          },
          dataSourceConfig: {
            showFileExplorer: true,
            groovyScript: `
            import groovy.sql.Sql
import java.util.LinkedHashMap

def dbSql = ctx.dbSql
log.info("Starting scriptedReport_employeesByHireDate.groovy...")

// --- 1. Read report parameters using Variables API ---
def startDate = ctx.variables.getUserVariables(ctx.token).get('startDate')
def endDate = ctx.variables.getUserVariables(ctx.token).get('endDate')

// --- 2. Define the SQL query ---
def sql
def rows

if (startDate && endDate) {
    sql = """
    SELECT 
        "EmployeeID", 
        "FirstName", 
        "LastName", 
        date("HireDate" / 1000, 'unixepoch') AS "HireDate"
    FROM "Employees"
    WHERE date("HireDate" / 1000, 'unixepoch') BETWEEN :startDate AND :endDate
    ORDER BY "HireDate"
    """
    rows = dbSql.rows(sql, [startDate: startDate, endDate: endDate])
} else {
    sql = """
    SELECT 
        "EmployeeID", 
        "FirstName", 
        "LastName", 
        date("HireDate" / 1000, 'unixepoch') AS "HireDate"
    FROM "Employees"
    ORDER BY "HireDate"
    """
    rows = dbSql.rows(sql)
}

def result = []
rows.each { row ->
    def map = new LinkedHashMap<String, Object>()
    map.putAll(row)
    result.add(map)
}

ctx.reportData = result
if (!result.isEmpty()) {
    ctx.reportColumnNames = new ArrayList<>(result[0].keySet())
} else {
    ctx.reportColumnNames = []
}
log.info("Finished scriptedReport_employeesByHireDate.groovy. Rows: {}", ctx.reportData.size())
          `,
            reportParametersScript: `
  import java.time.LocalDate
  
  reportParameters {
    parameter(
      id:           'department',
      type:         String,
      label:        'Department',
      defaultValue: 'Finance'
    ) {
      constraints(required: true)
      ui(control: 'select', options: "SELECT DISTINCT department FROM employees")
    }
  
    parameter(
      id:           'minSalary',
      type:         Integer,
      label:        'Minimum Salary',
      defaultValue: 1000
    ) {
      constraints(min: 0)
    }
  
    parameter(
      id:           'includeInactive',
      type:         Boolean,
      label:        'Include Inactive',
      defaultValue: false
    )
  }
  
  if (reportParametersProvided) {
    log.info("--- Report Parameter Values ---")
    log.info("department         : \${department ?: 'NOT_SET'}")
    log.info("minSalary          : \${minSalary ?: 'NOT_SET'}")
    log.info("includeInactive    : \${includeInactive ?: 'false'}")
  }`,
            testViewData: true,
            transformationScript: `
            // Simple Groovy transformation: filter only active employees
            data.findAll { it[4] == 'active' }
          `,
          },
          exerciseAiButtons: {
            script: true,
            transformation: true,
          },
        });
  
        ft = ConfTemplatesTestHelper.deleteTemplate(ft, 'ScriptPayslips');
        return ft;
      },
    );
  
    // --- XML Data Source Test ---
    electronBeforeAfterAllTest(
      'should generate Freemarker XML report from XML datasource',
      async ({ beforeAfterEach: firstPage }) => {
        test.setTimeout(Constants.DELAY_FIVE_THOUSANDS_SECONDS);
        let ft = new FluentTester(firstPage);
        ft = ConfTemplatesTestHelper.createNewTemplate(ft, 'XMLPayslips', 'enableMailMergeCapability');
  
        ft = configureAndRunReportGeneration(ft, {
          dataSourceType: 'ds.xmlfile',
          dataSourceFilePath: '/samples/reports/payslips/Payslips.xml',
          outputType: 'output.any',
          outputExtension: 'xml',
          templateConfig: {
            useHtmlContent: true,
            templatePath: '/samples/reports/payslips/payslips-template-freemarker.xml',
          },
          dataSourceConfig: {
            xmlRepeatingNodeXPath: '/payslips/payslip',
          },
        });
  
        ft = ConfTemplatesTestHelper.deleteTemplate(ft, 'XMLPayslips');
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
          .waitOnElementToBecomeVisible('#sqlQueryEditor')
          .setCodeJarContentSingleShot('#sqlQueryEditor', params.dataSourceConfig.sqlQuery);
      }
      break;
    case 'ds.scriptfile':
      ft = ft.dropDownSelectOptionHavingValue('#dsTypes', 'ds.scriptfile');
      if (params.dataSourceConfig?.groovyScript) {
        ft = ft
          .waitOnElementToBecomeVisible('#groovyScriptEditor')
          .setCodeJarContent(
            '#groovyScriptEditor',
            params.dataSourceConfig.groovyScript,
          );
      }
      if (params.exerciseAiButtons?.script) {
        ft = ft.click('#btnHelpWithScriptAI');
        ft = ft.waitOnElementToBecomeVisible('#aiHelpModal');
        ft = ft.click('#aiHelpModalClose');
      }
      break;
    // CSV is default, no need for explicit case
  }

  if (params.dataSourceType === 'ds.sqlquery') {

    ft = ft.waitOnElementToContainText('#databaseConnection', '(default)');

    if (params.exerciseAiButtons?.sql) {

      for (const dbConnection of params.dbConnections || []) {

        if (dbConnection.defaultDbConnection) {
          ft = ft.waitOnElementToContainText('#databaseConnection', dbConnection.connectionName);
          ft = ft.waitOnElementToBecomeEnabled('#btnHelpWithSqlQueryAI');
          ft = ft.click('#btnHelpWithSqlQueryAI');
          ft = ft.waitOnElementToBecomeVisible('#btnTestDbConnectionDbSchema');
          ft = ft.waitOnElementToBecomeEnabled('#btnTestDbConnectionDbSchema');

          ft = ft.click('#btnTestDbConnectionDbSchema');

          ft = ft.waitOnElementToBecomeVisible('#btnTestDbConnection');
          ft = ft.waitOnElementToBecomeEnabled('#btnTestDbConnection');

          ft = ft.click('#btnTestDbConnection')
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
            .waitOnElementToBecomeVisible('#btnCopyPromptText')
            .click('#btnCopyPromptText')
            .waitOnElementToBecomeVisible('.dburst-button-question-confirm')
            .click('.dburst-button-question-confirm')
            .waitOnElementToBecomeInvisible('.dburst-button-question-confirm')
            .clipboardShouldContainText('You are an expert SQL Developer')
            .clipboardShouldContainText('"tableName": "Products"')
            .clipboardShouldContainText('"columnName": "Discontinued"')
            .click('#btnCloseAiCopilotModal')
            .waitOnElementToBecomeInvisible('#btnCopyPromptText')
            .click('#btnCloseDbConnectionModal');

        } else {

          ft = ft.dropDownSelectOptionHavingLabel('#databaseConnection', dbConnection.connectionName);
          ft = ft.waitOnElementToContainText('#databaseConnection', dbConnection.connectionName);
          ft = ft.waitOnElementToBecomeEnabled('#btnHelpWithSqlQueryAI');
          ft = ft.click('#btnHelpWithSqlQueryAI');

          if (dbConnection.dbConnectionType === 'dbcon-plain-schema-only') {

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
              .click('#btnGenerateWithAIDbSchema')
              .waitOnElementToBecomeVisible('#btnCopyPromptText')
              .click('#btnCopyPromptText')
              .waitOnElementToBecomeVisible('.dburst-button-question-confirm')
              .click('.dburst-button-question-confirm')
              .waitOnElementToBecomeInvisible('.dburst-button-question-confirm')
              .clipboardShouldContainText('You are an expert SQL Developer')
              .clipboardShouldContainText('"tableName": "Products"')
              .clipboardShouldContainText('"columnName": "Discontinued"')
              .click('#btnCloseAiCopilotModal')
              .waitOnElementToBecomeInvisible('#btnCopyPromptText')
              .click('#btnCloseDbConnectionModal');

          }
          else if (dbConnection.dbConnectionType === 'dbcon-domaingrouped-schema') {

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
              .waitOnElementToBecomeVisible('#btnCopyPromptText')
              .click('#btnCopyPromptText')
              .waitOnElementToBecomeVisible('.dburst-button-question-confirm')
              .click('.dburst-button-question-confirm')
              .waitOnElementToBecomeInvisible('.dburst-button-question-confirm')
              .clipboardShouldContainText('You are an expert SQL Developer')
              .clipboardShouldContainText('"tableName": "Orders"')
              .clipboardShouldContainText('"tableName": "Order Details"')
              .click('#btnCloseAiCopilotModal')
              .waitOnElementToBecomeInvisible('#btnCopyPromptText')
              .click('#databaseSchemaTab-link')
              .waitOnElementToBecomeVisible('#databaseSchemaPicklistContainer')
              //.waitOnElementToBecomeVisible('#btnRefreshDatabaseSchema')
              .click('#btnCloseDbConnectionModal');

          } else if (dbConnection.dbConnectionType === 'dbcon-all-features') {

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
              .waitOnElementToBecomeVisible('#btnCopyPromptText')
              .click('#btnCopyPromptText')
              .waitOnElementToBecomeVisible('.dburst-button-question-confirm')
              .click('.dburst-button-question-confirm')
              .waitOnElementToBecomeInvisible('.dburst-button-question-confirm')
              .clipboardShouldContainText('You are an expert SQL Developer')
              .clipboardShouldContainText('"tableName": "Orders"')
              .clipboardShouldContainText('"tableName": "Order Details"')
              .click('#btnCloseAiCopilotModal')
              .waitOnElementToBecomeInvisible('#btnCopyPromptText')
              .waitOnElementToBecomeEnabled('#databaseSchemaTab-link')
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

  if (params.dataSourceConfig?.reportParametersScript) {
    ft = ft
      .waitOnElementToBecomeEnabled('#tabSqlReportParameters-link')
      .click('#tabSqlReportParameters-link') // Assumed ID
      .sleep(Constants.DELAY_ONE_SECOND) // Wait for the tab to be ready
      .waitOnElementToBecomeVisible('#paramsSpecEditor')
      .setCodeJarContentSingleShot('#paramsSpecEditor', params.dataSourceConfig.reportParametersScript).sleep(Constants.DELAY_ONE_SECOND)
      .click('#tabSqlCode-link').waitOnElementToBecomeVisible('#sqlQueryEditor').sleep(Constants.DELAY_ONE_SECOND); // Switch back to SQL code tab;
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


  if (params.dataSourceType === 'ds.sqlquery') {
    ft = ft
      .waitOnElementToBecomeVisible('#btnTestSqlQuery')
      .click('#btnTestSqlQuery')
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

  if (params.dataSourceType === 'ds.scriptfile') {
    ft = ft
      .waitOnElementToBecomeVisible('#btnTestScript')
      .click('#btnTestScript')
      .waitOnElementToBecomeVisible('#reportingTabulatorTab-link')
      .waitOnElementToBecomeVisible('div.tabulator-row')
      .elementShouldContainText('div.tabulator-row', 'John Doe');
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
      .processingShouldHaveGeneratedOutputFiles(
        [
          '0.pdf'],
        '.pdf',
      )
  } else {
    ft = ft
      .processingShouldHaveGeneratedOutputFiles(
        [
          '0.' + params.outputExtension,
          '1.' + params.outputExtension,
          '2.' + params.outputExtension,
        ],
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

function createDbConnection(
  ft: FluentTester,
  testName: string,
  dbConnectionType: 'dbcon-no-schema' | 'dbcon-plain-schema-only' | 'dbcon-domaingrouped-schema' | 'dbcon-all-features' = 'dbcon-no-schema',
  dbVendor: string = 'sqlite',
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
      .click('#btnTestDbConnection')
      .confirmDialogShouldBeVisible()
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
