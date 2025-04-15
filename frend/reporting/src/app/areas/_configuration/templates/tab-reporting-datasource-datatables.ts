export const tabReportingDataSourceDataTablesTemplate = `<ng-template
  #tabReportingDataSourceDataTablesTemplate
>
  <div class="well">
    <!-- Datasource Type Dropdown -->
    <div class="row">
      <div class="col-xs-2">
        {{ 'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.TYPE' | translate }}
      </div>
      <div class="col-xs-6">
        <select
          id="dsTypes"
          class="form-control"
          [(ngModel)]="xmlReporting?.documentburster.report.datasource.type"
          (ngModelChange)="onDataSourceTypeChange()"
        >
          <option value="ds.csvfile">
            {{ 'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.TYPE-CSV' | translate }}
          </option>
          <option value="ds.tsvfile">
            {{ 'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.TYPE-TSV' | translate }}
          </option>
          <option value="ds.fixedwidthfile">
            {{ 'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.TYPE-FIXED-WIDTH' | translate }}
          </option>
          <option value="ds.excelfile">
            {{ 'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.TYPE-EXCEL' | translate }}
          </option>
          <option value="ds.gsheet">
            {{ 'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.TYPE-CLOUD-GSHEET' | translate }}
          </option>
          <option value="ds.o365sheet">
            {{ 'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.TYPE-CLOUD-O365SHEET' | translate }}
          </option>
          <option value="ds.database">
            {{ 'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.TYPE-DATABASE' | translate }}
          </option>
        </select>
      </div>
    </div>
    <p></p>

    <!-- CSV/TSV Section -->
    <div *ngIf="xmlReporting?.documentburster.report.datasource.type === 'ds.csvfile' || 
                 xmlReporting?.documentburster.report.datasource.type === 'ds.tsvfile'">
      <div class="row">
        <div class="col-xs-2">
          {{ 'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.CSV-SEPARATOR-CHAR' | translate }}
        </div>
        <div class="col-xs-9">
          <input
            id="separatorChar"
            class="form-control"
            [(ngModel)]="xmlReporting?.documentburster.report.datasource.csvoptions.separatorchar"
            (ngModelChange)="settingsChangedEventHandler($event)"
            [readonly]="xmlReporting?.documentburster.report.datasource.type === 'ds.tsvfile'"
          />
        </div>
      </div>

      <p></p>
      <div class="row">
        <div class="col-xs-2">
          {{ 'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.HEADER' | translate }}
        </div>
        <div class="col-xs-9">
          <select
            id="selectHeader"
            class="form-control"
            (change)="onSelectCsvHeader()"
            [(ngModel)]="xmlReporting?.documentburster.report.datasource.csvoptions.header"
            (ngModelChange)="settingsChangedEventHandler($event)"
          >
            <option id="optionNoHeader" value="noheader">
              {{ 'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.HEADER-NO-HEADER' | translate }}
            </option>
            <option id="optionFirstLine" value="firstline">
              {{ 'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.HEADER-FIRST-LINE' | translate }}
            </option>
            <option id="optionFirstLine" value="multiline">
              {{ 'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.HEADER-MULTI-LINE' | translate }}
            </option>
          </select>
        </div>
      </div>
      <p></p>
      <div class="row">
        <div class="col-xs-2">
          {{ 'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.SKIP-LINES' | translate }}
        </div>
        <div class="col-xs-9">
          <input
            id="skipLines"
            type="number"
            class="form-control"
            [(ngModel)]="xmlReporting?.documentburster.report.datasource.csvoptions.skiplines"
            (ngModelChange)="settingsChangedEventHandler($event)"
            [disabled]="xmlReporting?.documentburster.report.datasource.csvoptions.header != 'multiline'"
          />
        </div>
      </div>

      <br />

      <div class="row">
        <div class="col-xs-12">
          <label id="lblShowMoreCsvOptions" for="btnShowMoreCsvOptions" class="checkboxlabel" style="cursor: pointer;">
            <span><strong>
              <u *ngIf="!xmlReporting?.documentburster.report.datasource.showmorecsvoptions">Show More CSV Options</u>
              <u *ngIf="xmlReporting?.documentburster.report.datasource.showmorecsvoptions"><em>Show Less CSV Options</em></u>
            </strong></span>
          </label>
          <input
            type="checkbox"
            id="btnShowMoreCsvOptions"
            style="visibility: hidden;"
            [(ngModel)]="xmlReporting?.documentburster.report.datasource.showmorecsvoptions"
            (ngModelChange)="settingsChangedEventHandler($event)"
          />
        </div>
      </div>

      <br />

      <div class="row" *ngIf="xmlReporting?.documentburster.report.datasource.showmorecsvoptions">
        <div class="col-xs-2">
          {{ 'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.CODE-COLUMN' | translate }}
        </div>
        <div class="col-xs-5">
          <select
            id="csvIdColumn"
            class="form-control"
            [(ngModel)]="csvIdColumnSelection"
            (ngModelChange)="onCsvIdColumnSelectionChange($event)"
          >
            <option value="notused">{{ 'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.CODE-COLUMN-NOT-USED' | translate }}</option>
            <option value="firstcolumn">{{ 'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.CODE-COLUMN-FIRST-COLUMN' | translate }}</option>
            <option value="lastcolumn">{{ 'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.CODE-COLUMN-LAST-COLUMN' | translate }}</option>
            <option value="custom">{{ 'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.CODE-COLUMN-LET-ME-SPECIFY' | translate }}</option>
          </select>
        </div>
        <div class="col-xs-4" *ngIf="csvIdColumnSelection === 'custom'">
          <input
            type="number"
            id="csvCustomIdColumnIndex"
            class="form-control"
            min="0"
            [(ngModel)]="xmlReporting.documentburster.report.datasource.csvoptions.idcolumn"
            (ngModelChange)="settingsChangedEventHandler($event)"
            placeholder="Enter column index (0-based)"
          />
        </div>
      </div>

      <p></p>
      
      <div class="row" *ngIf="xmlReporting?.documentburster.report.datasource.showmorecsvoptions">
        <div class="col-xs-2">
          {{ 'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.CSV-QUOTATION-CHAR' | translate }}
        </div>
        <div class="col-xs-9">
          <input
            id="quotationChar"
            class="form-control"
            [(ngModel)]="xmlReporting?.documentburster.report.datasource.csvoptions.quotationchar"
            (ngModelChange)="settingsChangedEventHandler($event)"
          />
        </div>
      </div>

      <p></p>

      <div class="row" *ngIf="xmlReporting?.documentburster.report.datasource.showmorecsvoptions">
        <div class="col-xs-2">
          {{ 'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.CSV-ESCAPE-CHAR' | translate }}
        </div>
        <div class="col-xs-9">
          <input
            id="escapeChar"
            class="form-control"
            [(ngModel)]="xmlReporting?.documentburster.report.datasource.csvoptions.escapechar"
            (ngModelChange)="settingsChangedEventHandler($event)"
          />
        </div>
      </div>

      <p></p>
      <div class="row" *ngIf="xmlReporting?.documentburster.report.datasource.showmorecsvoptions">
        <div class="col-xs-2">
          {{ 'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.CSV-STRICT-QUOTATIONS' | translate }}
        </div>
        <div class="col-xs-9">
          <input
            type="checkbox"
            id="btnStrictQuotations"
            [(ngModel)]="xmlReporting?.documentburster.report.datasource.csvoptions.strictquotations"
            (ngModelChange)="settingsChangedEventHandler($event)"
          />
        </div>
      </div>

      <p></p>
      <div class="row" *ngIf="xmlReporting?.documentburster.report.datasource.showmorecsvoptions">
        <div class="col-xs-2">
          {{ 'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.CSV-IGNORE-QUOTATIONS' | translate }}
        </div>
        <div class="col-xs-9">
          <input
            type="checkbox"
            id="btnIgnoreQuotations"
            [(ngModel)]="xmlReporting?.documentburster.report.datasource.csvoptions.ignorequotations"
            (ngModelChange)="settingsChangedEventHandler($event)"
          />
        </div>
      </div>

      <p></p>
      <div class="row" *ngIf="xmlReporting?.documentburster.report.datasource.showmorecsvoptions">
        <div class="col-xs-2">
          {{ 'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.IGNORE-LEADING-WHITESPACE' | translate }}
        </div>
        <div class="col-xs-9">
          <input
            type="checkbox"
            id="btnIgnoreLeadingWhitespace"
            [(ngModel)]="xmlReporting?.documentburster.report.datasource.csvoptions.ignoreleadingwhitespace"
            (ngModelChange)="settingsChangedEventHandler($event)"
          />
        </div>
      </div>
    </div>

    <!-- Fixed Width Section -->
    <div *ngIf="xmlReporting?.documentburster.report.datasource.type === 'ds.fixedwidthfile'">
      
      <!-- Basic Options -->
      <div class="row">
        <div class="col-xs-2">
          {{ 'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.FIXED-WIDTH-COLUMNS' | translate }}
        </div>
        <div class="col-xs-9">
          <textarea
            id="fixedWidthColumns"
            class="form-control"
            rows="5"
            [(ngModel)]="xmlReporting?.documentburster.report.datasource.fixedwidthoptions.columns"
            (ngModelChange)="settingsChangedEventHandler($event)"
            placeholder="Column 1, 10
Column 2, 20
Column 3, 15"
          ></textarea>
        </div>
      </div>

      <p></p>

      <!-- Fixed Width Header -->
      <div class="row">
        <div class="col-xs-2">
          {{ 'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.HEADER' | translate }}
        </div>
        <div class="col-xs-9">
          <select
            id="selectFixedWidthHeader"
            class="form-control"
            (change)="onSelectFixedWidthHeader()"
            [(ngModel)]="xmlReporting?.documentburster.report.datasource.fixedwidthoptions.header"
            (ngModelChange)="settingsChangedEventHandler($event)"
          >
            <option value="noheader">{{ 'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.HEADER-NO-HEADER' | translate }}</option>
            <option value="firstline">{{ 'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.HEADER-FIRST-LINE' | translate }}</option>
          </select>
        </div>
      </div>

      <p></p>

      <!-- Fixed Width Skip Lines -->
      <div class="row">
        <div class="col-xs-2">
          {{ 'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.SKIP-LINES' | translate }}
        </div>
        <div class="col-xs-9">
          <input
            id="fixedWidthSkipLines"
            type="number"
            class="form-control"
            [(ngModel)]="xmlReporting?.documentburster.report.datasource.fixedwidthoptions.skiplines"
            (ngModelChange)="settingsChangedEventHandler($event)"
            [disabled]="true"
          />
        </div>
      </div>

      <br />

      <!-- Show More Options Toggle -->
      <div class="row">
        <div class="col-xs-12">
          <label id="lblShowMoreFixedWidthOptions" for="btnShowMoreFixedWidthOptions" class="checkboxlabel" style="cursor: pointer;">
            <span><strong>
              <u *ngIf="!xmlReporting?.documentburster.report.datasource.showmorefixedwidthoptions">Show More Fixed Width Options</u>
              <u *ngIf="xmlReporting?.documentburster.report.datasource.showmorefixedwidthoptions"><em>Show Less Fixed Width Options</em></u>
            </strong></span>
          </label>
          <input
            type="checkbox"
            id="btnShowMoreFixedWidthOptions"
            style="visibility: hidden;"
            [(ngModel)]="xmlReporting?.documentburster.report.datasource.showmorefixedwidthoptions"
            (ngModelChange)="settingsChangedEventHandler($event)"
          />
        </div>
      </div>

      <br />

      <!-- Advanced Fixed Width Options -->
      <div class="row" *ngIf="xmlReporting?.documentburster.report.datasource.showmorefixedwidthoptions">
        <div class="col-xs-2">
          {{ 'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.CODE-COLUMN' | translate }}
        </div>
        <div class="col-xs-5">
          <select
            id="fixedWidthIdColumn"
            class="form-control"
            [(ngModel)]="fixedWidthIdColumnSelection"
            (ngModelChange)="onFixedWidthIdColumnSelectionChange($event)"
          >
            <option value="notused">{{ 'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.CODE-COLUMN-NOT-USED' | translate }}</option>
            <option value="firstcolumn">{{ 'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.CODE-COLUMN-FIRST-COLUMN' | translate }}</option>
            <option value="lastcolumn">{{ 'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.CODE-COLUMN-LAST-COLUMN' | translate }}</option>
            <option value="custom">{{ 'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.CODE-COLUMN-LET-ME-SPECIFY' | translate }}</option>
          </select>
        </div>
        <div class="col-xs-4" *ngIf="fixedWidthIdColumnSelection === 'custom'">
          <input
            type="number"
            id="fixedWidthCustomIdColumnIndex"
            class="form-control"
            min="0"
            [(ngModel)]="xmlReporting.documentburster.report.datasource.fixedwidthoptions.idcolumn"
            (ngModelChange)="settingsChangedEventHandler($event)"
            placeholder="Enter column index (0-based)"
          />
        </div>
      </div>
      
      <p></p>

      <div *ngIf="xmlReporting?.documentburster.report.datasource.showmorefixedwidthoptions">
        <div class="row">
          <div class="col-xs-2">
            {{ 'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.IGNORE-LEADING-WHITESPACE' | translate }}
          </div>
          <div class="col-xs-9">
            <input
              type="checkbox"
              id="btnFixedWidthIgnoreLeadingWhitespace"
              [(ngModel)]="xmlReporting?.documentburster.report.datasource.fixedwidthoptions.ignoreleadingwhitespace"
              (ngModelChange)="settingsChangedEventHandler($event)"
            />
          </div>
        </div>
      </div>
    </div>
    
    <!-- Excel Section -->
    <div *ngIf="xmlReporting?.documentburster.report.datasource.type === 'ds.excelfile'">
      <div class="row">
        <div class="col-xs-2">
          {{ 'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.HEADER' | translate }}
        </div>
        <div class="col-xs-9">
          <select
            id="selectExcelHeader"
            class="form-control"
            (change)="onSelectExcelHeader()"
            [(ngModel)]="xmlReporting?.documentburster.report.datasource.exceloptions.header"
            (ngModelChange)="settingsChangedEventHandler($event)"
          >
            <option value="noheader">
              {{ 'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.HEADER-NO-HEADER' | translate }}
            </option>
            <option value="firstline">
              {{ 'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.HEADER-FIRST-LINE' | translate }}
            </option>
            <option value="multiline">
              {{ 'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.HEADER-MULTI-LINE' | translate }}
            </option>
          </select>
        </div>
      </div>

      <p></p>
      <div class="row">
        <div class="col-xs-2">
          {{ 'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.SKIP-LINES' | translate }}
        </div>
        <div class="col-xs-9">
          <input
            id="excelSkipLines"
            class="form-control"
            type="number"
            [(ngModel)]="xmlReporting?.documentburster.report.datasource.exceloptions.skiplines"
            (ngModelChange)="settingsChangedEventHandler($event)"
            [disabled]="xmlReporting?.documentburster.report.datasource.exceloptions.header != 'multiline'"
          />
        </div>
      </div>

      <p></p>
      <div class="row">
        <div class="col-xs-2">
          {{ 'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.EXCEL-SHEET-INDEX' | translate }}
        </div>
        <div class="col-xs-9">
          <input
            id="excelSheetIndex"
            class="form-control"
            type="number"
            [(ngModel)]="xmlReporting?.documentburster.report.datasource.exceloptions.sheetindex"
            (ngModelChange)="settingsChangedEventHandler($event)"
          />
        </div>
      </div>

      <br />

      <div class="row">
        <div class="col-xs-12">
          <label id="lblShowMoreExcelOptions" for="btnShowMoreExcelOptions" class="checkboxlabel" style="cursor: pointer;">
            <span><strong>
              <u *ngIf="!xmlReporting?.documentburster.report.datasource.showmoreexceloptions">Show More Excel Options</u>
              <u *ngIf="xmlReporting?.documentburster.report.datasource.showmoreexceloptions"><em>Show Less Excel Options</em></u>
            </strong></span>
          </label>
          <input
            type="checkbox"
            id="btnShowMoreExcelOptions"
            style="visibility: hidden;"
            [(ngModel)]="xmlReporting?.documentburster.report.datasource.showmoreexceloptions"
            (ngModelChange)="settingsChangedEventHandler($event)"
          />
        </div>
      </div>

      <br />

      <div *ngIf="xmlReporting?.documentburster.report.datasource.showmoreexceloptions">
        <div class="row">
          <div class="col-xs-2">
            {{ 'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.CODE-COLUMN' | translate }}
          </div>
          <div class="col-xs-5">
            <select
              id="excelIdColumn"
              class="form-control"
              [(ngModel)]="excelIdColumnSelection"
              (ngModelChange)="onExcelIdColumnSelectionChange($event)"
            >
              <option value="notused">{{ 'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.CODE-COLUMN-NOT-USED' | translate }}</option>
              <option value="firstcolumn">{{ 'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.CODE-COLUMN-FIRST-COLUMN' | translate }}</option>
              <option value="lastcolumn">{{ 'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.CODE-COLUMN-LAST-COLUMN' | translate }}</option>
              <option value="custom">{{ 'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.CODE-COLUMN-LET-ME-SPECIFY' | translate }}</option>
            </select>
          </div>
          <div class="col-xs-4" *ngIf="excelIdColumnSelection === 'custom'">
            <input
              type="number"
              id="excelCustomIdColumnIndex"
              class="form-control"
              min="0"
              [(ngModel)]="xmlReporting.documentburster.report.datasource.exceloptions.idcolumn"
              (ngModelChange)="settingsChangedEventHandler($event)"
              placeholder="Enter column index (0-based)"
            />
          </div>
        </div>

        <p></p>
        <div class="row">
          <div class="col-xs-2">
            {{ 'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.IGNORE-LEADING-WHITESPACE' | translate }}
          </div>
          <div class="col-xs-9">
            <input
              type="checkbox"
              id="btnExcelIgnoreLeadingWhitespace"
              [(ngModel)]="xmlReporting?.documentburster.report.datasource.exceloptions.ignoreleadingwhitespace"
              (ngModelChange)="settingsChangedEventHandler($event)"
            />
          </div>
        </div>

        <p></p>
        <div class="row">
          <div class="col-xs-2">
            {{ 'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.EXCEL-USE-FORMULA-RESULTS' | translate }}
          </div>
          <div class="col-xs-9">
            <input
              type="checkbox"
              id="btnExcelUseFormulaResults"
              [(ngModel)]="xmlReporting?.documentburster.report.datasource.exceloptions.useformularesults"
              (ngModelChange)="settingsChangedEventHandler($event)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Request Feature Section -->
    <div *ngIf="!askForFeatureService.alreadyImplementedFeatures.includes(xmlReporting?.documentburster.report.datasource.type)">
      <div class="row">
        <div class="col-xs-2"></div>
        <div class="col-xs-5">
          <button
            type="button"
            class="btn btn-primary btn-block"
            (click)="onAskForFeatureModalShow(xmlReporting?.documentburster.report.datasource.type)"
          >
            Request <span class="badge">New</span> Feature
          </button>
        </div>
      </div>
    </div>
  </div>
</ng-template>`;
