import { Component, Input } from '@angular/core';
import { ExecutionStatsService } from '../../providers/execution-stats.service';

@Component({
  selector: 'dburst-log-files-viewer-separate-tabs',
  templateUrl: './log-files-viewer-separate-tabs.component.html',
})
export class LogFilesViewerSeparateTabsComponent {
  @Input() viewerId = 'logsViewer';

  constructor(protected executionStatsService: ExecutionStatsService) {}
}
