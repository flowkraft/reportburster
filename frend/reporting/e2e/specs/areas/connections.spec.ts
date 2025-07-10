import { test } from '@playwright/test';
import _ from 'lodash';

import { FluentTester } from '../../helpers/fluent-tester';
import { electronBeforeAfterAllTest } from '../../utils/common-setup';
import { Constants } from '../../utils/constants';
import * as PATHS from '../../utils/paths';
import { ConfTemplatesTestHelper } from '../../helpers/areas/conf-templates-test-helper';
import { ConnectionsTestHelper } from '../../helpers/areas/connections-test-helper';

//DONE2
test.describe('', async () => {
  
  electronBeforeAfterAllTest(
    "(database-connection) 'Ubiquitous Language' Tab: Functionality (Edit, Save, Load)",
    async function ({ beforeAfterEach: firstPage }) {
      test.setTimeout(Constants.DELAY_FIVE_THOUSANDS_SECONDS * 2);
      let ft = new FluentTester(firstPage);

      const dbVendor = ConnectionsTestHelper.getRandomDbVendor(); // Or a fixed one like 'sqlite' for simplicity
      ft = ft.consoleLog(
        `STEP 0.0: Testing 'Ubiquitous Language' Tab with vendor: ${dbVendor}`,
      );

      const connectionName = `UbLangTest-${dbVendor}-${Date.now()}`;
      const kebabConnectionName = _.kebabCase(connectionName);
      const dbConnectionFileNameAndId = `db-${kebabConnectionName}\\.xml`;

      // --- STEP 1: Setup - Create a new database connection ---
      ft = ft.consoleLog(
        `STEP 1: Creating new connection '${connectionName}' for vendor ${dbVendor}.`,
      );

      ft = ConnectionsTestHelper.createAndAssertNewDatabaseConnection(
        ft,
        connectionName,
        dbVendor,
      );

      // --- STEP 2: Open connection and navigate to Ubiquitous Language tab ---
      ft = ft.consoleLog(
        'STEP 2: Opening connection and navigating to Ubiquitous Language tab.',
      );
      ft = ft.gotoConnections();
      ft = ft.clickAndSelectTableRow(`#${dbConnectionFileNameAndId}`);
      ft = ft.waitOnElementToBecomeEnabled('#btnEdit').click('#btnEdit');
      ft = ft.waitOnElementToBecomeVisible('#modalDbConnection');
      ft = ft.sleep(Constants.DELAY_ONE_SECOND).click('#databaseUbiquitousLanguageTab-link').sleep(Constants.DELAY_ONE_SECOND);

      ft = ft
        .waitOnElementToBecomeVisible('#noUbiquitousLanguageContentInfo')
        .waitOnElementToBecomeVisible('#btnUbiquitousLanguageStartEditing')
        .waitOnElementToBecomeEnabled('#btnUbiquitousLanguageStartEditing')
        .elementShouldNotBeVisible('#ubiquitousLanguageEditor')
        .elementShouldNotBeVisible('#ubiquitousLanguageViewer');

      // --- STEP 3: Toggle to Edit Mode ---
      ft = ft.consoleLog('STEP 3: Toggling to Edit Mode.');

      ft = ft.click('#btnUbiquitousLanguageStartEditing');
      ft = ft.waitOnElementToBecomeVisible('#ubiquitousLanguageEditor');
      ft = ft.waitOnElementToBecomeVisible('#btnUbiquitousLanguageEditDone');
      ft = ft.elementShouldNotBeVisible('#btnUbiquitousLanguageEdit');

      // --- STEP 4: Enter Markdown, switch to View, and Save ---
      const initialMarkdown = `# Test Header\n\nThis is a test paragraph for Ubiquitous Language.`;
      const updatedMarkdown = `# Updated Header\n\nThis content has been updated.`;

      ft = ft.consoleLog(
        'STEP 4: Entering Markdown, switching to View, and Saving.',
      );
      ft = ft.setCodeJarContentSingleShot(
        '#ubiquitousLanguageEditor',
        initialMarkdown,
      );
      ft = ft.click('#btnUbiquitousLanguageEditDone'); // Switch back to view mode
      ft = ft.waitOnElementToBecomeVisible('#btnUbiquitousLanguageEdit'); // View mode
      ft = ft.elementShouldNotBeVisible('#ubiquitousLanguageEditor');

      // Verify rendered markdown - selectors depend on how <markdown> component renders
      ft = ft.waitOnElementToContainText('.markdown-content h1', 'Test Header');
      ft = ft.waitOnElementToContainText(
        '.markdown-content p',
        'This is a test paragraph for Ubiquitous Language.',
      );

      // Save the UL
      ft = ft
        .click('#btnOKConfirmationDbConnectionModal')
        .waitOnElementToBecomeInvisible('#btnOKConfirmationDbConnectionModal');

      // --- STEP 5: Load Existing Content ---
      ft = ft.consoleLog(
        'STEP 5: Re-opening connection to load existing Ubiquitous Language.',
      );
      ft = ft.gotoConnections();
      ft = ft.clickAndSelectTableRow(`#${dbConnectionFileNameAndId}`);
      ft = ft.click('#btnEdit');
      ft = ft.waitOnElementToBecomeVisible('#modalDbConnection');
      ft = ft.sleep(Constants.DELAY_ONE_SECOND).click('#databaseUbiquitousLanguageTab-link').sleep(Constants.DELAY_ONE_SECOND);
      ft = ft.waitOnElementToBecomeVisible('#btnUbiquitousLanguageEdit'); // Should be in view mode
      // Verify loaded markdown
      ft = ft.waitOnElementToContainText('.markdown-content h1', 'Test Header');
      ft = ft.waitOnElementToContainText(
        '.markdown-content p',
        'This is a test paragraph for Ubiquitous Language.',
      );

      // --- STEP 6: Edit again, but Cancel (changes should not persist) ---
      ft = ft.consoleLog('STEP 6: Editing again, then cancelling.');
      ft = ft.click('#btnUbiquitousLanguageEdit'); // To edit mode
      ft = ft.waitOnElementToBecomeVisible('#ubiquitousLanguageEditor');
      ft = ft.setCodeJarContentSingleShot(
        '#ubiquitousLanguageEditor',
        updatedMarkdown,
      );
      ft = ft.click('#btnUbiquitousLanguageEditDone'); // To view mode with updated (but unsaved) content
      ft = ft.waitOnElementToContainText(
        '.markdown-content h1',
        'Updated Header',
      );
      ft = ft.click('#btnCloseDbConnectionModal'); // Cancel changes
      ft = ft.waitOnElementToBecomeInvisible('#btnCloseDbConnectionModal');

      // --- STEP 7: Verify Content Was Not Saved After Cancel ---
      ft = ft.consoleLog(
        'STEP 7: Verifying content was not saved after cancel.',
      );
      ft = ft.gotoConnections();
      ft = ft.clickAndSelectTableRow(`#${dbConnectionFileNameAndId}`);
      ft = ft.click('#btnEdit');
      ft = ft.waitOnElementToBecomeVisible('#modalDbConnection');
      ft = ft.sleep(Constants.DELAY_ONE_SECOND);
      ft = ft.click('#databaseUbiquitousLanguageTab-link');
      ft = ft.sleep(Constants.DELAY_ONE_SECOND);
      // Should still be the initial saved markdown
      ft = ft.waitOnElementToContainText('.markdown-content h1', 'Test Header');
      ft = ft.waitOnElementToContainText(
        '.markdown-content p',
        'This is a test paragraph for Ubiquitous Language.',
      );

      // --- STEP 8: Edit to Empty Content and Save (should delete file) ---
      ft = ft.consoleLog('STEP 8: Editing to empty content and saving.');
      ft = ft.click('#btnUbiquitousLanguageEdit');
      ft = ft.waitOnElementToBecomeVisible('#ubiquitousLanguageEditor');
      ft = ft.setCodeJarContentSingleShot('#ubiquitousLanguageEditor', '');
      ft = ft.click('#btnUbiquitousLanguageEditDone');
      // Markdown view area should now be hidden due to ngIf="isStringAndNotEmpty(...)"
      ft = ft
        .waitOnElementToBecomeVisible('#noUbiquitousLanguageContentInfo')
        .waitOnElementToBecomeVisible('#btnUbiquitousLanguageStartEditing');

      ft = ft
        .click('#btnOKConfirmationDbConnectionModal')
        .waitOnElementToBecomeInvisible('#btnOKConfirmationDbConnectionModal');

      // --- STEP 9: Verify Empty Content on Load (after deletion/empty save) ---
      ft = ft.consoleLog('STEP 9: Verifying empty content on load.');
      ft = ft.gotoConnections();
      ft = ft.clickAndSelectTableRow(`#${dbConnectionFileNameAndId}`);
      ft = ft.click('#btnEdit');
      ft = ft.waitOnElementToBecomeVisible('#modalDbConnection');
      ft = ft
         .sleep(Constants.DELAY_ONE_SECOND)
         .click('#databaseUbiquitousLanguageTab-link')
         .sleep(Constants.DELAY_ONE_SECOND)
         .waitOnElementToBecomeVisible('#noUbiquitousLanguageContentInfo')
        .waitOnElementToBecomeVisible('#btnUbiquitousLanguageStartEditing');
      ft = ft.elementShouldNotBeVisible('#btnUbiquitousLanguageEdit');
      ft = ft.elementShouldNotBeVisible('.markdown-content')
        .sleep(Constants.DELAY_ONE_SECOND)
        .click('#toolsTab-link')
        .sleep(Constants.DELAY_ONE_SECOND)
        .waitOnElementToBecomeVisible('#schemaNotLoadedChat2DB')
        .elementShouldNotBeVisible('#vannaTrainingIncludeUbiquitousLanguage');
      
        ft = ft
        .click('#btnCloseDbConnectionModal')
        .waitOnElementToBecomeInvisible('#btnCloseDbConnectionModal');

      // --- STEP 10: Cleanup ---
      ft = ft.consoleLog('STEP 10: Cleaning up the test connection.');
      ft = ConnectionsTestHelper.deleteAndAssertDatabaseConnection(
        ft,
        dbConnectionFileNameAndId,
        dbVendor,
      );

      return ft;
    },
  );

});
