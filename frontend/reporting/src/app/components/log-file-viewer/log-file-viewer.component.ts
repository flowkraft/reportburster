import { OnInit, Component, Input, OnDestroy } from '@angular/core';

import { ExecutionStatsService } from '../../providers/execution-stats.service';
import { LogsServiceWebSocket } from '../../providers/ws-logs.service';

@Component({
  selector: 'dburst-log-file-viewer',
  template:
    '<div *ngIf="logFileName == \'info.log\'" [innerHTML]="executionStatsService.logStats.infoLogContent" style="white-space: pre-wrap;"></div><div *ngIf="logFileName == \'warnings.log\'" [innerHTML]="executionStatsService.logStats.warningsLogContent" style="white-space: pre-wrap;"></div><div *ngIf="logFileName == \'errors.log\'" [innerHTML]="executionStatsService.logStats.errorsLogContent" style="white-space: pre-wrap;"></div>',
})
export class LogFileViewerComponent implements OnInit, OnDestroy {
  @Input() logFileName: string;

  constructor(
    //protected settingsService: SettingsServiceJava,
    protected executionStatsService: ExecutionStatsService,
    protected logsService: LogsServiceWebSocket,
  ) {}

  async ngOnInit() {
    this.logsService.startTailing(this.logFileName);
  }

  ngOnDestroy() {
    this.logsService.tailerStop(this.logFileName);
  }
}
