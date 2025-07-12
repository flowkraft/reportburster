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
    "(database-connection) 'Chat2DB' Tab: Functionality tests (all UI elements, Vanna AI, Training Plan, Table Selection, Dropdowns)",
    async function ({ beforeAfterEach: firstPage }) {
      test.setTimeout(Constants.DELAY_FIVE_THOUSANDS_SECONDS * 3);

      let ft = new FluentTester(firstPage);

      // --- STEP 1: Create and test a new database connection (this is the only way to unlock Chat2DB tab) ---
      const dbVendor = ConnectionsTestHelper.getRandomDbVendor();
      const connectionName = `Chat2DBTest-${dbVendor}-${Date.now()}`;
      const kebabConnectionName = _.kebabCase(connectionName);
      const fileNameAndId = `db-${kebabConnectionName}\\.xml`;

      ft = ft.consoleLog('STEP 1: Create and test new DB connection');
      ft = ft.gotoConnections();
      ft = ft.waitOnElementToBecomeEnabled('#btnNewDropdown').click('#btnNewDropdown');
      ft = ft.waitOnElementToBecomeVisible('#btnNewDatabase').click('#btnNewDatabase');
      ft = ft.waitOnElementToBecomeVisible('#modalDbConnection');
      ft = ft.waitOnElementToBecomeEnabled('#dbConnectionName');
      ft = ConnectionsTestHelper.fillNewDatabaseConnectionDetails(
        ft,
        connectionName,
        dbVendor,
        kebabConnectionName,
      );

      // Test Connection (save if needed)
      ft = ft.waitOnElementToBecomeEnabled('#btnTestDbConnection').click('#btnTestDbConnection');
      ft = ft.waitOnElementToContainText(
        '#confirmDialog .modal-body',
        'The connection must be saved before being able to test it. Save now?',
      );

      ft = ft.clickYesDoThis();
      ft = ft.waitOnElementToHaveClass('#btnTestDbConnectionIcon', 'fa-spin');
      ft = ft.waitOnElementNotToHaveClass('#btnTestDbConnectionIcon', 'fa-spin');
      ft = ft.waitOnToastToBecomeVisible('success', 'Successfully connected to the database', Constants.DELAY_HUNDRED_SECONDS);

      // --- STEP 2: Prepare Domain-Grouped Schema (so checkbox is enabled in Chat2DB) ---
      ft = ft.consoleLog('STEP 2: Prepare Domain-Grouped Schema');

      ft = ft.sleep(Constants.DELAY_ONE_SECOND).click('#domainGroupedDatabaseSchemaTab-link').sleep(Constants.DELAY_ONE_SECOND);

      ft = ft.waitOnElementToBecomeVisible('#domainGroupedSchemaPicklist');
      ft = ft.waitOnElementToBecomeEnabled('#btnToggleDomainGroupedCodeView');
      ft = ft.click('#btnToggleDomainGroupedCodeView');
      ft = ft.waitOnElementToBecomeVisible('#domainGroupedCodeEditor');

      // Use a minimal valid domain-grouped schema
      const domainGroupedSchema = `{"domainGroups":[{"label":"TestDomain","tables":[{"tableName":"Products","columns":[{"name":"ProductID"}]}]}]}`;
      ft = ft.setCodeJarContentSingleShot('#domainGroupedCodeEditor', domainGroupedSchema);
      ft = ft.click('#btnToggleDomainGroupedCodeView');
      ft = ft.waitOnElementToBecomeVisible('#domainGroupedSchemaPicklist');

      // --- STEP 3: Prepare ER Diagram (so checkbox is enabled in Chat2DB) ---
      ft = ft.consoleLog('STEP 3: Prepare ER Diagram');

      ft = ft.sleep(Constants.DELAY_ONE_SECOND).click('#databaseDiagramTab-link').sleep(Constants.DELAY_ONE_SECOND);

      ft = ft.waitOnElementToBecomeVisible('#btnDatabaseDiagramShowCode');
      ft = ft.click('#btnDatabaseDiagramShowCode');
      ft = ft.waitOnElementToBecomeVisible('#plantUmlEditor');
      const erDiagramPuml = '@startuml\nentity "Products" { ProductID }\n@enduml';
      ft = ft.setCodeJarContentSingleShot('#plantUmlEditor', erDiagramPuml);
      ft = ft.click('#btnDatabaseDiagramViewDiagram');
      ft = ft.waitOnElementToBecomeVisible('#btnDatabaseDiagramShowCode');

      // --- STEP 4: Prepare Ubiquitous Language (so checkbox is enabled in Chat2DB) ---
      ft = ft.consoleLog('STEP 4: Prepare Ubiquitous Language');

      ft = ft.sleep(Constants.DELAY_ONE_SECOND).click('#databaseUbiquitousLanguageTab-link').sleep(Constants.DELAY_ONE_SECOND);

      ft = ft.waitOnElementToBecomeVisible('#btnUbiquitousLanguageStartEditing');
      ft = ft.click('#btnUbiquitousLanguageStartEditing');
      ft = ft.waitOnElementToBecomeVisible('#ubiquitousLanguageEditor');
      ft = ft.setCodeJarContentSingleShot('#ubiquitousLanguageEditor', '# Test UL');
      ft = ft.click('#btnUbiquitousLanguageEditDone');
      ft = ft.waitOnElementToBecomeVisible('#btnUbiquitousLanguageEdit');

      // --- STEP 5: Go to Chat2DB tab and assert all UI elements and states ---
      ft = ft.consoleLog('STEP 5: Chat2DB tab assertions');

      ft = ft.sleep(Constants.DELAY_ONE_SECOND).click('#toolsTab-link').sleep(Constants.DELAY_ONE_SECOND);

      ft = ft.waitOnElementToBecomeVisible('#btnChatWithDb').elementShouldBeDisabled('#btnChatWithDb');
      ft = ft.waitOnElementToBecomeDisabled('#btnTrainVannaAi');

      ft = ft.waitOnElementToBecomeEnabled('#btnToggleVannaAi');
      ft = ft.waitOnElementToBecomeEnabled('#vannaTrainingIncludeDbSchema');
      ft = ft.waitOnElementToBecomeEnabled('#vannaTrainingIncludeDomainGroupedSchema');
      ft = ft.waitOnElementToBecomeEnabled('#vannaTrainingIncludeErDiagram');
      ft = ft.waitOnElementToBecomeEnabled('#vannaTrainingIncludeUbiquitousLanguage');
      ft = ft.waitOnElementToBecomeEnabled('#vannaTrainingIncludeSqlQueries');


      ft = ft.consoleLog('STEP 6: Vanna.AI Start/Stop UI assertions');

      // Start Vanna.AI
      ft = ft.waitOnElementToBecomeEnabled('#btnToggleVannaAi');
      ft = ft.click('#btnToggleVannaAi');
      ft = ft.waitOnElementToContainText('#confirmDialog .modal-body', 'Start Vanna.AI?');
      ft = ft.clickYesDoThis();

      ft = ft.waitOnElementToBecomeEnabled('#btnChatWithDb');
      ft = ft.waitOnElementToBecomeEnabled('#btnTrainVannaAi');

      // Assert button label and icon color when started
      ft = ft.waitOnElementToContainText('#btnToggleVannaAi', 'Stop Vanna.AI');

      ft = ft.waitOnElementToBecomeEnabled('#btnToggleVannaAi');
      ft = ft.elementShouldHaveClass('#btnToggleVannaAi .fa', 'fa-stop');

      ft = ft.click('#btnToggleVannaAi');
      ft = ft.waitOnElementToContainText('#confirmDialog .modal-body', 'Stop Vanna.AI?');
      ft = ft.clickYesDoThis();
      ft = ft.waitOnElementToContainText('#btnToggleVannaAi', 'Start Vanna.AI');

      ft = ft.waitOnElementToBecomeEnabled('#btnToggleVannaAi');
      ft = ft.elementShouldHaveClass('#btnToggleVannaAi .fa', 'fa-play');

      ft = ft.waitOnElementToBecomeDisabled('#btnChatWithDb');
      ft = ft.waitOnElementToBecomeDisabled('#btnTrainVannaAi');
      // The color check is not directly supported, but you can check for the icon class

      // --- STEP 7: Generate Vanna.AI Training Plan with different checkbox combinations ---
      ft = ft.consoleLog('STEP 7: Generate Vanna.AI Training Plan - 1,3,5 checked');

      // 1. Only 1, 3, 5 checked
      ft = ft.setCheckboxState('#vannaTrainingIncludeDbSchema', true);
      ft = ft.setCheckboxState('#vannaTrainingIncludeDomainGroupedSchema', false);
      ft = ft.setCheckboxState('#vannaTrainingIncludeErDiagram', true);
      ft = ft.setCheckboxState('#vannaTrainingIncludeUbiquitousLanguage', false);
      ft = ft.setCheckboxState('#vannaTrainingIncludeSqlQueries', true);

      ft = ft.click('#btnGenerateVannaTrainingPlan');


      ft = ft.waitOnElementToBecomeVisible('dburst-ai-manager').waitOnElementToBecomeVisible('#btnCopyPromptText');

      ft = ft
        .click('#btnCopyPromptText')
        .waitOnElementToBecomeVisible('.dburst-button-question-confirm')
        .click('.dburst-button-question-confirm')
        .waitOnElementToBecomeInvisible('.dburst-button-question-confirm');

      ft = ft.clipboardShouldContainText('You are an expert Vanna.AI consultant.');

      ft = ft.elementShouldNotContainText('dburst-ai-manager', '[VANNA TRAINING DB SCHEMA]');
      ft = ft.clipboardShouldContainText('[VANNA TRAINING DOMAIN GROUPED SCHEMA]');
      ft = ft.elementShouldNotContainText('dburst-ai-manager', '[VANNA TRAINING ER DIAGRAM]');
      ft = ft.clipboardShouldContainText('[VANNA TRAINING UBIQUITOUS LANGUAGE]');
      ft = ft.elementShouldNotContainText('dburst-ai-manager', '[VANNA TRAINING EXISTING SQL QUERIES]');

      ft = ft
        .click('#btnCloseAiCopilotModal')
        .waitOnElementToBecomeInvisible('#btnCopyPromptText');



      // 2. All 5 checked
      ft = ft.consoleLog('STEP 8: Generate Vanna.AI Training Plan - all checked');
      ft = ft.setCheckboxState('#vannaTrainingIncludeDbSchema', true);
      ft = ft.setCheckboxState('#vannaTrainingIncludeDomainGroupedSchema', true);
      ft = ft.setCheckboxState('#vannaTrainingIncludeErDiagram', true);
      ft = ft.setCheckboxState('#vannaTrainingIncludeUbiquitousLanguage', true);
      ft = ft.setCheckboxState('#vannaTrainingIncludeSqlQueries', true);

      ft = ft.click('#btnGenerateVannaTrainingPlan');

      ft = ft.waitOnElementToBecomeVisible('dburst-ai-manager').waitOnElementToBecomeVisible('#btnCopyPromptText');

      ft = ft
        .click('#btnCopyPromptText')
        .waitOnElementToBecomeVisible('.dburst-button-question-confirm')
        .click('.dburst-button-question-confirm')
        .waitOnElementToBecomeInvisible('.dburst-button-question-confirm');

      ft = ft.clipboardShouldContainText('You are an expert Vanna.AI consultant.');

      ft = ft.elementShouldNotContainText('dburst-ai-manager', '[VANNA TRAINING DB SCHEMA]');
      ft = ft.elementShouldNotContainText('dburst-ai-manager', '[VANNA TRAINING DOMAIN GROUPED SCHEMA]');
      ft = ft.elementShouldNotContainText('dburst-ai-manager', '[VANNA TRAINING ER DIAGRAM]');
      ft = ft.elementShouldNotContainText('dburst-ai-manager', '[VANNA TRAINING UBIQUITOUS LANGUAGE]');
      ft = ft.elementShouldNotContainText('dburst-ai-manager', '[VANNA TRAINING EXISTING SQL QUERIES]');

      ft = ft
        .click('#btnCloseAiCopilotModal')
        .waitOnElementToBecomeInvisible('#btnCopyPromptText');

      // --- STEP 12: Apps Manager assertions ---
      ft = ft.consoleLog('STEP 9: Apps Manager assertions');

      // 1. Assert CloudBeaver is the default selected app and shows stopped in the dropdown button
      ft = ft.elementShouldContainText('#appsManagerAppNamecloudbeaver', 'CloudBeaver');
      ft = ft.elementShouldContainText('#appsManagerAppStatecloudbeaver', 'stopped');

      // 2. Expand the dropdown to view all options
      ft = ft.click('#appsManagerDropdownToggle');

      // Assert both CloudBeaver (stopped) and VS Code are present in the dropdown
      ft = ft.elementShouldContainText('#appsManagerAppNamecloudbeaver', 'CloudBeaver');
      ft = ft.elementShouldContainText('#appsManagerAppStatecloudbeaver', 'stopped');
      ft = ft.elementShouldContainText('#appsManagerAppNamevscode', 'VS Code');

      // 3. Start CloudBeaver (click the Start button for CloudBeaver)
      ft = ft.click('#appsManagerAppStartBtncloudbeaver');

      // Confirm dialog appears and accept
      ft = ft.waitOnElementToContainText('#confirmDialog .modal-body', 'Start DB Management (CloudBeaver)?');
      ft = ft.clickYesDoThis().waitOnElementToContainText('#appsManagerAppStatecloudbeaver', 'running');

      // Assert CloudBeaver is now running
      ft = ft.elementShouldContainText('#appsManagerAppNamecloudbeaver', 'CloudBeaver');
      ft = ft.click('#appsManagerDropdownToggle').waitOnElementToBecomeVisible('#appsManagerAppStopBtncloudbeaver');

      // 4. Stop CloudBeaver (click the Stop icon for CloudBeaver)
      ft = ft.click('#appsManagerAppStopBtncloudbeaver');

      // Confirm dialog appears and accept
      ft = ft.waitOnElementToContainText('#confirmDialog .modal-body', 'Stop DB Management (CloudBeaver)?');
      ft = ft.clickYesDoThis();

      // Assert CloudBeaver is now stopped again
      ft = ft.elementShouldContainText('#appsManagerAppNamecloudbeaver', 'CloudBeaver');
      ft = ft.elementShouldContainText('#appsManagerAppStatecloudbeaver', 'stopped');

      // --- STEP 10: Save and close modal, cleanup ---
      ft = ft.consoleLog('STEP 10: Save and cleanup');
      ft = ft.waitOnElementToBecomeEnabled('#btnOKConfirmationDbConnectionModal');
      ft = ft.click('#btnOKConfirmationDbConnectionModal');
      ft = ft.waitOnElementToBecomeInvisible('#btnOKConfirmationDbConnectionModal');
      ft = ft.gotoConnections();
      ft = ConnectionsTestHelper.deleteAndAssertDatabaseConnection(
        ft,
        fileNameAndId,
        dbVendor,
      );

      return ft;
    });

});
