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
import { ElectronService } from '../electron.service';
import UtilitiesElectron from '../utilities-electron';

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
              try {
                //const throwError = true;
                const throwError = false;

                response =
                  await this.electronService.checkJavaVersion(throwError);
              } catch (error) {
                response = error;
              }

              this.electronService.typeCommandOnTerminalAndThenPressEnter(
                'choco --version',
              );

              break;

            case 'choco --version':
              try {
                //const throwError = true;
                const throwError = false;

                const version =
                  await this.electronService.checkChocoVersion(throwError);

                response = 'Chocolatey ' + version;
              } catch (error) {
                response = error;
              }

              break;

            case 'install chocolatey':
              try {
                await this.electronService.emptyLogFile();

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
                await this.electronService.emptyLogFile();

                const unInstallCommand = `& ../tools/chocolatey/uninstall.ps1`;
                const testCommand = 'choco --version';

                const elevatedScript =
                  await this.electronService.getCommandReadyToBeRunAsAdministratorUsingPowerShell(
                    unInstallCommand,
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

            case 'choco install jre8 -PackageParameters "/exclude:64" --yes':
            case 'choco install jre8 --yes':
            case 'choco install openjdk --yes':
            case 'choco install notepadplusplus --yes':
            case 'choco install winmerge --yes':
            case 'choco uninstall jre8 --yes':
            case 'choco uninstall openjdk --yes':
            case 'choco uninstall notepadplusplus --yes':
            case 'choco uninstall winmerge --yes':
              try {
                await this.electronService.emptyLogFile();

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
            case '':
              response = '';
              break;

            default:
              response = 'Unknown command: ' + command;
          }
        } finally {
          if (response) {
            //response = response.toString();
            await UtilitiesElectron.logAsync(
              response.replace('undefined', ''),
              'info',
            );
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

    //this.electronService.typeCommandOnTerminalAndThenPressEnter(
    //  'java -version',
    //);

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
