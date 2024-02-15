import { Component, OnInit } from '@angular/core';

import { extraPackagesTemplate } from './extra-packages.template';

import { BashService } from '../bash.service';
import { ConfirmService } from '../../../components/dialog-confirm/confirm.service';
import { ExecutionStatsService } from '../../../providers/execution-stats.service';
import Utilities from '../../../helpers/utilities';
import { TranslateService } from '@ngx-translate/core';

interface ExtPackage {
  id: string;
  name: string;
  icon: string;
  website: string;
  description: string;
  status: string;
  packageManager: string;
  cmdInstall: string;
  cmdUnInstall: string;
  cmdGetInfo: string;
}

@Component({
  selector: 'dburst-extra-packages',
  template: ` ${extraPackagesTemplate} `,
})
export class ExtraPackagesComponent implements OnInit {
  protected extraPackages = [
    {
      id: 'notepadplusplus',
      name: 'Notepad++',
      icon: 'notepad++.svg',
      website: 'https://notepad-plus-plus.org',
      description: ` is a free (as in “free speech” and also as in “free beer”) source code editor and Notepad replacement. Notepad++ is useful when editing ReportBurster configuration files and scripts.`,
      status: 'not-installed',
      packageManager: 'choco',
      cmdInstall: 'choco install notepadplusplus --yes',
      cmdUnInstall: 'choco uninstall notepadplusplus',
      cmdGetInfo: 'choco info notepadplusplus -lo',
    },
    {
      id: 'vscode',
      name: 'Visual Studio Code',
      icon: 'vscode-logo.svg',
      website: 'https://code.visualstudio.com',
      description: ` Code editing. Redefined.`,
      status: 'not-installed',
      packageManager: 'choco',
      cmdInstall: 'choco install vscode --yes',
      cmdUnInstall: 'choco uninstall vscode',
      cmdGetInfo: 'choco info vscode -lo',
    },
    {
      id: 'winmerge',
      name: 'WinMerge',
      icon: 'winmerge.png',
      website: 'https://winmerge.org',
      description: ` is an Open Source differencing and merging tool for Windows. WinMerge can compare both folders and files, presenting differences in a visual text format that is easy to understand and handle. WinMerge can be used for comparing ReportBurster configuration files and scripts.`,
      status: 'not-installed',
      packageManager: 'choco',
      cmdInstall: 'choco install winmerge --yes',
      cmdUnInstall: 'choco uninstall winmerge',
      cmdGetInfo: 'choco info winmerge -lo',
    },
    {
      id: 'docker-desktop',
      name: 'Docker Desktop',
      icon: 'docker.svg',
      website: 'https://www.docker.com/products/docker-desktop/',
      description: ` a very good containerization software. Docker is required for running other ReportBurster extra packages.`,
      status: 'not-installed',
      packageManager: 'choco',
      cmdInstall: 'choco install docker-desktop --yes',
      cmdUnInstall: 'choco uninstall docker-desktop',
      cmdGetInfo: 'choco info docker-desktop -lo',
    },
  ];

  constructor(
    protected translateService: TranslateService,
    protected bashService: BashService,
    protected executionStatsService: ExecutionStatsService,
    protected confirmService: ConfirmService
  ) {}

  async ngOnInit() {
    await this.fetchExtraPackagesDetails();
  }

  async fetchExtraPackagesDetails() {
    for (const extraPackage of this.extraPackages) {
      const packageId = extraPackage.id;

      extraPackage.description = await this.translateService.instant(
        `AREAS.INSTALL-SETUP-UPGRADE.COMPONENTS.EXTRA-PACKAGES.INNER-HTML.${packageId.toUpperCase()}`
      );

      //console.log(packageId);

      extraPackage.status = 'not-installed';

      const chocoInfoCommand = `choco info ${packageId} -lo`;
      //const chocoInfoCommand = `choco --version`;

      try {
        const { stdout, stderr } = await this.bashService.execCommand(
          chocoInfoCommand
        );

        //console.log(`chocoInfo = ${chocoInfo}`);

        if (stdout && stdout.includes('1 packages installed.')) {
          extraPackage.status = 'installed';
        }
      } catch (error) {
        extraPackage.status = 'not-installed';
      }
    }
    // Sort the extraPackages array so that installed packages come first
    this.extraPackages.sort((a, b) => {
      if (a.status === 'installed' && b.status !== 'installed') {
        return -1;
      } else if (a.status !== 'installed' && b.status === 'installed') {
        return 1;
      } else {
        return 0;
      }
    });
  }

  doInstallUninstallAction(pckage: ExtPackage, action: string) {
    const dialogQuestion = `${Utilities.titleCase(action)} ${pckage.name}?`;

    this.confirmService.askConfirmation({
      message: dialogQuestion,
      confirmAction: () => {
        this.bashService.typeCommandOnTerminalAndThenPressEnter(
          `choco ${action} ${pckage.id} --yes`
        );
      },
    });
  }
}
