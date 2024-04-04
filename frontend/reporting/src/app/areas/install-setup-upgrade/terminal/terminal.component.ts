import {
  Component,
  AfterViewInit,
  ElementRef,
  ChangeDetectorRef,
} from '@angular/core';
import { Subscription } from 'rxjs';

import { DomHandler } from 'primeng/dom';

import { terminalTemplate } from './terminal.template';
import { ConfirmService } from '../../../components/dialog-confirm/confirm.service';
import { TerminalService } from 'primeng/terminal';
import { ElectronService } from '../../../core/services/electron/electron.service';
import UtilitiesElectron from '../../../helpers/utilities-electron';
import { StateStoreService } from '../../../providers/state-store.service';

@Component({
  selector: 'dburst-terminal',
  template: ` ${terminalTemplate} `,
})
export class TerminalComponent implements AfterViewInit {
  readOnly = true;
  availableCommandsVisible = false;

  headerLevel = 'Commands (Read-only)';

  subscription: Subscription;

  /*
  @ViewChild('terminalTemplate', { static: true }) terminalTemplate: TemplateRef<
    any
  >;
  */

  constructor(
    protected terminalService: TerminalService,
    protected stateStore: StateStoreService,
    protected electronService: ElectronService,
    protected confirmService: ConfirmService,
    protected el: ElementRef,
    protected changeDetectorRef: ChangeDetectorRef,
  ) {
    this.subscription = this.terminalService.commandHandler.subscribe(
      async (command) => {
        let response: string;
        let jobFilePath: string;
        try {
          if (command.includes('install')) {
            const threeWordsKebab = command.split(' ').slice(0, 3).join('-');

            jobFilePath =
              await this.electronService.createJobFile(threeWordsKebab);
          }
          switch (command) {
            case 'java -version':
            case 'java --version':
              //console.log(
              //  `this.stateStore.configSys.sysInfo.setup = ${JSON.stringify(this.stateStore.configSys.sysInfo.setup)}`,
              //);

              response = `Java ${this.stateStore.configSys.sysInfo.setup.java.version}`;

              this.electronService.typeCommandOnTerminalAndThenPressEnter(
                'choco --version',
              );

              break;

            case 'choco --version':
              response = `Chocolatey ${this.stateStore.configSys.sysInfo.setup.chocolatey.version}`;

              break;

            case 'install chocolatey':
              try {
                await this.electronService.installChocolatey();

                /*
                    elevatedScript.stderr.on('data', (data) => {
                    response = response + '\n' + data;
                  });

                  for await (const data of elevatedScript.stdout) {
                    response = response + '\n' + data;
                  }
                  */
              } catch (error) {
                response = error;
              }

              break;

            case 'uninstall chocolatey':
              try {
                const unInstallCommand = `& ../tools/chocolatey/uninstall.ps1`;
                //const testCommand = 'choco --version';

                const elevatedScript =
                  await this.electronService.getCommandReadyToBeRunAsAdministratorUsingBatchCmd(
                    unInstallCommand,
                    //testCommand,
                  );

                elevatedScript.stderr.on('data', (data) => {
                  response = response + '\n' + data;
                });

                for await (const data of elevatedScript.stdout) {
                  response = response + '\n' + data;
                }
              } catch (error) {
                response = error;
              }

              break;

            case 'choco install jre8 -PackageParameters "/exclude:64" --yes':
              try {
                try {
                  await UtilitiesElectron.appShutServer();
                } catch (error) {}

                const elevatedScript =
                  await this.electronService.getCommandReadyToBeRunAsAdministratorUsingBatchCmd(
                    command,
                  );

                elevatedScript.stderr.on('data', (data) => {
                  response = response + '\n' + data;
                });

                for await (const data of elevatedScript.stdout) {
                  response = response + '\n' + data;
                }
              } catch (error) {
                response = error;
              }

              break;
            case 'choco install openjdk --yes':
            case 'choco install notepadplusplus --yes':
            case 'choco install winmerge --yes':
            case 'choco uninstall notepadplusplus --yes --force':
            case 'choco uninstall winmerge --yes --force':
              try {
                try {
                  await UtilitiesElectron.appShutServer();
                } catch (error) {}

                const testCommand = 'choco --version';
                const elevatedScript =
                  await this.electronService.getCommandReadyToBeRunAsAdministratorUsingPowerShell(
                    command,
                    testCommand,
                  );

                elevatedScript.stderr.on('data', (data) => {
                  response = response + '\n' + data;
                });

                for await (const data of elevatedScript.stdout) {
                  response = response + '\n' + data;
                }
              } catch (error) {
                response = error;
              }

              break;
            case 'choco uninstall jre8 --yes --force':
            case 'choco uninstall openjdk --yes --force':
              try {
                try {
                  await UtilitiesElectron.appShutServer();
                } catch (error) {}

                const testCommand = 'java -version';
                const elevatedScript =
                  await this.electronService.getCommandReadyToBeRunAsAdministratorUsingPowerShell(
                    command,
                    testCommand,
                  );

                elevatedScript.stderr.on('data', (data) => {
                  response = response + '\n' + data;
                });

                for await (const data of elevatedScript.stdout) {
                  response = response + '\n' + data;
                }
              } catch (error) {
                response = error;
              }

              break;

            case '':
              response = '';
              break;

            default:
              response = 'Unknown command: ' + command;
          }
        } finally {
          if (response) {
            //response = response.toString();
            try {
              await UtilitiesElectron.logInfoAsync(
                response.replace('undefined', ''),
              );
            } catch (error) {}
          }
          if (jobFilePath)
            await this.electronService.deleteJobFile(jobFilePath);

          this.changeDetectorRef.detectChanges();
        }
      },
    );
  }

  ngAfterViewInit() {
    this.electronService.pTerminalInput = DomHandler.find(
      this.el.nativeElement,
      '.p-terminal-input',
    )[0];

    this.electronService.typeCommandOnTerminalAndThenPressEnter(
      'java -version',
    );

    this.changeDetectorRef.detectChanges();
  }

  honourReadOnly() {
    return !this.readOnly;
  }

  toggleReadOnly() {
    if (this.readOnly) {
      this.confirmService.askConfirmation({
        message:
          "If you don't understand the commands you can break the system. Are you sure that you want to continue?",
        confirmAction: () => {
          this.electronService.typeCommandOnTerminalAndThenPressEnter('');
          this.readOnly = false;
          this.headerLevel = 'Type Your Commands Here';
        },
      });
    } else {
      this.readOnly = true;
      this.headerLevel = 'Commands (Read-only)';
    }
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
