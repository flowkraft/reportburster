export const tabReportingTabulatorTemplate = `<ng-template
  #tabReportingTabulatorTemplate
>
  <div class="well">
    <!-- Top Area: Setup Options -->
    <div class="row">
      <div class="col-xs-12">
        <tabset>
          <!-- Tab 1: General Table Configuration -->
          <tab heading="{{ 'AREAS.CONFIGURATION.TAB-REPORTING-TABULATOR.GENERAL-CONFIG' | translate }}">
            <div class="row" style="margin-top: 10px;">
              <div class="col-xs-12">
                <div class="alert alert-info">
                  General Table Configuration settings would come here (layout, height, responsive options, etc.)
                </div>
              </div>
            </div>
          </tab>
          
          <!-- Tab 2: Columns -->
          <tab heading="{{ 'AREAS.CONFIGURATION.TAB-REPORTING-TABULATOR.COLUMNS' | translate }}">
            <div class="row" style="margin-top: 10px;">
              <div class="col-xs-12">
                <div class="alert alert-info">
                  Column configuration would come here (field mappings, titles, visibility, width)
                </div>
              </div>
            </div>
          </tab>
          
          <!-- Tab 3: Sorting -->
          <tab heading="{{ 'AREAS.CONFIGURATION.TAB-REPORTING-TABULATOR.SORTING' | translate }}">
            <div class="row" style="margin-top: 10px;">
              <div class="col-xs-12">
                <div class="alert alert-info">
                  Sorting configuration would come here (enable/disable sorting, initial sort order)
                </div>
              </div>
            </div>
          </tab>
          
          <!-- Tab 4: Pagination -->
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
    
    <!-- Bottom Area: Table Preview -->
    <div class="row" style="margin-top: 20px;">
      <div class="col-xs-12">
        <div class="panel panel-default">
          <div class="panel-heading">
            <h3 class="panel-title">{{ 'AREAS.CONFIGURATION.TAB-REPORTING-TABULATOR.TABLE-PREVIEW' | translate }}</h3>
          </div>
          <div class="panel-body">
            <div class="alert alert-info">
              Tabulator preview would be displayed here
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</ng-template>`;
