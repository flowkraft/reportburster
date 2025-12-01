export const tabReportingChartTemplate = `<ng-template
  #tabReportingChartTemplate
>
  <div class="well">
    <tabset>
      <tab heading="Preview">
        <div class="row" style="margin-top: 20px;">
          <div class="col-xs-12">
            <div class="panel panel-default">
              <div class="panel-body">
                <!-- Only show chart if Chart Options script is configured and data exists -->
                <rb-chart #chart
                  *ngIf="reportDataResult && !reportDataResultIsError && activeChartConfigScriptGroovy?.trim() && reportDataResult?.reportData?.length > 0"
                  [data]="{ chartConfig: activeChartConfigOptions, reportData: reportDataResult?.reportData }"
                  [options]="activeChartConfigOptions?.options || {}"
                  [type]="activeChartConfigOptions?.type || 'bar'"
                  [loading]="isReportDataLoading"
                  (ready)="onChartReady($event)"
                  (initError)="onChartError($any($event).detail.message)"
                  (chartError)="onChartError($any($event).detail.message)"
                ></rb-chart>

                <!-- Show message when Chart Options are not configured -->
                <div *ngIf="!activeChartConfigScriptGroovy?.trim()" class="text-center" style="padding: 20px;">
                  <strong>Chart is not yet configured.</strong> To display a chart, go to the <strong>Chart Options</strong> tab and configure your chart settings.
                </div>

                <!-- Show 'No Data' when chart is configured but no data -->
                <div *ngIf="activeChartConfigScriptGroovy?.trim() && (!reportDataResult || (!reportDataResultIsError && (!reportDataResult?.reportData || reportDataResult?.reportData?.length === 0)))" class="text-center" style="padding: 20px;">
                  <strong>No Data</strong>
                </div>

                <div *ngIf="reportDataResult && reportDataResultIsError">
                  <div class="alert alert-danger">
                    <strong>Error:</strong> Query failed. Check Logs below.
                  </div>
                  <pre style="white-space:pre-wrap;max-height:300px;overflow:auto;">
                    {{ reportDataResult.reportData?.[0]?.ERROR_MESSAGE }}
                  </pre>
                  <div
                    id="errorsLogChart"
                    class="panel-body"
                    style="
                      color: red;
                      height: 420px;
                      overflow-y: scroll;
                      overflow-x: auto;
                      -webkit-user-select: all;
                      user-select: all;
                    "
                  >
                    <dburst-log-file-viewer logFileName="errors.log"></dburst-log-file-viewer>
                  </div>
                </div>

                <div *ngIf="reportDataResult">
                  <br/>
                  <p>Execution Time: {{ reportDataResult.executionTimeMillis }}ms</p>
                  <p>Total Rows: {{ reportDataResult.reportData?.length || 0 }}</p>
                  <p>Preview Mode: {{ reportDataResult.isPreview ? 'Yes' : 'No' }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </tab>

      <tab heading="Chart Options">
        <div class="row" style="margin-top: 10px;">
          <div class="col-xs-12">
            <ngx-codejar
              id="chartConfigEditor"
              #chartConfigEditor
              [(code)]="activeChartConfigScriptGroovy"
              (update)="onChartConfigChanged($event)"
              [highlightMethod]="highlightGroovyCode"
              [highlighter]="'prism'"
              [showLineNumbers]="true"
              style="height: 350px; border: 1px solid #ccc; border-radius: 4px; overflow-y: auto; display: block; font-family: 'Courier New', monospace; margin-top: 10px;"
            ></ngx-codejar>
          </div>
        </div>
      </tab>

      <tab heading="Example (Chart Options)">
        <div class="row" style="margin-top: 10px;">
          <div class="col-xs-12">
            <ngx-codejar
              id="chartConfigExampleEditor"
              [code]="exampleChartConfigScript"
              [highlightMethod]="highlightGroovyCode"
              [highlighter]="'prism'"
              [showLineNumbers]="true"
              [readonly]="true"
              style="height: 350px; border: 1px solid #ccc; border-radius: 4px; overflow-y: auto; display: block; font-family: 'Courier New', monospace; background-color: #f8f8f8; margin-top: 10px;"
            ></ngx-codejar>
            <button id="btnCopyToClipboardChartConfigExample" type="button" class="btn btn-default btn-block" style="margin-top: 10px;" (click)="copyToClipboardChartConfigExample()">
              Copy Example Chart Options To Clipboard
            </button>
          </div>
        </div>
      </tab>
    </tabset>
  </div>
</ng-template>`;
