export const tabReportingUsageTemplate = `<ng-template #tabReportingUsageTemplate>
  <div class="well">
    <div class="panel panel-default">
      <div class="panel-heading">
        <h4>Embed Reports in External Web Applications</h4>
        <p>Copy and paste the following HTML snippets to embed your report components in external web applications.</p>
       </div>
      <div class="panel-body">

        <!-- ═══════════════════════════════════════════════════════════ -->
        <!-- DASHBOARD MODE: Show only rb-dashboard snippet              -->
        <!-- ═══════════════════════════════════════════════════════════ -->

        <ng-container *ngIf="isDashboardOutputType()">
          <h5><strong>1. Dashboard Component</strong></h5>
          <p class="text-muted" style="font-size: 12px;">
            <i class="fa fa-info-circle"></i>
            Dashboards render the full HTML template with all embedded <code>&lt;rb-*&gt;</code> components.
          </p>
          <div class="well well-sm" style="background-color: #f5f5f5; font-family: monospace; white-space: pre-wrap; word-break: break-all;">
&lt;rb-dashboard
  report-id="{{ getCurrentReportCode() }}"
  api-base-url="{{ getApiBaseUrl() }}"
  api-key="{{ getApiKeyForUsage() }}"&gt;
&lt;/rb-dashboard&gt;
          </div>
          <button type="button" class="btn btn-default btn-sm" style="margin-bottom: 15px;" (click)="copyUsageRbDashboard()">
            <i class="fa fa-copy"></i> Copy rb-dashboard
          </button>

          <h5><strong>2. Shareable Dashboard URL</strong></h5>
          <p class="text-muted" style="font-size: 12px;">
            <i class="fa fa-info-circle"></i>
            Open this URL in a browser to view the live dashboard. Share it with others or use it in emails.
          </p>
          <div class="well well-sm" style="background-color: #f5f5f5; font-family: monospace; white-space: pre-wrap; word-break: break-all;">{{ getDashboardUrl() }}</div>
          <button type="button" class="btn btn-default btn-sm" (click)="copyToClipboard(getDashboardUrl())">
            <i class="fa fa-copy"></i> Copy URL
          </button>
          <p class="text-muted" style="font-size: 12px; margin-top: 8px;">
            <i class="fa fa-envelope"></i>
            Available in email templates as: <code>{{ '$' }}{{ '{' }}dashboard_url{{ '}' }}</code>
          </p>
          <hr/>
        </ng-container>

        <!-- ═══════════════════════════════════════════════════════════ -->
        <!-- NON-DASHBOARD MODE: Individual component snippets           -->
        <!-- ═══════════════════════════════════════════════════════════ -->

        <ng-container *ngIf="!isDashboardOutputType()">

        <!-- DATA TABLE COMPONENT(S) -->

        <!-- Named tabulators (multi-component / aggregator report) -->
        <ng-container *ngIf="getNamedTabulatorIds().length > 0">
          <div *ngFor="let cid of getNamedTabulatorIds(); let idx = index" style="margin-bottom: 10px;">
            <h5><strong>1{{ getLetterSuffix(idx) }}. Data Table — {{ cid }}</strong></h5>
            <div class="well well-sm" style="background-color: #f5f5f5; font-family: monospace; white-space: pre-wrap; word-break: break-all;">
&lt;rb-tabulator
  report-id="{{ getCurrentReportCode() }}"
  component-id="{{ cid }}"
  api-base-url="{{ getApiBaseUrl() }}"
  api-key="{{ getApiKeyForUsage() }}"&gt;
&lt;/rb-tabulator&gt;
            </div>
            <button type="button" class="btn btn-default btn-sm" style="margin-bottom: 10px;" (click)="copyUsageRbTabulatorNamed(cid)">
              <i class="fa fa-copy"></i> Copy rb-tabulator ({{ cid }})
            </button>
          </div>
          <hr/>
        </ng-container>

        <!-- Single unnamed tabulator (standard report) -->
        <ng-container *ngIf="getNamedTabulatorIds().length === 0">
          <h5><strong>1. Data Table Component</strong></h5>
          <div class="well well-sm" style="background-color: #f5f5f5; font-family: monospace; white-space: pre-wrap; word-break: break-all;">
&lt;rb-tabulator
  report-id="{{ getCurrentReportCode() }}"
  api-base-url="{{ getApiBaseUrl() }}"
  api-key="{{ getApiKeyForUsage() }}"&gt;
&lt;/rb-tabulator&gt;
          </div>
          <button type="button" class="btn btn-default btn-sm" style="margin-bottom: 15px;" (click)="copyUsageRbTabulator()">
            <i class="fa fa-copy"></i> Copy rb-tabulator
          </button>
          <hr/>
        </ng-container>

        <!-- PARAMETERS COMPONENT -->

        <!-- Parameters component - show only if parameters are configured -->
        <div *ngIf="activeParamsSpecScriptGroovy?.trim()">
          <h5><strong>{{ getUsageParamsNumber() }}. Parameters Component</strong></h5>
          <div class="well well-sm" style="background-color: #f5f5f5; font-family: monospace; white-space: pre-wrap; word-break: break-all;">
&lt;rb-parameters
  report-id="{{ getCurrentReportCode() }}"
  api-base-url="{{ getApiBaseUrl() }}"
  api-key="{{ getApiKeyForUsage() }}"&gt;
&lt;/rb-parameters&gt;
          </div>
          <button type="button" class="btn btn-default btn-sm" style="margin-bottom: 15px;" (click)="copyUsageRbParameters()">
            <i class="fa fa-copy"></i> Copy rb-parameters
          </button>
          <hr/>
        </div>

        <!-- CHART COMPONENT(S) -->

        <!-- Named charts (multi-component / aggregator report) -->
        <ng-container *ngIf="getNamedChartIds().length > 0">
          <div *ngFor="let cid of getNamedChartIds(); let idx = index" style="margin-bottom: 10px;">
            <h5><strong>{{ getUsageChartNumber() }}{{ getLetterSuffix(idx) }}. Chart — {{ cid }}</strong></h5>
            <div class="well well-sm" style="background-color: #f5f5f5; font-family: monospace; white-space: pre-wrap; word-break: break-all;">
&lt;rb-chart
  report-id="{{ getCurrentReportCode() }}"
  component-id="{{ cid }}"
  api-base-url="{{ getApiBaseUrl() }}"
  api-key="{{ getApiKeyForUsage() }}"&gt;
&lt;/rb-chart&gt;
            </div>
            <button type="button" class="btn btn-default btn-sm" style="margin-bottom: 10px;" (click)="copyUsageRbChartNamed(cid)">
              <i class="fa fa-copy"></i> Copy rb-chart ({{ cid }})
            </button>
          </div>
          <hr/>
        </ng-container>

        <!-- Single unnamed chart (standard report) -->
        <div *ngIf="getNamedChartIds().length === 0 && activeChartConfigScriptGroovy?.trim()">
          <h5><strong>{{ getUsageChartNumber() }}. Chart Component (optional - for data visualization)</strong></h5>
          <div class="well well-sm" style="background-color: #f5f5f5; font-family: monospace; white-space: pre-wrap; word-break: break-all;">
&lt;rb-chart
  report-id="{{ getCurrentReportCode() }}"
  api-base-url="{{ getApiBaseUrl() }}"
  api-key="{{ getApiKeyForUsage() }}"&gt;
&lt;/rb-chart&gt;
          </div>
          <button type="button" class="btn btn-default btn-sm" style="margin-bottom: 15px;" (click)="copyUsageRbChart()">
            <i class="fa fa-copy"></i> Copy rb-chart
          </button>
          <hr/>
        </div>

        <!-- PIVOT TABLE COMPONENT(S) -->

        <!-- Named pivot tables (multi-component / aggregator report) -->
        <ng-container *ngIf="getNamedPivotIds().length > 0">
          <div *ngFor="let cid of getNamedPivotIds(); let idx = index" style="margin-bottom: 10px;">
            <h5><strong>{{ getUsagePivotTableNumber() }}{{ getLetterSuffix(idx) }}. Pivot Table — {{ cid }}</strong></h5>
            <div class="well well-sm" style="background-color: #f5f5f5; font-family: monospace; white-space: pre-wrap; word-break: break-all;">
&lt;rb-pivottable
  report-id="{{ getCurrentReportCode() }}"
  component-id="{{ cid }}"
  api-base-url="{{ getApiBaseUrl() }}"
  api-key="{{ getApiKeyForUsage() }}"&gt;
&lt;/rb-pivottable&gt;
            </div>
            <button type="button" class="btn btn-default btn-sm" style="margin-bottom: 10px;" (click)="copyUsageRbPivotTableNamed(cid)">
              <i class="fa fa-copy"></i> Copy rb-pivottable ({{ cid }})
            </button>
          </div>
          <hr/>
        </ng-container>

        <!-- Single unnamed pivot table (standard report) -->
        <div *ngIf="getNamedPivotIds().length === 0 && activePivotTableConfigScriptGroovy?.trim()">
          <h5><strong>{{ getUsagePivotTableNumber() }}. Pivot Table Component (for data analysis)</strong></h5>
          <div class="well well-sm" style="background-color: #f5f5f5; font-family: monospace; white-space: pre-wrap; word-break: break-all;">
&lt;rb-pivottable
  report-id="{{ getCurrentReportCode() }}"
  api-base-url="{{ getApiBaseUrl() }}"
  api-key="{{ getApiKeyForUsage() }}"&gt;
&lt;/rb-pivottable&gt;
          </div>
          <button type="button" class="btn btn-default btn-sm" style="margin-bottom: 15px;" (click)="copyUsageRbPivotTable()">
            <i class="fa fa-copy"></i> Copy rb-pivottable
          </button>
          <hr/>
        </div>

        <!-- REPORT COMPONENT (always shown, no component-id needed) -->

        <h5><strong>{{ getUsageRbReportNumber() }}. Report Component</strong></h5>
        <div *ngIf="hasEntityCodeParameter()" class="alert alert-info" style="font-size: 12px; padding: 8px 12px; margin-bottom: 10px;">
          <i class="fa fa-info-circle"></i>
          This report uses <code>entityCode</code> parameter. Replace <code>YOUR_ENTITY_CODE</code> with the actual entity identifier.
        </div>
        <div class="well well-sm" style="background-color: #f5f5f5; font-family: monospace; white-space: pre-wrap; word-break: break-all;">
&lt;rb-report
  report-id="{{ getCurrentReportCode() }}"{{ getEntityCodeAttribute() }}
  api-base-url="{{ getApiBaseUrl() }}"
  api-key="{{ getApiKeyForUsage() }}"&gt;
&lt;/rb-report&gt;
        </div>
        <button type="button" class="btn btn-default btn-sm" style="margin-bottom: 15px;" (click)="copyUsageRbReport()">
          <i class="fa fa-copy"></i> Copy rb-report
        </button>

        <hr/>

        </ng-container>

        <!-- ═══════════════════════════════════════════════════════════ -->
        <!-- SCRIPT TAG                                                 -->
        <!-- ═══════════════════════════════════════════════════════════ -->

        <h5><strong>{{ getUsageScriptNumber() }}. Include the Web Components Script</strong></h5>
        <p class="text-muted" style="font-size: 12px;">
          <i class="fa fa-info-circle"></i>
          All FlowKraft apps (<code>_apps/flowkraft/*</code>) and <code>_apps/cms-webportal-playground</code> have this pre-configured.
          Only add this script tag for fully custom applications not pre-configured by DataPallas.
        </p>
        <div class="well well-sm" style="background-color: #f5f5f5; font-family: monospace; white-space: pre-wrap; word-break: break-all;">
&lt;script src="{{ getWebComponentsBaseUrl() }}/rb-webcomponents.umd.js"&gt;&lt;/script&gt;
        </div>
        <button type="button" class="btn btn-default btn-sm" style="margin-bottom: 15px;" (click)="copyUsageScriptTag()">
          <i class="fa fa-copy"></i> Copy Script Tag
        </button>

        <hr/>

        <!-- ═══════════════════════════════════════════════════════════ -->
        <!-- COMPLETE EXAMPLE                                           -->
        <!-- ═══════════════════════════════════════════════════════════ -->

        <h5><strong>Complete Example</strong></h5>
        <div class="well well-sm" style="background-color: #f5f5f5; font-family: monospace; white-space: pre-wrap; word-break: break-all;">{{ getCompleteUsageExample() }}</div>
        <button type="button" class="btn btn-primary btn-sm" (click)="copyUsageCompleteExample()">
          <i class="fa fa-copy"></i> Copy Complete Example
        </button>
      </div>
    </div>
  </div>
</ng-template>`;
