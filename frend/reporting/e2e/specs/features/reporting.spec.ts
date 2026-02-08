import * as path from 'path';
const slash = require('slash');

import { test } from '@playwright/test';
import { electronBeforeAfterAllTest } from '../../utils/common-setup';
import { Constants } from '../../utils/constants';
import { FluentTester } from '../../helpers/fluent-tester';
import { ConfTemplatesTestHelper } from '../../helpers/areas/conf-templates-test-helper';
import * as PATHS from '../../utils/paths';
import _ from 'lodash';
import { ConnectionsTestHelper, DB_VENDORS_SUPPORTED } from '../../helpers/areas/connections-test-helper';

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

const DB_VENDORS_SELECTED: string[] = (() => {
  const required = 'sqlite';
  const pool = DB_VENDORS_SUPPORTED.filter(v => v !== required);

  // Use date-based seed for daily variation but consistent within a run
  const today = new Date().toISOString().split('T')[0]; // e.g., "2025-12-02"
  const seed = today.split('-').reduce((acc, n) => acc + parseInt(n), 0);

  // Simple seeded shuffle
  const seededRandom = (i: number) => {
    const x = Math.sin(seed + i) * 10000;
    return x - Math.floor(x);
  };

  const shuffled = [...pool].sort((a, b) => seededRandom(pool.indexOf(a)) - seededRandom(pool.indexOf(b)));
  const pickedOthers = shuffled.slice(0, 2);

  const list = [required, ...pickedOthers];
  return list;
})();

//DONE2
test.describe('', async () => {

  FluentTester.setGlobalClickWaitMs(Constants.DELAY_ONE_SECOND);

  for (const dbVendor of DB_VENDORS_SELECTED) {
    electronBeforeAfterAllTest(
      `(${dbVendor}) should generate FOP2PDF report from SQL datasource and transformation (WITH parameters)`,
      //`(ibmdb2) should generate FOP2PDF report from SQL datasource with parameters and transformation`,
      async ({ beforeAfterEach: firstPage }) => {

        // ensure compose is down before starting
        // ConnectionsTestHelper.dockerComposeDownInDbFolder();

        try {

          test.setTimeout(Constants.DELAY_FIVE_HUNDRED_SECONDS);

          const TEST_NAME = `SQLPayslips`;

          //const dbVendor: string = 'ibmdb2';
          let ft = new FluentTester(firstPage);

          // Start starter-pack only for non-sqlite vendors
          if (dbVendor !== 'sqlite') {
            ft = ConnectionsTestHelper.setStarterPackStateForVendor(ft, dbVendor, 'start');
          }

          // Create 4 different DB connections with clear names
          const dbConnections = [];

          const dbConnNoSchema = createDbConnection(ft, TEST_NAME, 'dbcon-no-schema', dbVendor, false);
          ft = dbConnNoSchema.ft;
          const connectionNameNoSchema = dbConnNoSchema.connectionName;
          dbConnections.push({ connectionName: connectionNameNoSchema, dbConnectionType: 'dbcon-no-schema', defaultDbConnection: true });
          await ft.gotoConnections();

          const prefixSel = `[id^="btnDefault_db-${_.kebabCase(dbConnNoSchema.connectionName)}-${dbVendor}"]`;
          const alreadyDefault = await ft.elementExistsNow2(prefixSel);
          ft = ft.consoleLog(`alreadyDefault value: ${alreadyDefault}`);
          if (!alreadyDefault) ft = ConnectionsTestHelper.makeConnectionAsDefault(ft, `db-${_.kebabCase(dbConnNoSchema.connectionName)}-${dbVendor}\\.xml`);

          let clearLogs = false;
          if (dbVendor !== 'sqlite')
            clearLogs = true;

          const dbConnPlainSchema = createDbConnection(ft, TEST_NAME, 'dbcon-plain-schema-only', dbVendor, clearLogs);
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

          const sqlQuery =
            dbVendor === 'sqlite'
              ? `
    SELECT 
        "EmployeeID", 
        "FirstName", 
        "LastName", 
        date("HireDate"/1000, 'unixepoch', 'localtime') AS "HireDate"
    FROM "Employees"
    WHERE date("HireDate"/1000, 'unixepoch', 'localtime') BETWEEN :startDate AND :endDate
    ORDER BY "HireDate"
  `
              : dbVendor === 'postgres' || dbVendor === 'postgresql'
                ? `
    SELECT
        "EmployeeID",
        "FirstName",
        "LastName",
        "HireDate"
    FROM "Employees"
    /* ensure parameters are treated as dates in Postgres */
    WHERE "HireDate" BETWEEN CAST(:startDate AS date) AND CAST(:endDate AS date)
    ORDER BY "HireDate"
  `
                : dbVendor === 'oracle'
                  ? `
    SELECT
        "EmployeeID",
        "FirstName",
        "LastName",
        "HireDate"
    FROM "Employees"
    /* explicitly convert string params to DATE for Oracle (adjust quoting/schema if needed) */
    WHERE "HireDate" BETWEEN TO_DATE(:startDate, 'YYYY-MM-DD') AND TO_DATE(:endDate, 'YYYY-MM-DD')
    ORDER BY "HireDate"
  `
                  : dbVendor === 'ibmdb2' || dbVendor === 'db2'
                    ? `
     SELECT
        "EmployeeID",
        "FirstName",
        "LastName",
        "HireDate"
    FROM "DB2INST1"."Employees"
    WHERE "HireDate" BETWEEN CAST(:startDate AS DATE) AND CAST(:endDate AS DATE)
    ORDER BY "HireDate"
  `
                    : dbVendor === 'duckdb'
                      ? `
    SELECT 
        "EmployeeID", 
        "FirstName", 
        "LastName", 
        "HireDate"
    FROM "Employees"
    WHERE "HireDate" BETWEEN CAST(:startDate AS DATE) AND CAST(:endDate AS DATE)
    ORDER BY "HireDate"
  `
                      : dbVendor === 'clickhouse'
                        ? `
    SELECT 
        EmployeeID, 
        FirstName, 
        LastName, 
        HireDate
    FROM Employees
    WHERE HireDate BETWEEN toDate(:startDate) AND toDate(:endDate)
    ORDER BY HireDate
  `
                        : `
    SELECT 
        EmployeeID, 
        FirstName, 
        LastName, 
        HireDate
    FROM Employees
    WHERE HireDate BETWEEN :startDate AND :endDate
    ORDER BY HireDate
  `;
          const dbConnectionType = 'dbcon-plain-schema-only'; // or any other type you need

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
              sqlQuery: sqlQuery,
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
      min:      LocalDate.now().minusDays(36500),
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

          ft = ConfTemplatesTestHelper.deleteTemplate(ft, 'sql-payslips');

          // Delete all 4 DB connections
          // Delete all DB connections (reverse creation order to reduce UI reordering races)
          const deleteOrder = [
            connectionNameAllFeatures,
            connectionNameDomainGrouped,
            connectionNamePlainSchema,
            connectionNameNoSchema,
          ];

          for (const connName of deleteOrder) {
            ft = ConnectionsTestHelper.deleteAndAssertDatabaseConnection(
              ft,
              `db-${_.kebabCase(connName)}-${dbVendor}\\.xml`,
              dbVendor,
            );
          }

          // Stop starter-pack when done
          if (dbVendor !== 'sqlite') {
            ft = ConnectionsTestHelper.setStarterPackStateForVendor(ft, dbVendor, 'stop');
          }

          return ft;
        } finally {
          // cleanup after test
          //if (dbVendor !== 'sqlite')
          //ConnectionsTestHelper.dockerComposeDownInDbFolder();
        }
      },
    );

    // --- Script Data Source Test ---
    electronBeforeAfterAllTest(
      `(${dbVendor}) should generate XLSX report from Groovy script datasource (WITH parameters)`,
      async ({ beforeAfterEach: firstPage }) => {
        // ensure compose is down before starting
        // ConnectionsTestHelper.dockerComposeDownInDbFolder();

        try {

          test.setTimeout(Constants.DELAY_FIVE_HUNDRED_SECONDS);

          const TEST_NAME = `ScriptPayslips`;

          //const dbVendor = 'sqlite';
          let ft = new FluentTester(firstPage);

          // Start starter-pack only for non-sqlite vendors
          if (dbVendor !== 'sqlite') {
            ft = ConnectionsTestHelper.setStarterPackStateForVendor(ft, dbVendor, 'start');
          }

          // Create 4 different DB connections with clear names
          const dbConnections = [];

          const dbConnNoSchema = createDbConnection(ft, TEST_NAME, 'dbcon-no-schema', dbVendor, false);
          ft = dbConnNoSchema.ft;
          const connectionNameNoSchema = dbConnNoSchema.connectionName;
          dbConnections.push({ connectionName: connectionNameNoSchema, dbConnectionType: 'dbcon-no-schema', defaultDbConnection: true });

          ft = ft
            .gotoConnections();

          const prefixSel = `[id^="btnDefault_db-${_.kebabCase(dbConnNoSchema.connectionName)}-${dbVendor}"]`;
          const alreadyDefault = await ft.elementExistsNow2(prefixSel);
          ft = ft.consoleLog(`alreadyDefault value: ${alreadyDefault}`);
          if (!alreadyDefault) ft = ConnectionsTestHelper.makeConnectionAsDefault(ft, `db-${_.kebabCase(dbConnNoSchema.connectionName)}-${dbVendor}\\.xml`);

          let clearLogs = false;
          if (dbVendor !== 'sqlite')
            clearLogs = true;

          const dbConnPlainSchema = createDbConnection(ft, TEST_NAME, 'dbcon-plain-schema-only', dbVendor, clearLogs);
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

          // Vendor-aware SQL
          const sqlQueryWithParams =
            dbVendor === 'sqlite'
              ? `
    SELECT 
        "EmployeeID", 
        "FirstName", 
        "LastName", 
        date("HireDate"/1000, 'unixepoch', 'localtime') AS "HireDate"
    FROM "Employees"
    WHERE date("HireDate"/1000, 'unixepoch', 'localtime') BETWEEN :startDate AND :endDate
    ORDER BY "HireDate"
  `
              : dbVendor === 'postgres' || dbVendor === 'postgresql'
                ? `
    SELECT
        "EmployeeID",
        "FirstName",
        "LastName",
        "HireDate"
    FROM "Employees"
    /* ensure parameters are treated as dates in Postgres */
    WHERE "HireDate" BETWEEN CAST(:startDate AS date) AND CAST(:endDate AS date)
    ORDER BY "HireDate"
  `
                : dbVendor === 'oracle'
                  ? `
    SELECT
        "EmployeeID",
        "FirstName",
        "LastName",
        "HireDate"
    FROM "Employees"
    /* explicitly convert string params to DATE for Oracle (adjust quoting/schema if needed) */
    WHERE "HireDate" BETWEEN TO_DATE(:startDate, 'YYYY-MM-DD') AND TO_DATE(:endDate, 'YYYY-MM-DD')
    ORDER BY "HireDate"
  `
                  : dbVendor === 'ibmdb2' || dbVendor === 'db2'
                    ? `
     SELECT
        "EmployeeID",
        "FirstName",
        "LastName",
        "HireDate"
    FROM "DB2INST1"."Employees"
    WHERE "HireDate" BETWEEN CAST(:startDate AS DATE) AND CAST(:endDate AS DATE)
    ORDER BY "HireDate"
  `
                    : dbVendor === 'duckdb'
                      ? `
    SELECT 
        "EmployeeID", 
        "FirstName", 
        "LastName", 
        "HireDate"
    FROM "Employees"
    WHERE "HireDate" BETWEEN CAST(:startDate AS DATE) AND CAST(:endDate AS DATE)
    ORDER BY "HireDate"
  `
                      : dbVendor === 'clickhouse'
                        ? `
    SELECT 
        EmployeeID, 
        FirstName, 
        LastName, 
        HireDate
    FROM Employees
    WHERE HireDate BETWEEN toDate(:startDate) AND toDate(:endDate)
    ORDER BY HireDate
  `
                        : `
    SELECT 
        EmployeeID, 
        FirstName, 
        LastName, 
        HireDate
    FROM Employees
    WHERE HireDate BETWEEN :startDate AND :endDate
    ORDER BY HireDate
  `;

          const sqlQueryNoParams =
            dbVendor === 'sqlite'
              ? `
    SELECT 
        "EmployeeID", 
        "FirstName", 
        "LastName", 
        date("HireDate"/1000, 'unixepoch', 'localtime') AS "HireDate"
    FROM "Employees"
    ORDER BY "HireDate"
  `
              : dbVendor === 'postgres' || dbVendor === 'postgresql'
                ? `
    SELECT
        "EmployeeID",
        "FirstName",
        "LastName",
        "HireDate"
    FROM "Employees"
    ORDER BY "HireDate"
  `
                : dbVendor === 'oracle'
                  ? `
    SELECT
        "EmployeeID",
        "FirstName",
        "LastName",
        "HireDate"
    FROM "Employees"
    ORDER BY "HireDate"
  `
                  : dbVendor === 'ibmdb2' || dbVendor === 'db2'
                    ? `
     SELECT
        "EmployeeID",
        "FirstName",
        "LastName",
        "HireDate"
    FROM "DB2INST1"."Employees"
    ORDER BY "HireDate"
  `
                    : dbVendor === 'duckdb'
                      ? `
    SELECT 
        "EmployeeID", 
        "FirstName", 
        "LastName", 
        "HireDate"
    FROM "Employees"
    ORDER BY "HireDate"
  `
                      : dbVendor === 'clickhouse'
                        ? `
    SELECT 
        EmployeeID, 
        FirstName, 
        LastName, 
        HireDate
    FROM Employees
    ORDER BY HireDate
  `
                        : `
    SELECT 
        EmployeeID, 
        FirstName, 
        LastName, 
        HireDate
    FROM Employees
    ORDER BY HireDate
  `;
          const dbConnectionType = 'dbcon-plain-schema-only'; // or any other type you need

          ft = configureAndRunReportGeneration2(ft, TEST_NAME, {
            dataSourceType: 'ds.scriptfile',
            dbConnectionType: dbConnectionType,
            dbConnections: dbConnections,
            outputType: 'output.xlsx',
            outputExtension: 'xlsx',
            templateConfig: {
              useHtmlContent: true,
              templateContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Employee Details Excel Report</title>
  <style>
	  body {
		font-family: Arial, sans-serif;
		font-size: 11;
		margin: 0;
		padding: 0;
		background: #fff;
	  }
	  .report-title {
		font-size: 16;
		font-weight: bold;
		text-align: center;
		margin-bottom: 15pt;
		margin-top: 20pt;
	  }
	  table {
		border-collapse: collapse;
		width: 100%;
		table-layout: fixed;
		margin: 0 auto 20pt auto;
	  }
	  th, td {
		border: 1 solid #000000;
		padding: 4;
		font-size: 10;
		text-align: center;
		vertical-align: middle;
		word-break: break-word;
	  }
	  th {
		background-color: #f2f2f2;
		font-weight: bold;
	  }
</style>
</head>
<body>
  <div class="report-title">Employee Details</div>
  <table data-sheet-name="Employee Details">
    <tr>
      <th style="width: 4">Employee ID</th>
      <th style="width: 5">First Name</th>
      <th style="width: 5">Last Name</th>
      <th style="width: 4">Hire Date</th>
    </tr>
    <tr>
      <td data-text-cell="true">\${EmployeeID!}</td>
      <td>\${FirstName!}</td>
      <td>\${LastName!}</td>
      <td data-date-cell-format="yyyy-MM-dd">
        <#if HireDate?is_date>
          \${HireDate?string("yyyy-MM-dd")}
        <#else>
          \${HireDate!}
        </#if>
      </td>
    </tr>
  </table>
</body>
</html>
`,
            },
            dataSourceConfig: {
              showFileExplorer: false,
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
    sql = """${sqlQueryWithParams}"""
    rows = dbSql.rows(sql, [startDate: startDate, endDate: endDate])
} else {
    sql = """${sqlQueryNoParams}"""
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
      min:      LocalDate.now().minusDays(36500),
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

          ft = ConfTemplatesTestHelper.deleteTemplate(ft, 'script-payslips');

          // Delete all 4 DB connections
          ft = ConnectionsTestHelper.deleteAndAssertDatabaseConnection(ft, `db-${_.kebabCase(connectionNameNoSchema)}-${dbVendor}\\.xml`, dbVendor);
          ft = ConnectionsTestHelper.deleteAndAssertDatabaseConnection(ft, `db-${_.kebabCase(connectionNamePlainSchema)}-${dbVendor}\\.xml`, dbVendor);
          ft = ConnectionsTestHelper.deleteAndAssertDatabaseConnection(ft, `db-${_.kebabCase(connectionNameDomainGrouped)}-${dbVendor}\\.xml`, dbVendor);
          ft = ConnectionsTestHelper.deleteAndAssertDatabaseConnection(ft, `db-${_.kebabCase(connectionNameAllFeatures)}-${dbVendor}\\.xml`, dbVendor);

          // Stop starter-pack when done
          if (dbVendor !== 'sqlite') {
            ft = ConnectionsTestHelper.setStarterPackStateForVendor(ft, dbVendor, 'stop');
          }

          return ft;
        } finally {
          // cleanup after test
          //if (dbVendor !== 'sqlite')
          //ConnectionsTestHelper.dockerComposeDownInDbFolder();
        }
      },
    );

  }

  electronBeforeAfterAllTest(
    `(sqlite) should generate XLSX report from Groovy script datasource (WITHOUT parameters)`,
    async ({ beforeAfterEach: firstPage }) => {
      test.setTimeout(Constants.DELAY_FIVE_HUNDRED_SECONDS);

      const TEST_NAME = `ScriptPayslipsNoParams`;

      const dbVendor = 'sqlite';

      let ft = new FluentTester(firstPage);

      // Start starter-pack only for non-sqlite vendors
      if (dbVendor !== 'sqlite') {
        ft = ConnectionsTestHelper.setStarterPackStateForVendor(ft, dbVendor, 'start');
      }

      // Only one DB connection (the one actually used)
      const dbConnections: {
        connectionName: string;
        dbConnectionType: 'dbcon-no-schema' | 'dbcon-plain-schema-only' | 'dbcon-domaingrouped-schema' | 'dbcon-all-features';
        defaultDbConnection: boolean;
      }[] = [];

      const dbConnectionType = 'dbcon-plain-schema-only';

      const dbConnPlainSchema = createDbConnection(ft, TEST_NAME, dbConnectionType, dbVendor, false);
      ft = dbConnPlainSchema.ft;

      ft = ft
        .gotoConnections();

      const prefixSel = `[id^="btnDefault_db-${_.kebabCase(dbConnPlainSchema.connectionName)}-${dbVendor}"]`;
      const alreadyDefault = await ft.elementExistsNow2(prefixSel);
      ft = ft.consoleLog(`alreadyDefault value: ${alreadyDefault}`);
      if (!alreadyDefault) ft = ConnectionsTestHelper.makeConnectionAsDefault(ft, `db-${_.kebabCase(dbConnPlainSchema.connectionName)}-${dbVendor}\\.xml`);

      dbConnections.push({
        connectionName: dbConnPlainSchema.connectionName,
        dbConnectionType: dbConnectionType,
        defaultDbConnection: true
      });

      ft = ConfTemplatesTestHelper.createNewTemplate(ft, TEST_NAME, 'enableMailMergeCapability');

      // Vendor-aware SQL (NO PARAMS)
      const sqlQueryNoParams =
        dbVendor === 'sqlite'
          ? `
            SELECT 
                "EmployeeID",
                "FirstName",
                "LastName",
                date("HireDate"/1000, 'unixepoch', 'localtime') AS "HireDate"
            FROM "Employees"
            ORDER BY "HireDate"
          `
          : `
            SELECT 
                "EmployeeID",
                "FirstName",
                "LastName",
                "HireDate"
            FROM "Employees"
            ORDER BY "HireDate"
          `;

      // Run test using existing helper (no reportParametersScript, no transformationScript)
      ft = configureAndRunReportGeneration2(ft, TEST_NAME, {
        dataSourceType: 'ds.scriptfile',
        dbConnectionType: dbConnectionType,
        dbConnections,
        outputType: 'output.xlsx',
        outputExtension: 'xlsx',
        templateConfig: {
          useHtmlContent: true,
          templateContent: `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Employee Details Excel Report</title>
<style>
  body { font-family: Arial, sans-serif; font-size:11; margin:0; padding:0; background:#fff; }
  .report-title { font-size:16; font-weight:bold; text-align:center; margin:20pt 0 15pt 0; }
  table { border-collapse:collapse; width:100%; table-layout:fixed; margin:0 auto 20pt auto; }
  th, td { border:1 solid #000000; padding:4; font-size:10; text-align:center; vertical-align:middle; word-break:break-word; }
  th { background:#f2f2f2; font-weight:bold; }
</style>
</head>
<body>
  <div class="report-title">Employee Details</div>
  <table data-sheet-name="Employee Details">
    <tr>
      <th style="width:4">Employee ID</th>
      <th style="width:5">First Name</th>
      <th style="width:5">Last Name</th>
      <th style="width:4">Hire Date</th>
    </tr>
    <tr>
      <td data-text-cell="true">\${EmployeeID!}</td>
      <td>\${FirstName!}</td>
      <td>\${LastName!}</td>
      <td data-date-cell-format="yyyy-MM-dd">
        <#if HireDate?is_date>
          \${HireDate?string("yyyy-MM-dd")}
        <#else>
          \${HireDate!}
        </#if>
      </td>
    </tr>
  </table>
</body>
</html>
        `,
        },
        dataSourceConfig: {
          showFileExplorer: false,
          groovyScript: `
import groovy.sql.Sql
import java.util.LinkedHashMap

def dbSql = ctx.dbSql
log.info("Starting scriptedReport_employeesByHireDate_noParams.groovy...")

def sql = """${sqlQueryNoParams}"""
def rows = dbSql.rows(sql)

def result = []
rows.each { row ->
  def m = new LinkedHashMap<String,Object>()
  m.putAll(row)
  result.add(m)
}

ctx.reportData = result
ctx.reportColumnNames = result.isEmpty() ? [] : new ArrayList<>(result[0].keySet())
log.info("Finished scriptedReport_employeesByHireDate_noParams.groovy. Rows: {}", ctx.reportData.size())
        `,
          testViewData: true,
          //reportParametersScript: '',
          //transformationScript: ''
        },
        exerciseAiButtons: {
          sql: false,
          transformation: false
        },
      });

      // Clean up: delete template and the single DB connection
      ft = ConfTemplatesTestHelper.deleteTemplate(ft, _.kebabCase(TEST_NAME));
      ft = ConnectionsTestHelper.deleteAndAssertDatabaseConnection(
        ft,
        `db-${_.kebabCase(dbConnPlainSchema.connectionName)}-${dbVendor}\\.xml`,
        dbVendor
      );

      // Stop starter-pack when done
      if (dbVendor !== 'sqlite') {
        ft = ConnectionsTestHelper.setStarterPackStateForVendor(ft, dbVendor, 'stop');
      }

      return ft;
    }
  );

  electronBeforeAfterAllTest(
    `(sqlite) should generate FOP2PDF report from SQL datasource (WITHOUT parameters)`,
    async ({ beforeAfterEach: firstPage }) => {
      test.setTimeout(Constants.DELAY_FIVE_HUNDRED_SECONDS);

      const TEST_NAME = `SQLPayslipsNoParams`;
      const dbVendor = 'sqlite';

      let ft = new FluentTester(firstPage);

      // Start starter-pack only for non-sqlite vendors
      if (dbVendor !== 'sqlite') {
        ft = ConnectionsTestHelper.setStarterPackStateForVendor(ft, dbVendor, 'start');
      }

      const dbConnections: {
        connectionName: string;
        dbConnectionType: 'dbcon-no-schema' | 'dbcon-plain-schema-only' | 'dbcon-domaingrouped-schema' | 'dbcon-all-features';
        defaultDbConnection: boolean;
      }[] = [];

      const dbConnectionType = 'dbcon-plain-schema-only';
      const dbConn = createDbConnection(ft, TEST_NAME, dbConnectionType, dbVendor, false);
      ft = dbConn.ft;

      ft = ft
        .gotoConnections();

      const prefixSel = `[id^="btnDefault_db-${_.kebabCase(dbConn.connectionName)}-${dbVendor}"]`;
      const alreadyDefault = await ft.elementExistsNow2(prefixSel);
      ft = ft.consoleLog(`alreadyDefault value: ${alreadyDefault}`);
      if (!alreadyDefault) ft = ConnectionsTestHelper.makeConnectionAsDefault(ft, `db-${_.kebabCase(dbConn.connectionName)}-${dbVendor}\\.xml`);

      dbConnections.push({
        connectionName: dbConn.connectionName,
        dbConnectionType: dbConnectionType as 'dbcon-no-schema' | 'dbcon-plain-schema-only' | 'dbcon-domaingrouped-schema' | 'dbcon-all-features',
        defaultDbConnection: true,
      });

      ft = ConfTemplatesTestHelper.createNewTemplate(ft, TEST_NAME, 'enableMailMergeCapability');

      // Vendor-aware SQL (NO PARAMS)
      const sqlQuery =
        dbVendor === 'sqlite'
          ? `
            SELECT 
                "EmployeeID",
                "FirstName",
                "LastName",
                date("HireDate"/1000, 'unixepoch', 'localtime') AS "HireDate"
            FROM "Employees"
            ORDER BY "HireDate"
          `
          : `
            SELECT 
                "EmployeeID",
                "FirstName",
                "LastName",
                "HireDate"
            FROM "Employees"
            ORDER BY "HireDate"
          `;

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
          sqlQuery: sqlQuery,
          testViewData: true, // keep view-data checks
        },
        exerciseAiButtons: {
          sql: false,
          transformation: false,
        },
      });

      // Cleanup: delete template and the single DB connection
      ft = ConfTemplatesTestHelper.deleteTemplate(ft, _.kebabCase(TEST_NAME));
      ft = ConnectionsTestHelper.deleteAndAssertDatabaseConnection(
        ft,
        `db-${_.kebabCase(dbConn.connectionName)}-${dbVendor}\\.xml`,
        dbVendor
      );

      // Stop starter-pack when done
      if (dbVendor !== 'sqlite') {
        ft = ConnectionsTestHelper.setStarterPackStateForVendor(ft, dbVendor, 'stop');
      }

      return ft;
    },
  );

  // --- XML Data Source Test ---
  electronBeforeAfterAllTest(
    'should generate XML reports from XML datasource',
    async ({ beforeAfterEach: firstPage }) => {
      test.setTimeout(Constants.DELAY_FIVE_HUNDRED_SECONDS);
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

  electronBeforeAfterAllTest(
    'should generate JSON reports from XML datasource',
    async ({ beforeAfterEach: firstPage }) => {
      test.setTimeout(Constants.DELAY_FIVE_HUNDRED_SECONDS);
      let ft = new FluentTester(firstPage);
      ft = ConfTemplatesTestHelper.createNewTemplate(ft, 'Payslips', 'enableMailMergeCapability');

      ft = configureAndRunReportGeneration(ft, {
        dataSourceType: 'ds.xmlfile',
        dataSourceFilePath: '/samples/reports/payslips/Payslips.xml',
        outputType: 'output.any',
        outputExtension: 'json',
        templateConfig: {
          useHtmlContent: true,
          templatePath: '/samples/reports/payslips/payslips-template-json.ftl',
        },
        dataSourceConfig: {
          xmlRepeatingNodeXPath: '/payslips/payslip',
        },
      });

      ft = ConfTemplatesTestHelper.deleteTemplate(ft, 'payslips');
      return ft;
    },
  );



  electronBeforeAfterAllTest(
    'should correctly generate DOCX output from DOCX template using CSV as datasource (csv2docx_from_docx_template)',
    async ({ beforeAfterEach: firstPage }) => {
      test.setTimeout(Constants.DELAY_FIVE_HUNDRED_SECONDS);

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
      test.setTimeout(Constants.DELAY_FIVE_HUNDRED_SECONDS);

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
      test.setTimeout(Constants.DELAY_FIVE_HUNDRED_SECONDS);

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
      test.setTimeout(Constants.DELAY_FIVE_HUNDRED_SECONDS);

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
      test.setTimeout(Constants.DELAY_FIVE_HUNDRED_SECONDS);

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
      test.setTimeout(Constants.DELAY_FIVE_HUNDRED_SECONDS);

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
      test.setTimeout(Constants.DELAY_FIVE_HUNDRED_SECONDS);

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
      test.setTimeout(Constants.DELAY_FIVE_HUNDRED_SECONDS);

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
                // TODO: Write Chat2DB tab e2e tests for FlowKraft AI Hub app
                .click('#toolsTab-link')
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
  if (params.dataSourceConfig?.transformationScript !== undefined) {
    if (params.dataSourceConfig.transformationScript) {
      // Set the transformation script
      ft = ft
        .click('#lblShowAdditionalTransformation')
        .waitOnElementToBecomeVisible('#transformationCodeEditor')
        .setCodeJarContentSingleShot('#transformationCodeEditor', params.dataSourceConfig.transformationScript)
        .sleep(Constants.DELAY_ONE_SECOND);
    } else {
      // Clear the transformation script
      ft = ft
        .click('#lblShowAdditionalTransformation')
        .waitOnElementToBecomeVisible('#transformationCodeEditor')
        .setCodeJarContentSingleShot('#transformationCodeEditor', '') // Explicitly set to empty
        .sleep(Constants.DELAY_ONE_SECOND);
    }
  }

  if (params.exerciseAiButtons?.transformation) {
    ft = ft.waitOnElementToBecomeVisible('#btnHelpWithTransformationAI').click('#btnHelpWithTransformationAI');

    ft = ft.waitOnElementToBecomeVisible('#btnCloseAiCopilotModal').waitOnElementToBecomeVisible('#btnCloseAiCopilotModal')
      .pageShouldContainText('Your task is to write a complete Groovy script that performs **additional data transformation**')
      .click('#btnCloseAiCopilotModal')
      .waitOnElementToBecomeInvisible('#btnCloseAiCopilotModal');

  }

  const hasParams = Boolean(params.dataSourceConfig?.reportParametersScript);
  const expectedRowCount = hasParams ? 1 : 3;

  //ft = ft.consoleLog(`[DEBUG] hasParams=${hasParams}, expecting ${expectedRowCount} rows after Test button.`);

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
      .clickYesDoThis();

    if (hasParams) {
      ft = ft
        .waitOnElementToBecomeVisible('#formReportParameters')
        .waitOnElementToBecomeVisible('#btnTestQueryRun')
        .waitOnElementToBecomeEnabled('#startDate')
        .setValue('#startDate', '1991-01-01')
        .sleep(Constants.DELAY_ONE_SECOND)
        .waitOnElementToBecomeEnabled('#btnTestQueryRun')
        .click('#btnTestQueryRun');
    }

    ft = ft
      .waitOnToastToBecomeVisible(
        'success',
        'SQL query executed successfully, go to the Tabulator', Constants.DELAY_HUNDRED_SECONDS
      )
      .waitOnElementToBecomeVisible('#reportingTabulatorTab-link')
      .click('#reportingTabulatorTab-link')
      .waitOnTabulatorToBecomeVisible();

    //ft = ft.consoleLog(`[DEBUG] 2nd time hasParams=${hasParams}, expecting ${expectedRowCount} rows after Test button.`);

    ft = ft.waitOnTabulatorToHaveRowCount(expectedRowCount);

    // Adjust assertions depending on whether parameters were used
    if (hasParams) {
      ft = ft
        .tabulatorCellShouldHaveText(0, "FirstName", "Andrew")
        .tabulatorCellShouldHaveText(0, "LastName", "Fuller")
      //.tabulatorCellShouldHaveText(0, "HireDate", "1992-08-14");
    } else {
      // No params: expect all 3 employees ordered by HireDate asc
      ft = ft
        .tabulatorCellShouldHaveText(0, "FirstName", "Janet")
        .tabulatorCellShouldHaveText(0, "LastName", "Leverling")
        //.tabulatorCellShouldHaveText(0, "HireDate", "1992-04-01")
        .tabulatorCellShouldHaveText(1, "FirstName", "Nancy")
        .tabulatorCellShouldHaveText(1, "LastName", "Davolio")
        //.tabulatorCellShouldHaveText(1, "HireDate", "1992-05-01")
        .tabulatorCellShouldHaveText(2, "FirstName", "Andrew")
        .tabulatorCellShouldHaveText(2, "LastName", "Fuller")
      //.tabulatorCellShouldHaveText(2, "HireDate", "1992-08-14");
    }
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


  if (hasParams && params.dataSourceConfig.reportParametersScript.includes('startDate')) {
    ft = ft
      .waitOnElementToBecomeEnabled('#startDate')
      .setValue('#startDate', '1991-01-01')
      .sleep(Constants.DELAY_ONE_SECOND)
      .waitOnElementToBecomeEnabled('#btnViewData')
      .waitOnElementToBecomeEnabled('#btnGenerateReports');
  }

  // Test "View Data" for SQL and Script if requested
  if (params.dataSourceConfig?.testViewData) {
    ft = ft
      .waitOnElementToBecomeVisible('#btnViewData')
      .click('#btnViewData')
      .clickYesDoThis()
      .click('#btnClearLogs')
      .clickYesDoThis()
      .waitOnElementToBecomeDisabled('#btnClearLogs')
      .click('#btnViewData')
      .clickYesDoThis()
      .waitOnToastToBecomeVisible(
        'success',
        'SQL query executed successfully', Constants.DELAY_HUNDRED_SECONDS
      )
      .waitOnTabulatorToBecomeVisible();

    //ft = ft.consoleLog(`[DEBUG] 3rd time hasParams=${hasParams}, expecting ${expectedRowCount} rows after Test button.`);

    ft = ft.waitOnTabulatorToHaveRowCount(expectedRowCount);

    // Adjust assertions depending on whether parameters were used
    if (hasParams) {
      ft = ft
        .tabulatorCellShouldHaveText(0, "FirstName", "Andrew")
        .tabulatorCellShouldHaveText(0, "LastName", "Fuller")
      //.tabulatorCellShouldHaveText(0, "HireDate", "1992-08-14");
    } else {
      // No params: expect all 3 employees ordered by HireDate asc
      ft = ft
        .tabulatorCellShouldHaveText(0, "FirstName", "Janet")
        .tabulatorCellShouldHaveText(0, "LastName", "Leverling")
        //.tabulatorCellShouldHaveText(0, "HireDate", "1992-04-01")
        .tabulatorCellShouldHaveText(1, "FirstName", "Nancy")
        .tabulatorCellShouldHaveText(1, "LastName", "Davolio")
        //.tabulatorCellShouldHaveText(1, "HireDate", "1992-05-01")
        .tabulatorCellShouldHaveText(2, "FirstName", "Andrew")
        .tabulatorCellShouldHaveText(2, "LastName", "Fuller")
      //.tabulatorCellShouldHaveText(2, "HireDate", "1992-08-14");
    };
  }

  ft = ft
    .click('#btnGenerateReports')
    .clickYesDoThis()
    .click('#btnClearLogs')
    .clickYesDoThis()
    .waitOnElementToBecomeDisabled('#btnClearLogs')
    .click('#btnGenerateReports')
    .clickYesDoThis()
    .waitOnProcessingToStart(Constants.CHECK_PROCESSING_JAVA)
    .waitOnProcessingToFinish(Constants.CHECK_PROCESSING_LOGS);

  const expectedSuffix = params.outputType === 'output.fop2pdf' ? '.pdf' : params.outputExtension;

  ft = ft.processingShouldHaveGeneratedNFilesHavingSuffix(
    expectedRowCount,
    expectedSuffix,
  ).appStatusShouldBeGreatNoErrorsNoWarnings();

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

  ft = ft.sleep(3 * Constants.DELAY_ONE_SECOND);
  if (params.outputExtension === 'json') {
    ft = ft
      .gotoConfiguration()
      .click(`#topMenuConfigurationLoad_payslips_${PATHS.SETTINGS_CONFIG_FILE}`)
      .waitOnElementToBecomeVisible('#leftMenuReportingSettings')
      .waitOnElementToBecomeEnabled('#leftMenuReportingSettings')
      .setValue('#burstFileName', '${burst_token}.json')
      .sleep(3 * Constants.DELAY_ONE_SECOND);
  }

  const displayType = dataSourceTypeDisplayMap[params.dataSourceType];

  // Run report generation
  ft = ft
    //.waitOnElementWithTextToBecomeVisible('Saved')
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
      .clickAndSelectTableRow(`#db-${_.kebabCase(connectionName)}-${dbVendor}\\.xml`)
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
