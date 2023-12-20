import { Component, OnInit } from '@angular/core';

import { interval, Subscription } from 'rxjs';
import { ExecutionStatsService } from '../../providers/execution-stats.service';

//import * as jetpack from 'fs-jetpack';

//import * as path from 'path';
import Utilities from '../../helpers/utilities';
import { ElectronService } from '../../core/services';
import { ConfirmService } from '../../components/dialog-confirm/confirm.service';

@Component({
  selector: 'dburst-status-bar',
  templateUrl: './status-bar.template.html',
})
export class StatusBarComponent implements OnInit {
  subscription: Subscription;

  constructor(
    protected confirmService: ConfirmService,
    protected electronService: ElectronService,
    protected executionStatsService: ExecutionStatsService
  ) {}

  ngOnInit() {
    //FIXME define a constant CHECK_INTERVAL = 333 to be reused across all ).subscribe

    const repeat = interval(333);
    this.subscription = repeat.subscribe((val) => {
      this.executionStatsService.checkJobsFolder();
      this.executionStatsService.checkLogsFolder();
      this.executionStatsService.checkResumeJobs();
    });
  }

  shouldShowPauseCancelButtons() {
    if (
      this.executionStatsService.jobStats.niceWorkingOnFileNames === 'email' ||
      this.executionStatsService.jobStats.niceWorkingOnFileNames ===
        'license' ||
      this.executionStatsService.jobStats.niceWorkingOnFileNames === 'twilio' ||
      this.executionStatsService.jobStats.pauseJobFileExists > 0 ||
      this.executionStatsService.jobStats.cancelJobFileExists > 0 ||
      this.executionStatsService.jobStats.numberOfActiveUpdateJobs > 0
    ) {
      return false;
    }

    return true;
  }

  // jobs
  doPauseCancelJob(fileName: string, jobFilePath: string, command: string) {
    let message = 'Cancel ' + fileName + ' job processing?';

    if (command === 'pause') {
      message = 'Pause ' + fileName + ' job processing?';
    }

    this.confirmService.askConfirmation({
      message: message,
      confirmAction: () => {
        if (command === 'pause') {
          this.executionStatsService.jobStats.pauseJobFileExists = 1;
        } else {
          this.executionStatsService.jobStats.cancelJobFileExists = 1;
        }

        const dirPath = this.electronService.path.dirname(jobFilePath);
        const baseName = this.electronService.path.basename(
          jobFilePath,
          '.job'
        );

        const pauseCancelFileName = baseName + '.' + command;

        const pauseCancelFilePath = Utilities.slash(
          dirPath + '/' + pauseCancelFileName
        );

        this.electronService.jetpack.fileAsync(pauseCancelFilePath);
      },
    });
  }
}
