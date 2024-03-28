import { Component } from '@angular/core';
import { ExecutionStatsService } from '../../providers/execution-stats.service';
import { ConfirmService } from '../dialog-confirm/confirm.service';
import { LogsServiceWebSocket } from '../../providers/ws-logs.service';
import { FsService } from '../../providers/fs.service';
import { SettingsService } from '../../providers/settings.service';

@Component({
  selector: 'dburst-log-files-viewer-all-together',
  templateUrl: './log-files-viewer-all-together.html',
})
export class LogFilesViewerAllTogetherComponent {
  constructor(
    protected confirmService: ConfirmService,
    protected executionStatsService: ExecutionStatsService,
    protected fsService: FsService,
    protected logsService: LogsServiceWebSocket,
    protected settingsService: SettingsService,
  ) {}

  clearQuarantinedAndLogFiles(shouldClearLogFiles: boolean) {
    let dialogQuestion = 'Clear all quarantined files?';
    if (shouldClearLogFiles) {
      dialogQuestion = 'Clear all quarantined and log files?';
    }

    this.confirmService.askConfirmation({
      message: dialogQuestion,
      confirmAction: async () => {
        await this.fsService.dirAsync(
          this.settingsService.QUARANTINE_FOLDER_PATH,
          { empty: true },
        );
        if (shouldClearLogFiles) {
          await this.logsService.clearLogs();
        }
      },
    });
  }

  clearLogs(logFile: string) {
    let dialogQuestion = 'Clear file /logs/' + logFile + '?';
    if (!logFile) {
      dialogQuestion = 'Clear all log files?';
    }

    this.confirmService.askConfirmation({
      message: dialogQuestion,
      confirmAction: () => {
        this.logsService.clearLogs(logFile);
      },
    });
  }
}
