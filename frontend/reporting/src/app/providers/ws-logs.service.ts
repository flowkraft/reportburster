import { Subject, Subscription, interval } from 'rxjs';
import {
  SocketOptions,
  WebSocketEndpoint,
} from '../helpers/websocket-endpoint';
import { SettingsService } from './settings.service';
import { Constants } from '../helpers/constants';
import { ApiService } from './api.service';
import { Injectable } from '@angular/core';
import { StompSubscription } from '@stomp/stompjs';
import { FsService } from './fs.service';
import { ExecutionStatsService } from './execution-stats.service';
import { log } from 'console';

@Injectable({
  providedIn: 'root',
})
export class LogsServiceWebSocket extends WebSocketEndpoint {
  logsSubjects = new Map<string, Subject<string>>();
  subscriptionsLogFileContent = new Map<string, Subscription>();

  subscriptionCheckIfLogFileWasCreatedIsEmptyOrRemoved: Subscription;

  wsSubscription: StompSubscription;

  constructor(
    protected apiService: ApiService,
    protected settingsService: SettingsService,
    protected fsService: FsService,
    protected executionStatsService: ExecutionStatsService,
  ) {
    super();
  }

  async makeWSConnectionAndHandleMessages() {
    //if server is started and the subscription is not already active
    const sOptions = new SocketOptions(
      Constants.WS_ENDPOINT,
      Constants.WS_TOPIC_TAILER,
      this.apiService.getToken,
    );

    await this.makeWSConnection(sOptions);
    this.settingsService.activeWebSocketSubcriptions.push(sOptions);

    this.wsSubscription = this._socket.stomp.subscribe(
      sOptions.topicName,
      (data: any) => {
        const message = this.getMessage(data);
        //console.log(`message = ${JSON.stringify(message)}`);
        const payload = message.message.filesPayload[0];
        const fileName = payload.fileName;
        if (this.logsSubjects.has(fileName)) {
          const logLine = payload.fileContent;
          this.logsSubjects.get(fileName).next(logLine);
        }
      },
    );
  }

  async startTailing(logFileName: string) {
    const repeat = interval(750);
    this.subscriptionCheckIfLogFileWasCreatedIsEmptyOrRemoved =
      repeat.subscribe((val) =>
        this.checkIfFileWasCreatedIsEmptyOrRemoved(logFileName),
      );
  }

  async tailerStart(logFileName: string) {
    if (!this.wsSubscription) {
      await this.makeWSConnectionAndHandleMessages();
    }

    if (logFileName == 'info.log')
      if (this.executionStatsService.logStats.infoTailingActive > 0) {
        this.executionStatsService.logStats.infoTailingActive = 2;
        return;
      } else this.executionStatsService.logStats.infoTailingActive++;

    if (logFileName == 'errors.log')
      if (this.executionStatsService.logStats.errorsTailingActive > 0) {
        this.executionStatsService.logStats.errorsTailingActive = 2;
        return;
      } else this.executionStatsService.logStats.errorsTailingActive++;

    if (logFileName == 'warnings.log')
      if (this.executionStatsService.logStats.warningsTailingActive > 0) {
        this.executionStatsService.logStats.warningsTailingActive = 2;
        return;
      } else this.executionStatsService.logStats.warningsTailingActive++;

    const subscriptionLogFileContent = this.getLogs$(logFileName).subscribe(
      (logLine: string) => {
        //console.log(`this.logFileName = ${logFileName}, logLine = ${logLine}`);

        if (logFileName == 'info.log') {
          if (
            !this.executionStatsService.logStats.infoLogLines.includes(logLine)
          ) {
            this.executionStatsService.logStats.infoLogLines.unshift(logLine);
          }
          this.executionStatsService.logStats.infoLogContent =
            this.executionStatsService.logStats.infoLogLines.join('\n'); // Update the content property
        }

        if (logFileName == 'errors.log') {
          if (
            !this.executionStatsService.logStats.errorsLogLines.includes(
              logLine,
            )
          ) {
            this.executionStatsService.logStats.errorsLogLines.unshift(logLine);
          }
          this.executionStatsService.logStats.errorsLogContent =
            this.executionStatsService.logStats.errorsLogLines.join('\n'); // Update the content property

          //console.log(
          //  `this.executionStatsService.logStats.errorsLogContent = ${this.executionStatsService.logStats.errorsLogContent}`,
          //);
        }

        if (logFileName == 'warnings.log') {
          if (
            !this.executionStatsService.logStats.warningsLogLines.includes(
              logLine,
            )
          ) {
            this.executionStatsService.logStats.warningsLogLines.unshift(
              logLine,
            );
          }
          this.executionStatsService.logStats.warningsLogContent =
            this.executionStatsService.logStats.warningsLogLines.join('\n'); // Update the content property
        }
      },
    );

    this.subscriptionsLogFileContent.set(
      logFileName,
      subscriptionLogFileContent,
    );
    await this.apiService.put('/jobman/logs/tailer', {
      fileName: logFileName,
      command: 'start',
    });
  }

  async tailerStop(logFileName: string) {
    //console.log(
    //  `tailerStop: logFileName = ${logFileName}, logStats = ${JSON.stringify(this.executionStatsService.logStats)}`,
    //);
    if (logFileName == 'info.log')
      if (this.executionStatsService.logStats.infoTailingActive == 2) {
        this.executionStatsService.logStats.infoTailingActive--;
        return;
      } else {
        this.executionStatsService.logStats.infoTailingActive = 0;

        delete this.executionStatsService.logStats.infoLogContent;
        this.executionStatsService.logStats.infoLogLines = [];
      }

    if (logFileName == 'errors.log')
      if (this.executionStatsService.logStats.errorsTailingActive == 2) {
        this.executionStatsService.logStats.errorsTailingActive--;
        return;
      } else {
        this.executionStatsService.logStats.errorsTailingActive = 0;
        delete this.executionStatsService.logStats.errorsLogContent;
        this.executionStatsService.logStats.errorsLogLines = [];
      }

    if (logFileName == 'warnings.log')
      if (this.executionStatsService.logStats.warningsTailingActive == 2) {
        this.executionStatsService.logStats.warningsTailingActive--;
        return;
      } else {
        this.executionStatsService.logStats.warningsTailingActive = 0;
        delete this.executionStatsService.logStats.warningsLogContent;
        this.executionStatsService.logStats.warningsLogLines = [];
      }

    if (this.logsSubjects.has(logFileName)) {
      this.logsSubjects.get(logFileName).complete();
      this.subscriptionsLogFileContent.get(logFileName).unsubscribe();
      this.logsSubjects.delete(logFileName);
    }

    if (this.logsSubjects.size == 0) {
      if (this.wsSubscription) {
        this.wsSubscription.unsubscribe();
        this.wsSubscription = null;
      }
    }

    await this.apiService.put('/jobman/logs/tailer', {
      fileName: logFileName,
      command: 'stop',
    });
  }

  getLogs$(fileName: string) {
    if (!this.logsSubjects.has(fileName)) {
      this.logsSubjects.set(fileName, new Subject<string>());
    }
    return this.logsSubjects.get(fileName).asObservable();
  }

  async clearLogs(logFileName?: string) {
    if (logFileName) {
      await this.fsService.writeAsync(
        `${this.settingsService.LOGS_FOLDER_PATH}/${logFileName}`,
        '',
      );
    } else {
      const logsFiles = ['errors.log', 'warnings.log', 'info.log'];

      for (const logFileName of logsFiles) {
        await this.fsService.writeAsync(
          `${this.settingsService.LOGS_FOLDER_PATH}/${logFileName}`,
          '',
        );
      }
      await this.checkLogsFolder();
    }
  }

  async checkIfFileWasCreatedIsEmptyOrRemoved(logFileName: string) {
    let logFileExists = false;
    let logFileSize = -1;

    switch (logFileName) {
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

    //console.log(
    //  `this.logFileName = ${logFileName}, logFileExists = ${logFileExists}, logFileSize = ${logFileSize}`,
    //);

    if (logFileExists) {
      if (logFileSize <= 0) {
        this.tailerStop(logFileName);
      } else if (logFileSize > 0) {
        this.tailerStart(logFileName);
      }
    } else {
      this.tailerStop(logFileName);
    }
  }

  async checkLogsFolder() {}
}
