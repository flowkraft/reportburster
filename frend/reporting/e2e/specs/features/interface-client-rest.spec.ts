import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { InterfaceTestHelper } from '../../helpers/interface-test-helper';
import { Constants } from '../../utils/constants';

/**
 * REST Interface Tests — verifies the Jobs REST API produces identical results to CLI.
 *
 * Each test mirrors interface-client-cli.spec.ts exactly (same inputs, same expected
 * output files from samples.spec.ignore) but executes via REST API instead of CLI.
 *
 * If a test passes for CLI but fails for REST (or vice versa), the bug is in the
 * interface layer, not the engine.
 */

const BASE_URL = 'http://localhost:9090';
const PORTABLE_DIR = process.env.PORTABLE_EXECUTABLE_DIR!;

// ── Burst Tests (from samples.spec.ignore) ──

test.describe('REST — Burst (samples.spec.ignore)', () => {

  test('01_monthly_payslips_split_only (pdf2pdf)', async () => {
    InterfaceTestHelper.cleanOutputAndLogs();
    await InterfaceTestHelper.execRest('/api/jobs/burst', {
      inputFile: 'samples/burst/Payslips.pdf', reportId: 'split-only',
    }, BASE_URL);
    await InterfaceTestHelper.assertOutputFiles(
      Constants.PAYSLIPS_PDF_BURST_TOKENS.map(t => t + '.pdf'), 'pdf',
    );
  });

  test('02_excel_distinct_sheets_split_only (xls2xls)', async () => {
    InterfaceTestHelper.cleanOutputAndLogs();
    await InterfaceTestHelper.execRest('/api/jobs/burst', {
      inputFile: 'samples/burst/Payslips-Distinct-Sheets.xls', reportId: 'split-only',
    }, BASE_URL);
    await InterfaceTestHelper.assertOutputFiles(
      Constants.PAYSLIPS_XLS_BURST_TOKENS.map(t => t + '.xls'), 'xls',
    );
  });

  test('03_excel_distinct_column_values (xls2xls)', async () => {
    InterfaceTestHelper.cleanOutputAndLogs();
    await InterfaceTestHelper.execRest('/api/jobs/burst', {
      inputFile: 'samples/burst/Customers-Distinct-Column-Values.xls', reportId: 'split-only',
    }, BASE_URL);
    await InterfaceTestHelper.assertOutputFilesExist('xls');
  });

  test('04_split_two_times (pdf2pdf)', async () => {
    InterfaceTestHelper.cleanOutputAndLogs();
    await InterfaceTestHelper.execRest('/api/jobs/burst', {
      inputFile: 'samples/burst/Split2Times.pdf', reportId: 'split-two-times',
    }, BASE_URL);
    await InterfaceTestHelper.assertOutputFilesExist('pdf');
  });
});

// ── Generate CSV Tests (from samples.spec.ignore) ──

test.describe('REST — Generate CSV (samples.spec.ignore)', () => {

  test('06_generate_payslips_csv2docx', async () => {
    InterfaceTestHelper.cleanOutputAndLogs();
    await InterfaceTestHelper.execRest('/api/jobs/generate', {
      reportId: 'g-csv2docx', input: 'samples/reports/payslips/Payslips.csv',
    }, BASE_URL);
    await InterfaceTestHelper.assertOutputFiles(['0.docx', '1.docx', '2.docx'], 'docx');
  });

  test('07_generate_payslips_csv2html', async () => {
    InterfaceTestHelper.cleanOutputAndLogs();
    await InterfaceTestHelper.execRest('/api/jobs/generate', {
      reportId: 'g-csv2htm', input: 'samples/reports/payslips/Payslips.csv',
    }, BASE_URL);
    await InterfaceTestHelper.assertOutputFiles(['0.html', '1.html', '2.html'], 'html');
  });

  test('08_generate_payslips_csv2pdf', async () => {
    InterfaceTestHelper.cleanOutputAndLogs();
    await InterfaceTestHelper.execRest('/api/jobs/generate', {
      reportId: 'g-csv2pdf', input: 'samples/reports/payslips/Payslips.csv',
    }, BASE_URL);
    await InterfaceTestHelper.assertOutputFiles(['0.pdf', '1.pdf', '2.pdf'], 'pdf');
  });

  test('09_generate_payslips_csv2xlsx', async () => {
    InterfaceTestHelper.cleanOutputAndLogs();
    await InterfaceTestHelper.execRest('/api/jobs/generate', {
      reportId: 'g-csv2xls', input: 'samples/reports/payslips/Payslips.csv',
    }, BASE_URL);
    await InterfaceTestHelper.assertOutputFiles(['0.xlsx', '1.xlsx', '2.xlsx'], 'xlsx');
  });

  test('10_generate_payslips_xls2xls', async () => {
    InterfaceTestHelper.cleanOutputAndLogs();
    await InterfaceTestHelper.execRest('/api/jobs/generate', {
      reportId: 'g-xls2xls', input: 'samples/reports/payslips/Payslips.xlsx',
    }, BASE_URL);
    await InterfaceTestHelper.assertOutputFilesExist('xlsx');
  });
});

// ── Generate SQL/Script Tests (from samples.spec.ignore) ──

test.describe('REST — Generate SQL/Script (samples.spec.ignore)', () => {

  test('11_generate_student_profiles_sql2foppdf', async () => {
    InterfaceTestHelper.cleanOutputAndLogs();
    await InterfaceTestHelper.execRest('/api/jobs/generate', {
      reportId: 'g-sql2fop-stud',
    }, BASE_URL);
    await InterfaceTestHelper.assertOutputFiles(
      ['Andrew-Fuller.pdf', 'Janet-Leverling.pdf', 'Nancy-Davolio.pdf'], 'pdf',
    );
  });

  test('12_generate_customer_statements_sql2html', async () => {
    InterfaceTestHelper.cleanOutputAndLogs();
    await InterfaceTestHelper.execRest('/api/jobs/generate', {
      reportId: 'g-sql2htm-cst-stmt',
    }, BASE_URL);
    await InterfaceTestHelper.assertOutputFiles([
      'ALFKI.html', 'ANATR.html', 'ANTON.html', 'AROUT.html', 'BERGS.html',
      'BLAUS.html', 'BONAP.html', 'CACTU.html', 'DRACD.html', 'DUMON.html',
      'ERNSH.html', 'FOLKO.html', 'FRANK.html', 'GREAL.html', 'HILAA.html',
      'ISLAT.html', 'KOENE.html', 'LEHMS.html', 'LILAS.html', 'MAGAA.html',
      'MORGK.html', 'OTTIK.html', 'QUICK.html', 'TOMSP.html', 'WANDK.html',
    ], 'html');
  });

  test('13_generate_customer_sales_summary_sql2xlsx', async () => {
    InterfaceTestHelper.cleanOutputAndLogs();
    await InterfaceTestHelper.execRest('/api/jobs/generate', {
      reportId: 'g-sql2xls-cst-sles',
    }, BASE_URL);
    await InterfaceTestHelper.assertOutputFiles(['CustomerSalesSummary.xlsx'], 'xlsx');
  });

  test('15_generate_category_region_crosstab_script2html', async () => {
    InterfaceTestHelper.cleanOutputAndLogs();
    await InterfaceTestHelper.execRest('/api/jobs/generate', {
      reportId: 'g-scr2htm-cross',
    }, BASE_URL);
    await InterfaceTestHelper.assertOutputFiles(['CategoryRegionCrosstab.html'], 'html');
  });

  test('16_generate_monthly_sales_trend_script2html', async () => {
    InterfaceTestHelper.cleanOutputAndLogs();
    await InterfaceTestHelper.execRest('/api/jobs/generate', {
      reportId: 'g-scr2htm-trend',
    }, BASE_URL);
    await InterfaceTestHelper.assertOutputFiles(['MonthlySalesTrend.html'], 'html');
  });

  test('17_generate_supplier_scorecards_script2html', async () => {
    InterfaceTestHelper.cleanOutputAndLogs();
    await InterfaceTestHelper.execRest('/api/jobs/generate', {
      reportId: 'g-scr2htm-supc',
    }, BASE_URL);
    await InterfaceTestHelper.assertOutputFiles([
      'supplier_1_scorecard.html', 'supplier_2_scorecard.html',
      'supplier_3_scorecard.html', 'supplier_4_scorecard.html',
      'supplier_5_scorecard.html', 'supplier_6_scorecard.html',
    ], 'html');
  });

  test('20_generate_adhoc_employee_profile_script2pdf', async () => {
    InterfaceTestHelper.cleanOutputAndLogs();
    await InterfaceTestHelper.execRest('/api/jobs/generate', {
      reportId: 'g-scr2pdf-adhoc',
      params: {
        EmployeeID: 'E001', FirstName: 'John', LastName: 'Doe',
        Title: 'Sales Representative', City: 'Seattle', Country: 'USA',
      },
    }, BASE_URL);
    await InterfaceTestHelper.assertOutputFiles(['E001-John-Doe.pdf'], 'pdf');
  });
});

// ── Merge Test (from samples.spec.ignore) ──

test.describe('REST — Merge (samples.spec.ignore)', () => {

  test('05_merge_then_burst_invoices (pdf2pdf)', async () => {
    InterfaceTestHelper.cleanOutputAndLogs();

    const absoluteDir = path.resolve(PORTABLE_DIR);

    const prepareResponse = await fetch(`${BASE_URL}/api/jobs/merge/prepare-list`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filePaths: [
          path.join(absoluteDir, 'samples/burst/Invoices-Oct.pdf'),
          path.join(absoluteDir, 'samples/burst/Invoices-Nov.pdf'),
          path.join(absoluteDir, 'samples/burst/Invoices-Dec.pdf'),
        ],
      }),
    });
    const { listFile } = await prepareResponse.json();

    await InterfaceTestHelper.execRest('/api/jobs/merge', {
      listFile, outputName: 'merged.pdf', burst: true, reportId: 'split-only',
    }, BASE_URL);

    await InterfaceTestHelper.assertOutputFiles([
      '0011.pdf', '0012.pdf', '0013.pdf', '0014.pdf', '0015.pdf',
      '0016.pdf', '0017.pdf', '0018.pdf', '0019.pdf', 'merged.pdf',
    ], 'pdf');
  });
});

// ── QA Testing Modes (from processing-qa.spec.ignore) ──

test.describe('REST — QA Testing (processing-qa.spec.ignore)', () => {

  test('burst --testall', async () => {
    InterfaceTestHelper.cleanOutputAndLogs();
    await InterfaceTestHelper.execRest('/api/jobs/burst', {
      inputFile: 'samples/burst/Payslips.pdf', reportId: 'split-only', testAll: true,
    }, BASE_URL);
    await InterfaceTestHelper.assertOutputFiles(
      Constants.PAYSLIPS_PDF_BURST_TOKENS.map(t => t + '.pdf'), 'pdf',
    );
  });

  test('burst --testlist single token', async () => {
    InterfaceTestHelper.cleanOutputAndLogs();
    await InterfaceTestHelper.execRest('/api/jobs/burst', {
      inputFile: 'samples/burst/Payslips.pdf', reportId: 'split-only',
      testList: 'clyde.grew@northridgehealth.org',
    }, BASE_URL);
    await InterfaceTestHelper.assertOutputFileCount(1, 'pdf');
  });

  test('burst --testrandom 2', async () => {
    InterfaceTestHelper.cleanOutputAndLogs();
    await InterfaceTestHelper.execRest('/api/jobs/burst', {
      inputFile: 'samples/burst/Payslips.pdf', reportId: 'split-only', testRandom: 2,
    }, BASE_URL);
    await InterfaceTestHelper.assertOutputFileCount(2, 'pdf');
  });
});

// ── System (REST equivalents of CLI system commands) ──

test.describe('REST — System Commands', () => {

  test('system info', async () => {
    const response = await fetch(`${BASE_URL}/api/system/info`, {
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
    });
    expect(response.ok).toBeTruthy();
  });

  test('services status', async () => {
    const response = await fetch(`${BASE_URL}/api/system/services/status`, {
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
    });
    expect(response.ok).toBeTruthy();
  });

  test('--version from settings.xml', async () => {
    const settingsXml = fs.readFileSync(path.join(PORTABLE_DIR, 'config/burst/settings.xml'), 'utf-8');
    const versionMatch = settingsXml.match(/<version>([^<]+)<\/version>/);
    expect(versionMatch).toBeTruthy();
    expect(versionMatch![1]).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
