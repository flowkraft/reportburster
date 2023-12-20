import { Component } from '@angular/core';
import { ExecutionStatsService } from '../../providers/execution-stats.service';
import { ShellService } from '../../providers/shell.service';
import { ConfirmService } from '../dialog-confirm/confirm.service';

@Component({
  selector: 'dburst-log-files-viewer-all-together',
  templateUrl: './log-files-viewer-all-together.html',
})
export class LogFilesViewerAllTogetherComponent {
  constructor(
    protected confirmService: ConfirmService,
    protected executionStatsService: ExecutionStatsService,
    protected shellService: ShellService
  ) {}

  clearQuarantinedAndLogFiles(shouldClearLogFiles) {
    let dialogQuestion = 'Clear all quarantined files?';
    if (shouldClearLogFiles) {
      dialogQuestion = 'Clear all quarantined and log files?';
    }

    this.confirmService.askConfirmation({
      message: dialogQuestion,
      confirmAction: async () => {
        await this.shellService.clearQuarantinedFiles();
        if (shouldClearLogFiles) {
          await this.shellService.clearLogs();
        }
      },
    });
  }

  clearLogs(logFile) {
    let dialogQuestion = 'Clear file /logs/' + logFile + '?';
    if (!logFile) {
      dialogQuestion = 'Clear all log files?';
    }

    this.confirmService.askConfirmation({
      message: dialogQuestion,
      confirmAction: () => {
        this.shellService.clearLogs(logFile);
      },
    });
  }
}
