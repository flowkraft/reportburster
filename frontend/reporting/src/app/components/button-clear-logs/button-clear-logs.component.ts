import { Component, Input } from '@angular/core';

import { ExecutionStatsService } from '../../providers/execution-stats.service';
import { ShellService } from '../../providers/shell.service';
import { ConfirmService } from '../dialog-confirm/confirm.service';

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
    protected executionStatsService: ExecutionStatsService,
    protected shellService: ShellService,
    protected confirmService: ConfirmService
  ) {}

  onClick() {
    const dialogQuestion = this.question ? this.question : 'Clear log files?';

    this.confirmService.askConfirmation({
      message: dialogQuestion,
      confirmAction: () => {
        this.shellService.clearLogs();
      },
    });
  }
}
