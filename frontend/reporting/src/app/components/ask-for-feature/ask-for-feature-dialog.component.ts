import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { Subject } from 'rxjs';
import { askForFeatureDialogTemplate } from './ask-for-feature-dialog.template';
import { ConfirmService } from '../dialog-confirm/confirm.service';
import Utilities from '../../helpers/utilities';
import { ShellService } from '../../providers/shell.service';
import { SettingsService } from '../../providers/settings.service';
import { FsService } from '../../providers/fs.service';

@Component({
  selector: 'dburst-ask-for-feature-dialog',
  template: `${askForFeatureDialogTemplate}`,
})
export class AskForFeatureDialogComponent implements OnInit {
  onClose: Subject<boolean>;
  title: string;

  msgTo: string;
  msgSubject: string;
  msgMessage: string;

  confirmLabel: string;

  constructor(
    protected bsModalRef: BsModalRef,
    protected settingsService: SettingsService,
    protected confirmService: ConfirmService,
    protected fsService: FsService,
    protected shellService: ShellService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.onClose = new Subject();
  }

  async confirm(action?: string) {
    if (action == 'send-message') {
      let xmlAskForFeatureFilePath = `${
        this.settingsService.JOBS_FOLDER_PATH
      }/${Utilities.getRandomFileName('xml')}`;

      xmlAskForFeatureFilePath = Utilities.slash(xmlAskForFeatureFilePath);

      await this.settingsService.saveSettingsFileAsync(
        xmlAskForFeatureFilePath,
        {
          documentburster: {
            featurerequest: {
              subject: this.msgSubject,
              message: this.msgMessage,
            },
          },
        },
      );

      this.shellService.runBatFile(['-rnf', `"${xmlAskForFeatureFilePath}"`]);
    } else if (action == 'configure-email-properly') {
      this.router.navigate(['/ext-connections'], { skipLocationChange: true });
    }

    this.onClose?.next(true);
    this.bsModalRef.hide();
  }
}
