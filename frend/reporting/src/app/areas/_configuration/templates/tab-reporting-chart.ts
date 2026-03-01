export const tabReportingChartTemplate = `<ng-template
  #tabReportingChartTemplate
>
  <div class="well">
    <tabset>
      <tab heading="Preview">
        <div class="row" style="margin-top: 20px;">
          <div class="col-xs-12">
            <!-- Named components (aggregator report) -->
            <ng-container *ngIf="getNamedChartIds().length > 0">
              <div *ngFor="let cid of getNamedChartIds()" class="panel panel-default" style="margin-bottom: 15px;">
                <div class="panel-heading"><strong>{{cid}}</strong></div>
                <div class="panel-body">
                  <rb-chart
                    *ngIf="showChartPreview"
                    [reportCode]="getCurrentReportCode()"
                    [componentId]="cid"
                    [apiBaseUrl]="reportingService.reportingApiBaseUrl"
                    [reportParams]="previewParams || {}"
                    [testMode]="true"
                    (dataFetched)="onChartDataFetched($any($event))"
                    (fetchError)="onChartFetchError($any($event))"
                    (ready)="onChartReady($event)"
                    (initError)="onChartError($any($event).detail.message)"
                    (chartError)="onChartError($any($event).detail.message)"
                  ></rb-chart>
                </div>
              </div>
            </ng-container>

            <!-- Single unnamed component (standard report) — Mode 1: Angular fetches data once, pushes via [data] prop -->
            <div *ngIf="getNamedChartIds().length === 0" class="panel panel-default">
              <div class="panel-body">
                <!-- Only show chart if Chart Options script is configured and data exists -->
                <rb-chart #chart
                  *ngIf="reportDataResult && !reportDataResultIsError && activeChartConfigScriptGroovy?.trim() && reportDataResult?.data?.length > 0"
                  [data]="{ chartConfig: activeChartConfigOptions, reportData: reportDataResult?.data }"
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
                <div *ngIf="activeChartConfigScriptGroovy?.trim() && (!reportDataResult || (!reportDataResultIsError && (!reportDataResult?.data || reportDataResult?.data?.length === 0)))" class="text-center" style="padding: 20px;">
                  <strong>No Data</strong>
                </div>

                <div *ngIf="reportDataResult && reportDataResultIsError">
                  <div class="alert alert-danger">
                    <strong>Error:</strong> Query failed. Check Logs below.
                  </div>
                  <pre style="white-space:pre-wrap;max-height:300px;overflow:auto;">
                    {{ reportDataResult.data?.[0]?.ERROR_MESSAGE }}
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
                  <p>Total Rows: {{ reportDataResult.data?.length || 0 }}</p>
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
            <a id="btnSeeMoreChartExamples" href="https://www.reportburster.com/docs/bi-analytics/web-components/charts" target="_blank" class="btn btn-default btn-block" style="color: #337ab7; text-decoration: underline; margin-bottom: 10px;">
              See More Chart Examples
            </a>
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
