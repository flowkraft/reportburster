import _ from 'lodash';

import { FluentTester } from '../fluent-tester';
import * as PATHS from '../../utils/paths';
import { Constants } from '../../utils/constants';
import { ConfigurationTestHelper } from './configuration-test-helper';

import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Database vendor constants
export const DB_VENDORS_SUPPORTED = [
  'oracle',
  'sqlserver',
  'postgres',
  'mysql',
  'mariadb',
  'ibmdb2',
  'sqlite',
  'duckdb',
  'clickhouse',
  'supabase',
];

export const DB_VENDORS_DEFAULT = 'sqlite';

// OLAP vendors (have Star Schema with fact/dimension tables + views)
export const DB_VENDORS_OLAP = ['duckdb', 'clickhouse'];

// Helper to check if vendor is OLAP (has Star Schema)
export const SEED_CAPABLE_VENDORS = ['oracle', 'sqlserver', 'ibmdb2', 'postgres', 'mysql', 'mariadb', 'supabase'];

export function hasSeedCapability(vendor: string): boolean {
  return SEED_CAPABLE_VENDORS.includes(vendor);
}

export function isOlapVendor(vendor: string): boolean {
  return DB_VENDORS_OLAP.includes(vendor.toLowerCase());
}

// OLTP tables (present in ALL databases)
export const SCHEMA_TABLES_OLTP = [
  'Categories',
  'Customers',
  'Employees',
  'OrderDetails',
  'Orders',
  'Products',
  'Shippers',
  'Suppliers',
];

// OLAP Star Schema tables (present only in DuckDB and ClickHouse)
export const SCHEMA_TABLES_OLAP = [
  'dim_customer',
  'dim_employee',
  'dim_product',
  'dim_time',
  'fact_sales',
];

// OLAP Views (present only in DuckDB and ClickHouse)
export const SCHEMA_VIEWS_OLAP = [
  'vw_monthly_sales',
  'vw_sales_detail',
];

type StarterPackState = 'running' | 'stopped' | 'starting' | 'stopping' | 'error' | 'unknown';

function vendorToPackId(vendor: string): string {
  const v = (vendor || '').toLowerCase().trim();
  switch (v) {
    case 'postgres':
    case 'postgresql':
      return 'db-northwind-postgres';
    case 'ibm-db2':
    case 'ibmdb2':
    case 'db2':
      return 'db-northwind-db2';
    case 'sqlserver':
      return 'db-northwind-sqlserver';
    case 'oracle':
      return 'db-northwind-oracle';
    case 'mariadb':
      return 'db-northwind-mariadb';
    case 'mysql':
      return 'db-northwind-mysql';
    case 'sqlite':
      return 'db-northwind-sqlite';
    case 'duckdb':
      return 'db-northwind-duckdb';
    case 'clickhouse':
      return 'db-northwind-clickhouse';
    case 'supabase':
      return 'db-northwind-supabase';
    default:
      return `db-northwind-${v}`;
  }
}

export class ConnectionsTestHelper {
  static DB_VENDORS_TEST_RANDOM = true;

  // Map starter-pack defaults (mirrors .env)
  static dbServerConnDefaults(vendor: string) {
    const v = (vendor || '').toLowerCase();
    switch (v) {
      case 'postgres':
      case 'postgresql':
        return { host: 'localhost', port: '5432', db: 'Northwind', user: 'postgres', pass: 'postgres' };
      case 'mysql':
        return { host: 'localhost', port: '3306', db: 'Northwind', user: 'root', pass: 'password' };
      case 'mariadb':
        return { host: 'localhost', port: '3307', db: 'Northwind', user: 'root', pass: 'password' };
      case 'sqlserver':
        return { host: 'localhost', port: '1433', db: 'Northwind', user: 'sa', pass: 'Password123!' };
      case 'oracle':
        return { host: 'localhost', port: '1521', db: 'XEPDB1', user: 'oracle', pass: 'oracle' };
      case 'ibmdb2':
        return { host: 'localhost', port: '50000', db: 'NORTHWND', user: 'db2inst1', pass: 'password' };
      case 'duckdb':
        // DuckDB is file-based: no host/port/user/pass needed, only the database file path
        return { host: '', port: '', db: '/db/sample-northwind-duckdb/northwind.duckdb', user: '', pass: '' };
      case 'clickhouse':
        return { host: 'localhost', port: '8123', db: 'northwind', user: 'default', pass: 'clickhouse' };
      case 'supabase':
        return { host: 'localhost', port: '5435', db: 'Northwind', user: 'supabase_admin', pass: 'postgres' };
      default:
        return { host: 'localhost', port: '5432', db: 'Northwind', user: 'postgres', pass: 'postgres' };
    }
  }


  static deleteAndAssertEmailConnection(
    ft: FluentTester,
    connectionFileName: string,
  ): FluentTester {
    return ft
      .gotoConnections()
      .waitOnElementToBecomeVisible(`#${connectionFileName}`)
      .clickAndSelectTableRow(`#${connectionFileName}`)
      .waitOnElementToBecomeEnabled('#btnDelete')
      .elementShouldBeEnabled('#btnDelete')
      .click('#btnDelete')
      .waitOnElementToBecomeVisible('#confirmDialog')
      .clickNoDontDoThis()
      .waitOnElementToBecomeInvisible('#confirmDialog')
      // re-select row because some UIs clear selection after dialog dismissal
      .clickAndSelectTableRow(`#${connectionFileName}`)
      .waitOnElementToBecomeEnabled('#btnDelete')
      .click('#btnDelete')
      .waitOnElementToBecomeVisible('#confirmDialog')
      .clickYesDoThis()
      .waitOnElementToBecomeInvisible(`#${connectionFileName}`)
      .gotoConnections()
      .elementShouldNotBeVisible(`#${connectionFileName}`);
  }

  static duplicateAndAssertEmailConnection(
    ft: FluentTester,
    connectionName: string,
  ): FluentTester {
    const connectionFileName = `eml-${_.kebabCase(connectionName)}\\.xml`;
    const newConnectionName = `${connectionName} Duplicated`;
    const newConnectionFileName = `eml-${_.kebabCase(newConnectionName)}\\.xml`;

    return ft
      .gotoConnections()
      .waitOnElementToHaveText(
        `#${connectionFileName} td:first-child`,
        `${connectionName} Modified`,
      )
      .clickAndSelectTableRow(`#${connectionFileName}`)
      .waitOnElementToBecomeEnabled('#btnDuplicate')
      .click('#btnDuplicate')
      .waitOnElementToBecomeEnabled('#connectionName')
      .click('#connectionName')
      .typeText(`${connectionName}`)
      .waitOnElementToContainText('#alreadyExistsWarning', 'already exists')
      .waitOnElementToBecomeDisabled('#btnOKConfirmationConnectionModal')
      .click('#connectionName')
      .typeText('')
      .waitOnElementToBecomeInvisible('#alreadyExistsWarning')
      .elementShouldBeDisabled('#btnOKConfirmationConnectionModal')
      .typeText(`${newConnectionName}`)
      .waitOnElementToBecomeEnabled('#btnOKConfirmationConnectionModal')
      .click('#emailServerHost')
      .typeText('smtp.exmail.qq.com Duplicated')
      .click('#smtpPort')
      .typeText('777')
      .pageShouldContainText('Create Email Connection')
      .click('#btnOKConfirmationConnectionModal')
      .waitOnElementToHaveText(
        `#${newConnectionFileName} td:first-child`,
        `${newConnectionName}`,
      )
      .gotoConnections()
      .waitOnElementToHaveText(
        `#${connectionFileName} td:first-child`,
        `${connectionName} Modified`,
      )
      .waitOnElementToHaveText(
        `#${newConnectionFileName} td:first-child`,
        `${newConnectionName}`,
      )
      .clickAndSelectTableRow(`#${newConnectionFileName}`)
      .waitOnElementToBecomeEnabled('#btnEdit')
      .click('#btnEdit')
      .waitOnElementToBecomeEnabled('#btnOKConfirmationConnectionModal')
      .inputShouldHaveValue('#connectionName', `${newConnectionName}`)
      .inputShouldHaveValue('#emailServerHost', 'smtp.exmail.qq.com Duplicated')
      .inputShouldHaveValue('#smtpPort', '777')
      .click('#btnCloseConnectionModal');
  }

  static readUpdateAndAssertEmailConnection(
    ft: FluentTester,
    connectionName: string,
  ): FluentTester {
    const connectionFileName = `eml-${_.kebabCase(connectionName)}\\.xml`;

    return ft
      .gotoConnections()
      .waitOnElementToHaveText(
        `#${connectionFileName} td:first-child`,
        connectionName,
      )
      .clickAndSelectTableRow(`#${connectionFileName}`)
      .waitOnElementToBecomeEnabled('#btnEdit')
      .click('#btnEdit')
      .waitOnElementToBecomeEnabled('#btnOKConfirmationConnectionModal')
      .inputShouldHaveValue('#connectionName', connectionName)
      .inputShouldHaveValue('#emailServerHost', 'smtp.exmail.qq.com')
      .inputShouldHaveValue('#smtpPort', '465')
      .elementCheckBoxShouldBeSelected('#btnSSL')
      .elementCheckBoxShouldNotBeSelected('#btnTLS')
      .inputShouldHaveValue('#fromName', '${var0}')
      .inputShouldHaveValue('#fromEmailAddress', '${var1}')
      .inputShouldHaveValue('#userName', '${var2}')
      .inputShouldHaveValue('#smtpPassword', '${var3}')
      .pageShouldContainText('Update Email Connection')
      .click('#btnCloseConnectionModal')
      .elementShouldHaveText(
        `#${connectionFileName} td:first-child`,
        connectionName,
      )
      .click('#btnEdit')
      .waitOnElementToBecomeEnabled('#btnOKConfirmationConnectionModal')
      .click('#connectionName')
      .typeText(`${connectionName} Modified`)
      .click('#emailServerHost')
      .typeText('smtp.exmail.qq.com Modified')
      .click('#smtpPort')
      .typeText('999')
      .click('#btnSSL')
      .click('#btnTLS')
      .click('#fromName')
      .typeText('${var0} Modified')
      .click('#fromEmailAddress')
      .typeText('${var1} Modified')
      .click('#userName')
      .typeText('${var2} Modified')
      .click('#smtpPassword')
      .typeText('${var3} Modified')
      .click('#btnOKConfirmationConnectionModal')
      .waitOnElementToHaveText(
        `#${connectionFileName} td:first-child`,
        `${connectionName} Modified`,
      )
      .gotoConnections()
      .waitOnElementToHaveText(
        `#${connectionFileName} td:first-child`,
        `${connectionName} Modified`,
      )
      .clickAndSelectTableRow(`#${connectionFileName}`)
      .waitOnElementToBecomeEnabled('#btnEdit')
      .click('#btnEdit')
      .waitOnElementToBecomeEnabled('#btnOKConfirmationConnectionModal')
      .inputShouldHaveValue('#connectionName', `${connectionName} Modified`)
      .inputShouldHaveValue('#emailServerHost', 'smtp.exmail.qq.com Modified')
      .inputShouldHaveValue('#smtpPort', '999')
      .elementCheckBoxShouldNotBeSelected('#btnSSL')
      .elementCheckBoxShouldBeSelected('#btnTLS')
      .inputShouldHaveValue('#fromName', '${var0} Modified')
      .inputShouldHaveValue('#fromEmailAddress', '${var1} Modified')
      .inputShouldHaveValue('#userName', '${var2} Modified')
      .inputShouldHaveValue('#smtpPassword', '${var3} Modified')
      .click('#btnCloseConnectionModal');
  }

  static createAndAssertNewEmailConnection(
    ft: FluentTester,
    connectionName: string,
  ): FluentTester {
    const connectionFileName = `eml-${_.kebabCase(connectionName)}\\.xml`;

    return ft
      .gotoConnections()
      .waitOnElementToBecomeEnabled('#btnNewDropdown') // Wait for the dropdown button to be enabled
      .click('#btnNewDropdown') // Click the dropdown button
      .waitOnElementToBecomeVisible('#btnNewEmail') // Wait for the email option to appear
      .click('#btnNewEmail')
      .waitOnElementToBecomeVisible('#connectionName')
      .elementShouldBeDisabled('#btnOKConfirmationConnectionModal')
      .click('#btnCloseConnectionModal')
      .waitOnElementToBecomeInvisible('#btnCloseConnectionModal')
      .click('#btnNewDropdown') // Click the dropdown button
      .waitOnElementToBecomeVisible('#btnNewEmail') // Wait for the email option to appear
      .click('#btnNewEmail')
      .waitOnElementToBecomeVisible('#connectionName')
      .click('#connectionName')
      .typeText('Contact')
      .waitOnElementToContainText('#alreadyExistsWarning', 'already exists')
      .typeText(connectionName)
      .waitOnElementToBecomeInvisible('#alreadyExistsWarning')
      .waitOnElementToBecomeEnabled('#btnOKConfirmationConnectionModal')
      .click('#btnWellKnownEmailProviders')
      .waitOnElementToBecomeVisible('#btnShowMoreProviders')
      .click('#modalWellKnownEmailProviders *[id=btnClose]')
      .waitOnElementToBecomeInvisible('#btnShowMoreProviders')
      .click('#btnWellKnownEmailProviders')
      .waitOnElementToBecomeVisible('#btnShowMoreProviders')
      .click('#btnShowMoreProviders')
      .click('#QQex')
      .click('#modalWellKnownEmailProviders *[id=btnOKConfirmation]')
      .inputShouldHaveValue('#emailServerHost', 'smtp.exmail.qq.com')
      .inputShouldHaveValue('#smtpPort', '465')
      .elementCheckBoxShouldBeSelected('#btnSSL')
      .elementCheckBoxShouldNotBeSelected('#btnTLS')
      .click('#fromName')
      .typeText('')
      .click('#btnFromNameVariables')
      .click('#\\$\\{var0\\}')
      .click('#modalSelectVariable *[id=btnOKConfirmation]')
      .click('#fromEmailAddress')
      .typeText('')
      .click('#btnFromEmailAddressVariables')
      .click('#\\$\\{var1\\}')
      .click('#modalSelectVariable *[id=btnOKConfirmation]')
      .click('#userName')
      .typeText('')
      .click('#btnUserNameVariables')
      .click('#\\$\\{var2\\}')
      .click('#modalSelectVariable *[id=btnOKConfirmation]')
      .click('#smtpPassword')
      .typeText('')
      .click('#btnSmtpPasswordVariables')
      .click('#btnShowMoreVariables')
      .waitOnElementToBecomeVisible('#\\$\\{var3\\}')
      .click('#\\$\\{var3\\}')
      .click('#modalSelectVariable *[id=btnOKConfirmation]')
      .pageShouldContainText('Create Email Connection')
      .click('#btnOKConfirmationConnectionModal')
      .waitOnElementToHaveText(
        `#${connectionFileName} td:first-child`,
        connectionName,
      );
  }

  static makeConnectionAsDefault(
    ft: FluentTester,
    connectionFileName: string,
  ): FluentTester {

    // not default -> perform the normal fluent UI flow to make it default
    return ft
      .clickAndSelectTableRow(`#${connectionFileName}`)
      .waitOnElementToBecomeVisible(`#btnActions_${connectionFileName}`)
      .click(`#btnActions_${connectionFileName}`)
      .waitOnElementToBecomeVisible(`#btnToggleDefault_${connectionFileName}`)
      // first click (cancel) to ensure dialog flow works
      .click(`#btnToggleDefault_${connectionFileName}`)
      .clickNoDontDoThis()
      // repeat and confirm
      .click(`#btnActions_${connectionFileName}`)
      .waitOnElementToBecomeVisible(`#btnToggleDefault_${connectionFileName}`)
      .click(`#btnToggleDefault_${connectionFileName}`)
      .clickYesDoThis()
      .waitOnElementToBecomeInvisible(`#btnActions_${connectionFileName}`)
      .waitOnElementToBecomeVisible(`#btnDefault_${connectionFileName}`)
      .waitOnElementToHaveClass('#btnDelete', 'disabled');
  }

  static assertConfigurationUsesEmailConnection(
    ft: FluentTester,
    folderName: string,
    emailConnectionName: string,
    shouldBeTheDefaultEmailConnection: string,
  ): FluentTester {
    ft = ConfigurationTestHelper.loadConfiguration(ft, folderName)

    ft = ft
      .click('#leftMenuEmailSettings') // email SMTP settings
      .elementCheckBoxShouldBeSelected('#btnUseExistingEmailConnection')
      .elementShouldBeEnabled('#btnSelectedEmailConnection')
      .elementShouldContainText(
        '#btnSelectedEmailConnection',
        emailConnectionName,
      );

    if (shouldBeTheDefaultEmailConnection == 'yes-default-connection')
      ft = ft.elementShouldBeVisible('#selectedEmailConnectionDefault');
    else ft = ft.elementShouldNotBeVisible('#selectedEmailConnectionDefault');

    if (emailConnectionName == 'Email Contact Information') {
      ft = ft
        .inputShouldHaveValue('#fromName', 'From Name')
        .inputShouldHaveValue('#fromEmailAddress', 'from@emailaddress.com')
        .inputShouldHaveValue('#emailServerHost', 'Email Server Host')
        .inputShouldHaveValue('#smtpPort', '25')
        .inputShouldHaveValue('#userName', 'From Email User ID')
        .inputShouldHaveValue('#smtpPassword', 'From Email Password')
        .elementCheckBoxShouldNotBeSelected('#btnSSL')
        .elementCheckBoxShouldNotBeSelected('#btnTLS');
    } else if (emailConnectionName == 'Test Contact Information') {
      ft = ft
        .inputShouldHaveValue('#fromName', '${var0}')
        .inputShouldHaveValue('#fromEmailAddress', '${var1}')
        .inputShouldHaveValue('#emailServerHost', 'smtp.exmail.qq.com')
        .inputShouldHaveValue('#smtpPort', '465')
        .inputShouldHaveValue('#userName', '${var2}')
        .inputShouldHaveValue('#smtpPassword', '${var3}')
        .elementCheckBoxShouldBeSelected('#btnSSL')
        .elementCheckBoxShouldNotBeSelected('#btnTLS');
    }
    ft = ft
      .elementShouldBeDisabled('#fromName')
      .elementShouldBeDisabled('#fromEmailAddress')
      .elementShouldBeDisabled('#emailServerHost')
      .elementShouldBeDisabled('#smtpPort')
      .elementShouldBeDisabled('#userName')
      .elementShouldBeDisabled('#smtpPassword')
      .elementShouldBeDisabled('#btnTLS')
      .elementShouldBeDisabled('#btnSSL')
      .elementShouldHaveAttribute('#btnFromNameVariables button', 'disabled')
      .elementShouldHaveAttribute(
        '#btnFromEmailAddressVariables button',
        'disabled',
      )
      .elementShouldHaveAttribute(
        '#btnEmailServerHostVariables button',
        'disabled',
      )
      .elementShouldHaveAttribute('#btnSmtpPortVariables button', 'disabled')
      .elementShouldHaveAttribute('#btnUserNameVariables button', 'disabled')
      .elementShouldHaveAttribute(
        '#btnSmtpPasswordVariables button',
        'disabled',
      );

    return ft;
  }

  /**
   * Creates a new database connection and asserts that it was created correctly
   * @param ft FluentTester instance
   * @param connectionName Name for the new connection
   * @param dbVendor Database vendor type (one of Constants.DB_VENDORS_SUPPORTED)
   */
  static createAndAssertNewDatabaseConnection(
    ft: FluentTester,
    connectionName: string,
    dbVendor: string,
  ): FluentTester {
    const connectionCode = `db-${_.kebabCase(connectionName)}-${dbVendor}`;
    //const kebabConnectionName = _.kebabCase(connectionName); // Needed for fillNewDatabaseConnectionDetails

    // Navigate and open the modal
    ft = ft
      .gotoConnections()
      .waitOnElementToBecomeEnabled('#btnNewDropdown')
      .click('#btnNewDropdown')
      .waitOnElementToBecomeVisible('#btnNewDatabase')
      .click('#btnNewDatabase')
      .waitOnElementToBecomeVisible('#modalDbConnection')
      // Wait for a field to be ready before filling, e.g., connection name input
      .waitOnElementToBecomeEnabled('#dbConnectionName');

    // Fill connection details using the reusable helper
    // This replaces the manual .typeText, .dropDownSelectOptionHavingValue, and if/else block for vendor specifics
    ft = ConnectionsTestHelper.fillNewDatabaseConnectionDetails(
      ft,
      connectionName,
      dbVendor,
      //kebabConnectionName,
    );

    // Save the connection and perform assertions (this part remains the same as your original)
    return ft
      .waitOnElementToBecomeEnabled('#btnOKConfirmationDbConnectionModal')
      .click('#btnOKConfirmationDbConnectionModal')
      .waitOnElementToBecomeInvisible('#btnOKConfirmationDbConnectionModal')
      .waitOnElementToBecomeVisible(`#${connectionCode}\\.xml`)
      .clickAndSelectTableRow(`#${connectionCode}\\.xml`)
      .elementShouldContainText(
        `#${connectionCode}\\.xml td:first-child`,
        connectionName,
      )
      .elementShouldContainText(
        `#${connectionCode}\\.xml td:nth-child(2)`,
        'database-connection',
      )
      .elementShouldHaveText(
        `#${connectionCode}\\.xml td:nth-child(3)`,
        '--not used--',
      );
  }

  /**
   * Reads an existing database connection, updates its values, and asserts the changes
   * @param ft FluentTester instance
   * @param connectionName Name of the connection to update
   * @param dbVendor Database vendor type (one of Constants.DB_VENDORS_SUPPORTED)
   */
  static readUpdateAndAssertDatabaseConnection(
    ft: FluentTester,
    connectionName: string,
    dbVendor: string,
  ): FluentTester {
    const connectionCode = `db-${_.kebabCase(connectionName)}-${dbVendor}`;
    const updatedConnectionName = `${connectionName} Updated`;

    // Start sequence for updating
    let sequence = ft
      .gotoConnections()
      .clickAndSelectTableRow(`#${connectionCode}\\.xml`)
      .waitOnElementToBecomeEnabled('#btnEdit')
      .click('#btnEdit')
      .waitOnElementToBecomeVisible('#dbConnectionName')
      .click('#dbConnectionName')
      .typeText('')
      .typeText(updatedConnectionName);

    // Vendor-specific update logic
    if (dbVendor === 'sqlite') {
      // For SQLite, we only update the database file path
      sequence = sequence
        .createFolder(
          `${process.env.PORTABLE_EXECUTABLE_DIR}/db/sample-northwind-sqlite-test`,
        )
        .copyFile(
          `${process.env.PORTABLE_EXECUTABLE_DIR}/db/sample-northwind-sqlite/northwind.db`,
          `${process.env.PORTABLE_EXECUTABLE_DIR}/db/sample-northwind-sqlite-test/northwind-test.db`,
        )
        .click('#btnBrowseSqliteFile')
        .waitOnElementToBecomeEnabled(
          '#childDirLinksample-northwind-sqlite-test',
        )
        .click('#childDirLinksample-northwind-sqlite-test')
        .waitOnElementToBecomeVisible('#tdFileNamenorthwind-test\\.db')
        .elementShouldBeDisabled('#btnSelectFileExplorer')
        .click('#tdFileNamenorthwind-test\\.db');
      sequence = sequence
        .waitOnElementToBecomeEnabled('#btnSelectFileExplorer')
        .click('#btnSelectFileExplorer')
        .waitOnElementToBecomeInvisible('#btnSelectFileExplorer')
        .waitOnInputValueToContainText(
          '#dbName',
          '/db/sample-northwind-sqlite-test/northwind-test.db',
        );
    } else if (dbVendor === 'duckdb') {
      // DuckDB update: copy file to test dir, browse to it (#dbName is readonly)
      sequence = sequence
        .createFolder(
          `${process.env.PORTABLE_EXECUTABLE_DIR}/db/sample-northwind-duckdb-test`,
        )
        .copyFile(
          `${process.env.PORTABLE_EXECUTABLE_DIR}/db/sample-northwind-duckdb/northwind.duckdb`,
          `${process.env.PORTABLE_EXECUTABLE_DIR}/db/sample-northwind-duckdb-test/northwind-test.duckdb`,
        )
        .click('#btnBrowseSqliteFile')
        .waitOnElementToBecomeEnabled(
          '#childDirLinksample-northwind-duckdb-test',
        )
        .click('#childDirLinksample-northwind-duckdb-test')
        .waitOnElementToBecomeVisible('#tdFileNamenorthwind-test\\.duckdb')
        .elementShouldBeDisabled('#btnSelectFileExplorer')
        .click('#tdFileNamenorthwind-test\\.duckdb');
      sequence = sequence
        .waitOnElementToBecomeEnabled('#btnSelectFileExplorer')
        .click('#btnSelectFileExplorer')
        .waitOnElementToBecomeInvisible('#btnSelectFileExplorer')
        .waitOnInputValueToContainText(
          '#dbName',
          '/db/sample-northwind-duckdb-test/northwind-test.duckdb',
        );
    } else {
      // For server-based databases (PostgreSQL, MySQL, ClickHouse, etc.), update host and port
      sequence = sequence
        .click('#dbHost')
        .typeText('')
        .typeText('db.example.com')
        .click('#dbPort')
        .typeText('')
        .typeText('5433');
    }

    // Complete the update sequence
    return sequence
      .waitOnElementToBecomeEnabled('#btnOKConfirmationDbConnectionModal')
      .click('#btnOKConfirmationDbConnectionModal')
      .waitOnElementToBecomeInvisible('#btnOKConfirmationDbConnectionModal')
      .waitOnElementToBecomeVisible(`#${connectionCode}\\.xml`)
      .clickAndSelectTableRow(`#${connectionCode}\\.xml`)
      .elementShouldContainText(
        `#${connectionCode}\\.xml td:first-child`,
        updatedConnectionName,
      );
  }

  /**
   * Duplicates an existing database connection and asserts the duplicate was created
   * @param ft FluentTester instance
   * @param connectionName Name of the connection to duplicate
   * @param dbVendor Database vendor type (one of Constants.DB_VENDORS_SUPPORTED)
   */
  static duplicateAndAssertDatabaseConnection(
    ft: FluentTester,
    connectionName: string,
    dbVendor: string,
  ): FluentTester {
    const originalConnectionCode = `db-${_.kebabCase(connectionName)}-${dbVendor}`;

    // This will be the new unique name we type for the duplicated connection.
    const newNameForDuplicate = `${connectionName} Duplicated`;
    // This will be the code/ID of the newly created duplicated connection based on the new unique name.
    const newDuplicateConnectionCode = `db-${_.kebabCase(newNameForDuplicate)}-${dbVendor}`;

    return (
      ft
        .gotoConnections()
        .clickAndSelectTableRow(`#${originalConnectionCode}\\.xml`)
        .waitOnElementToBecomeEnabled('#btnDuplicate')
        .click('#btnDuplicate')
        .waitOnElementToBecomeVisible('#dbConnectionName')
        // --- Start: New logic similar to the email duplication test ---
        .click('#dbConnectionName') // Focus the name field
        .typeText(connectionName) // Type the current name of the connection being duplicated
        .waitOnElementToContainText('#dbAlreadyExistsWarning', 'already exists') // Check for the warning
        .waitOnElementToBecomeDisabled('#btnOKConfirmationDbConnectionModal') // Save button should be disabled

        .click('#dbConnectionName') // Focus again to clear
        .typeText('') // Clear the name field
        .waitOnElementToBecomeInvisible('#dbAlreadyExistsWarning') // Warning should disappear
        .elementShouldBeDisabled('#btnOKConfirmationDbConnectionModal') // Save button still disabled (empty name)

        .typeText(newNameForDuplicate) // Type the new, unique name for the duplicate
        .waitOnElementToBecomeEnabled('#btnOKConfirmationDbConnectionModal') // Save button should become enabled
        // --- End: New logic ---

        .pageShouldContainText('Create Database Connection') // Verify modal title for duplicate is "Create..."
        .click('#btnOKConfirmationDbConnectionModal') // Click Save
        .waitOnElementToBecomeInvisible('#btnOKConfirmationDbConnectionModal')
        .waitOnElementToBecomeVisible(`#${newDuplicateConnectionCode}\\.xml`) // Wait for the new duplicated entry in the list
        .clickAndSelectTableRow(`#${newDuplicateConnectionCode}\\.xml`) // Select the new duplicated entry
        .elementShouldContainText(
          `#${newDuplicateConnectionCode}\\.xml td:first-child`, // Verify the name in the list
          newNameForDuplicate,
        )
        .elementShouldContainText(
          `#${newDuplicateConnectionCode}\\.xml td:nth-child(2)`,
          'database-connection',
        )
        .elementShouldHaveText(
          `#${newDuplicateConnectionCode}\\.xml td:nth-child(3)`,
          '--not used--',
        )
    );
  }

  /**
   * Deletes a database connection and verifies that it and all its associated files are deleted
   * @param ft FluentTester instance
   * @param connectionFileName Name of the connection file (with xml extension)
   * @param dbVendor Database vendor type (one of Constants.DB_VENDORS_SUPPORTED)
   */
  static deleteAndAssertDatabaseConnection(
    ft: FluentTester,
    connectionFileName: string,
    dbVendor: string,
  ): FluentTester {
    // We'll verify the deletion in the UI first
    return ft
      .gotoConnections()
      .clickAndSelectTableRow(`#${connectionFileName}`)
      .waitOnElementToBecomeEnabled('#btnDelete')
      .click('#btnDelete')
      .waitOnElementToBecomeVisible('.dburst-button-question-confirm')
      .clickYesDoThis()
      .waitOnElementToBecomeInvisible(`#${connectionFileName}`)
      .gotoConnections()
      .elementShouldNotBeVisible(`#${connectionFileName}`);
  }

  // Helper methods for database vendors default values
  /**
   * Get the default host name for the given database vendor
   */
  static getDefaultHostForVendor(dbVendor: string): string {
    switch (dbVendor) {
      case 'oracle':
        return 'oracle-db.example.com';
      case 'sqlserver':
        return 'sqlserver.example.com';
      case 'postgresql':
        return 'localhost';
      case 'mysql':
        return 'mysql.example.com';
      case 'mariadb':
        return 'mariadb.example.com';
      case 'ibmdb2':
        return 'db2.example.com';
      default:
        return 'localhost';
    }
  }

  /**
   * Get the default port for the given database vendor
   */
  static getDefaultPortForVendor(dbVendor: string): string {
    switch (dbVendor) {
      case 'oracle':
        return '1521';
      case 'sqlserver':
        return '1433';
      case 'postgresql':
        return '5432';
      case 'mysql':
        return '3306';
      case 'mariadb':
        return '3306';
      case 'ibmdb2':
        return '50000';
      default:
        return '5432';
    }
  }

  /**
   * Get the default database name for the given database vendor
   */
  static getDefaultDatabaseNameForVendor(dbVendor: string): string {
    switch (dbVendor) {
      case 'oracle':
        return 'XEPDB1';
      case 'sqlserver':
        return 'master';
      case 'postgresql':
        return 'postgres';
      case 'mysql':
        return 'test';
      case 'mariadb':
        return 'test';
      case 'ibmdb2':
        return 'sample';
      default:
        return 'test';
    }
  }

  /**
   * Get the default username for the given database vendor
   */
  static getDefaultUsernameForVendor(dbVendor: string): string {
    switch (dbVendor) {
      case 'oracle':
        return 'system';
      case 'sqlserver':
        return 'sa';
      case 'postgresql':
        return 'postgres';
      case 'mysql':
        return 'root';
      case 'mariadb':
        return 'root';
      case 'ibmdb2':
        return 'db2inst1';
      default:
        return 'admin';
    }
  }

  /**
   * Get the default password for the given database vendor
   */
  static getDefaultPasswordForVendor(dbVendor: string): string {
    // Use simple passwords for testing
    switch (dbVendor) {
      case 'oracle':
        return 'oracle';
      case 'sqlserver':
        return 'Password123!';
      case 'postgresql':
        return 'postgres';
      case 'mysql':
        return 'password';
      case 'mariadb':
        return 'password';
      case 'ibmdb2':
        return 'password';
      default:
        return 'password';
    }
  }

  /**
   * Fills the details in an already open "New/Edit Database Connection" modal.
   * For SQLite, this includes interacting with the file browser to create the DB file.
   * This function does NOT click the final "OK" or "Save" button of the modal.
   */
  public static fillNewDatabaseConnectionDetails(
    ft: FluentTester,
    connectionName: string,
    dbVendor: string,
    //kebabConnectionName: string, // Used for generating default DB names and SQLite filename
  ): FluentTester {
    ft = ft.consoleLog(
      `Filling database connection details for: ${connectionName}, Vendor: ${dbVendor}`,
    );

    // 1. Fill Connection Name
    ft = ft
      .waitOnElementToBecomeEnabled('#dbConnectionName')
      .click('#dbConnectionName') // Ensure focus
      .typeText(connectionName);

    // 2. Select Database Type
    const dbVendorSelectValue = dbVendor.toLowerCase();
    ft = ft.dropDownSelectOptionHavingValue('#dbType', dbVendorSelectValue);
    // No verification needed - if selection fails, subsequent steps (file browser, save) will fail anyway
    // Original working code (connections.spec.ignore) never verified dropdown selection

    // 3. Fill vendor-specific details
    if (dbVendorSelectValue === 'sqlite') {
      // SQLite requires a file path via file browser
      ft = ft.waitOnElementToBecomeEnabled('#btnBrowseSqliteFile');
      ft = ft.click('#btnBrowseSqliteFile');

      ft = ft.waitOnElementToBecomeEnabled(
        '#childDirLinksample-northwind-sqlite',
      );
      ft = ft.click('#childDirLinksample-northwind-sqlite');

      ft = ft.waitOnElementToBecomeVisible('#tdFileNamenorthwind\\.db');

      ft = ft.elementShouldBeDisabled('#btnSelectFileExplorer');
      ft = ft.click('#tdFileNamenorthwind\\.db');
      ft = ft.waitOnElementToBecomeEnabled('#btnSelectFileExplorer');

      ft = ft.click('#btnSelectFileExplorer');
      ft = ft.waitOnElementToBecomeInvisible('#btnSelectFileExplorer');
      ft = ft.waitOnInputValueToContainText(
        '#dbName',
        '/db/sample-northwind-sqlite/northwind.db',
      );
    } else if (dbVendorSelectValue === 'duckdb') {
      // DuckDB is file-based: use file browser (same as SQLite — #dbName is readonly)
      ft = ft.waitOnElementToBecomeEnabled('#btnBrowseSqliteFile');
      ft = ft.click('#btnBrowseSqliteFile');
      ft = ft.waitOnElementToBecomeEnabled('#childDirLinksample-northwind-duckdb');
      ft = ft.click('#childDirLinksample-northwind-duckdb');
      ft = ft.waitOnElementToBecomeVisible('#tdFileNamenorthwind\\.duckdb');
      ft = ft.elementShouldBeDisabled('#btnSelectFileExplorer');
      ft = ft.click('#tdFileNamenorthwind\\.duckdb');
      ft = ft.waitOnElementToBecomeEnabled('#btnSelectFileExplorer');
      ft = ft.click('#btnSelectFileExplorer');
      ft = ft.waitOnElementToBecomeInvisible('#btnSelectFileExplorer');
      ft = ft.waitOnInputValueToContainText(
        '#dbName',
        '/db/sample-northwind-duckdb/northwind.duckdb',
      );
    } else {
      // Server-based databases (PostgreSQL, MySQL, ClickHouse, etc.)
      const d = ConnectionsTestHelper.dbServerConnDefaults(dbVendorSelectValue);

      ft = ft
        .waitOnElementToBecomeEnabled('#dbHost').click('#dbHost').typeText(d.host)
        .waitOnElementToBecomeEnabled('#dbPort').click('#dbPort').typeText(d.port)
        .waitOnElementToBecomeEnabled('#dbName').click('#dbName').typeText(d.db)
        .waitOnElementToBecomeEnabled('#dbUsername').click('#dbUsername').typeText(d.user)
        .waitOnElementToBecomeEnabled('#dbPassword').click('#dbPassword').typeText(d.pass);
    }

    ft = ft.consoleLog(
      `Finished filling database connection details for: ${connectionName}`,
    );
    return ft;
  }

  static useForJasperReports(
    ft: FluentTester,
    connectionFileName: string,
  ): FluentTester {
    // The dropdown button is btnDefault_ (blue) for default connections
    // or btnActions_ (grey) for non-default — click whichever is visible
    const dropdownSelector = `#btnDefault_${connectionFileName}, #btnActions_${connectionFileName}`;
    return ft
      .gotoConnections()
      .clickAndSelectTableRow(`#${connectionFileName}`)
      .waitOnElementToBecomeVisible(dropdownSelector)
      .click(dropdownSelector)
      .waitOnElementToBecomeVisible(`#btnUseForJasper_${connectionFileName}`)
      .click(`#btnUseForJasper_${connectionFileName}`)
      .confirmDialogShouldBeVisible()
      .clickYesDoThis();
  }

  static _waitForStarterPackToBeInState(
    ft: FluentTester,
    packId: string,
    state: StarterPackState,
    timeout: number = Constants.DELAY_FIVE_THOUSANDS_SECONDS,
  ): FluentTester {
    if (!packId) return ft.consoleLog(`Invalid starter pack id '${packId}'`);

    const btnSel = `#btnStartStop_${packId}`;
    const iconSel = `#btnStartStop_${packId} #starterPackIcon_${packId}`;
    const spinnerSel = `#btnStartStop_${packId} #starterPackSpinner_${packId}`;

    let seq = ft;

    switch (state) {
      case 'starting':
        return seq
          .waitOnElementToBecomeDisabled(btnSel, timeout)
          .waitOnElementToBecomeVisible(spinnerSel, timeout)
          .waitOnElementToHaveText(btnSel, 'Starting', timeout)
          .consoleLog(`Starter pack '${packId}' entered 'starting' state.`);
      case 'stopping':
        return seq
          .waitOnElementToBecomeDisabled(btnSel, timeout)
          .waitOnElementToBecomeVisible(spinnerSel, timeout)
          .waitOnElementToHaveText(btnSel, 'Stopping', timeout)
          .consoleLog(`Starter pack '${packId}' entered 'stopping' state.`);
      case 'running':
        return seq
          .waitOnElementToBecomeEnabled(btnSel, timeout)
          .waitOnElementToHaveText(btnSel, 'Stop', timeout)
          .waitOnElementToBecomeVisible(iconSel, timeout)
          .waitOnElementToHaveClass(iconSel, 'fa-stop', timeout)
          .consoleLog(`Starter pack '${packId}' is 'running'.`);
      case 'stopped':
        return seq
          .waitOnElementToBecomeEnabled(btnSel, timeout)
          .waitOnElementToHaveText(btnSel, 'Start', timeout)
          .waitOnElementToBecomeVisible(iconSel, timeout)
          .waitOnElementToHaveClass(iconSel, 'fa-play', timeout)
          .consoleLog(`Starter pack '${packId}' is 'stopped'.`);
      case 'error':
        return seq
          .waitOnElementToBecomeEnabled(btnSel, timeout)
          .waitOnElementToHaveText(btnSel, 'Start', timeout)
          .consoleLog(`Starter pack '${packId}' reported 'error' / not running.`);
      case 'unknown':
      default:
        return seq.consoleLog(
          `Starter pack '${packId}' is in 'unknown' / control visible state.`,
        );
    }
  }

  static setStarterPackStateForVendor(
    ft: FluentTester,
    dbVendor: string,
    action: 'start' | 'stop',
    fullTimeout: number = Constants.DELAY_FIVE_THOUSANDS_SECONDS,
  ): FluentTester {

    const packId = vendorToPackId(dbVendor);
    const btnSel = `#btnStartStop_${packId}`;

    // Navigate, then operate only on the Start/Stop button (container ID is not reliable)
    let seq = ft
      .gotoStarterPacks()
      .setValue('#packSearch', dbVendor)
      // debounce in component is 300ms; add small buffer
      .sleep(400)
      .waitOnElementToBecomeVisible(btnSel);

    // --- MINIMAL LIVE PRECHECK: probe page state after navigation, and cancel queued actions if already in target state ---
    const probeAction = async (): Promise<void> => {
      try {
        // quick non-blocking probe of the button presence/visibility
        const exists = await ft.elementExistsNow(btnSel, 1000);
        if (!exists) {
          // no control found -> nothing to do
          console.log(`[ConnectionsTestHelper] Starter pack control not present for '${packId}' (btnSel=${btnSel}) - skipping start/stop probe.`);
          return;
        }

        // read normalized button text and decide
        const raw = (await ft.getElementTextContent(btnSel) || '').replace(/\s+/g, ' ').trim().toLowerCase();
        if (action === 'start') {
          if (raw.includes('stop') && !raw.includes('start')) {
            console.log(`Starter pack '${packId}' already running; skipping start.`);
            // cancel queued follow-up actions (prevents the start flow)
            ft.actions = [];
            return;
          }
        } else {
          if (raw.includes('start') && !raw.includes('stop')) {
            console.log(`Starter pack '${packId}' already stopped; skipping stop.`);
            // cancel queued follow-up actions (prevents the stop flow)
            ft.actions = [];
            return;
          }
        }
      } catch (err) {
        // on probe errors fall back to normal flow (do nothing)
        console.warn(`[ConnectionsTestHelper] probeAction failed for '${packId}': ${err && err.message}`);
      }
    };

    // push probeAction so it runs after the navigation actions but before the start/stop actions added below
    seq.actions.push(probeAction);
    // --- end precheck ---

    // --- MINIMAL PRE-VALIDATION + original flow (queued) ---
    if (action === 'start') {
      // assert UI shows "Start" before attempting to start (tolerant contains)
      seq = seq.elementShouldContainText(btnSel, 'Start');
    } else {
      seq = seq.elementShouldContainText(btnSel, 'Stop');
    }

    seq = seq
      .waitOnElementToBecomeEnabled(btnSel)
      .click(btnSel)
      .confirmDialogShouldBeVisible()
      .clickYesDoThis()
      .consoleLog(`Requested ${action} for starter pack '${packId}'.`);

    if (action === 'start') {
      seq = this._waitForStarterPackToBeInState(
        seq,
        packId,
        'starting',
        fullTimeout,
      );
      seq = this._waitForStarterPackToBeInState(seq, packId, 'running', fullTimeout);
      return seq;
    }

    // action === 'stop'
    seq = this._waitForStarterPackToBeInState(
      seq,
      packId,
      'stopping',
      fullTimeout,
    );
    seq = this._waitForStarterPackToBeInState(seq, packId, 'stopped', fullTimeout);
    return seq;
  }

  static dockerComposeDownInDbFolder(
    timeoutMs: number = Constants.DELAY_FIVE_THOUSANDS_SECONDS,
    removeVolumes: boolean = true
  ): void {
    const baseDir = String(process.env.PORTABLE_EXECUTABLE_DIR || '.');
    const dbDir = path.resolve(baseDir, 'db');
    const isWin = process.platform === 'win32';

    let cmd: string;
    let args: string[];

    const downCmd = removeVolumes ? 'docker compose down -v' : 'docker compose down';

    if (isWin) {
      cmd = 'powershell.exe';
      // run the compose command inside PowerShell so PATH/resolution works on Windows
      args = ['-NoProfile', '-NonInteractive', '-Command', downCmd];
    } else {
      cmd = 'docker';
      args = removeVolumes ? ['compose', 'down', '-v'] : ['compose', 'down'];
    }

    console.log(`[ConnectionsTestHelper] (blocking) running: ${cmd} ${args.join(' ')} (cwd=${dbDir})`);

    const res = spawnSync(cmd, args, {
      cwd: dbDir,
      encoding: 'utf8',
      timeout: timeoutMs,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    if (res.error) {
      console.error('[ConnectionsTestHelper] spawnSync error:', res.error);
      throw res.error;
    }

    if (res.status !== 0) {
      const out = (res.stdout || '').toString();
      const err = (res.stderr || '').toString();
      console.error(`[ConnectionsTestHelper] docker compose down failed (status=${res.status})\nSTDOUT:\n${out}\nSTDERR:\n${err}`);
      throw new Error(`docker compose down failed (status=${res.status}): ${err || out}`);
    }

    if (res.stdout) console.log(res.stdout.toString());
    if (res.stderr) console.error(res.stderr.toString());

    // When volumes are removed, also delete .northwind_initialized marker files
    // so NorthwindManager re-provisions on next start (e.g., Playwright retry)
    if (removeVolumes) {
      const entries = fs.readdirSync(dbDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory() && entry.name.startsWith('sample-northwind-')) {
          const markerPath = path.join(dbDir, entry.name, '.northwind_initialized');
          if (fs.existsSync(markerPath)) {
            fs.unlinkSync(markerPath);
            console.log(`[ConnectionsTestHelper] Removed marker: ${markerPath}`);
          }
        }
      }
    }

    console.log('[ConnectionsTestHelper] docker compose down completed (blocking).');
  }

  /**
   * Vendor-aware docker compose down. Supabase uses its own subdirectory
   * (`db/supabase/`) rather than the root `db/` compose file. All other
   * server-based vendors live in the root `db/` compose.
   *
   * Safe to call from a `finally` block — swallows non-fatal errors from
   * already-stopped containers.
   */
  static dockerComposeDownForVendor(
    vendor: string,
    timeoutMs: number = Constants.DELAY_FIVE_THOUSANDS_SECONDS,
    removeVolumes: boolean = true,
  ): void {
    const baseDir = String(process.env.PORTABLE_EXECUTABLE_DIR || '.');
    const v = (vendor || '').toLowerCase().trim();
    // Supabase has its own docker-compose in db/supabase/
    const composeDir = v === 'supabase'
      ? path.resolve(baseDir, 'db', 'supabase')
      : path.resolve(baseDir, 'db');

    const downCmd = removeVolumes ? 'docker compose down -v' : 'docker compose down';
    const isWin = process.platform === 'win32';
    let cmd: string;
    let args: string[];

    if (isWin) {
      cmd = 'powershell.exe';
      args = ['-NoProfile', '-NonInteractive', '-Command', downCmd];
    } else {
      cmd = 'docker';
      args = removeVolumes ? ['compose', 'down', '-v'] : ['compose', 'down'];
    }

    console.log(`[ConnectionsTestHelper] stopping ${vendor} docker compose (cwd=${composeDir})`);

    const res = spawnSync(cmd, args, {
      cwd: composeDir,
      encoding: 'utf8',
      timeout: timeoutMs,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    if (res.error) {
      console.error(`[ConnectionsTestHelper] docker compose down error (${vendor}):`, res.error);
      return; // non-fatal in finally cleanup
    }
    if (res.status !== 0) {
      const out = (res.stdout || '').toString();
      const err = (res.stderr || '').toString();
      console.error(`[ConnectionsTestHelper] docker compose down failed (${vendor}, status=${res.status})\n${err || out}`);
      return; // non-fatal in finally cleanup
    }

    if (res.stdout) console.log(res.stdout.toString());

    // Remove .northwind_initialized markers so next start re-provisions
    if (removeVolumes) {
      const markerDir = v === 'supabase' ? composeDir : path.resolve(baseDir, 'db');
      try {
        const entries = fs.readdirSync(markerDir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory() && entry.name.startsWith('sample-northwind-')) {
            const markerPath = path.join(markerDir, entry.name, '.northwind_initialized');
            if (fs.existsSync(markerPath)) {
              fs.unlinkSync(markerPath);
              console.log(`[ConnectionsTestHelper] Removed marker: ${markerPath}`);
            }
          }
        }
      } catch (e) { /* ignore marker cleanup errors */ }
    }

    console.log(`[ConnectionsTestHelper] docker compose down completed for ${vendor}.`);
  }

  /**
   * Seeds N invoices into seed_inv_* tables, waits for completion,
   * then wipes the data and waits for the seed button to reappear.
   * Assumes the starter pack is already running and visible.
   * then wipes the data and waits for the seed button to reappear.
   * Assumes the starter pack is already running and visible.
   */
  static seedAndWipeInvoices(
    ft: FluentTester,
    dbVendor: string,
    invoiceCount: number = 100,
    fullTimeout: number = Constants.DELAY_FIVE_THOUSANDS_SECONDS,
  ): FluentTester {
    const packId = vendorToPackId(dbVendor);
    const inputSel = `#seedInvoiceCount_${packId}`;
    const seedBtnSel = `#btnSeedInvoices_${packId}`;
    const wipeBtnSel = `#btnWipeInvoices_${packId}`;

    // Already on starter packs page with vendor filtered (from setStarterPackStateForVendor)
    // Wait for seed controls to be visible and enabled (pack running, not mid-operation)
    ft = ft
      .waitOnElementToBecomeVisible(inputSel)
      .waitOnElementToBecomeEnabled(inputSel)
      .setValue(inputSel, String(invoiceCount))
      .consoleLog(`[SeedWipe] Set invoice count to ${invoiceCount} for ${packId}`)
      .waitOnElementToBecomeVisible(seedBtnSel)
      .waitOnElementToBecomeEnabled(seedBtnSel)
      .click(seedBtnSel)
      .confirmDialogShouldBeVisible()
      .clickYesDoThis()
      .consoleLog(`[SeedWipe] Clicked Seed for ${packId}`);

    // Wait for Wipe button to appear (seed completed)
    ft = ft
      .waitOnElementToBecomeVisible(wipeBtnSel, fullTimeout)
      .waitOnElementToBecomeEnabled(wipeBtnSel)
      .consoleLog(`[SeedWipe] Seed complete — Wipe button visible for ${packId}`);

    // Click Wipe
    ft = ft
      .click(wipeBtnSel)
      .confirmDialogShouldBeVisible()
      .clickYesDoThis()
      .consoleLog(`[SeedWipe] Clicked Wipe for ${packId}`);

    // Wait for Seed button to reappear (wipe completed)
    ft = ft
      .waitOnElementToBecomeVisible(seedBtnSel, fullTimeout)
      .waitOnElementToBecomeEnabled(seedBtnSel)
      .consoleLog(`[SeedWipe] Wipe complete — Seed button visible again for ${packId}`);

    // Stop starter pack (already on the page, no navigation needed)
    const stopBtnSel = `#btnStartStop_${packId}`;
    ft = ft
      .waitOnElementToBecomeEnabled(stopBtnSel)
      .click(stopBtnSel)
      .confirmDialogShouldBeVisible()
      .clickYesDoThis()
      .consoleLog(`[SeedWipe] Requested stop for ${packId}`);

    ft = ConnectionsTestHelper._waitForStarterPackToBeInState(ft, packId, 'stopping', fullTimeout);
    ft = ConnectionsTestHelper._waitForStarterPackToBeInState(ft, packId, 'stopped', fullTimeout);

    return ft;
  }

  /**
   * Exercises the Field Selection toolbar (All Details / Names Only / Mixed)
   * on the Database Schema picklist. Only works when enableFieldSelection=true
   * (i.e. context is sqlQuery, scriptQuery, or dashboardScript).
   *
   * Assumes Products is already in the target picklist.
   * Moves Categories + Employees to target, then tests all three modes.
   */
  static exerciseFieldSelectionModes(
    ft: FluentTester,
    picklistId: string,
  ): FluentTester {
    // Assumes Products + Categories already in target. Move Employees to target.
    ft = ft.consoleLog('Field Selection Modes — testing All Details / Names Only / Mixed');

    ft = ft
      .click(`#treeNodeemployeessourceTree${picklistId}`)
      .click(`#btnMoveToTarget${picklistId}`)
      .waitOnElementToBecomeVisible(`#treeNodecategoriestargetTree${picklistId}`)
      .waitOnElementToBecomeVisible(`#treeNodeemployeestargetTree${picklistId}`)
      .waitOnElementToBecomeVisible(`#treeNodeproductstargetTree${picklistId}`);

    // ── 4a: All three tables → Names Only ──
    ft = ft.consoleLog('Field Selection 4a: All three tables → Names Only');
    ft = ft
      .click(`#btnNamesOnly${picklistId}`)
      .sleep(Constants.DELAY_ONE_SECOND)
      .click('#btnGenerateWithAIDbSchema')
      .waitOnElementToBecomeVisible('#btnCopyPromptText')
      .click('#btnCopyPromptText')
      .waitOnElementToBecomeVisible('.dburst-button-question-confirm')
      .click('.dburst-button-question-confirm')
      .waitOnElementToBecomeInvisible('.dburst-button-question-confirm')
      .clipboardShouldContainText('Products')
      .clipboardShouldContainText('Categories')
      .clipboardShouldContainText('Employees')
      .clipboardShouldContainText('Tables Included by Name Only')
      .clipboardShouldNotContainText('"columnName"')
      .click('#btnCloseAiCopilotModal')
      .waitOnElementToBecomeInvisible('#btnCopyPromptText');

    // ── 4b: Switch back to All Details for all three ──
    ft = ft.consoleLog('Field Selection 4b: All three tables → All Details');
    ft = ft
      .click(`#btnAllDetails${picklistId}`)
      .sleep(Constants.DELAY_ONE_SECOND)
      .click('#btnGenerateWithAIDbSchema')
      .waitOnElementToBecomeVisible('#btnCopyPromptText')
      .click('#btnCopyPromptText')
      .waitOnElementToBecomeVisible('.dburst-button-question-confirm')
      .click('.dburst-button-question-confirm')
      .waitOnElementToBecomeInvisible('.dburst-button-question-confirm')
      .clipboardShouldContainText('"tableName": "Products"')
      .clipboardShouldContainText('"columnName": "Discontinued"')
      .clipboardShouldContainText('"tableName": "Categories"')
      .clipboardShouldContainText('"columnName": "CategoryName"')
      .clipboardShouldContainText('"tableName": "Employees"')
      .clipboardShouldContainText('"columnName": "LastName"')
      .click('#btnCloseAiCopilotModal')
      .waitOnElementToBecomeInvisible('#btnCopyPromptText');

    // ── 4c: Mixed — Products full, Categories partial, Employees names-only ──
    ft = ft.consoleLog('Field Selection 4c: Mixed — Products full, Categories partial, Employees names-only');

    // Start from all-details baseline (all three tables → full).
    // The target-side checkbox cycle is tri-state: full → names-only → fully-deselected,
    // so we build the mixed scenario by descending from "all full" rather than ascending
    // from "all names-only" (which would put the second click into the wrong bucket).
    ft = ft
      .click(`#btnAllDetails${picklistId}`)
      .sleep(Constants.DELAY_ONE_SECOND);

    // Products — leave as-is → stays full. No click needed.

    // Categories → partial: expand, then uncheck Description column,
    // leaving CategoryName (and any other vendor-specific columns) partially selected.
    // Picture is not unchecked here because DuckDB's Northwind omits that column entirely.
    ft = ft.ensureTreeNodeExpanded(
      `#treeNodecategoriestargetTree${picklistId}`,
    ).sleep(Constants.DELAY_ONE_SECOND);

    ft = ft
      .click(`#treeNodecategories_descriptiontargetTree${picklistId} .p-checkbox`)
      .sleep(Constants.DELAY_ONE_SECOND);

    // Employees → names-only: single click on the table's own checkbox cycles
    // full → names-only. Use the direct-child combinator to hit the row's own
    // checkbox (not a nested column's) even if the node is expanded.
    ft = ft
      .click(`#treeNodeemployeestargetTree${picklistId} > .p-treenode-content > .p-checkbox`)
      .sleep(Constants.DELAY_ONE_SECOND);

    ft = ft
      .sleep(Constants.DELAY_ONE_SECOND)
      .click('#btnGenerateWithAIDbSchema')
      .waitOnElementToBecomeVisible('#btnCopyPromptText')
      .click('#btnCopyPromptText')
      .waitOnElementToBecomeVisible('.dburst-button-question-confirm')
      .click('.dburst-button-question-confirm')
      .waitOnElementToBecomeInvisible('.dburst-button-question-confirm')
      // Products = full details
      .clipboardShouldContainText('"tableName": "Products"')
      .clipboardShouldContainText('"columnName": "Discontinued"')
      // Categories = partial (CategoryName included; Description excluded)
      .clipboardShouldContainText('"columnName": "CategoryName"')
      .clipboardShouldNotContainText('"columnName": "Description"')
      // Employees = names only (no column details)
      .clipboardShouldContainText('Employees')
      .clipboardShouldNotContainText('"columnName": "LastName"')
      // Sectioned format markers
      .clipboardShouldContainText('Tables with Full/Partial Schema')
      .clipboardShouldContainText('Tables Included by Name Only')
      .click('#btnCloseAiCopilotModal')
      .waitOnElementToBecomeInvisible('#btnCopyPromptText');

    // Cleanup: restore picklist and switch back to Connection Details tab
    // so that isDatabaseSchemaTabActive=false when modal closes (prevents
    // stale tab state from affecting the next connection's tab auto-selection)
    ft = ft
      .click(`#btnAllDetails${picklistId}`)
      .sleep(Constants.DELAY_HALF_SECOND)
      .click(`#btnMoveAllToSource${picklistId}`)
      .sleep(Constants.DELAY_HALF_SECOND)
      // Re-select Categories + Products — use > .p-treenode-content > .p-checkbox to avoid
      // hitting nested child checkboxes when Categories is still expanded from step 4c
      .click(`#treeNodecategoriessourceTree${picklistId} > .p-treenode-content > .p-checkbox`)
      .click(`#treeNodeproductssourceTree${picklistId} > .p-treenode-content > .p-checkbox`)
      .click(`#btnMoveToTarget${picklistId}`)
      .waitOnElementToBecomeVisible(`#treeNodecategoriestargetTree${picklistId}`)
      .waitOnElementToBecomeVisible(`#treeNodeproductstargetTree${picklistId}`)
      // Switch to Connection Details tab to reset isDatabaseSchemaTabActive
      .click('#connectionDetailsTab-link')
      .waitOnElementToBecomeVisible('#btnTestDbConnection')
      .sleep(Constants.DELAY_HALF_SECOND);

    return ft;
  }

  /**
   * Lightweight check: verifies the Field Selection toolbar buttons exist, respond,
   * and produce the expected prompt content (Names Only vs All Details).
   * Only works when enableFieldSelection=true.
   *
   * Assumes at least one table is already in the target picklist
   * and the AI generate button is enabled.
   */
  static quickExerciseFieldSelectionButtons(
    ft: FluentTester,
    picklistId: string,
  ): FluentTester {
    ft = ft.consoleLog('Quick Field Selection — verifying buttons and prompt content');

    // Names Only: prompt should mention "Tables Included by Name Only" and have no column details
    ft = ft
      .waitOnElementToBecomeVisible(`#btnAllDetails${picklistId}`)
      .waitOnElementToBecomeVisible(`#btnNamesOnly${picklistId}`)
      .click(`#btnNamesOnly${picklistId}`)
      .sleep(Constants.DELAY_ONE_SECOND)
      .click('#btnGenerateWithAIDbSchema')
      .waitOnElementToBecomeVisible('#btnCopyPromptText')
      .click('#btnCopyPromptText')
      .waitOnElementToBecomeVisible('.dburst-button-question-confirm')
      .click('.dburst-button-question-confirm')
      .waitOnElementToBecomeInvisible('.dburst-button-question-confirm')
      .clipboardShouldContainText('Tables Included by Name Only')
      .clipboardShouldNotContainText('"columnName"')
      .click('#btnCloseAiCopilotModal')
      .waitOnElementToBecomeInvisible('#btnCopyPromptText');

    // All Details: prompt should contain column details
    ft = ft
      .click(`#btnAllDetails${picklistId}`)
      .sleep(Constants.DELAY_ONE_SECOND)
      .click('#btnGenerateWithAIDbSchema')
      .waitOnElementToBecomeVisible('#btnCopyPromptText')
      .click('#btnCopyPromptText')
      .waitOnElementToBecomeVisible('.dburst-button-question-confirm')
      .click('.dburst-button-question-confirm')
      .waitOnElementToBecomeInvisible('.dburst-button-question-confirm')
      .clipboardShouldContainText('"columnName"')
      .clipboardShouldNotContainText('Tables Included by Name Only')
      .click('#btnCloseAiCopilotModal')
      .waitOnElementToBecomeInvisible('#btnCopyPromptText');

    return ft;
  }

}
