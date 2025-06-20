import _ from 'lodash';

import { FluentTester } from '../fluent-tester';
import * as PATHS from '../../utils/paths';

export class ConnectionsTestHelper {
  // Database vendor constants
  static DB_VENDORS_SUPPORTED = [
    // 'oracle',
    // 'sqlserver',
    // 'postgresql',
    // 'mysql',
    // 'mariadb',
    // 'ibmdb2',
    'sqlite',
  ];
  static DB_VENDORS_DEFAULT = 'sqlite';
  static DB_VENDORS_TEST_RANDOM = true;

  static deleteAndAssertEmailConnection(
    ft: FluentTester,
    connectionFileName: string,
  ): FluentTester {
    return ft
      .gotoConnections()
      .waitOnElementToBecomeVisible(`#${connectionFileName}`)
      .clickAndSelectTableRow(`#${connectionFileName}`)
      .waitOnElementToBecomeEnabled('#btnDelete')
      .click('#btnDelete')
      .clickNoDontDoThis()
      .click('#btnDelete')
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
      .clickNoDontDoThis()
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
    return ft
      .clickAndSelectTableRow(`#${connectionFileName}`)
      .waitOnElementToBecomeVisible(`#btnActions_${connectionFileName}`)
      .click(`#btnActions_${connectionFileName}`)
      .waitOnElementToBecomeVisible(`#btnToggleDefault_${connectionFileName}`)
      .click(`#btnToggleDefault_${connectionFileName}`)
      .clickNoDontDoThis()
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
    ft = ft
      .gotoConfiguration()
      .click(
        `#topMenuConfigurationLoad_${folderName}_${PATHS.SETTINGS_CONFIG_FILE}`,
      )
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
    const connectionCode = `db-${_.kebabCase(connectionName)}`;
    const kebabConnectionName = _.kebabCase(connectionName); // Needed for fillNewDatabaseConnectionDetails

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
      kebabConnectionName,
    );

    // Save the connection and perform assertions (this part remains the same as your original)
    return ft
      .waitOnElementToBecomeEnabled('#btnOKConfirmationDbConnectionModal')
      .click('#btnOKConfirmationDbConnectionModal')
      .waitOnToastToBecomeVisible(
        'info',
        `Connection '${connectionName}' saved successfully.`,
      )
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
    const connectionCode = `db-${_.kebabCase(connectionName)}`;
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
    } else {
      // For other database types, update host and port
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
      .waitOnToastToBecomeVisible(
        'info',
        `Connection '${updatedConnectionName}' saved successfully.`,
      )
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
    const originalConnectionCode = `db-${_.kebabCase(connectionName)}`; // e.g., "db-test-database-connection"

    // This will be the new unique name we type for the duplicated connection.
    const newNameForDuplicate = `${connectionName} Duplicated`; // e.g., "Test Database Connection Updated Duplicated"
    // This will be the code/ID of the newly created duplicated connection based on the new unique name.
    const newDuplicateConnectionCode = `db-${_.kebabCase(newNameForDuplicate)}`;

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
        .waitOnToastToBecomeVisible(
          'info',
          `Connection '${newNameForDuplicate}' saved successfully.`, // Toast should use the new unique name
        )
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
        return 'ORCL';
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
        return 'db2admin';
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
        return 'db2admin';
      default:
        return 'password';
    }
  }

  /**
   * Get a random database vendor from Constants.DB_VENDORS_SUPPORTED
   */
  static getRandomDbVendor(): string {
    const vendors = ConnectionsTestHelper.DB_VENDORS_SUPPORTED;
    const randomIndex = Math.floor(Math.random() * vendors.length);
    return vendors[randomIndex];
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
    kebabConnectionName: string, // Used for generating default DB names and SQLite filename
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

    // 3. Fill vendor-specific details
    const defaultHost = 'localhost';
    const defaultDbNameNonSqlite = `testdb_${kebabConnectionName}`;
    const defaultUser = 'testuser';
    const defaultPass = 'testpassword';

    if (dbVendorSelectValue !== 'sqlite') {
      ft = ft
        .waitOnElementToBecomeEnabled('#dbHost')
        .click('#dbHost')
        .typeText(defaultHost);

      // Port is often auto-filled. We'll rely on that for now.
      // Verification or explicit typing can be added if needed.

      ft = ft
        .waitOnElementToBecomeEnabled('#dbName')
        .click('#dbName')
        .typeText(defaultDbNameNonSqlite);
      ft = ft
        .waitOnElementToBecomeEnabled('#dbUsername')
        .click('#dbUsername')
        .typeText(defaultUser);
      ft = ft
        .waitOnElementToBecomeEnabled('#dbPassword')
        .click('#dbPassword')
        .typeText(defaultPass);
    } else {
      // SQLite requires a file path
      // For testing, we'll use a placeholder path that would be selected in the UI
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
    }

    ft = ft.consoleLog(
      `Finished filling database connection details for: ${connectionName}`,
    );
    return ft;
  }
}
