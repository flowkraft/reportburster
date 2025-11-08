import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import _ from 'lodash';

import { leftMenuTemplate } from './templates/_left-menu';
import { tabsTemplate } from './templates/_tabs';
import { tabExternalConnectionsTemplate } from './templates/tab-configuration-connection';
import { tabLogsTemplate } from './templates/tab-logs';

import { tabLicenseTemplate } from './templates/tab-license';
import { ConfirmService } from '../../components/dialog-confirm/confirm.service';
import { ToastrMessagesService } from '../../providers/toastr-messages.service';

import { ActivatedRoute, Router } from '@angular/router';
import { ExecutionStatsService } from '../../providers/execution-stats.service';
import { InfoService } from '../../components/dialog-info/info.service';
import {
  ExtConnection,
  newDatabaseServer,
  newEmailServer,
  SettingsService,
} from '../../providers/settings.service';
import { ShellService } from '../../providers/shell.service';
import { FsService } from '../../providers/fs.service';
import { ConnectionDetailsComponent } from '../../components/connection-details/connection-details.component';

@Component({
  selector: 'dburst-connection-list',
  template: `
    <aside class="main-sidebar">
      <section class="sidebar">${leftMenuTemplate}</section>
    </aside>
    <div class="content-wrapper">
      <section class="content"><div>${tabsTemplate}</div></section>
    </div>
    ${tabExternalConnectionsTemplate}
    <dburst-connection-details
      #connectionDetailsModal
    ></dburst-connection-details>
    ${tabLogsTemplate} ${tabLicenseTemplate}
  `,
})
export class ConnectionListComponent implements OnInit {
  @ViewChild('connectionDetailsModal')
  connectionDetailsModalInstance!: ConnectionDetailsComponent;

  goBackLocation = '';
  configurationFilePath = '';
  configurationFileName = '';

  constructor(
    protected confirmService: ConfirmService,
    protected messagesService: ToastrMessagesService,
    protected fsService: FsService,
    protected settingsService: SettingsService,
    protected infoService: InfoService,
    protected executionStatsService: ExecutionStatsService,
    protected shellService: ShellService,
    protected route: ActivatedRoute,
    protected router: Router,
  ) { }

  async ngOnInit() {
    this.settingsService.numberOfUserVariables = 20;
    this.settingsService.currentConfigurationTemplateName = '';
    this.settingsService.currentConfigurationTemplatePath = '';

    this.settingsService.configurationFiles =
      await this.settingsService.loadAllSettingsFilesAsync();

    await this.settingsService.loadAllConnectionFilesAsync();

    if (!this.settingsService.defaultEmailConnectionFile) {
      if (
        this.settingsService.connectionFiles &&
        this.settingsService.connectionFiles.length > 0
      ) {
        this.messagesService.showWarning(
          'Choose a single email connection to be the `Default` email cnnection',
        );
      } else {
        this.messagesService.showInfo(
          'Multiple email connections can be configured and one should be selected to be the `Default` email connection`',
        );
      }
    }

    this.route.params.subscribe(async (params) => {
      if (params.goBackLocation) {
        this.goBackLocation = params.goBackLocation;
        this.configurationFilePath = params.configurationFilePath;
        this.configurationFileName = params.configurationFileName;
      }
    });
  }

  //generate inline a function at this location

  onItemClick(item: { filePath: string }) {
    //console.log(item.filePath);

    for (const connectionFile of this.settingsService.connectionFiles) {
      connectionFile.activeClicked =
        connectionFile.filePath === item.filePath ? true : false;
    }
  }

  getSelectedConnection() {
    if (!this.settingsService.connectionFiles) {
      return undefined;
    }

    return this.settingsService.connectionFiles.find(
      (connection) => connection.activeClicked,
    );
  }

  onDeleteSelectedConnection() {
    const selectedConnection = this.getSelectedConnection(); // Get the full connection object
    if (!selectedConnection) {
      this.messagesService.showWarning('No connection selected to delete.');
      return;
    }

    // Customize confirmation message
    let dialogQuestion = `Are you sure you want to delete the ${selectedConnection.connectionType || 'item'} '${selectedConnection.connectionName}'?`;
    if (selectedConnection.connectionType === 'database-connection') {
      dialogQuestion +=
        '\nThis will also delete its associated schema, ER diagram, and ubiquitous language files.';
    }

    this.confirmService.askConfirmation({
      message: dialogQuestion,
      confirmAction: async () => {
        const originalFilePath = selectedConnection.filePath; // Path to the .xml file, used for removing from list
        let pathToRemoveOnBackend = originalFilePath; // Path for the fsService.removeAsync call

        if (selectedConnection.connectionType === 'database-connection') {
          // For database connections, target the parent directory for deletion.
          // Example: originalFilePath = "config/connections/db-my-connection/db-my-connection.xml"
          // We want to remove "config/connections/db-my-connection"
          const pathParts = originalFilePath.split('/');
          if (pathParts.length > 1) {
            // Ensure there's a parent directory
            pathParts.pop(); // Remove the file name (e.g., "db-my-connection.xml")
            pathToRemoveOnBackend = pathParts.join('/');
          } else {
            // Should not happen for DB connections if path structure is consistent
            console.error(
              'Could not determine parent directory for database connection:',
              originalFilePath,
            );
            this.messagesService.showError(
              'Error determining path for database connection deletion.',
            );
            return;
          }
        }

        try {
          // The fsService.removeAsync should be capable of removing a directory recursively
          console.log(`Removing path: ${pathToRemoveOnBackend}`);
          await this.fsService.removeAsync(pathToRemoveOnBackend);

          // Remove the connection from the frontend list using its original unique filePath
          _.remove(
            this.settingsService.connectionFiles,
            (o) => o.filePath === originalFilePath,
          );

          // If the deleted connection was marked default, clear the app-level default pointer(s)
          if (selectedConnection.defaultConnection) {
            // clear database default if it pointed to this file
            if ((this.settingsService as any).defaultDatabaseConnectionFile &&
              (this.settingsService as any).defaultDatabaseConnectionFile.filePath === originalFilePath) {
              (this.settingsService as any).defaultDatabaseConnectionFile = null;
            }
            // clear email default if it pointed to this file
            if (this.settingsService.defaultEmailConnectionFile &&
              this.settingsService.defaultEmailConnectionFile.filePath === originalFilePath) {
              this.settingsService.defaultEmailConnectionFile = null;
            }
          }

          // Ensure the in-memory array reference is updated so bindings re-evaluate
          this.settingsService.connectionFiles = [...(this.settingsService.connectionFiles || [])];

          // If there are no connections left, ensure no default remains
          if (!this.settingsService.connectionFiles || this.settingsService.connectionFiles.length === 0) {
            (this.settingsService as any).defaultDatabaseConnectionFile = null;
            this.settingsService.defaultEmailConnectionFile = null;
          }

          this.messagesService.showInfo(
            `Connection '${selectedConnection.connectionName}' deleted successfully.`,
          );
          // Potentially clear any displayed details of the deleted connection if necessary
          // this.clearDisplayedConnectionDetails();
        } catch (error) {
          console.error(
            `Error deleting connection '${selectedConnection.connectionName}':`,
            error,
          );
          this.messagesService.showError(
            `Failed to delete connection: ${error.message || 'Unknown error'}`,
          );
        }
      },
    });
  }

  async doTestSMTPConnection() {
    // Delegate to the modal component, passing the selected connection
    const selectedConnection = this.getSelectedConnection();
    if (!selectedConnection) {
      this.messagesService.showWarning('No connection selected.');
      return;
    }
    // Show the modal in update mode for the selected connection
    await this.connectionDetailsModalInstance.showCrudModal(
      'update',
      'email-connection',
      false,
      selectedConnection
    );
    // Call the test method on the modal instance
    await this.connectionDetailsModalInstance.doTestSMTPConnection();
  }

  async doTestDatabaseConnection() {
    // Delegate to the modal component, passing the selected connection
    const selectedConnection = this.getSelectedConnection();
    if (!selectedConnection) {
      this.messagesService.showWarning('No connection selected.');
      return;
    }
    // Show the modal in update mode for the selected connection
    await this.connectionDetailsModalInstance.showCrudModal(
      'update',
      'database-connection',
      false,
      selectedConnection
    );
    // Call the test method on the modal instance
    await this.connectionDetailsModalInstance.doTestDatabaseConnection();
  }

  async showCrudModal(
    crudMode: string,
    connectionType: string = 'email-connection',
    duplicate?: boolean,
  ) {
    console.log('ConfigurationConnectionsComponet: showCrudModal()');
    this.connectionDetailsModalInstance.showCrudModal(
      crudMode,
      connectionType,
      duplicate,
      this.getSelectedConnection(),
    );
  }

  goBack() {
    this.router.navigate(
      [
        '/configuration',
        'emailSettingsMenuSelected',
        this.configurationFilePath,
        this.configurationFileName,
        true,
      ],
      { skipLocationChange: true },
    );
  }

  async toggleDefault() {
    const selectedConnection = this.getSelectedConnection();

    if (!selectedConnection) {
      this.messagesService.showWarning('No connection selected.');
      return;
    }

    const dialogQuestion = `Make '${selectedConnection.connectionName}' connection the 'Default' ${selectedConnection.connectionType}?`;

    this.confirmService.askConfirmation({
      message: dialogQuestion,
      confirmAction: async () => {
        const previousDefaultConnection =
          this.settingsService.connectionFiles.find(
            (connection) =>
              connection.defaultConnection &&
              connection.connectionType === selectedConnection.connectionType, // Use strict equality
          );

        // tempConnectionInfo serves as a template for the data structure to be saved.
        // We will populate either the 'email' or 'database' part of it.
        const tempConnectionInfo = {
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
            documentburster: {
              connection: {
                code: '',
                name: '',
                defaultConnection: false,
                databaseserver: { ...newDatabaseServer },
              },
            },
          },
        };

        let payloadForPreviousToSave: any;
        let payloadForSelectedToSave: any;

        // --- Handle PREVIOUS default connection ---
        if (previousDefaultConnection) {
          previousDefaultConnection.defaultConnection = false; // Update local object state

          if (previousDefaultConnection.connectionType === 'email-connection') {
            const connToUpdate =
              tempConnectionInfo.email.documentburster.connection;
            connToUpdate.defaultConnection = false;
            connToUpdate.code = previousDefaultConnection.connectionCode;
            connToUpdate.name = previousDefaultConnection.connectionName;
            connToUpdate.emailserver = {
              ...(previousDefaultConnection.emailserver || newEmailServer),
            };
            payloadForPreviousToSave = tempConnectionInfo.email;
          } else if (
            previousDefaultConnection.connectionType === 'database-connection'
          ) {
            const connToUpdate =
              tempConnectionInfo.database.documentburster.connection;
            connToUpdate.defaultConnection = false;
            connToUpdate.code = previousDefaultConnection.connectionCode;
            connToUpdate.name = previousDefaultConnection.connectionName;
            connToUpdate.databaseserver = {
              ...(previousDefaultConnection.dbserver || newDatabaseServer),
            };
            payloadForPreviousToSave = tempConnectionInfo.database;
          } else {
            this.messagesService.showError(
              `Invalid connection type for previous default: ${previousDefaultConnection.connectionType}`,
            );
            return; // Abort
          }

          try {
            await this.settingsService.saveConnectionFileAsync(
              previousDefaultConnection.filePath,
              payloadForPreviousToSave,
            );
          } catch (error) {
            this.messagesService.showError(
              `Failed to update previous default '${previousDefaultConnection.connectionName}': ${error.message || 'Unknown error'}`,
            );
            previousDefaultConnection.defaultConnection = true; // Revert local change on error
            return; // Abort
          }
        }

        // --- Handle NEW (selected) default connection ---
        selectedConnection.defaultConnection = true; // Update local object state

        if (selectedConnection.connectionType === 'email-connection') {
          const connToUpdate =
            tempConnectionInfo.email.documentburster.connection;
          connToUpdate.defaultConnection = true;
          connToUpdate.code = selectedConnection.connectionCode;
          connToUpdate.name = selectedConnection.connectionName;
          connToUpdate.emailserver = {
            ...(selectedConnection.emailserver || newEmailServer),
          };
          payloadForSelectedToSave = tempConnectionInfo.email;
          this.settingsService.defaultEmailConnectionFile = selectedConnection;
        } else if (
          selectedConnection.connectionType === 'database-connection'
        ) {
          const connToUpdate =
            tempConnectionInfo.database.documentburster.connection;
          connToUpdate.defaultConnection = true;
          connToUpdate.code = selectedConnection.connectionCode;
          connToUpdate.name = selectedConnection.connectionName;
          connToUpdate.databaseserver = {
            ...(selectedConnection.dbserver || newDatabaseServer),
          };
          payloadForSelectedToSave = tempConnectionInfo.database;
          // Ensure SettingsService has defaultDatabaseConnectionFile property and logic
          (this.settingsService as any).defaultDatabaseConnectionFile =
            selectedConnection;
        } else {
          this.messagesService.showError(
            `Invalid connection type for selected: ${selectedConnection.connectionType}`,
          );
          selectedConnection.defaultConnection = false; // Revert local change
          if (previousDefaultConnection) {
            previousDefaultConnection.defaultConnection = true; // Revert previous if it was changed
          }
          return; // Abort
        }

        try {
          await this.settingsService.saveConnectionFileAsync(
            selectedConnection.filePath,
            payloadForSelectedToSave,
          );
          this.messagesService.showInfo(
            `Connection '${selectedConnection.connectionName}' is now the Default ${selectedConnection.connectionType}.`,
          );
        } catch (error) {
          this.messagesService.showError(
            `Failed to set '${selectedConnection.connectionName}' as default: ${error.message || 'Unknown error'}`,
          );
          // Revert local changes on error
          selectedConnection.defaultConnection = false;
          if (selectedConnection.connectionType === 'email-connection') {
            this.settingsService.defaultEmailConnectionFile =
              previousDefaultConnection || null;
          } else {
            (this.settingsService as any).defaultDatabaseConnectionFile =
              previousDefaultConnection || null;
          }
          if (previousDefaultConnection) {
            previousDefaultConnection.defaultConnection = true;
          }
        }
        // UI should update based on changes to this.settingsService.connectionFiles items
        // If not, a ChangeDetectorRef.detectChanges() or similar might be needed,
        // or re-assigning the array: this.settingsService.connectionFiles = [...this.settingsService.connectionFiles];
      },
    });
  }
}
