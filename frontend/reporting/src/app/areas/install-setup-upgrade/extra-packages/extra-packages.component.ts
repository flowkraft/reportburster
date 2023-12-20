import { Component, OnInit } from '@angular/core';

import { extraPackagesTemplate } from './extra-packages.template';

import { BashService } from '../bash.service';
import { ConfirmService } from '../../../components/dialog-confirm/confirm.service';
import { ExecutionStatsService } from '../../../providers/execution-stats.service';
import Utilities from '../../../helpers/utilities';

interface ExtPackage {
  id: string;
  name: string;
  icon: string;
  website: string;
  description: string;
  status: string;
  packageManager: string;
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
      website: 'https://notepad-plus-plus.org/',
      description: ` is a free (as in “free speech” and also as in “free beer”) source code editor and Notepad replacement that supports several languages.`,
      status: 'not-installed',
      packageManager: 'choco',
    },
    {
      id: 'winmerge',
      name: 'WinMerge',
      icon: 'winmerge.png',
      website: 'https://winmerge.org/',
      description: ` is an Open Source differencing and merging tool for Windows. WinMerge can compare both folders and files, presenting differences in a visual text format that is easy to understand and handle.`,
      status: 'not-installed',
      packageManager: 'choco',
    },
  ];

  constructor(
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
