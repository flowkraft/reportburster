export const tabReportingDataSourceDataTablesTemplate = `<ng-template
  #tabReportingDataSourceDataTablesTemplate
>
  <div class="well">
    <div class="row">
      <div class="col-xs-2">
        {{ 'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.TYPE' |
        translate }}
      </div>
      <div class="col-xs-6">
        <select
          id="dsTypes"
          class="form-control"
          [(ngModel)]="xmlReporting?.documentburster.report.datasource.type"
          (ngModelChange)="settingsChangedEventHandler($event)"
          (change)="onAskForFeatureModalShow($event)"
        >
          <option value="ds.csvfile">
            {{ 'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.TYPE-CSV' |
            translate }}
          </option>
          <option value="ds.tsvfile">
            {{ 'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.TYPE-TSV' |
            translate }}
          </option>
          <option value="ds.fixedwidthfile">
            {{
            'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.TYPE-FIXED-WIDTH'
            | translate }}
          </option>
          <option value="ds.excelfile">
            {{ 'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.TYPE-EXCEL'
            | translate }}
          </option>
          <option value="ds.gsheet">
            {{
            'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.TYPE-CLOUD-GSHEET'
            | translate }}
          </option>
          <option value="ds.o365sheet">
            {{
            'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.TYPE-CLOUD-O365SHEET'
            | translate }}
          </option>
          <option value="ds.database">
            {{
            'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.TYPE-DATABASE'
            | translate }}
          </option>
        </select>
      </div>
    </div>
    <p></p>
    <div
      *ngIf="askForFeatureService.alreadyImplementedFeatures.includes(xmlReporting?.documentburster.report.datasource.type)"
    >
      <div class="row">
        <div class="col-xs-2">
          {{
          'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.CSV-SEPARATOR-CHAR'
          | translate }}
        </div>
        <div class="col-xs-9">
          <input
            id="separatorChar"
            class="form-control"
            [(ngModel)]="xmlReporting?.documentburster.report.datasource.csvoptions.separatorchar"
            (ngModelChange)="settingsChangedEventHandler($event)"
          />
        </div>
      </div>

      <p></p>
      <div class="row">
        <div class="col-xs-2">
          {{ 'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.HEADER' |
          translate }}
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
              {{
              'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.HEADER-NO-HEADER'
              | translate }}
            </option>
            <option id="optionFirstLine" value="firstline">
              {{
              'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.HEADER-FIRST-LINE'
              | translate }}
            </option>
            <option id="optionFirstLine" value="multiline">
              {{
              'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.HEADER-MULTI-LINE'
              | translate }}
            </option>
          </select>
        </div>
      </div>
      <p></p>
      <div class="row">
        <div class="col-xs-2">
          {{ 'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.SKIP-LINES' |
          translate }}
        </div>
        <div class="col-xs-9">
          <input
            id="skipLines"
            class="form-control"
            [(ngModel)]="xmlReporting?.documentburster.report.datasource.csvoptions.skiplines"
            (ngModelChange)="settingsChangedEventHandler($event)"
            [disabled]="xmlReporting?.documentburster.report.datasource.csvoptions.header != 'multiline'"
          />
        </div>
      </div>

      <br />

      <div class="row"
      >
        <div class="col-xs-12">
          <label id="lblShowMoreCsvOptions" for="btnShowMoreCsvOptions" class="checkboxlabel" style="cursor: pointer;"
            ><span><strong><u *ngIf="!xmlReporting?.documentburster.report.datasource.showmorecsvoptions">Show More CSV Options</u><u *ngIf="xmlReporting?.documentburster.report.datasource.showmorecsvoptions"><em>Show Less CSV Options</em></u></strong></span></label
          >
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
          {{
          'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.CSV-QUOTATION-CHAR'
          | translate }}
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
          {{
          'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.CSV-ESCAPE-CHAR'
          | translate }}
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
          {{
          'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.CSV-STRICT-QUOTATIONS'
          | translate }}
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
          {{
          'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.CSV-IGNORE-QUOTATIONS'
          | translate }}
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
          {{
          'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.CSV-IGNORE-LEADING-WHITESPACE'
          | translate }}
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

      <!--
      <p></p>
      <div class="row" *ngIf="xmlReporting?.documentburster.report.datasource.showmorecsvoptions">
        <div class="col-xs-2">
          {{ 'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.CODE-COLUMN'
          | translate }}
        </div>
        <div class="col-xs-6">
          <select
            id="selectIdColumn"
            class="form-control"
            (change)="onSelectIdColumn()"
            [(ngModel)]="xmlReporting?.documentburster.report.datasource.csvoptions.idcolumn"
            (ngModelChange)="settingsChangedEventHandler($event)"
          >
            <option value="notused">
              {{
              'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.CODE-COLUMN-NOT-USED'
              | translate }}
            </option>
            <option value="firstcolumn">
              {{
              'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.CODE-COLUMN-FIRST-COLUMN'
              | translate }}
            </option>
            <option value="lastcolumn">
              {{
              'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.CODE-COLUMN-LAST-COLUMN'
              | translate }}
            </option>
            <option value="letmespecify">
              {{
              'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.CODE-COLUMN-LET-ME-SPECIFY'
              | translate }}
            </option>
          </select>
        </div>

        <div
          class="col-xs-3"
          *ngIf="xmlReporting?.documentburster.report.datasource.csvoptions.idcolumn=='letmespecify'"
        >
          <input
            id="idColumnIndex"
            class="form-control"
            [(ngModel)]="xmlReporting?.documentburster.report.datasource.csvoptions.idcolumnindex"
            (ngModelChange)="settingsChangedEventHandler($event)"
          />
        </div>
      </div>
      -->
    </div>
    <div
      *ngIf="!askForFeatureService.alreadyImplementedFeatures.includes(xmlReporting?.documentburster.report.datasource.type)"
    >
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
</ng-template> `;
