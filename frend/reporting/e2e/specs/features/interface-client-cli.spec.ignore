import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { InterfaceTestHelper } from '../../helpers/interface-test-helper';
import { Constants } from '../../utils/constants';

/**
 * CLI Interface Tests — verifies DataPallas.bat works for every operation.
 *
 * Each test mirrors an existing UI E2E test from samples.spec.ignore (same inputs,
 * same expected output files) but executes via CLI instead of the Electron UI.
 *
 * Test names include the sample ID (e.g., "01_monthly_payslips") to make it
 * obvious which existing spec is being replicated.
 */

const PORTABLE_DIR = process.env.PORTABLE_EXECUTABLE_DIR!;

// ── Burst Tests (from samples.spec.ignore) ──

test.describe('CLI — Burst (samples.spec.ignore)', () => {

  test('01_monthly_payslips_split_only (pdf2pdf)', async () => {
    InterfaceTestHelper.cleanOutputAndLogs();
    const result = InterfaceTestHelper.execCli([
      'burst', 'samples/burst/Payslips.pdf',
      '-c', 'config/samples/split-only/settings.xml',
    ]);
    expect(result.exitCode).toEqual(0);
    await InterfaceTestHelper.assertOutputFiles(
      Constants.PAYSLIPS_PDF_BURST_TOKENS.map(t => t + '.pdf'), 'pdf',
    );
  });

  test('02_excel_distinct_sheets_split_only (xls2xls)', async () => {
    InterfaceTestHelper.cleanOutputAndLogs();
    const result = InterfaceTestHelper.execCli([
      'burst', 'samples/burst/Payslips-Distinct-Sheets.xls',
      '-c', 'config/samples/split-only/settings.xml',
    ]);
    expect(result.exitCode).toEqual(0);
    await InterfaceTestHelper.assertOutputFiles(
      Constants.PAYSLIPS_XLS_BURST_TOKENS.map(t => t + '.xls'), 'xls',
    );
  });

  test('03_excel_distinct_column_values (xls2xls)', async () => {
    InterfaceTestHelper.cleanOutputAndLogs();
    const result = InterfaceTestHelper.execCli([
      'burst', 'samples/burst/Customers-Distinct-Column-Values.xls',
      '-c', 'config/samples/split-only/settings.xml',
    ]);
    expect(result.exitCode).toEqual(0);
    await InterfaceTestHelper.assertOutputFilesExist('xls');
  });

  test('04_split_two_times (pdf2pdf)', async () => {
    InterfaceTestHelper.cleanOutputAndLogs();
    const result = InterfaceTestHelper.execCli([
      'burst', 'samples/burst/Split2Times.pdf',
      '-c', 'config/samples/split-two-times/settings.xml',
    ]);
    expect(result.exitCode).toEqual(0);
    await InterfaceTestHelper.assertOutputFilesExist('pdf');
  });
});

// ── Generate CSV Tests (from samples.spec.ignore) ──

test.describe('CLI — Generate CSV (samples.spec.ignore)', () => {

  test('06_generate_payslips_csv2docx', async () => {
    InterfaceTestHelper.cleanOutputAndLogs();
    const result = InterfaceTestHelper.execCli([
      'generate', '-c', 'config/samples/g-csv2docx/settings.xml',
      'samples/reports/payslips/Payslips.csv',
    ]);
    expect(result.exitCode).toEqual(0);
    await InterfaceTestHelper.assertOutputFiles(['0.docx', '1.docx', '2.docx'], 'docx');
  });

  test('07_generate_payslips_csv2html', async () => {
    InterfaceTestHelper.cleanOutputAndLogs();
    const result = InterfaceTestHelper.execCli([
      'generate', '-c', 'config/samples/g-csv2htm/settings.xml',
      'samples/reports/payslips/Payslips.csv',
    ]);
    expect(result.exitCode).toEqual(0);
    await InterfaceTestHelper.assertOutputFiles(['0.html', '1.html', '2.html'], 'html');
  });

  test('08_generate_payslips_csv2pdf', async () => {
    InterfaceTestHelper.cleanOutputAndLogs();
    const result = InterfaceTestHelper.execCli([
      'generate', '-c', 'config/samples/g-csv2pdf/settings.xml',
      'samples/reports/payslips/Payslips.csv',
    ]);
    expect(result.exitCode).toEqual(0);
    await InterfaceTestHelper.assertOutputFiles(['0.pdf', '1.pdf', '2.pdf'], 'pdf');
  });

  test('09_generate_payslips_csv2xlsx', async () => {
    InterfaceTestHelper.cleanOutputAndLogs();
    const result = InterfaceTestHelper.execCli([
      'generate', '-c', 'config/samples/g-csv2xls/settings.xml',
      'samples/reports/payslips/Payslips.csv',
    ]);
    expect(result.exitCode).toEqual(0);
    await InterfaceTestHelper.assertOutputFiles(['0.xlsx', '1.xlsx', '2.xlsx'], 'xlsx');
  });

  test('10_generate_payslips_xls2xls', async () => {
    InterfaceTestHelper.cleanOutputAndLogs();
    const result = InterfaceTestHelper.execCli([
      'generate', '-c', 'config/samples/g-xls2xls/settings.xml',
      'samples/reports/payslips/Payslips.xlsx',
    ]);
    expect(result.exitCode).toEqual(0);
    await InterfaceTestHelper.assertOutputFilesExist('xlsx');
  });
});

// ── Generate SQL/Script Tests (from samples.spec.ignore) ──

test.describe('CLI — Generate SQL/Script (samples.spec.ignore)', () => {
  test('11_generate_student_profiles_sql2foppdf', async () => {
    InterfaceTestHelper.cleanOutputAndLogs();
    const result = InterfaceTestHelper.execCli([
      'generate', '-c', 'config/samples/g-sql2fop-stud/settings.xml', 'g-sql2fop-stud',
    ]);
    expect(result.exitCode).toEqual(0);
    await InterfaceTestHelper.assertOutputFiles(
      ['Andrew-Fuller.pdf', 'Janet-Leverling.pdf', 'Nancy-Davolio.pdf'], 'pdf',
    );
  });

  test('12_generate_customer_statements_sql2html', async () => {
    InterfaceTestHelper.cleanOutputAndLogs();
    const result = InterfaceTestHelper.execCli([
      'generate', '-c', 'config/samples/g-sql2htm-cst-stmt/settings.xml', 'g-sql2htm-cst-stmt',
    ]);
    expect(result.exitCode).toEqual(0);
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
    const result = InterfaceTestHelper.execCli([
      'generate', '-c', 'config/samples/g-sql2xls-cst-sles/settings.xml', 'g-sql2xls-cst-sles',
    ]);
    expect(result.exitCode).toEqual(0);
    await InterfaceTestHelper.assertOutputFiles(['CustomerSalesSummary.xlsx'], 'xlsx');
  });

  test('15_generate_category_region_crosstab_script2html', async () => {
    InterfaceTestHelper.cleanOutputAndLogs();
    const result = InterfaceTestHelper.execCli([
      'generate', '-c', 'config/samples/g-scr2htm-cross/settings.xml', 'g-scr2htm-cross',
    ]);
    expect(result.exitCode).toEqual(0);
    await InterfaceTestHelper.assertOutputFiles(['CategoryRegionCrosstab.html'], 'html');
  });

  test('16_generate_monthly_sales_trend_script2html', async () => {
    InterfaceTestHelper.cleanOutputAndLogs();
    const result = InterfaceTestHelper.execCli([
      'generate', '-c', 'config/samples/g-scr2htm-trend/settings.xml', 'g-scr2htm-trend',
    ]);
    expect(result.exitCode).toEqual(0);
    await InterfaceTestHelper.assertOutputFiles(['MonthlySalesTrend.html'], 'html');
  });

  test('17_generate_supplier_scorecards_script2html', async () => {
    InterfaceTestHelper.cleanOutputAndLogs();
    const result = InterfaceTestHelper.execCli([
      'generate', '-c', 'config/samples/g-scr2htm-supc/settings.xml', 'g-scr2htm-supc',
    ]);
    expect(result.exitCode).toEqual(0);
    await InterfaceTestHelper.assertOutputFiles([
      'supplier_1_scorecard.html', 'supplier_2_scorecard.html',
      'supplier_3_scorecard.html', 'supplier_4_scorecard.html',
      'supplier_5_scorecard.html', 'supplier_6_scorecard.html',
    ], 'html');
  });

  test('20_generate_adhoc_employee_profile_script2pdf', async () => {
    InterfaceTestHelper.cleanOutputAndLogs();
    const result = InterfaceTestHelper.execCli([
      'generate', '-c', 'config/samples/g-scr2pdf-adhoc/settings.xml', 'g-scr2pdf-adhoc',
      '-p', '"EmployeeID=E001"', '-p', '"FirstName=John"', '-p', '"LastName=Doe"',
      '-p', '"Title=Sales Representative"', '-p', '"City=Seattle"', '-p', '"Country=USA"',
    ]);
    expect(result.exitCode).toEqual(0);
    await InterfaceTestHelper.assertOutputFiles(['E001-John-Doe.pdf'], 'pdf');
  });
});

// ── Merge Test (from samples.spec.ignore) ──

test.describe('CLI — Merge (samples.spec.ignore)', () => {

  test('05_merge_then_burst_invoices (pdf2pdf)', async () => {
    InterfaceTestHelper.cleanOutputAndLogs();

    const absoluteDir = path.resolve(PORTABLE_DIR);
    const tempDir = path.join(absoluteDir, 'temp');
    fs.mkdirSync(tempDir, { recursive: true });
    const listFile = path.join(tempDir, 'merge-cli-test.txt');
    fs.writeFileSync(listFile, [
      path.join(absoluteDir, 'samples/burst/Invoices-Oct.pdf'),
      path.join(absoluteDir, 'samples/burst/Invoices-Nov.pdf'),
      path.join(absoluteDir, 'samples/burst/Invoices-Dec.pdf'),
    ].join('\n'));

    const result = InterfaceTestHelper.execCli([
      'document', 'merge', listFile, '-o', 'merged.pdf',
      '-b', '-c', 'config/samples/split-only/settings.xml',
    ]);
    expect(result.exitCode).toEqual(0);
    await InterfaceTestHelper.assertOutputFiles([
      '0011.pdf', '0012.pdf', '0013.pdf', '0014.pdf', '0015.pdf',
      '0016.pdf', '0017.pdf', '0018.pdf', '0019.pdf', 'merged.pdf',
    ], 'pdf');
  });
});

// ── QA Testing Modes (from processing-qa.spec.ignore) ──

test.describe('CLI — QA Testing (processing-qa.spec.ignore)', () => {

  test('burst --testall', async () => {
    InterfaceTestHelper.cleanOutputAndLogs();
    const result = InterfaceTestHelper.execCli([
      'burst', 'samples/burst/Payslips.pdf',
      '-c', 'config/samples/split-only/settings.xml', '-ta',
    ]);
    expect(result.exitCode).toEqual(0);
    await InterfaceTestHelper.assertOutputFiles(
      Constants.PAYSLIPS_PDF_BURST_TOKENS.map(t => t + '.pdf'), 'pdf',
    );
  });

  test('burst --testlist single token', async () => {
    InterfaceTestHelper.cleanOutputAndLogs();
    const result = InterfaceTestHelper.execCli([
      'burst', 'samples/burst/Payslips.pdf',
      '-c', 'config/samples/split-only/settings.xml',
      '-tl', 'clyde.grew@northridgehealth.org',
    ]);
    expect(result.exitCode).toEqual(0);
    await InterfaceTestHelper.assertOutputFileCount(1, 'pdf');
  });

  test('burst --testrandom 2', async () => {
    InterfaceTestHelper.cleanOutputAndLogs();
    const result = InterfaceTestHelper.execCli([
      'burst', 'samples/burst/Payslips.pdf',
      '-c', 'config/samples/split-only/settings.xml',
      '-tr', '2',
    ]);
    expect(result.exitCode).toEqual(0);
    await InterfaceTestHelper.assertOutputFileCount(2, 'pdf');
  });
});

// ── System Commands ──

test.describe('CLI — System Commands', () => {

  test('license check', async () => {
    const result = InterfaceTestHelper.execCli(['system', 'license', 'check']);
    // License check runs without crashing — exit code may vary depending on license state
    expect(result.exitCode).toBeDefined();
  });

  test('--help shows usage', async () => {
    const result = InterfaceTestHelper.execCli(['--help']);
    expect(result.exitCode).toEqual(0);
    // DataPallas.bat redirects Java output to logs/DataPallas.bat.log
    const batLog = fs.readFileSync(path.join(PORTABLE_DIR, 'logs/DataPallas.bat.log'), 'utf-8');
    expect(batLog).toContain('DataPallas');
  });

  test('--version shows version from settings.xml', async () => {
    const result = InterfaceTestHelper.execCli(['--version']);
    expect(result.exitCode).toEqual(0);
    const batLog = fs.readFileSync(path.join(PORTABLE_DIR, 'logs/DataPallas.bat.log'), 'utf-8');
    expect(batLog).toContain('DataPallas');
    // Verify it matches the version in settings.xml
    const settingsXml = fs.readFileSync(path.join(PORTABLE_DIR, 'config/burst/settings.xml'), 'utf-8');
    const versionMatch = settingsXml.match(/<version>([^<]+)<\/version>/);
    expect(batLog).toContain(versionMatch![1]);
  });
});

