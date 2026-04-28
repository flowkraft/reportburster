export const tabCmsWebPortalTemplate = `<ng-template
  #tabCmsWebPortalTemplate
>
  <div class="well" style="padding-bottom: 0;">

    <div class="row" style="margin-top: 14px">
      <div class="col-xs-12 text-center">
        <a
          id="btnExploreCmsWebPortalApps"
          href="#"
          [routerLink]="['/help','appsMenuSelected']"
          skipLocationChange="true"
          class="btn btn-default"
          style="font-size: 1.05em; padding: 10px 24px; border-radius: 4px; border: 1.5px solid #aaa;"
        >
          Explore More Apps That Go Well Together with DataPallas
        </a>
      </div>
    </div>

    <div class="row" style="margin-top: 10px">
      <div class="col-xs-12">
        <dburst-apps-manager
          [dropdownDirection]="'expandedList'"
          [inputAppsToShow]="['flowkraft-data-canvas']"
          [showDevButtons]="false"
        >
        </dburst-apps-manager>
      </div>
    </div>

    <!-- Dashboard Reports Table -->
    <div class="row" style="margin-top: 12px" *ngIf="dashboardReports.length > 0">
      <div class="col-xs-12">
        <div style="display: flex; align-items: center; justify-content: space-between; margin: 10px 0 8px;">
          <h4 style="margin: 0; font-weight: 600;">
            <i class="fa fa-dashboard" style="margin-right: 8px; color: #5a9bb8;"></i>
            Dashboards
          </h4>
          <button
            id="btnRefreshDashboards"
            type="button"
            class="btn btn-default btn-sm"
            (click)="refreshDashboards()"
            [disabled]="isDashboardRefreshing"
            title="Refresh dashboard list"
          >
            <i class="fa fa-refresh" [class.fa-spin]="isDashboardRefreshing"></i>
          </button>
        </div>
        <table class="table table-bordered table-hover" style="background:#fff; margin-bottom: 8px;">
          <thead>
            <tr>
              <th>Name</th>
              <th style="width:90px; text-align:center;">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let r of dashboardPagedReports">
              <td>
                {{ r.templateName || r.folderName }}
                <span
                  *ngIf="r.type === 'config-samples'"
                  class="label label-primary"
                  style="margin-left: 8px; font-size: 0.78em;"
                >sample</span>
              </td>
              <td style="text-align:center;">
                <a
                  href="http://localhost:9090/dashboard/{{ r.folderName }}"
                  target="_blank"
                  class="btn btn-xs btn-default"
                >
                  <i class="fa fa-external-link"></i>&nbsp;View
                </a>
              </td>
            </tr>
            <tr *ngIf="dashboardPagedReports.length === 0">
              <td colspan="2" style="text-align: center; color: #999; padding: 20px;">
                <span *ngIf="dashboardSearchTerm">No dashboards match '{{ dashboardSearchTerm }}'</span>
                <span *ngIf="!dashboardSearchTerm">No dashboards yet</span>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination (reports-list style) -->
        <nav *ngIf="dashboardFilteredReports.length > dashboardPageSize" style="margin-top: 6px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="color: #777; font-size: 12px;">
              Showing {{ dashboardPageStart + 1 }}-{{ dashboardPageEnd }} of {{ dashboardFilteredReports.length }}
            </span>
            <ul class="pagination pagination-sm" style="margin: 0;">
              <li [ngClass]="{ 'disabled': dashboardPage === 0 }">
                <a href="#" (click)="dashboardPrevPage(); $event.preventDefault()">&laquo;</a>
              </li>
              <li
                *ngFor="let p of dashboardPageNumbers"
                [ngClass]="{ 'active': p === dashboardPage }"
              >
                <a href="#" (click)="dashboardGoToPage(p); $event.preventDefault()">{{ p + 1 }}</a>
              </li>
              <li [ngClass]="{ 'disabled': dashboardPage >= dashboardTotalPages - 1 }">
                <a href="#" (click)="dashboardNextPage(); $event.preventDefault()">&raquo;</a>
              </li>
            </ul>
          </div>
        </nav>

      </div>
    </div>

    <!-- Search box — only shown when there are enough dashboards for 2+ pages -->
    <div class="row" style="margin-top: 6px; margin-bottom: 10px;" *ngIf="dashboardTotalPages >= 2 || dashboardSearchTerm">
      <div class="col-xs-12">
        <div class="input-group">
          <span class="input-group-addon"><i class="fa fa-search"></i></span>
          <input
            type="text"
            id="dashboardSearch"
            class="form-control"
            placeholder="Search by name"
            [ngModel]="dashboardSearchTerm"
            (ngModelChange)="onDashboardSearchChange($event)"
          />
          <span class="input-group-btn" *ngIf="dashboardSearchTerm">
            <button
              type="button"
              class="btn btn-default"
              (click)="onDashboardSearchChange('')"
              title="Clear search"
            >
              <i class="fa fa-times"></i>
            </button>
          </span>
        </div>
      </div>
    </div>

  </div>
</ng-template> `;
