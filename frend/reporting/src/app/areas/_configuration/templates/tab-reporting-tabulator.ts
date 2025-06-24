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

    <!-- Bottom Area: Table Preview -->
    <div class="row" style="margin-top: 20px;">
      <div class="col-xs-12">
        <div class="panel panel-default">
          <div class="panel-heading">
            <h3 class="panel-title">{{ 'AREAS.CONFIGURATION.TAB-REPORTING-TABULATOR.TABLE-PREVIEW' | translate }}</h3>
          </div>
          <div class="panel-body">
            <rb-tabulator></rb-tabulator>
          </div>
        </div>
      </div>
    </div>
  </div>
</ng-template>`;
