export const tabReportingPivotTableTemplate = `<ng-template
  #tabReportingPivotTableTemplate
>
  <div class="well">
    <tabset>
      <tab heading="Preview">
        <div class="row" style="margin-top: 20px;">
          <div class="col-xs-12">
            <div class="panel panel-default">
              <div class="panel-body">
                <!-- Show message when Pivot Table Options are not configured -->
                <div *ngIf="!activePivotTableConfigScriptGroovy?.trim()" class="text-center" style="padding: 20px;">
                  <strong>Pivot Table is not yet configured.</strong> To display a pivot table, go to the <strong>Pivot Table Options</strong> tab and configure your pivot table settings.
                </div>

                <!-- Pivot Table Web Component -->
                <rb-pivot-table #pivotTable
                  *ngIf="activePivotTableConfigScriptGroovy?.trim() && reportDataResult && !reportDataResultIsError && reportDataResult?.reportData?.length > 0"
                  [data]="reportDataResult?.reportData"
                  [rows]="activePivotTableConfigOptions?.rows || []"
                  [cols]="activePivotTableConfigOptions?.cols || []"
                  [vals]="activePivotTableConfigOptions?.vals || []"
                  [aggregatorName]="activePivotTableConfigOptions?.aggregatorName || 'Count'"
                  [rendererName]="activePivotTableConfigOptions?.rendererName || 'Table'"
                  [rowOrder]="activePivotTableConfigOptions?.rowOrder || 'key_a_to_z'"
                  [colOrder]="activePivotTableConfigOptions?.colOrder || 'key_a_to_z'"
                  [valueFilter]="activePivotTableConfigOptions?.valueFilter || {}"
                ></rb-pivot-table>

                <!-- Show 'No Data' when pivot table is configured but no data -->
                <div id="noDataPivotTable" *ngIf="activePivotTableConfigScriptGroovy?.trim() && (!reportDataResult || (!reportDataResultIsError && (!reportDataResult?.reportData || reportDataResult?.reportData?.length === 0)))" class="text-center" style="padding: 20px;">
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
                    id="errorsLogPivotTable"
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

      <tab heading="Pivot Table Options">
        <div class="row" style="margin-top: 10px;">
          <div class="col-xs-12">
            <ngx-codejar
              id="pivotTableConfigEditor"
              #pivotTableConfigEditor
              [(code)]="activePivotTableConfigScriptGroovy"
              (update)="onPivotTableConfigChanged($event)"
              [highlightMethod]="highlightGroovyCode"
              [highlighter]="'prism'"
              [showLineNumbers]="true"
              style="height: 350px; border: 1px solid #ccc; border-radius: 4px; overflow-y: auto; display: block; font-family: 'Courier New', monospace; margin-top: 10px;"
            ></ngx-codejar>
          </div>
        </div>
      </tab>

      <tab heading="Example (Pivot Table Options)">
        <div class="row" style="margin-top: 10px;">
          <div class="col-xs-12">
            <ngx-codejar
              id="pivotTableConfigExampleEditor"
              [code]="examplePivotTableConfigScript"
              [highlightMethod]="highlightGroovyCode"
              [highlighter]="'prism'"
              [showLineNumbers]="true"
              [readonly]="true"
              style="height: 350px; border: 1px solid #ccc; border-radius: 4px; overflow-y: auto; display: block; font-family: 'Courier New', monospace; background-color: #f8f8f8; margin-top: 10px;"
            ></ngx-codejar>
            <button id="btnCopyToClipboardPivotTableConfigExample" type="button" class="btn btn-default btn-block" style="margin-top: 10px;" (click)="copyToClipboardPivotTableConfigExample()">
              Copy Example Pivot Table Options To Clipboard
            </button>
          </div>
        </div>
      </tab>
    </tabset>
  </div>
</ng-template>`;
