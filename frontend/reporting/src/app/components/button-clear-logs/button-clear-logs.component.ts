import { Component, Input } from '@angular/core';

import { ExecutionStatsService } from '../../providers/execution-stats.service';
import { ConfirmService } from '../dialog-confirm/confirm.service';
import { LogsServiceWebSocket } from '../../providers/ws-logs.service';
import { ToastrMessagesService } from '../../providers/toastr-messages.service';

@Component({
  selector: 'dburst-button-clear-logs',
  templateUrl: './button-clear-logs.component.html',
  styles: [':host {display: inline-block; width: 100%}'],
})
export class ButtonClearLogsComponent {
  @Input() id: string;
  @Input() value: string;
  @Input() title: string;
  @Input() question: string;

  constructor(
    protected logsService: LogsServiceWebSocket,
    protected executionStatsService: ExecutionStatsService,
    protected confirmService: ConfirmService,
    protected messagesService: ToastrMessagesService,
  ) {}

  onClick() {
    const dialogQuestion = this.question ? this.question : 'Clear log files?';

    this.confirmService.askConfirmation({
      message: dialogQuestion,
      confirmAction: async () => {
        await this.logsService.clearLogs();
        this.executionStatsService.logStats.foundDirtyLogFiles = false;
        this.messagesService.showInfo('Logs cleared.');
      },
    });
  }
}
