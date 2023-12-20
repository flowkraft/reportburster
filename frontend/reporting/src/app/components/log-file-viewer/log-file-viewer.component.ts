import { OnInit, Component, Input, OnDestroy } from '@angular/core';

//import * as path from 'path';

import { interval, Subscription } from 'rxjs';

import { SettingsService } from '../../providers/settings.service';
import { ExecutionStatsService } from '../../providers/execution-stats.service';
import Utilities from '../../helpers/utilities';
import { ElectronService } from '../../core/services';

@Component({
  selector: 'dburst-log-file-viewer',
  template: '<div id="{{viewerId}}" [innerHTML]="content"></div>',
})
export class LogFileViewerComponent implements OnInit, OnDestroy {
  @Input() viewerId: string;

  @Input() logFile: string;

  logFilePath: string;

  isTailingActive = false;
  logLines = [];
  content: string;
  tail: typeof ElectronService.tail;

  subscription: Subscription;

  constructor(
    protected settingsService: SettingsService,
    protected executionStatsService: ExecutionStatsService,
    protected electronService: ElectronService
  ) {}

  async ngOnInit() {
    this.logFilePath = this.electronService.path.resolve(
      Utilities.slash(this.settingsService.LOGS_FOLDER_PATH + this.logFile)
    );

    //FIXME define a constant CHECK_INTERVAL = 333 to be reused across all ).subscribe

    const repeat = interval(333);
    this.subscription = repeat.subscribe((val) =>
      this.checkIfFileWasCreatedIsEmptyOrRemoved()
    );
  }

  ngOnDestroy() {
    this.unTailFile();
    this.subscription.unsubscribe();
  }

  tailFile() {
    this.isTailingActive = true;
    this.tail = new ElectronService.tail.Tail(this.logFilePath, {
      fromBeginning: true,
    });

    this.tail.on('line', (line) => {
      if (line && !this.logLines.includes(line)) {
        this.logLines.unshift(line);
        this.content = this.logLines.join('<br>');
      }
    });
    this.tail.on('error', function (error) {
      if (this.isTailingActive) {
        this.isTailingActive = false;
        this.tail.unwatch();
      }

      delete this.content;
      this.logLines = [];
    });
  }

  unTailFile() {
    delete this.content;
    this.logLines = [];

    if (this.isTailingActive) {
      this.isTailingActive = false;
      this.tail.unwatch();
    }
  }

  async checkIfFileWasCreatedIsEmptyOrRemoved() {
    let logFileExists = false;
    let logFileSize = -1;

    switch (this.logFile) {
      case 'info.log': {
        logFileExists =
          this.executionStatsService.logStats.infoLogFileSize >= 0;
        logFileSize = this.executionStatsService.logStats.infoLogFileSize;
        break;
      }
      case 'errors.log': {
        logFileExists =
          this.executionStatsService.logStats.errorsLogFileSize >= 0;
        logFileSize = this.executionStatsService.logStats.errorsLogFileSize;

        break;
      }
      case 'warnings.log': {
        logFileExists =
          this.executionStatsService.logStats.warningsLogFileSize >= 0;
        logFileSize = this.executionStatsService.logStats.warningsLogFileSize;

        break;
      }
      case 'bash.service.log': {
        logFileExists =
          this.executionStatsService.logStats.bashServiceLogFileSize >= 0;
        logFileSize =
          this.executionStatsService.logStats.bashServiceLogFileSize;
        break;
      }
      default: {
        logFileExists = false;
        logFileSize = -1;

        break;
      }
    }

    if (logFileExists) {
      if (logFileSize === 0) {
        this.unTailFile();
      } else if (logFileSize > 0) {
        if (!this.isTailingActive) {
          this.tailFile();
        }
      }
    } else {
      this.unTailFile();
    }
  }
}
