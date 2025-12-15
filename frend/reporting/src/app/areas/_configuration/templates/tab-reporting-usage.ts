export const tabReportingUsageTemplate = `<ng-template #tabReportingUsageTemplate>
  <div class="well">
    <div class="panel panel-default">
      <div class="panel-heading">
        <h4>Embed Reports in External Web Applications</h4>
        <p>Copy and paste the following HTML snippets to embed your report components in external web applications.</p>
       </div>
      <div class="panel-body">
        <h5><strong>1. Data Table Component</strong></h5>
        <div class="well well-sm" style="background-color: #f5f5f5; font-family: monospace; white-space: pre-wrap; word-break: break-all;">
&lt;rb-tabulator
  report-code="{{ getCurrentReportCode() }}"
  api-base-url="{{ getApiBaseUrl() }}"
  api-key="{{ getApiKeyForUsage() }}"&gt;
&lt;/rb-tabulator&gt;
        </div>
        <button type="button" class="btn btn-default btn-sm" style="margin-bottom: 15px;" (click)="copyUsageRbTabulator()">
          <i class="fa fa-copy"></i> Copy rb-tabulator
        </button>

        <hr/>

        <!-- Parameters component - show only if parameters are configured -->
        <div *ngIf="activeParamsSpecScriptGroovy?.trim()">
          <h5><strong>2. Parameters Component</strong></h5>
          <div class="well well-sm" style="background-color: #f5f5f5; font-family: monospace; white-space: pre-wrap; word-break: break-all;">
&lt;rb-parameters
  report-code="{{ getCurrentReportCode() }}"
  api-base-url="{{ getApiBaseUrl() }}"
  api-key="{{ getApiKeyForUsage() }}"&gt;
&lt;/rb-parameters&gt;
          </div>
          <button type="button" class="btn btn-default btn-sm" style="margin-bottom: 15px;" (click)="copyUsageRbParameters()">
            <i class="fa fa-copy"></i> Copy rb-parameters
          </button>
          <hr/>
        </div>

        <!-- Chart component - show only if chart is configured -->
        <div *ngIf="activeChartConfigScriptGroovy?.trim()">
          <h5><strong>{{ activeParamsSpecScriptGroovy?.trim() ? '3' : '2' }}. Chart Component (optional - for data visualization)</strong></h5>
          <div class="well well-sm" style="background-color: #f5f5f5; font-family: monospace; white-space: pre-wrap; word-break: break-all;">
&lt;rb-chart
  report-code="{{ getCurrentReportCode() }}"
  api-base-url="{{ getApiBaseUrl() }}"
  api-key="{{ getApiKeyForUsage() }}"&gt;
&lt;/rb-chart&gt;
          </div>
          <button type="button" class="btn btn-default btn-sm" style="margin-bottom: 15px;" (click)="copyUsageRbChart()">
            <i class="fa fa-copy"></i> Copy rb-chart
          </button>
          <hr/>
        </div>

        <!-- Pivot Table component - show only if pivot table is configured -->
        <div *ngIf="activePivotTableConfigScriptGroovy?.trim()">
          <h5><strong>{{ getUsagePivotTableNumber() }}. Pivot Table Component (for data analysis)</strong></h5>
          <div class="well well-sm" style="background-color: #f5f5f5; font-family: monospace; white-space: pre-wrap; word-break: break-all;">
&lt;rb-pivottable
  report-code="{{ getCurrentReportCode() }}"
  api-base-url="{{ getApiBaseUrl() }}"
  api-key="{{ getApiKeyForUsage() }}"&gt;
&lt;/rb-pivottable&gt;
          </div>
          <button type="button" class="btn btn-default btn-sm" style="margin-bottom: 15px;" (click)="copyUsageRbPivotTable()">
            <i class="fa fa-copy"></i> Copy rb-pivottable
          </button>
          <hr/>
        </div>

        <h5><strong>{{ getUsageRbReportNumber() }}. Report Component</strong></h5>
        <div *ngIf="hasEntityCodeParameter()" class="alert alert-info" style="font-size: 12px; padding: 8px 12px; margin-bottom: 10px;">
          <i class="fa fa-info-circle"></i> 
          This report uses <code>entityCode</code> parameter. Replace <code>YOUR_ENTITY_CODE</code> with the actual entity identifier.
        </div>
        <div class="well well-sm" style="background-color: #f5f5f5; font-family: monospace; white-space: pre-wrap; word-break: break-all;">
&lt;rb-report
  report-code="{{ getCurrentReportCode() }}"{{ getEntityCodeAttribute() }}
  api-base-url="{{ getApiBaseUrl() }}"
  api-key="{{ getApiKeyForUsage() }}"&gt;
&lt;/rb-report&gt;
        </div>
        <button type="button" class="btn btn-default btn-sm" style="margin-bottom: 15px;" (click)="copyUsageRbReport()">
          <i class="fa fa-copy"></i> Copy rb-report
        </button>

        <hr/>

        <h5><strong>{{ getUsageScriptNumber() }}. Include the Web Components Script</strong></h5>
        <p class="text-muted" style="font-size: 12px;">
          <i class="fa fa-info-circle"></i> 
          All FlowKraft apps (<code>_apps/flowkraft/*</code>) and <code>_apps/cms-webportal-playground</code> have this pre-configured. 
          Only add this script tag for fully custom applications not pre-configured by ReportBurster.
        </p>
        <div class="well well-sm" style="background-color: #f5f5f5; font-family: monospace; white-space: pre-wrap; word-break: break-all;">
&lt;script src="{{ getWebComponentsBaseUrl() }}/rb-webcomponents.umd.js"&gt;&lt;/script&gt;
        </div>
        <button type="button" class="btn btn-default btn-sm" style="margin-bottom: 15px;" (click)="copyUsageScriptTag()">
          <i class="fa fa-copy"></i> Copy Script Tag
        </button>

        <hr/>

        <h5><strong>Complete Example</strong></h5>
        <div class="well well-sm" style="background-color: #f5f5f5; font-family: monospace; white-space: pre-wrap; word-break: break-all;">{{ getCompleteUsageExample() }}</div>
        <button type="button" class="btn btn-primary btn-sm" (click)="copyUsageCompleteExample()">
          <i class="fa fa-copy"></i> Copy Complete Example
        </button>
      </div>
    </div>
  </div>
</ng-template>`;
