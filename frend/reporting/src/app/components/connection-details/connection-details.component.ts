import {
  ChangeDetectorRef,
  Component,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';

import Prism from 'prismjs';
import 'prismjs/components/prism-json'; // Import JSON language support
import 'prismjs/components/prism-markdown';

import * as pako from 'pako';

import {
  ExtConnection,
  newDatabaseServer,
  newEmailServer,
  SettingsService,
} from '../../providers/settings.service';
import { ConfirmService } from '../dialog-confirm/confirm.service';
import { ToastrMessagesService } from '../../providers/toastr-messages.service';
import { FsService } from '../../providers/fs.service';
import { InfoService } from '../dialog-info/info.service';
import { ExecutionStatsService } from '../../providers/execution-stats.service';
import { ShellService } from '../../providers/shell.service';
import { ActivatedRoute, Router } from '@angular/router';
import _ from 'lodash';
import Utilities from '../../helpers/utilities';
import { EmailProviderSettings } from '../button-well-known/button-well-known.component';
import {
  AiManagerComponent,
  AiManagerLaunchConfig,
} from '../ai-manager/ai-manager.component';
import { AppsManagerService, ManagedApp } from '../apps-manager/apps-manager.service';
import { AiManagerService } from '../ai-manager/ai-manager.service';


@Component({
  selector: 'dburst-connection-details',
  templateUrl: './connection-details.template.html',
})
export class ConnectionDetailsComponent implements OnInit {
  @Input() mode: 'crud' | 'viewMode' = 'crud';
  @Input() context: 'crud' | 'sqlQuery' = 'crud';

  // Tab active states
  isConnectionDetailsTabActive = false;
  isDatabaseSchemaTabActive = false;
  isDomainGroupedSchemaTabActive = false;
  isErDiagramTabActive = false;
  isUbiquitousLanguageTabActive = false;
  isToolsTabActive = false;

  isVannaAiStarted = false;

  managedApps$ = this.getManagedApps(); // Observable or Promise

  vannaTrainingIncludeDbSchema: boolean = false;
  vannaTrainingIncludeDomainGroupedSchema: boolean = false;
  vannaTrainingIncludeErDiagram: boolean = false;
  vannaTrainingIncludeUbiquitousLanguage: boolean = false;
  vannaTrainingIncludeSqlQueries: boolean = false;

  constructor(
    protected confirmService: ConfirmService,
    protected messagesService: ToastrMessagesService,
    protected fsService: FsService,
    protected settingsService: SettingsService,
    protected infoService: InfoService,
    protected executionStatsService: ExecutionStatsService,
    protected shellService: ShellService,
    protected appsManagerService: AppsManagerService,
    protected route: ActivatedRoute,
    protected router: Router,
    private cdRef: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    console.log(
      `ConfigurationConnectionsComponet: ngOnInit() mode: ${this.mode}`,
    );

    this.initializePlantUmlDiagram();
  }

  @ViewChild(AiManagerComponent) private aiManagerInstance!: AiManagerComponent;

  modalConnectionInfo = {
    connectionType: 'email-connection',
    crudMode: 'create',
    duplicate: false,
    modalTitle: 'Create Email Connection',
    //connectionCode: '',
    //connectionName: '',
    filePath: '',
    connectionSameFilePathAlreadyExists: '' as boolean | string,
    email: {
      documentburster: {
        connection: {
          code: '',
          name: '',
          defaultConnection: false,
          emailserver: { ...newEmailServer },
        },
      },
    },
    database: {
      // Add database structure
      documentburster: {
        connection: {
          code: '',
          name: '',
          autotrainvanna: false,
          defaultConnection: false,
          databaseserver: { ...newDatabaseServer },
        },
      },
    },
  };

  initialAiCopilotActiveTabKey?: 'PROMPTS' | 'VANNA' | 'HEY_AI';
  initialAiCopilotSelectedCategory?: string;
  initialAiCopilotExpandedPromptId?: string;
  initialAiCopilotVariables?: { [key: string]: string };

  isModalEmailConnectionVisible = false;
  isModalDbConnectionVisible = false;

  showSchemaTreeSelect = false; // Flag to control visibility of the PickList section

  // --- PickList properties for Database Schema tab ---
  sourceSchemaObjects = []; // Available objects for PickList source
  targetSchemaObjects = []; // Selected objects for PickList target
  isSchemaLoading = false; // Flag to indicate schema loading in progress
  isTestingConnection = false; // Flag to indicate schema loading in progress

  private rawSchemaData: any = null; // Cached raw schema data

  // rawDomainGroupedSchema is an in-memory JS object, derived by parsing domainGroupedSchemaJsonTextContent.
  // It's used to populate the picklist's source view.
  // Its structure is expected to be { domainGroups: any[] } by processDomainGroupedSchema.
  private rawDomainGroupedSchema: { domainGroups: any[] } = {
    domainGroups: [],
  };

  showDomainSchemaTreeSelect = true; // Flag to control visibility of the Domain-Grouped Schema PickList section

  domainSourceSchemaObjects = []; // Available objects for Domain-Grouped Schema PickList source
  // domainTargetSchemaObjects holds the user's picklist selections. This state is ephemeral for persistence
  // and is NOT saved back to the domain-grouped-schema.json file.
  domainTargetSchemaObjects = []; // Selected objects for Domain-Grouped Schema PickList target

  isDomainGroupedCodeViewActive: boolean = false;
  // domainGroupedSchemaJsonTextContent is the authoritative raw string from file or ngx-codejar editor.
  // This is the ONLY content that gets saved for the domain-grouped schema.
  domainGroupedSchemaJsonTextContent: string = '';

  // Domain-grouped schema properties
  domainGroupedSchemaExists = false;
  domainGroupedSchemaPath = '';

  isDiagramEditMode: boolean = false;
  plantUmlCode: string = '';

  erDiagramFilePath: string = '';

  encodedPlantUmlDiagram: string = '';

  ubiquitousLanguageFilePath: string = '';

  isUbiquitousLanguageEditMode: boolean = false;

  ubiquitousLanguageMarkdown: string = '';

  sqliteFileBrowserVisible: boolean = false;

  get erDiagramExists(): boolean {
    return !!this.encodedPlantUmlDiagram;
  }

  async updateModelAndForm() {
    if (this.modalConnectionInfo.crudMode != 'update') {
      // Determine connection type and use appropriate values
      const isDbConnection = this.isModalDbConnectionVisible;
      const connectionPrefix = isDbConnection ? 'db' : 'eml';
      const connectionName = isDbConnection
        ? this.modalConnectionInfo.database.documentburster.connection.name
        : this.modalConnectionInfo.email.documentburster.connection.name;

      const connectionCode = `${connectionPrefix}-${_.kebabCase(connectionName)}`;
      const connectionFileName = `${connectionCode}.xml`;

      // Create different path structures based on connection type
      if (isDbConnection) {
        // For database connections: create a folder structure
        // Path format: /config/connections/db-my-connection/db-my-connection.xml
        const folderPath = `${this.settingsService.CONFIGURATION_CONNECTIONS_FOLDER_PATH}/${connectionCode}`;
        this.modalConnectionInfo.filePath = `${folderPath}/${connectionFileName}`;

        // First check if the folder exists, if not the file can't exist
        const folderExists = await this.fsService.existsAsync(folderPath);
        if (!folderExists) {
          this.modalConnectionInfo.connectionSameFilePathAlreadyExists = false;
        } else {
          // If folder exists, check if the file exists inside
          this.modalConnectionInfo.connectionSameFilePathAlreadyExists =
            await this.fsService.existsAsync(this.modalConnectionInfo.filePath);
        }
      } else {
        // For email connections: maintain current approach with a single file
        // Path format: /config/connections/eml-my-connection.xml
        this.modalConnectionInfo.filePath = `${this.settingsService.CONFIGURATION_CONNECTIONS_FOLDER_PATH}/${connectionFileName}`;

        // Check if the file exists
        this.modalConnectionInfo.connectionSameFilePathAlreadyExists =
          await this.fsService.existsAsync(this.modalConnectionInfo.filePath);
      }
    }
  }

  updateFormControlWithSelectedVariable(
    id: string,
    selectedVariableValue: string,
  ) {
    const formControl = document.getElementById(id) as HTMLInputElement;
    const caretPos = formControl.selectionStart;
    const oldValue = formControl.value;
    formControl.value =
      oldValue.substring(0, caretPos) +
      selectedVariableValue +
      oldValue.substring(caretPos);

    formControl.dispatchEvent(new Event('input'));
  }

  async doTestSMTPConnection() {
    const proceedWithTest = async () => {
      if (this.executionStatsService.logStats.foundDirtyLogFiles) {
        this.infoService.showInformation({
          message:
            'Log files are not empty. You need to press the Clear Logs button first.',
        });
        return;
      }
      this.confirmService.askConfirmation({
        message: 'Send test email?',
        confirmAction: () => {
          const filePath = this.modalConnectionInfo.filePath;
          if (!filePath) {
            this.messagesService.showError(
              'Connection file path is missing. Cannot test.',
            );
            return;
          }
          this.shellService.runBatFile([
            'system',
            'test-email',
            '--email-connection-file',
            '"' +
              Utilities.slash(filePath).replace(
                'config/',
                'PORTABLE_EXECUTABLE_DIR_PATH/config/',
              ) +
              '"',
          ]);
        },
      });
    };
    if (this.modalConnectionInfo.crudMode === 'create') {
      this.confirmService.askConfirmation({
        message:
          'The connection must be saved before being able to test it. Save now?',
        confirmAction: async () => {
          const saved = await this.saveCurrentConnection(false);
          if (saved) {
            this.messagesService.showInfo(
              'Saved. You can now test the connection.',
            );
          }
        },
        cancelAction: () => {},
      });
    } else {
      await proceedWithTest();
    }
  }

  async updateSMTPFormControlsWithSelectedProviderSettings(
    selectedProviderSettings: EmailProviderSettings,
  ) {
    this.modalConnectionInfo.email.documentburster.connection.emailserver.usessl =
      false;
    this.modalConnectionInfo.email.documentburster.connection.emailserver.usetls =
      false;

    this.modalConnectionInfo.email.documentburster.connection.emailserver.host =
      selectedProviderSettings.host;
    this.modalConnectionInfo.email.documentburster.connection.emailserver.port =
      selectedProviderSettings.port;

    if (selectedProviderSettings.secure === true) {
      this.modalConnectionInfo.email.documentburster.connection.emailserver.usessl =
        true;
    }

    if (selectedProviderSettings.tls) {
      this.modalConnectionInfo.email.documentburster.connection.emailserver.usetls =
        true;
    }
  }

  async onModalOK() {
    const isDb = this.isModalDbConnectionVisible;
    const mainConnectionSaved = await this.saveCurrentConnection(isDb); // Saves the .xml connection file

    if (mainConnectionSaved) {
      if (isDb) {
        // For database connections, save associated schema files
        await this.saveConnectionDomainGroupedSchema();
        await this.saveConnectionErDiagram();
        await this.saveConnectionUbiquitousLanguage();

        this.isModalDbConnectionVisible = false;
      } else {
        this.isModalEmailConnectionVisible = false;
      }
      // General "Saved" message was shown by saveCurrentConnection or can be consolidated here if needed.
      // Specific messages for sub-saves are handled within those methods.
    }
  }

  onModalClose() {
    this.isModalEmailConnectionVisible = false;
    this.isModalDbConnectionVisible = false;
  }

  onDbTypeChange(newType: string): void {
    const dbServer =
      this.modalConnectionInfo.database.documentburster.connection
        .databaseserver;

    // Clear the database field when type changes,
    // forcing selection for SQLite or input for others.
    dbServer.database = 'Database Name';

    dbServer.connectionstring = ''; // Also clear connection string

    // Set default port based on type
    switch (newType) {
      case 'oracle':
        dbServer.port = '1521';
        break;
      case 'sqlserver':
        dbServer.port = '1433';
        break;
      case 'postgresql':
        dbServer.port = '5432';
        break;
      case 'mysql':
      case 'mariadb': // Often uses the same port as MySQL
        dbServer.port = '3306';
        break;
      case 'ibmdb2':
        dbServer.port = '50000'; // Common default, might vary
        break;
      case 'sqlite':
        dbServer.database = '';
        dbServer.port = ''; // Port not applicable for SQLite
        dbServer.host = ''; // Host not applicable for SQLite
        dbServer.userid = ''; // Userid not applicable for SQLite
        dbServer.userpassword = ''; // Password not applicable for SQLite
        dbServer.usessl = false; // SSL not applicable for SQLite
        break;
      default:
        // Keep existing port or set a generic default if needed
        // dbServer.port = newDatabaseServer.port; // Or keep current
        break;
    }

    // If switching to SQLite, ensure other non-applicable fields are cleared
    if (newType === 'sqlite') {
      dbServer.host = '';
      dbServer.port = '';
      dbServer.userid = '';
      dbServer.userpassword = '';
      dbServer.usessl = false;
    } else {
      // If switching *away* from SQLite, ensure host/port have defaults if empty
      if (!dbServer.host) {
        dbServer.host = newDatabaseServer.host;
      }
      // Port is handled by the switch statement above
      if (!dbServer.userid) {
        dbServer.userid = newDatabaseServer.userid;
      }
      if (!dbServer.userpassword) {
        dbServer.userpassword = newDatabaseServer.userpassword;
      }
    }
  }

  openSqliteFileBrowser() {
    this.sqliteFileBrowserVisible = true;
  }

  async doTestDatabaseConnection() {
    const performTestLogic = (filePathToTest: string) => {
      this.isTestingConnection = true; // <<<< SET LOADING STATE TO TRUE
      this.isSchemaLoading = true; // Keep this as testing also loads schema
      this.showSchemaTreeSelect = false;
      this.sourceSchemaObjects = [];
      this.targetSchemaObjects = [];
      this.cdRef.detectChanges();

      const execPath = `"${Utilities.slash(filePathToTest)}"`;
      this.shellService.runBatFile(
        [
          'system',
          'test-and-fetch-database-schema',
          '--database-connection-file',
          execPath,
        ],
        `testing connection and fetching schema for '${this.modalConnectionInfo.database.documentburster.connection.name}'`,
        // null, // onDoneCmdStdOut - REMOVED
        // null, // onDoneCmdError - REMOVED
        // The third argument is the onDoneCmdClose callback
        (result: { success: boolean; error?: any }) => {
          // onDoneCmdClose
          this.isTestingConnection = false; // <<<< RESET LOADING STATE
          // isSchemaLoading will be handled by loadSchemaFromBackend or set here on error

          if (result.success) {
            this.messagesService.showSuccess(
              'Successfully connected to the database and fetched schema.',
            );
            this.loadSchemaFromBackend(filePathToTest); // This will set isSchemaLoading = false in its finally block
          } else {
            this.messagesService.showError(
              result.error?.message ||
                'Failed to connect to the database or fetch schema. Please check logs.',
            );
            this.isSchemaLoading = false; // Explicitly reset on error if loadSchemaFromBackend isn't called
            this.showSchemaTreeSelect = false;
          }
          this.cdRef.detectChanges();
        },
      );
    };

    const proceedWithTest = async () => {
      if (this.executionStatsService.logStats.foundDirtyLogFiles) {
        this.infoService.showInformation({
          message:
            'Log files are not empty. You need to press the Clear Logs button first.',
        });
        return;
      }
      this.confirmService.askConfirmation({
        message: 'Test database connection?',
        confirmAction: () => {
          const rawFilePath = this.modalConnectionInfo.filePath;
          if (!rawFilePath) {
            this.messagesService.showError(
              'Connection file path is not defined.',
            );
            return;
          }
          performTestLogic(rawFilePath);
        },
        cancelAction: () => {
          // User cancelled testing
        },
      });
    };

    if (this.modalConnectionInfo.crudMode === 'create') {
      this.confirmService.askConfirmation({
        message:
          'The connection must be saved before being able to test it. Save now?',
        confirmAction: async () => {
          const saved = await this.saveCurrentConnection(true); // true for isDbConnection
          if (saved) {
            const savedFilePath = this.modalConnectionInfo.filePath;
            if (savedFilePath) {
              performTestLogic(savedFilePath);
            } else {
              this.messagesService.showError(
                'Failed to get file path after saving. Cannot test connection.',
              );
              this.isTestingConnection = false; // Ensure state is reset if save fails to provide path
              this.isSchemaLoading = false;
              this.cdRef.detectChanges();
            }
          }
          // If not saved, button remains as is, isTestingConnection is false.
        },
        cancelAction: () => {
          // User clicked No to saving
        },
      });
    } else {
      // Existing connection
      await proceedWithTest();
    }
  }

  isTestDbConnectionDisabled(): boolean {
    if (this.isTestingConnection) {
      return true;
    }

    // disable if no connection name provided
    if (!this.modalConnectionInfo.database.documentburster.connection.name) {
      return true;
    }
    const dbServer =
      this.modalConnectionInfo.database.documentburster.connection
        .databaseserver;

    // Rule 1: Database Type must be selected (this check remains the same)
    if (!dbServer.type) {
      return true; // Disabled if no type selected
    }

    // Rule 2: Check based on type
    if (dbServer.type === 'sqlite') {
      // For SQLite: Database File must be provided (and not be the placeholder if any)
      // Since the placeholder is cleared to '' on type change, checking for non-empty is sufficient.
      if (!dbServer.database) {
        return true; // Disabled if database file path is missing
      }
    } else {
      // For non-SQLite types: Check if fields are empty OR still contain the placeholder text
      if (
        !dbServer.host ||
        dbServer.host === newDatabaseServer.host ||
        !dbServer.port || // Port check might be just for non-empty as it's auto-populated
        !dbServer.database ||
        dbServer.database === newDatabaseServer.database ||
        !dbServer.userid ||
        dbServer.userid === newDatabaseServer.userid ||
        !dbServer.userpassword ||
        dbServer.userpassword === newDatabaseServer.userpassword
      ) {
        return true; // Disabled if any required field is missing or is still the placeholder
      }
    }

    // If all checks pass, the button should be enabled
    return false;
  }

  refreshDatabaseSchema(): void {
    // Don't proceed if already loading
    if (this.isSchemaLoading) {
      return;
    }

    // Show confirmation dialog
    this.confirmService.askConfirmation({
      message: 'This will refresh the Database Schema. Continue?',
      confirmAction: () => {
        const filePath = this.modalConnectionInfo.filePath;
        if (!filePath) {
          this.messagesService.showError(
            'Connection file path is missing. Cannot refresh schema.',
          );
          return;
        }

        // Set loading state
        this.isSchemaLoading = true;
        this.cdRef.detectChanges();

        const execPath = `"${Utilities.slash(filePath)}"`;

        // Call the same method used for testing database connections
        // as it already fetches the schema
        this.shellService.runBatFile(
          [
            'system',
            'test-and-fetch-database-schema',
            '--database-connection-file',
            execPath,
          ],
          `refreshing schema for '${this.modalConnectionInfo.database.documentburster.connection.name}'`,
          (result: { success: boolean }) => {
            if (result.success) {
              // Reload the schema data
              this.loadSchemaFromBackend(filePath);
            } else {
              this.isSchemaLoading = false;
              this.messagesService.showError(
                'Failed to refresh database schema.',
              );
              this.cdRef.detectChanges();
            }
          },
        );
      },
    });
  }

  async toggleDomainGroupedCodeView(): Promise<void> {
    this.isDomainGroupedCodeViewActive = !this.isDomainGroupedCodeViewActive;
    if (this.isDomainGroupedCodeViewActive) {
      // Switched TO Code View (ngx-codejar):
      // ngx-codejar will display domainGroupedSchemaJsonTextContent.
      // No explicit update needed here for domainGroupedSchemaJsonTextContent itself.
      // rawDomainGroupedSchema should already be in sync if changes were made via editor.
    } else {
      // Switched TO Picklist View:
      // Ensure rawDomainGroupedSchema (for picklist's source) is up-to-date with
      // the current domainGroupedSchemaJsonTextContent from the editor.
      try {
        // Use a temporary variable for parsing to avoid altering rawDomainGroupedSchema on parse error
        const parsed = JSON.parse(
          this.domainGroupedSchemaJsonTextContent.trim() === ''
            ? '{}'
            : this.domainGroupedSchemaJsonTextContent,
        );
        // Normalize the parsed content into the expected { domainGroups: [] } structure
        this.rawDomainGroupedSchema = this.normalizeSchemaFormat(parsed);
      } catch (e) {
        console.warn(
          'Error parsing editor content when switching to picklist view. Picklist source might be stale.',
          e,
        );
        // Fallback to an empty structure for rawDomainGroupedSchema to prevent errors in processDomainGroupedSchema
        this.rawDomainGroupedSchema = { domainGroups: [] };
      }
      this.processDomainGroupedSchema(this.rawDomainGroupedSchema);
      // domainTargetSchemaObjects are ephemeral and typically would be reset or re-evaluated
      // For now, we leave them as they were, or they could be cleared:
      // this.domainTargetSchemaObjects = [];
    }
    this.cdRef.detectChanges();
  }

  launchAiCopilotForDomainSchemaGeneration(): void {
    if (!this.rawSchemaData || !this.rawSchemaData.tables) {
      this.messagesService.showError(
        'Raw database schema is not loaded. Please load or refresh the database schema first to generate a domain-grouped schema.',
      );
      return;
    }

    // The prompt 'DB-SCHEMA-DOMAIN-GROUPED' expects an array of tables.
    const schemaTablesJsonString = JSON.stringify(
      this.rawSchemaData.tables,
      null,
      2,
    );

    const launchConfig: AiManagerLaunchConfig = {
      initialActiveTabKey: 'PROMPTS',
      initialSelectedCategory: 'Database Schema',
      initialExpandedPromptId: 'DB-SCHEMA-DOMAIN-GROUPED',
      promptVariables: {
        '[INSERT YOUR DATABASE SCHEMA HERE]': schemaTablesJsonString,
      },
    };

    if (this.aiManagerInstance) {
      this.aiManagerInstance.launchWithConfiguration(launchConfig);
    } else {
      this.messagesService.showError('AI Copilot component is not available.');
      console.error(
        'AI Copilot instance is not found. Ensure @ViewChild(AiManagerComponent) is correctly configured.',
      );
    }
  }

  launchAiCopilotForSchemaQuery(): void {
    let selectedTableObjects: any[] = [];
    let sourceSchemaName = '';

    if (this.isDatabaseSchemaTabActive) {
      selectedTableObjects = this.targetSchemaObjects; // Use targetSchemaObjects for Database Schema tab
      sourceSchemaName = 'Database Schema';
    } else if (this.isDomainGroupedSchemaTabActive) {
      selectedTableObjects = this.domainTargetSchemaObjects; // Use domainTargetSchemaObjects for Domain-Grouped Schema tab
      sourceSchemaName = 'Domain-Grouped Schema';
    } else {
      this.messagesService.showError(
        'Cannot determine the active schema tab to get selected tables.',
      );
      return;
    }

    // The this.context check might still be relevant depending on your overall design
    // For example, this feature might only be available when context is 'sqlQuery'
    if (this.context === 'sqlQuery' && selectedTableObjects.length === 0) {
      this.messagesService.showInfo(
        `Please select at least one table from the ${sourceSchemaName}.`, // Dynamic message
      );
      return;
    }

    // If not in 'sqlQuery' context but still no tables selected (e.g. if button was enabled some other way)
    if (selectedTableObjects.length === 0) {
      this.messagesService.showInfo(
        `No tables selected from the ${sourceSchemaName}.`, // Dynamic message
      );
      return;
    }

    let selectedTableNames: string[] = [];

    if (this.isDatabaseSchemaTabActive) {
      selectedTableNames = selectedTableObjects
        .map((item) => item.label) // item.label is the table name
        .filter((label) => !!label);
    } else if (this.isDomainGroupedSchemaTabActive) {
      // selectedTableObjects are domain nodes, each domain node has children which are table nodes
      selectedTableNames = selectedTableObjects
        .flatMap((domainNode) =>
          domainNode.children && Array.isArray(domainNode.children)
            ? domainNode.children.map((tableNode: any) => tableNode.label) // tableNode.label is the table name
            : [],
        )
        .filter((label: string) => !!label);
    }

    console.log(`selectedTableNames: ${selectedTableNames}`);

    if (selectedTableNames.length === 0) {
      this.messagesService.showInfo(
        `No table names could be determined from the selection in ${sourceSchemaName}.`,
      );
      return;
    }

    // Filter the rawSchemaData.tables to get the full objects for selected tables
    let relevantTableData: any[] = [];
    if (
      this.rawSchemaData &&
      this.rawSchemaData.tables &&
      Array.isArray(this.rawSchemaData.tables)
    ) {
      relevantTableData = this.rawSchemaData.tables.filter(
        (table) => selectedTableNames.includes(table.tableName), // Assuming tables in rawSchemaData have a 'tableName' property
      );
    }

    if (relevantTableData.length === 0) {
      this.messagesService.showError(
        `Could not find the schema details for the selected tables in ${sourceSchemaName}. Ensure the base schema is loaded.`,
      );
      return;
    }

    const tablesJsonString = JSON.stringify(relevantTableData, null, 2); // Pretty print JSON

    const targetPromptId = 'SQL_FROM_NATURAL_LANGUAGE';
    const targetCategory = 'SQL Writing Assistance';
    const promptPlaceholder =
      '[INSERT THE JSON REPRESENTATION OF THE RELEVANT TABLE SUBSET HERE]';

    const launchConfig: AiManagerLaunchConfig = {
      initialActiveTabKey: 'PROMPTS',
      initialSelectedCategory: targetCategory,
      initialExpandedPromptId: targetPromptId,
      promptVariables: {
        [promptPlaceholder]: tablesJsonString, // Use the full JSON string here
      },
    };

    if (this.aiManagerInstance) {
      this.aiManagerInstance.launchWithConfiguration(launchConfig);
    } else {
      this.messagesService.showError('AI Copilot component is not available.');
      console.error(
        'AI Copilot instance is not found. Ensure @ViewChild(AiManagerComponent) is correctly configured.',
      );
    }
  }

launchAiCopilotForVannaAITrainingPlanGeneration(): void {
  // 1. Check if schema is loaded (as before)
  if (!this.rawSchemaData || !this.rawSchemaData.tables) {
    this.messagesService.showError(
      'Raw database schema is not loaded. Please load or refresh the database schema first to generate a Vanna.AI training plan.',
    );
    return;
  }

  // 2. Check if at least one of the 5 checkboxes is selected
  const includeDbSchema = !!this.vannaTrainingIncludeDbSchema;
  const includeDomainGroupedSchema = !!this.vannaTrainingIncludeDomainGroupedSchema;
  const includeErDiagram = !!this.vannaTrainingIncludeErDiagram;
  const includeUbiquitousLanguage = !!this.vannaTrainingIncludeUbiquitousLanguage;
  const includeSqlQueries = !!this.vannaTrainingIncludeSqlQueries;

  if (
    !includeDbSchema &&
    !includeDomainGroupedSchema &&
    !includeErDiagram &&
    !includeUbiquitousLanguage &&
    !includeSqlQueries
  ) {
    this.messagesService.showError(
      'Please select at least one information source (Database Schema, Domain-Grouped Schema, ER Diagram, Ubiquitous Language, or SQL Queries) to generate a Vanna.AI training plan.',
    );
    return;
  }

  // 3. Prepare variables for the prompt
  let databaseType = '';
  let plainDbSchema = '';
  let domainGroupedSchema = '';
  let erDiagram = '';
  let ubiquitousLanguage = '';
  let sqlQueries = '';

  // Database Type (always included if schema is loaded)
  if (this.rawSchemaData && this.rawSchemaData.databaseType) {
    databaseType = this.rawSchemaData.databaseType;
  } else if (
    this.modalConnectionInfo &&
    this.modalConnectionInfo.database &&
    this.modalConnectionInfo.database.documentburster &&
    this.modalConnectionInfo.database.documentburster.connection &&
    this.modalConnectionInfo.database.documentburster.connection.databaseserver &&
    this.modalConnectionInfo.database.documentburster.connection.databaseserver.type
  ) {
    databaseType = this.modalConnectionInfo.database.documentburster.connection.databaseserver.type;
  }

  // Plain DB Schema (JSON)
  if (includeDbSchema) {
    plainDbSchema = JSON.stringify(this.rawSchemaData.tables, null, 2);
  }

  // Domain-Grouped Schema (Plain Text)
  if (includeDomainGroupedSchema && this.domainGroupedSchemaJsonTextContent) {
    domainGroupedSchema = this.domainGroupedSchemaJsonTextContent.trim();
  }

  // ER Diagram (PlantUML)
  if (includeErDiagram && this.plantUmlCode) {
    erDiagram = this.plantUmlCode.trim();
  }

  // Ubiquitous Language (Markdown)
  if (includeUbiquitousLanguage && this.ubiquitousLanguageMarkdown) {
    ubiquitousLanguage = this.ubiquitousLanguageMarkdown.trim();
  }

  // Existing SQL Queries (Optional)
  // if (includeSqlQueries && this.sqlQueriesTextContent) {
  //   sqlQueries = this.sqlQueriesTextContent.trim();
  // }

  sqlQueries = 'Test SQL Queries'; 
  
  // 4. Build the prompt variables object
  const promptVariables: { [key: string]: string } = {};

  promptVariables['[Specify Database Type, e.g., PostgreSQL, SQL Server, MySQL]'] = databaseType;

  if (includeDbSchema) {
    promptVariables['[VANNA TRAINING DB SCHEMA]'] = plainDbSchema;
  }
  if (includeDomainGroupedSchema) {
    promptVariables['[VANNA TRAINING DOMAIN GROUPED SCHEMA]'] = domainGroupedSchema;
  }
  if (includeErDiagram) {
    promptVariables['[VANNA TRAINING ER DIAGRAM]'] = erDiagram;
  }
  if (includeUbiquitousLanguage) {
    promptVariables['[VANNA TRAINING UBIQUITOUS LANGUAGE]'] = ubiquitousLanguage;
  }
  if (includeSqlQueries) {
    promptVariables['[VANNA TRAINING EXISTING SQL QUERIES]'] = sqlQueries;
  }

  // 5. Launch the AI Copilot with the constructed config
  const launchConfig: AiManagerLaunchConfig = {
    initialActiveTabKey: 'PROMPTS',
    initialSelectedCategory: 'Vanna.AI',
    initialExpandedPromptId: 'VANNA-AI-TRAINING-PLAN',
    promptVariables,
  };

  if (this.aiManagerInstance) {
    this.aiManagerInstance.launchWithConfiguration(launchConfig);
  } else {
    this.messagesService.showError('AI Copilot component is not available.');
    console.error(
      'AI Copilot instance is not found. Ensure @ViewChild(AiManagerComponent) is correctly configured.',
    );
  }
}

  // Method to handle changes in the JSON editor (ngx-codejar)
  onDomainGroupedSchemaJsonTextContentChanged(newCode: string): void {
    this.domainGroupedSchemaJsonTextContent = newCode;
    console.log(
      '[onDomainGroupedSchemaJsonTextContentChanged] newCode:',
      newCode,
    );
    try {
      // Parse the new text content from the editor
      const parsed = JSON.parse(newCode.trim() === '' ? '{}' : newCode);
      // Normalize the parsed content into the expected { domainGroups: [] } structure
      // This updates rawDomainGroupedSchema, which is the source for the picklist's available items.
      this.rawDomainGroupedSchema = this.normalizeSchemaFormat(parsed);

      // Repopulate the picklist's source based on the updated rawDomainGroupedSchema
      this.processDomainGroupedSchema(this.rawDomainGroupedSchema);

      this.domainGroupedSchemaExists =
        this.rawDomainGroupedSchema.domainGroups.length > 0;

      console.log(
        '[onDomainGroupedSchemaJsonTextContentChanged] updated domainSource count:',
        this.domainSourceSchemaObjects.length,
      );
    } catch (err) {
      console.warn(
        'Invalid JSON in editor, cannot update domain picklist source:',
        err,
      );
      // If JSON is invalid, rawDomainGroupedSchema might hold the last valid parsed state or an empty state.
      // processDomainGroupedSchema might be called with a fallback if desired, e.g.:
      // this.rawDomainGroupedSchema = { domainGroups: [] };
      // this.processDomainGroupedSchema(this.rawDomainGroupedSchema);
    }
    console.log(
      '[onDomainGroupedSchemaJsonTextContentChanged] rawDomainGroupedSchema:',
      this.rawDomainGroupedSchema,
    );
  }

  // Method for JSON syntax highlighting
  highlightJsonMethod(editor: HTMLElement) {
    const code = editor.textContent || '';
    return Prism.highlight(code, Prism.languages.json, 'json');
  }

  toggleDatabaseDiagramCodeView(): void {
    this.isDiagramEditMode = !this.isDiagramEditMode;
    if (!this.isDiagramEditMode && this.plantUmlCode) {
      console.log(
        'toggleDatabaseDiagramCodeView: Switched to view mode, re-encoding...',
      ); // Log toggle
      setTimeout(() => {
        this.encodePlantUmlDiagram();
      }, 100);
    }
  }

  // Method to launch AI Copilot for ER Diagram
  launchAiCopilotForErDiagram(): void {
    if (!this.rawSchemaData || !this.rawSchemaData.tables) {
      this.messagesService.showError(
        'Raw database schema is not loaded. Please load or refresh the database schema first.',
      );
      return;
    }

    const flatSchemaJson = JSON.stringify(this.rawSchemaData.tables, null, 2);

    const launchConfig: AiManagerLaunchConfig = {
      initialActiveTabKey: 'PROMPTS',
      initialSelectedCategory: 'Database Schema', // Or a more specific category if available
      initialExpandedPromptId: 'DB-SCHEMA-ER-DIAGRAM-PLANTUML', // Assuming this ID exists in prompts.json
      promptVariables: {
        '[INSERT YOUR DATABASE SCHEMA HERE]': flatSchemaJson,
      },
    };

    if (this.aiManagerInstance) {
      this.aiManagerInstance.launchWithConfiguration(launchConfig);
    } else {
      this.messagesService.showError('AI Copilot component is not available.');
      console.error('AI Copilot instance is not found.');
    }
  }

  onPlantUmlCodeChanged(newCode: string): void {
    this.plantUmlCode = newCode;
  }

  // Method for PlantUML syntax highlighting
  highlightPlantUmlMethod(editor: HTMLElement) {
    const code = editor.textContent || '';
    //return Prism.highlight(code, Prism.languages.clike, 'clike');
    //return Prism.highlight(code, Prism.languages['plant-uml'], 'plant-uml');
    return Prism.highlight(code, Prism.languages.plaintext, 'plaintext');
  }

  toggleUbiquitousLanguageEditMode(): void {
    this.isUbiquitousLanguageEditMode = !this.isUbiquitousLanguageEditMode;
  }

  onUbiquitousLanguageChanged(newContent: string): void {
    this.ubiquitousLanguageMarkdown = newContent;
  }

  // Method for Markdown syntax highlighting
  highlightMarkdownMethod(editor: HTMLElement) {
    const code = editor.textContent || '';
    return Prism.highlight(code, Prism.languages.markdown, 'markdown');
  }

  onSqliteFileSelected(filePath: string) {
    const dbServer =
      this.modalConnectionInfo.database.documentburster.connection
        .databaseserver;
    if (dbServer.type === 'sqlite') {
      dbServer.database = filePath;
      // Update connection string as well
      dbServer.connectionstring = `jdbc:sqlite:${filePath}`;
    }
  }

  // Helper to save email or database connection before testing
  private async saveCurrentConnection(
    isDbConnection: boolean,
  ): Promise<boolean> {
    console.log(
      `[saveCurrentConnection] isDbConnection=${isDbConnection}, filePath=${this.modalConnectionInfo.filePath}`,
    );
    try {
      const connectionName = isDbConnection
        ? this.modalConnectionInfo.database.documentburster.connection.name
        : this.modalConnectionInfo.email.documentburster.connection.name;
      const connectionData = isDbConnection
        ? this.modalConnectionInfo.database
        : this.modalConnectionInfo.email;

      // derive a truly relative path for backend
      const rawPath = this.modalConnectionInfo.filePath;
      const idx = rawPath.indexOf('config/connections/');
      const savePath = idx >= 0 ? rawPath.substring(idx) : rawPath;
      console.log(
        '[saveCurrentConnection] sending to backend, relative savePath=',
        savePath,
      );

      if (!connectionName) {
        this.messagesService.showError('Connection Name cannot be empty.');
        return false;
      }

      // Create or duplicate mode
      if (
        this.modalConnectionInfo.crudMode === 'create' ||
        this.modalConnectionInfo.duplicate
      ) {
        const prefix = isDbConnection ? 'db' : 'eml';
        const code = `${prefix}-${_.kebabCase(connectionName)}`;
        if (isDbConnection) {
          this.modalConnectionInfo.database.documentburster.connection.code =
            code;

          this.modalConnectionInfo.database.documentburster.connection.defaultConnection =
            false;

          if (this.settingsService.getDatabaseConnectionFiles().length === 0)
            this.modalConnectionInfo.database.documentburster.connection.defaultConnection =
              true;
        } else {
          this.modalConnectionInfo.email.documentburster.connection.code = code;
          this.modalConnectionInfo.email.documentburster.connection.defaultConnection =
            false;
        }
        await this.updateModelAndForm();
        if (
          this.modalConnectionInfo.connectionSameFilePathAlreadyExists ===
            true ||
          this.modalConnectionInfo.connectionSameFilePathAlreadyExists ===
            'file'
        ) {
          this.messagesService.showError(
            `Connection file '${this.modalConnectionInfo.filePath}' already exists. Choose a different name.`,
          );
          return false;
        }
      } else {
        // Update mode
        const sel = this.settingsService.connectionFiles.find(
          (f) => f.filePath === this.modalConnectionInfo.filePath,
        );
        if (!sel) {
          this.messagesService.showError(
            'Could not find the connection to update. Please reopen the modal.',
          );
          return false;
        }
        sel.connectionName = connectionName;
        if (isDbConnection)
          sel.dbserver = {
            ...this.modalConnectionInfo.database.documentburster.connection
              .databaseserver,
          };
        else
          sel.emailserver = {
            ...this.modalConnectionInfo.email.documentburster.connection
              .emailserver,
          };
      }

      await this.settingsService.saveConnectionFileAsync(
        savePath,
        connectionData,
      );

      // After successful save, update application state

      // 1. Clear all selections first - ensure only one connection is selected
      for (const conn of this.settingsService.connectionFiles) {
        conn.activeClicked = false;
      }

      if (
        this.modalConnectionInfo.crudMode === 'create' ||
        this.modalConnectionInfo.duplicate
      ) {
        // Create a new connection object for the settingsService.connectionFiles array
        const connectionType = isDbConnection
          ? 'database-connection'
          : 'email-connection';
        const connectionCode = isDbConnection
          ? this.modalConnectionInfo.database.documentburster.connection.code
          : this.modalConnectionInfo.email.documentburster.connection.code;

        const newConnection: ExtConnection = {
          fileName: savePath.split('/').pop() || '',
          filePath: savePath,
          connectionCode: connectionCode,
          connectionName: connectionName,
          connectionType: connectionType,
          activeClicked: true, // Mark this new connection as selected
          defaultConnection: isDbConnection
            ? this.modalConnectionInfo.database.documentburster.connection
                .defaultConnection
            : this.modalConnectionInfo.email.documentburster.connection
                .defaultConnection,
          usedBy: '--not used--',
        };

        // Add connection-specific properties
        if (isDbConnection) {
          newConnection.dbserver = {
            ...this.modalConnectionInfo.database.documentburster.connection
              .databaseserver,
          };
        } else {
          newConnection.emailserver = {
            ...this.modalConnectionInfo.email.documentburster.connection
              .emailserver,
          };
        }

        // Add the new connection to the list
        this.settingsService.connectionFiles.push(newConnection);

        // Reset cached email/db connection arrays to force refresh
        this.settingsService._emailConnectionsFiles = null;
        this.settingsService._databaseConnectionsFiles = null;

        // Update modal state to reflect we're now in "update" mode
        this.modalConnectionInfo.crudMode = 'update';
        this.modalConnectionInfo.duplicate = false;
        this.modalConnectionInfo.connectionSameFilePathAlreadyExists = '';
      } else {
        // In update mode, find and mark as selected the connection that was updated
        const updatedConnection = this.settingsService.connectionFiles.find(
          (conn) => conn.filePath === savePath,
        );

        if (updatedConnection) {
          updatedConnection.activeClicked = true;
        }
      }

      this.messagesService.showInfo(
        `Connection '${connectionName}' saved successfully.`,
      );
      return true;
    } catch (err) {
      console.error('[saveCurrentConnection] Error saving connection:', err);
      this.messagesService.showError(
        err.message || 'Failed to save connection file.',
      );
      return false;
    }
  }

  /**
   * Save the domain-grouped schema based SOLELY on `domainGroupedSchemaJsonTextContent`.
   * It does NOT consider UI state like `isDomainGroupedCodeViewActive` or `domainTargetSchemaObjects`.
   */
  private async saveConnectionDomainGroupedSchema(): Promise<boolean> {
    if (!this.modalConnectionInfo.filePath) {
      this.messagesService.showError(
        'Connection file path is not defined. Cannot save domain-grouped schema.',
      );
      return false;
    }

    const pathParts = this.modalConnectionInfo.filePath.split('/');
    const connectionFileName = pathParts[pathParts.length - 1];
    const connectionCode = connectionFileName.replace(/\.xml$/i, '');
    const targetPath = `config/connections/${connectionCode}/${connectionCode}-domain-grouped-schema.json`;
    // Update this.domainGroupedSchemaPath if it's meant to always reflect the target path for the current connection
    this.domainGroupedSchemaPath = targetPath;

    let hasMeaningfulContent = false;
    const textToSave = this.domainGroupedSchemaJsonTextContent;

    if (textToSave && textToSave.trim() !== '') {
      try {
        const parsedForCheck = JSON.parse(textToSave);
        // Use normalizeSchemaFormat to check against the consistent structure
        const normalizedForCheck = this.normalizeSchemaFormat(parsedForCheck);
        if (
          normalizedForCheck.domainGroups &&
          normalizedForCheck.domainGroups.length > 0
        ) {
          hasMeaningfulContent = true;
        }
      } catch (e) {
        // Invalid JSON is not meaningful content to save.
        console.warn(
          'Content for domain-grouped schema (domainGroupedSchemaJsonTextContent) is invalid JSON. Will not save.',
          e,
        );
        this.messagesService.showError(
          'Domain-grouped schema content in editor is invalid JSON. It was not saved.',
        );
      }
    }

    try {
      if (hasMeaningfulContent) {
        // Save the exact text content from domainGroupedSchemaJsonTextContent
        await this.fsService.writeAsync(targetPath, textToSave);
        this.messagesService.showInfo(
          'Domain-grouped schema saved successfully.',
        );
        this.domainGroupedSchemaExists = true;
      } else {
        // If content is empty, invalid, or parses to an empty schema, remove the file if it exists.
        if (await this.fsService.existsAsync(targetPath)) {
          await this.fsService.removeAsync(targetPath);
          this.messagesService.showInfo(
            'Empty or invalid domain-grouped schema - existing file removed or not saved.',
          );
        } else {
          // If file doesn't exist and content is not meaningful, no action needed, but can log.
          console.log(
            'Domain-grouped schema is empty or invalid; no file to save or remove.',
          );
        }
        this.domainGroupedSchemaExists = false; // Reflect that no meaningful schema is persisted
      }
      this.cdRef.detectChanges();
      return true;
    } catch (err) {
      console.error(
        'Error during file operation for domain-grouped schema:',
        err,
      );
      this.messagesService.showError(
        `Failed to save/remove domain-grouped schema file: ${err.message || err}`,
      );
      return false;
    }
  }

  private async saveConnectionErDiagram(): Promise<boolean> {
    if (!this.modalConnectionInfo.filePath) {
      this.messagesService.showError(
        'Connection file path is not defined. Cannot save ER Diagram.',
      );
      return false;
    }

    const pathParts = this.modalConnectionInfo.filePath.split('/');
    const connectionFileName = pathParts[pathParts.length - 1];
    const connectionCode = connectionFileName.replace(/\.xml$/i, '');
    this.erDiagramFilePath = `config/connections/${connectionCode}/${connectionCode}-er-diagram.puml`;

    try {
      const content = this.plantUmlCode?.trim() ?? '';
      if (content !== '') {
        await this.fsService.writeAsync(this.erDiagramFilePath, content);
        this.messagesService.showInfo('ER Diagram saved successfully.');
        this.domainGroupedSchemaExists = true;
      } else {
        // Remove existing diagram file if no content
        if (await this.fsService.existsAsync(this.erDiagramFilePath)) {
          await this.fsService.removeAsync(this.erDiagramFilePath);
          this.messagesService.showInfo('Empty ER Diagram removed.');
        }
        this.erDiagramFilePath = '';
      }
      this.cdRef.detectChanges();
      return true;
    } catch (err) {
      console.error('Error saving ER Diagram:', err);
      this.messagesService.showError(
        `Failed to save ER Diagram: ${err.message || err}`,
      );
      return false;
    }
  }

  private async saveConnectionUbiquitousLanguage(): Promise<boolean> {
    if (!this.modalConnectionInfo.filePath) {
      this.messagesService.showError(
        'Connection file path is not defined. Cannot save Ubiquitous Language.',
      );
      return false;
    }

    const pathParts = this.modalConnectionInfo.filePath.split('/');
    const connectionFileName = pathParts[pathParts.length - 1];
    const connectionCode = connectionFileName.replace(/\.xml$/i, '');
    this.ubiquitousLanguageFilePath = `config/connections/${connectionCode}/${connectionCode}-ubiquitous-language.md`;

    try {
      const content = this.ubiquitousLanguageMarkdown?.trim() ?? '';
      if (content !== '') {
        await this.fsService.writeAsync(
          this.ubiquitousLanguageFilePath,
          content,
        );
        this.messagesService.showInfo(
          'Ubiquitous Language saved successfully.',
        );
      } else {
        // Remove existing file if no content
        if (await this.fsService.existsAsync(this.ubiquitousLanguageFilePath)) {
          await this.fsService.removeAsync(this.ubiquitousLanguageFilePath);
          this.messagesService.showInfo('Empty Ubiquitous Language removed.');
        }
        this.ubiquitousLanguageFilePath = '';
      }
      this.cdRef.detectChanges();
      return true;
    } catch (err) {
      console.error('Error saving Ubiquitous Language:', err);
      this.messagesService.showError(
        `Failed to save Ubiquitous Language: ${err.message || err}`,
      );
      return false;
    }
  }

  /**
   * Load the domain-grouped schema:
   * - Reads file to `domainGroupedSchemaJsonTextContent`.
   * - Parses `domainGroupedSchemaJsonTextContent` into `rawDomainGroupedSchema`.
   * - Updates picklist source via `processDomainGroupedSchema`.
   */
  async loadDomainGroupedSchema(): Promise<void> {
    // Initialize/reset states
    this.domainGroupedSchemaJsonTextContent = '';
    this.rawDomainGroupedSchema = { domainGroups: [] };
    this.domainGroupedSchemaExists = false;

    if (!this.domainGroupedSchemaPath) {
      console.warn(
        'Domain-grouped schema path is not set. Using empty schema.',
      );
      // Process with empty schema to clear UI
      this.processDomainGroupedSchema(this.rawDomainGroupedSchema);
      this.cdRef.detectChanges();
      return;
    }

    try {
      const exists = await this.fsService.existsAsync(
        this.domainGroupedSchemaPath,
      );

      console.log(
        `Checking for domain-grouped schema file: ${this.domainGroupedSchemaPath}, exists: ${exists}`,
      );

      if (exists) {
        const fileContent = await this.fsService.readAsync(
          this.domainGroupedSchemaPath,
        );

        console.log(
          `Attempting to load domain-grouped schema from: ${this.domainGroupedSchemaPath}, fileContent: ${fileContent}`,
        );

        if (typeof fileContent === 'string' && fileContent.trim() !== '') {
          this.domainGroupedSchemaJsonTextContent = fileContent; // Store raw text
          try {
            const parsedJson = JSON.parse(fileContent);
            this.rawDomainGroupedSchema =
              this.normalizeSchemaFormat(parsedJson); // Parse and normalize
            // Check if the loaded and normalized schema has meaningful content
            this.domainGroupedSchemaExists =
              this.rawDomainGroupedSchema.domainGroups.length > 0;
          } catch (parseError) {
            console.error(
              'Invalid JSON in domain-grouped schema file:',
              parseError,
            );
            this.messagesService.showError(
              'Domain-grouped schema file contains invalid JSON. Displaying empty schema.',
            );
            // Fallback to empty state for rawDomainGroupedSchema and text content
            this.domainGroupedSchemaJsonTextContent = ''; // Or '{}' if preferred for editor
            this.rawDomainGroupedSchema = { domainGroups: [] };
            this.domainGroupedSchemaExists = false;
          }
        } else {
          // File exists but is empty or not a string
          console.log(
            `Domain-grouped schema file ${this.domainGroupedSchemaPath} is empty or content is not a string.`,
          );
          this.domainGroupedSchemaJsonTextContent = ''; // Ensure text content is also reset
          this.rawDomainGroupedSchema = { domainGroups: [] };
          this.domainGroupedSchemaExists = false;
        }
      } else {
        console.log(
          `Domain-grouped schema file does not exist: ${this.domainGroupedSchemaPath}.`,
        );
        // Ensure text content is reset if file doesn't exist
        this.domainGroupedSchemaJsonTextContent = '';
        this.rawDomainGroupedSchema = { domainGroups: [] };
        this.domainGroupedSchemaExists = false;
      }
    } catch (err) {
      console.error('Error loading domain-grouped schema:', err);
      this.messagesService.showError(
        `Failed to load domain-grouped schema: ${err.message || err}`,
      );
      this.domainGroupedSchemaJsonTextContent = ''; // Fallback on any other error
      this.rawDomainGroupedSchema = { domainGroups: [] };
      this.domainGroupedSchemaExists = false;
    }

    // Always update the picklist UI based on the final state of rawDomainGroupedSchema
    this.processDomainGroupedSchema(this.rawDomainGroupedSchema);
    this.cdRef.detectChanges();
  }

  /**
   * Load and display the generated schema JSON for a connection.
   */
  private async loadSchemaFromBackend(rawFilePath: string) {
    if (!rawFilePath) {
      console.warn('loadSchemaFromBackend called with no rawFilePath.');
      this.isSchemaLoading = false;
      this.showSchemaTreeSelect = false;
      this.rawSchemaData = null;
      this.sourceSchemaObjects = [];
      return;
    }

    // Extract the connection code to construct relative paths correctly
    const pathParts = rawFilePath.split('/');
    const connectionFileName = pathParts[pathParts.length - 1]; // e.g., "db-test-7.xml"
    const connectionCode = connectionFileName.replace(/\.xml$/i, ''); // e.g., "db-test-7"

    // Construct relative path that backend expects: config/connections/{code}/{code}-information-schema.json
    const relativeSchemaPath = `config/connections/${connectionCode}/${connectionCode}-information-schema.json`;

    // Declare content variable at this scope so it's available in the catch block
    let content: string = '';

    try {
      const fileExists = await this.fsService.existsAsync(relativeSchemaPath);
      console.log('fileExists:', fileExists, typeof fileExists);

      if (!fileExists) {
        console.log(
          `Database schema file not found: ${relativeSchemaPath}. Please test the connection or refresh the schema to generate it.`,
        );
        this.rawSchemaData = null;
        this.sourceSchemaObjects = [];
        this.showSchemaTreeSelect = false;
      } else {
        content = await this.fsService.readAsync(relativeSchemaPath);
        if (!content || content.trim() === '') {
          console.log(
            `Schema file ${relativeSchemaPath} is empty. No schema loaded.`,
          );
          this.rawSchemaData = null;
          this.sourceSchemaObjects = [];
          this.showSchemaTreeSelect = false;
        } else {
          const parsed: any = JSON.parse(content);
          this.rawSchemaData = parsed; // Cache the raw parsed data

          // build hierarchical nodes for UI (PickList)
          const nodes = (parsed.tables || []).map((tbl: any) => ({
            key: tbl.tableName,
            label: tbl.tableName,
            icon: 'fa fa-table',
            title: 'Type: ' + (tbl.tableType || 'TABLE'),
            data: tbl, // Store original table data in the UI node if needed by PickList or other UI features
            children: (tbl.columns || []).map((col: any) => ({
              key: tbl.tableName + '.' + col.columnName,
              label: col.columnName,
              icon:
                tbl.primaryKeyColumns &&
                tbl.primaryKeyColumns.includes(col.columnName)
                  ? 'fa fa-key'
                  : (tbl.foreignKeys || []).some(
                        (fk: any) => fk.fkColumnName === col.columnName,
                      )
                    ? 'fa fa-link'
                    : 'fa fa-columns',
              title: `${col.typeName || ''}${col.columnSize ? '[' + col.columnSize + ']' : ''} ${col.isNullable === false ? 'NOT NULL' : 'NULL'}`,
              data: col, // Store original column data
            })),
          }));

          // assign hierarchical table nodes for picklist
          this.sourceSchemaObjects = nodes; // top-level tables with children columns
          this.targetSchemaObjects = [];
          this.showSchemaTreeSelect = true;

          this.messagesService.showInfo('Database schema loaded.');
        }
      }
    } catch (err) {
      console.error('Error loading schema JSON:', err);
      this.rawSchemaData = null;
      this.sourceSchemaObjects = [];
      this.showSchemaTreeSelect = false;
    } finally {
      this.isSchemaLoading = false;

      // Check for domain-grouped schema independently to ensure tabs work separately
      try {
        if (this.modalConnectionInfo.filePath) {
          await this.checkDomainGroupedSchemaExists();
        }
      } catch (domainErr) {
        console.error(
          'Error checking domain-grouped schema (independent):',
          domainErr,
        );
        // Don't let domain schema errors affect database schema functionality
      }

      this.cdRef.detectChanges();
    }
  }

  /**
   * Normalizes different possible JSON structures into a consistent { domainGroups: any[] } format.
   * Handles cases where the root might be an array of domain groups,
   * or an object with a 'domainGroupedSchema' key, or 'domainGroups' key.
   */
  private normalizeSchemaFormat(parsedJson: any): { domainGroups: any[] } {
    if (!parsedJson) {
      return { domainGroups: [] };
    }
    if (Array.isArray(parsedJson)) {
      // If the root is directly an array, assume it's the array of domain groups.
      return { domainGroups: parsedJson };
    }
    if (parsedJson && typeof parsedJson === 'object') {
      if (Array.isArray(parsedJson.domainGroups)) {
        return { domainGroups: parsedJson.domainGroups };
      }
      if (Array.isArray(parsedJson.domainGroupedSchema)) {
        // Handle older format or LLM output that might use 'domainGroupedSchema'
        return { domainGroups: parsedJson.domainGroupedSchema };
      }
    }
    // Fallback for unrecognized structures or if parsedJson is not an object/array.
    return { domainGroups: [] };
  }

  /**
   * Populates the picklist's source view (`domainSourceSchemaObjects`)
   * based on the `rawDomainGroupedSchema`.
   * Resets the picklist's target view (`domainTargetSchemaObjects`).
   */
  processDomainGroupedSchema(schemaDataToProcess: {
    domainGroups: any[];
  }): void {
    console.log(
      '[processDomainGroupedSchema] Processing schema data:',
      schemaDataToProcess,
    );

    // Ensure schemaDataToProcess and its domainGroups property are valid
    let domainGroupsArray: any[] = [];
    if (
      schemaDataToProcess &&
      Array.isArray(schemaDataToProcess.domainGroups)
    ) {
      domainGroupsArray = schemaDataToProcess.domainGroups;
    } else {
      console.warn(
        '[processDomainGroupedSchema] schemaDataToProcess.domainGroups is not an array or schemaDataToProcess is null/invalid. Picklist source will be empty.',
      );
    }

    // Populate the source for the picklist
    this.domainSourceSchemaObjects =
      this.mapDomainGroupsToTreeNodes(domainGroupsArray);

    // Reset the target of the picklist as the source has changed.
    // User selections in domainTargetSchemaObjects are ephemeral and not persisted with the schema file.
    this.domainTargetSchemaObjects = [];

    this.showDomainSchemaTreeSelect = this.domainSourceSchemaObjects.length > 0;
    this.cdRef.detectChanges();
  }

  encodePlantUmlDiagram(): void {
    try {
      if (!this.plantUmlCode || this.plantUmlCode.trim() === '') {
        this.encodedPlantUmlDiagram = ''; // Set to empty if no actual code
        console.log(
          'PlantUML code is empty, encodedPlantUmlDiagram set to empty.',
        );
        return;
      }

      // Step 1: Convert the PlantUML string to UTF-8 bytes
      const textEncoder = new TextEncoder();
      const bytes = textEncoder.encode(this.plantUmlCode);

      // Step 2: Deflate the bytes using pako
      const deflated = pako.deflate(bytes); // Remove the options object that had 'to: string'

      // Step 3: Convert deflated bytes to binary string
      const binaryString = Array.from(deflated)
        .map((byte) => String.fromCharCode(byte))
        .join('');

      // Step 4: Base64 encode
      const base64 = btoa(binaryString);

      // Step 5: Make URL safe
      this.encodedPlantUmlDiagram = base64
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');

      console.log(
        'Encoded successfully, length:',
        this.encodedPlantUmlDiagram.length,
      );
    } catch (error) {
      console.error('Encoding error:', error);
      this.encodedPlantUmlDiagram = '';
    }
  }

  /**
   * Check if domain-grouped schema file exists and load it if it does
   */
  async checkDomainGroupedSchemaExists(): Promise<void> {
    if (!this.modalConnectionInfo.filePath) {
      this.domainGroupedSchemaExists = false;
      this.domainGroupedSchemaJsonTextContent = ''; // Default to empty object string
      this.rawDomainGroupedSchema = { domainGroups: [] }; // Set empty raw data
      this.processDomainGroupedSchema({ domainGroups: [] }); // Process empty schema for UI consistency
      this.showDomainSchemaTreeSelect = false; // Ensure picklist is hidden
      return;
    }

    try {
      // Extract the connection code to construct relative paths correctly
      const pathParts = this.modalConnectionInfo.filePath.split('/');
      const connectionFileName = pathParts[pathParts.length - 1]; // e.g., "db-test-7.xml"
      const connectionCode = connectionFileName.replace(/\.xml$/i, ''); // e.g., "db-test-7"

      // Construct relative path that backend expects: config/connections/{code}/{code}-domain-grouped-schema.json
      const domainGroupedSchemaPath = `config/connections/${connectionCode}/${connectionCode}-domain-grouped-schema.json`;

      // Store the path but don't assume the file exists yet
      this.domainGroupedSchemaPath = domainGroupedSchemaPath;

      // Check if the file exists
      const exists = await this.fsService.existsAsync(domainGroupedSchemaPath);
      this.domainGroupedSchemaExists = !!exists;

      if (exists) {
        // File exists, attempt to load it
        await this.loadDomainGroupedSchema();
      } else {
        console.log(
          `Domain-grouped schema file does not exist yet: ${domainGroupedSchemaPath}`,
        );
        // Set default empty schema since the file doesn't exist
        this.domainGroupedSchemaJsonTextContent = ''; // Default to empty object for the editor
        this.rawDomainGroupedSchema = { domainGroups: [] }; // Set empty raw data
        this.processDomainGroupedSchema({ domainGroups: [] }); // Initialize the UI with empty state
      }

      this.cdRef.detectChanges();
    } catch (err) {
      console.error('Error checking domain-grouped schema:', err);
      this.domainGroupedSchemaExists = false;
      this.domainGroupedSchemaJsonTextContent = '';
      this.rawDomainGroupedSchema = { domainGroups: [] };
      this.processDomainGroupedSchema({ domainGroups: [] });
      this.showDomainSchemaTreeSelect = false; // Ensure picklist is hidden on error
      this.cdRef.detectChanges();
    }
  }

  private mapDomainGroupsToTreeNodes(domainGroups: any[]): any[] {
    if (!domainGroups || !Array.isArray(domainGroups)) return [];

    return domainGroups
      .map((domain) => {
        // Create domain node with proper tree node properties
        const domainNode = {
          key: `domain_${(domain.label || domain.name || 'unknown').replace(/\s+/g, '_')}`,
          label: domain.label || domain.name || 'Unknown Domain',
          icon: 'fa fa-layer-group',
          children: [],
        };

        // Process tables in this domain
        const tables = domain.tables || domain.children || [];
        if (Array.isArray(tables)) {
          domainNode.children = tables
            .filter((table) => table.name || table.tableName) // Only process valid tables
            .map((table) => {
              // Table node
              const tableNode = {
                key: table.name || table.tableName,
                label: table.name || table.tableName,
                icon: 'fa fa-table',
                children: [],
              };

              // Process columns if present
              const columns = table.columns || table.children || [];
              if (Array.isArray(columns)) {
                tableNode.children = columns.map((column) => ({
                  key: `${tableNode.label}.${column.name || column.columnName}`,
                  label: column.name || column.columnName,
                  icon: column.isPrimaryKey
                    ? 'fa fa-key'
                    : column.isForeignKey
                      ? 'fa fa-link'
                      : 'fa fa-columns',
                }));
              }

              return tableNode;
            });
        }

        // Process nested domains recursively
        const nestedDomains = Array.isArray(domain.domains)
          ? domain.domains
          : [];
        if (nestedDomains.length > 0) {
          domainNode.children = [
            ...domainNode.children,
            ...this.mapDomainGroupsToTreeNodes(nestedDomains),
          ];
        }

        return domainNode;
      })
      .filter((domain) => domain.children.length > 0); // Only include non-empty domains
  }

  async showCrudModal(
    crudMode: string,
    connectionType: string = 'email-connection',
    duplicate?: boolean,
    connectionDetails?: ExtConnection,
  ) {
    this.modalConnectionInfo.connectionType = connectionType;
    this.modalConnectionInfo.crudMode = crudMode;

    // Reset all tab active states for the database modal
    this.isConnectionDetailsTabActive = false;
    this.isDatabaseSchemaTabActive = false;
    this.isDomainGroupedSchemaTabActive = false;
    this.isErDiagramTabActive = false;
    this.isUbiquitousLanguageTabActive = false;

    if (connectionType === 'email-connection') {
      this.modalConnectionInfo.modalTitle = 'Create Email Connection';

      this.modalConnectionInfo.connectionSameFilePathAlreadyExists = false;
      this.modalConnectionInfo.email.documentburster.connection.code = '';
      this.modalConnectionInfo.email.documentburster.connection.name = '';

      this.modalConnectionInfo.email.documentburster.connection.defaultConnection =
        false;

      if (crudMode == 'update' || duplicate) {
        const selectedConnection = connectionDetails;

        if (crudMode == 'update') {
          this.modalConnectionInfo.filePath = selectedConnection.filePath;

          this.modalConnectionInfo.modalTitle = 'Update Email Connection';

          this.modalConnectionInfo.email.documentburster.connection.code =
            selectedConnection.connectionCode;

          this.modalConnectionInfo.email.documentburster.connection.name =
            selectedConnection.connectionName;

          this.modalConnectionInfo.email.documentburster.connection.defaultConnection =
            selectedConnection.defaultConnection;
        }

        this.modalConnectionInfo.email.documentburster.connection.emailserver =
          {
            ...selectedConnection.emailserver,
          };
      } else {
        this.modalConnectionInfo.email.documentburster.connection.defaultConnection =
          false;

        this.modalConnectionInfo.email.documentburster.connection.emailserver =
          {
            ...newEmailServer,
          };
      }
      this.isModalEmailConnectionVisible = true;
    } else if (connectionType === 'database-connection') {
      this.modalConnectionInfo.modalTitle = 'Create Database Connection';

      this.modalConnectionInfo.filePath = '';
      this.modalConnectionInfo.connectionSameFilePathAlreadyExists = false;
      this.modalConnectionInfo.database.documentburster.connection.code = '';
      this.modalConnectionInfo.database.documentburster.connection.name = '';
      this.modalConnectionInfo.database.documentburster.connection.defaultConnection =
        false;

      // Reset schema-related states that might persist from a previous edit
      this.rawSchemaData = null;
      this.sourceSchemaObjects = [];
      this.targetSchemaObjects = []; // Usually reset when source changes, but good to be explicit
      this.showSchemaTreeSelect = false;
      this.isSchemaLoading = false;
      this.isTestingConnection = false;

      this.isModalDbConnectionVisible = true;

      if (crudMode == 'update' || duplicate) {
        const selectedConnection = connectionDetails;

        if (crudMode == 'update') {
          this.modalConnectionInfo.filePath = selectedConnection.filePath;

          this.modalConnectionInfo.modalTitle = 'Update Database Connection';
          if (this.context === 'sqlQuery')
            this.modalConnectionInfo.modalTitle =
              'Choose Table(s) & Generate SQL';

          this.modalConnectionInfo.database.documentburster.connection.code =
            selectedConnection.connectionCode;
          this.modalConnectionInfo.database.documentburster.connection.name =
            selectedConnection.connectionName;
          this.modalConnectionInfo.database.documentburster.connection.defaultConnection =
            selectedConnection.defaultConnection;
        }

        this.modalConnectionInfo.database.documentburster.connection.databaseserver =
          {
            ...selectedConnection.dbserver, // use correct property
          };
        // Trigger schema load for update
        if (crudMode == 'update') {
          await this.loadSchemaFromBackend(selectedConnection.filePath);
          // Load ER Diagram and Ubiquitous Language
          await this.loadErDiagram(selectedConnection.filePath);
          await this.loadUbiquitousLanguage(selectedConnection.filePath);

          if (this.context === 'sqlQuery') {
            console.log(
              `this.domainGroupedSchemaExists = ${this.domainGroupedSchemaExists}`,
            );
            if (this.domainGroupedSchemaExists) {
              this.isDomainGroupedSchemaTabActive = true;
            } else {
              this.isDatabaseSchemaTabActive = true;
            }
          } else {
            this.isConnectionDetailsTabActive = true; // Default for non-sqlQuery context
          }
        } else {
          // duplicate mode
          this.isConnectionDetailsTabActive = true; // Default for duplicate mode
        }
      } else {
        // Create mode
        this.modalConnectionInfo.database.documentburster.connection.defaultConnection =
          false;
        this.modalConnectionInfo.database.documentburster.connection.databaseserver =
          {
            ...newDatabaseServer,
          };
        // Reset ER Diagram and Ubiquitous Language to defaults for create mode
        this.plantUmlCode = '';
        this.ubiquitousLanguageMarkdown = '';
        this.erDiagramFilePath = '';
        this.ubiquitousLanguageFilePath = '';

        // Reset Domain Grouped Schema for create mode
        this.domainGroupedSchemaJsonTextContent = ''; // Initialize to empty string
        this.rawDomainGroupedSchema = { domainGroups: [] }; // Initialize raw model
        this.domainGroupedSchemaPath = '';
        this.domainGroupedSchemaExists = false;
        this.processDomainGroupedSchema(this.rawDomainGroupedSchema); // Update UI (clears picklist source)

        this.isConnectionDetailsTabActive = true; // Default for create mode
      }
    }
  }

  // Method to load ER Diagram content
  private async loadErDiagram(connectionFilePath: string): Promise<void> {
    if (!connectionFilePath) {
      this.plantUmlCode = '';
      this.encodePlantUmlDiagram();
      this.erDiagramFilePath = '';
      return;
    }
    try {
      const pathParts = connectionFilePath.split('/');
      const connectionFileName = pathParts[pathParts.length - 1];
      const connectionCode = connectionFileName.replace(/\.xml$/i, '');
      const erDiagramPath = `config/connections/${connectionCode}/${connectionCode}-er-diagram.puml`;
      this.erDiagramFilePath = erDiagramPath;

      const exists = await this.fsService.existsAsync(erDiagramPath);
      if (exists) {
        const content = await this.fsService.readAsync(erDiagramPath);
        this.plantUmlCode = content || '';
      } else {
        this.plantUmlCode = '';
      }
    } catch (err) {
      console.error('Error loading ER Diagram:', err);
      this.plantUmlCode = '';
    } finally {
      this.encodePlantUmlDiagram();
      this.cdRef.detectChanges();
    }
  }

  // Method to load Ubiquitous Language content
  private async loadUbiquitousLanguage(
    connectionFilePath: string,
  ): Promise<void> {
    if (!connectionFilePath) {
      this.ubiquitousLanguageMarkdown = '';
      this.ubiquitousLanguageFilePath = '';
      return;
    }
    try {
      const pathParts = connectionFilePath.split('/');
      const connectionFileName = pathParts[pathParts.length - 1];
      const connectionCode = connectionFileName.replace(/\.xml$/i, '');
      const ulPath = `config/connections/${connectionCode}/${connectionCode}-ubiquitous-language.md`;
      this.ubiquitousLanguageFilePath = ulPath;

      const exists = await this.fsService.existsAsync(ulPath);
      console.log(`Ubiquitous Language file exists: ${exists}`);

      if (exists) {
        const content = await this.fsService.readAsync(ulPath);
        this.ubiquitousLanguageMarkdown = content || '';
      } else {
        this.ubiquitousLanguageMarkdown = '';
      }
    } catch (err) {
      console.error('Error loading Ubiquitous Language:', err);
      this.ubiquitousLanguageMarkdown = ''; // Reset on error
    } finally {
      this.cdRef.detectChanges();
    }
  }

  public isStringAndNotEmpty(value: any): boolean {
    return typeof value === 'string' && value.length > 0;
  }

  initializePlantUmlDiagram(): void {
    console.log(
      `initializePlantUmlDiagram: plantUmlCode length: ${this.plantUmlCode?.length}`,
    ); // Log code length before encoding
    if (this.plantUmlCode) {
      this.encodePlantUmlDiagram();
    } else {
      console.warn('initializePlantUmlDiagram: No plantUmlCode to initialize.');
    }
  }

  public launchWithAiCopilotConfiguration(
    config?: AiManagerLaunchConfig,
  ): void {
    if (config?.initialActiveTabKey)
      this.initialAiCopilotActiveTabKey = config?.initialActiveTabKey;
    if (config?.initialSelectedCategory)
      this.initialAiCopilotSelectedCategory = config.initialSelectedCategory;
    if (config?.initialExpandedPromptId)
      this.initialAiCopilotExpandedPromptId = config.initialExpandedPromptId;
    if (config?.promptVariables)
      this.initialAiCopilotVariables = config.promptVariables;
  }

  public getUbiquitousLanguageExampleMarkdown(): string {
    let example = '#### Core Concepts\n\n';

    if (
      this.rawSchemaData &&
      this.rawSchemaData.tables &&
      this.rawSchemaData.tables.length > 0
    ) {
      const table1 = this.rawSchemaData.tables[0];
      const table1Name = Utilities.toTitleCase(
        table1.tableName || 'YourEntity',
      );
      example += `**${table1Name}**\n`;
      example += `*   **Definition**: Represents [describe the purpose of the ${table1Name} table/entity here, e.g., a customer transaction, user profile, product inventory].\n`;
      if (table1.columns && table1.columns.length > 0) {
        const column1 = table1.columns[0];
        const column1Name = column1.columnName || 'ImportantAttribute';
        example += `*   **Key Attribute (${column1Name})**: [Describe the significance of ${column1Name}, e.g., primary identifier, critical status field].\n`;
      }
      example += `*   **Business Rule**: e.g., "A ${table1Name} must always be linked to a valid [OtherEntityName] via the foreign key."\n\n`;

      if (this.rawSchemaData.tables.length > 1) {
        const table2 = this.rawSchemaData.tables[1];
        const table2Name = Utilities.toTitleCase(
          table2.tableName || 'AnotherRelatedEntity',
        );
        example += `**${table2Name}**\n`;
        example += `*   **Relationship with ${table1Name}**: [Describe how ${table2Name} relates to ${table1Name}, e.g., "Each ${table1Name} can have multiple ${table2Name} records, representing order items."]\n`;
      }
    } else {
      example += '**Customer**\n';
      example +=
        '*   **Definition**: An individual or organization that has engaged with our services or purchased products.\n';
      example +=
        '*   **Business Rule**: Must have a unique `customer_id`. An email address is preferred for communication.\n\n';
      example += '**Order**\n';
      example +=
        '*   **Definition**: A formal request by a `Customer` to purchase one or more `Products` or `Services`.\n';
      example +=
        '*   **States**: Can be `DRAFT`, `PENDING_PAYMENT`, `CONFIRMED`, `SHIPPED`, `DELIVERED`, `CANCELLED`.\n';
    }
    example += '\n#### Key Terms (Glossary)\n\n';
    example +=
      '*   **MVP (Minimum Viable Product)**: The version of a new product which allows a team to collect the maximum amount of validated learning about customers with the least effort.\n';
    example +=
      '*   **SLA (Service Level Agreement)**: A commitment between a service provider and a client detailing aspects like quality, availability, responsibilities.\n';
    return example;
  }

  async getManagedApps(): Promise<ManagedApp[]> {
    const apps: ManagedApp[] = [];

    const cloudbeaverApp = await this.appsManagerService.getAppById('cloudbeaver');
    if (cloudbeaverApp) {
      apps.push(cloudbeaverApp);
    }

    const vscodeApp = await this.appsManagerService.getAppById('vscode');
    if (vscodeApp) {
      apps.push(vscodeApp);
    }

    // console.log(`apps: ${JSON.stringify(apps)}`);
    return apps;
  }

  async toggleVannaAiService() {
    let dialogQuestion = `Start Vanna.AI?`;
    if (this.isVannaAiStarted) {
      dialogQuestion = `Stop Vanna.AI?`;
    }

    this.confirmService.askConfirmation({
      message: dialogQuestion,
      confirmAction: async () => {
        this.isVannaAiStarted = !this.isVannaAiStarted;
      }
    });
  }

  getAiTrainingCheckboxDisabledTooltip(checkboxId: string): string {
  switch (checkboxId) {
    case 'vannaTrainingIncludeDbSchema':
      if (this.isSchemaLoading) return 'Database schema is loading...';
      if (!this.sourceSchemaObjects || this.sourceSchemaObjects.length === 0)
        return 'No database schema loaded. Please test or refresh the connection first.';
      return '';
    case 'vannaTrainingIncludeDomainGroupedSchema':
      if (!this.domainGroupedSchemaExists)
        return 'No domain-grouped schema found. Please generate or save one first.';
      return '';
    case 'vannaTrainingIncludeErDiagram':
      if (!this.erDiagramExists)
        return 'No ER diagram found. Please create and save an ER diagram first.';
      return '';
    case 'vannaTrainingIncludeUbiquitousLanguage':
      if (!this.isStringAndNotEmpty(this.ubiquitousLanguageMarkdown))
        return 'No Ubiquitous Language content found. Please add and save some content first.';
      return '';
    case 'vannaTrainingIncludeSqlReportQueries':
      if (!(this as any).hasSqlReportQueries)
        return 'No SQL-based report queries found for this connection.';
      return '';
    default:
      return '';
  }
}

}
