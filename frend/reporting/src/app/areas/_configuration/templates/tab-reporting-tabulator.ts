export const tabReportingTabulatorTemplate = `<ng-template
  #tabReportingTabulatorTemplate
>
  <div class="well">
    <!-- Top Area: Setup Options 
    <div class="row">
      <div class="col-xs-12">
        <tabset>
          <tab heading="{{ 'AREAS.CONFIGURATION.TAB-REPORTING-TABULATOR.GENERAL-CONFIG' | translate }}">
            <div class="row" style="margin-top: 10px;">
              <div class="col-xs-12">
                <div class="alert alert-info">
                  General Table Configuration settings would come here (layout, height, responsive options, etc.)
                </div>
              </div>
            </div>
          </tab>
          
          <tab heading="{{ 'AREAS.CONFIGURATION.TAB-REPORTING-TABULATOR.COLUMNS' | translate }}">
            <div class="row" style="margin-top: 10px;">
              <div class="col-xs-12">
                <div class="alert alert-info">
                  Column configuration would come here (field mappings, titles, visibility, width)
                </div>
              </div>
            </div>
          </tab>
          
          <tab heading="{{ 'AREAS.CONFIGURATION.TAB-REPORTING-TABULATOR.SORTING' | translate }}">
            <div class="row" style="margin-top: 10px;">
              <div class="col-xs-12">
                <div class="alert alert-info">
                  Sorting configuration would come here (enable/disable sorting, initial sort order)
                </div>
              </div>
            </div>
          </tab>
          
          <tab heading="{{ 'AREAS.CONFIGURATION.TAB-REPORTING-TABULATOR.PAGINATION' | translate }}">
            <div class="row" style="margin-top: 10px;">
              <div class="col-xs-12">
                <div class="alert alert-info">
                  Pagination settings would come here (enable/disable pagination, page size, page size selector)
                </div>
              </div>
            </div>
          </tab>
        </tabset>
      </div>
    </div>
    -->

    <!-- Bottom Area: Table Preview with Tabset -->
    <!-- Top area notice removed (was debug banner) -->
    <tabset>
      <tab heading="Preview">
        <div class="row" style="margin-top: 20px;">
      <div class="col-xs-12">
        <div class="panel panel-default">
          <div class="panel-body">
            <!-- Show table when data exists -->
            <rb-tabulator #tabulator
              *ngIf="reportDataResult && !reportDataResultIsError && reportDataResult?.reportData?.length > 0"
              [data]="reportDataResult?.reportData"
              [columns]="activeTabulatorConfigOptions?.columns || (reportDataResult?.reportColumnNames | tabulatorColumns)"
              [options]="activeTabulatorConfigOptions?.layoutOptions || {}"
              [loading]="isReportDataLoading"
              (ready)="onTabReady($event)"
              (initError)="onTabError($any($event).detail.message)"
              (tableError)="onTabError($any($event).detail.message)"
            ></rb-tabulator>

            <!-- Show 'No Data' when no query run or query returned empty -->
            <div *ngIf="!reportDataResult || (!reportDataResultIsError && (!reportDataResult?.reportData || reportDataResult?.reportData?.length === 0))" class="text-center" style="padding: 20px;">
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
                id="errorsLogTabulator"
                class="panel-body"
                style="
                  color: red;
                  height: 421px;
                  overflow-y: scroll;
                  overflow-x: auto;
                  -webkit-user-select: all;
                  user-select: all;
                "
              >
                <dburst-log-file-viewer
                  logFileName="errors.log"
                ></dburst-log-file-viewer>
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

      <tab heading="Tabulator Options">
        <div class="row" style="margin-top: 10px;">
          <div class="col-xs-12">
            <ngx-codejar
              id="tabulatorConfigEditor"
              #tabulatorConfigEditor
              [(code)]="activeTabulatorConfigScriptGroovy"
              (update)="onTabulatorConfigChanged($event)"
              [highlightMethod]="highlightGroovyCode"
              [highlighter]="'prism'"
              [showLineNumbers]="true"
              style="height: 350px; border: 1px solid #ccc; border-radius: 4px; overflow-y: auto; display: block; font-family: 'Courier New', monospace; margin-top: 10px;"
            ></ngx-codejar>
          </div>
        </div>
      </tab>

      <tab heading="Example (Tabulator Options)">
        <div class="row" style="margin-top: 10px;">
          <div class="col-xs-12">
            <ngx-codejar
              id="tabulatorConfigExampleEditor"
              [code]="exampleTabulatorConfigScript"
              [highlightMethod]="highlightGroovyCode"
              [highlighter]="'prism'"
              [showLineNumbers]="true"
              [readonly]="true"
              style="height: 350px; border: 1px solid #ccc; border-radius: 4px; overflow-y: auto; display: block; font-family: 'Courier New', monospace; background-color: #f8f8f8; margin-top: 10px;"
            ></ngx-codejar>
            <button id="btnCopyToClipboardTabulatorConfigExample" type="button" class="btn btn-default btn-block" style="margin-top: 10px;" (click)="copyToClipboardTabulatorConfigExample()">
              Copy Example Tabulator Options To Clipboard
            </button>
          </div>
        </div>
      </tab>
    </tabset>
  </div>
</ng-template>`;
