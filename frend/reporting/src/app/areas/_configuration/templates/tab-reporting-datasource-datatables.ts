export const tabReportingDataSourceDataTablesTemplate = `<ng-template
  #tabReportingDataSourceDataTablesTemplate
>
  <dburst-connection-details
      #connectionDetailsModal
      [mode]="'viewMode'"
      [context]="'sqlQuery'"
  ></dburst-connection-details>

  <div class="well">
    <div class="row">
      <div class="col-xs-2">
         {{ 'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.TYPE' | translate }}
      </div>
        
      <div class="col-xs-5">
        <select
            id="dsTypes"
            class="form-control"
            [(ngModel)]="xmlReporting?.documentburster.report.datasource.type"
            (ngModelChange)="onDataSourceTypeChange($event)"
          >
            <option value="ds.sqlquery">
              {{ 'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.TYPE-SQL-QUERY' | translate }}
            </option>
            <option value="ds.scriptfile">
              {{ 'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.TYPE-SCRIPT' | translate }}
            </option>
            <option value="ds.xmlfile">
              {{ 'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.TYPE-XML' | translate }}
            </option>
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
          </select>
      </div>

      <!-- SQL Query Section -->
      <div class="col-xs-5">
          <select
                id="sqlDatabaseConnection"
                *ngIf="settingsService.getDatabaseConnectionFiles().length > 0 && (xmlReporting?.documentburster.report.datasource.type === 'ds.sqlquery' || xmlReporting?.documentburster.report.datasource.type === 'ds.scriptfile')"
                class="form-control"
                [(ngModel)]="xmlReporting.documentburster.report.datasource.sqloptions.conncode"
                (ngModelChange)="onDatabaseConnectionChanged($event)"
              >
                <option *ngFor="let connection of settingsService.getDatabaseConnectionFiles()" [value]="connection.connectionCode">
                  {{connection.connectionName}} 
                  <span *ngIf="connection.defaultConnection">(default)</span>
                </option>
              </select>
          <!-- Help text below editor -->
          <small class="text-muted" style="display: block; margin-top: 5px;" *ngIf="settingsService.getDatabaseConnectionFiles().length > 0 && (xmlReporting?.documentburster.report.datasource.type === 'ds.sqlquery' || xmlReporting?.documentburster.report.datasource.type === 'ds.scriptfile')"
                >
            Select Database
          </small>
           <!-- Message when no database connections exist -->
          <div id="noDbConnectionsMessageSql" *ngIf="(xmlReporting?.documentburster.report.datasource.type === 'ds.sqlquery' || 
                xmlReporting?.documentburster.report.datasource.type === 'ds.scriptfile') && settingsService.getDatabaseConnectionFiles().length === 0" style="padding-top: 6px;">
            <i class="fa fa-info-circle"></i>&nbsp;No database connections defined&nbsp;
            <a id="createDbConnectionLinkSql" [routerLink]="['/configuration-connections']" skipLocationChange="true" class="btn btn-primary btn-sm">
              <i class="fa fa-database"></i>&nbsp;Create Database Connection
            </a>
          </div>
      
        </div>
        
    </div>
    
    <p></p>

    <!-- START: New Report Parameters Section for SQL Query/Script -->
    <div class="row" *ngIf="xmlReporting?.documentburster.report.datasource.type === 'ds.sqlquery' || 
                xmlReporting?.documentburster.report.datasource.type === 'ds.scriptfile'">
      <div class="col-xs-12" *ngIf="xmlReporting?.documentburster.report.datasource.type === 'ds.sqlquery'">
          <tabset id="tabsetSqlQuery">
            <tab id="tabSqlCode" heading="{{ 'AREAS.CONFIGURATION.TAB-EMAIL-CONNECTION-SETTINGS.SQL-QUERY-PLACEHOLDER' | translate }}">
                  
              <!-- SQL Query Editor with Label Above -->
              
              <div class="row">
                <div class="col-xs-12">
                  
                  <!-- SQL Editor -->
                  <ngx-codejar
                    id="sqlQueryEditor"
                    [(code)]="xmlReporting.documentburster.report.datasource.sqloptions.query"
                    (update)="onSqlQueryChanged($event)"
                    [highlightMethod]="highlightSqlCode"
                    [highlighter]="'prism'"
                    [showLineNumbers]="true"
                    style="height: 250px; border: 1px solid #ccc; border-radius: 4px; overflow-y: auto; display: block; font-family: 'Courier New', monospace; margin-top: 10px;"
                  ></ngx-codejar>
                </div>
              </div>
  
              <div class="row" style="margin-top: 10px;">
                <div class="col-xs-6">
                  <button id="btnHelpWithSqlQueryAI" type="button" title="Write SQL code to fetch report data from the database" class="btn btn-default btn-block" (click)="showDbConnectionModal()" 
                  [disabled]="settingsService.getDatabaseConnectionFiles().length === 0 || !xmlReporting.documentburster.report.datasource.sqloptions.conncode">
                    <strong>Hey AI, Help Me With This SQL Query ...</strong>
                  </button>
                </div>
                <div class="col-xs-3">
                  <button
                    id="btnTestSqlQuery"
                    type="button"
                    class="btn btn-primary btn-block"
                    (click)="doTestSqlQuery()"
                  >
                    <i class="fa fa-paper-plane"></i>&nbsp;&nbsp;Test SQL Query
                  </button>
                </div>
                <div class="col-xs-3">
                  <dburst-button-clear-logs></dburst-button-clear-logs>
                </div>
              </div>

            </tab>
          
            <tab id="tabSqlReportParameters" heading="Report Parameters">
              <ngx-codejar
                id="paramsSpecEditor"
                [(code)]="activeParamsSpecScriptGroovy"
                (update)="onParametersSpecChanged($event)"
                [highlightMethod]="highlightGroovyCode"
                [highlighter]="'prism'"
                [showLineNumbers]="true"
                style="height: 250px; border: 1px solid #ccc; border-radius: 4px; overflow-y: auto; display: block; font-family: 'Courier New', monospace; margin-top: 10px;"
              ></ngx-codejar>
            </tab>
            <tab id="tabSqlExampleReportParameters" heading="Example (Report Parameters)">
              <ngx-codejar
                id="paramsSpecExampleEditor"
                [code]="exampleParamsSpecScript"
                [highlightMethod]="highlightGroovyCode"
                [highlighter]="'prism'"
                [showLineNumbers]="true"
                [readonly]="true"
                style="height: 250px; border: 1px solid #ccc; border-radius: 4px; overflow-y: auto; display: block; font-family: 'Courier New', monospace; background-color: #f8f8f8; margin-top: 10px;"
              ></ngx-codejar>
              <button id="btnCopyToClipboardParametersSpecExample" type="button" class="btn btn-default btn-block" style="margin-top: 10px;" (click)="copyToClipboardParametersSpecExample()">
                Copy Example Params Script To Clipboard
              </button>
            </tab>
            </tabset>
          </div>
          
          <div class="col-xs-12" *ngIf="xmlReporting?.documentburster.report.datasource.type === 'ds.scriptfile'">
          
            <tabset id="tabsetScriptFile">
            <tab id="tabScriptCode" heading="{{ 'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.SCRIPT-CODE' | translate }}">
            
              <!-- Script Editor -->
              <div class="row">
                <div class="col-xs-12">
                  
                  <!-- Groovy Script Editor -->
                  <ngx-codejar
                    id="groovyScriptEditor"
                    [(code)]="activeDatasourceScriptGroovy"
                    (update)="onScriptContentChanged($event)"
                    [highlightMethod]="highlightGroovyCode"
                    [highlighter]="'prism'"
                    [showLineNumbers]="true"
                    style="height: 250px; border: 1px solid #ccc; border-radius: 4px; overflow-y: auto; display: block; font-family: 'Courier New', monospace; margin-top: 10px;"
                  ></ngx-codejar>
                  </div>
                </div>
                  
                <div class="row" style="margin-top: 10px;">
                  
                  <div class="col-xs-6">
                    <button id="btnHelpWithScriptAI" type="button" class="btn btn-default btn-block" (click)="showDbConnectionModal()">
                      <strong>Hey AI, Help Me With This Script ...</strong>
                    </button>
                  </div>
                  <div class="col-xs-3">
                    <button
                      id="btnTestScript"
                      type="button"
                      class="btn btn-primary btn-block"
                      (click)="doRunTestScript()"
                    >
                      <i class="fa fa-paper-plane"></i>&nbsp;&nbsp;Run / Test Script
                    </button>
                  </div>
                  <div class="col-xs-3">
                    <dburst-button-clear-logs></dburst-button-clear-logs>
                  </div>
                
                </div>
            
            </tab>
            <tab id="tabScriptReportParameters" heading="Report Parameters">
              <ngx-codejar
                id="paramsSpecEditor"
                [(code)]="activeParamsSpecScriptGroovy"
                (update)="onParametersSpecChanged($event)"
                [highlightMethod]="highlightGroovyCode"
                [highlighter]="'prism'"
                [showLineNumbers]="true"
                style="height: 250px; border: 1px solid #ccc; border-radius: 4px; overflow-y: auto; display: block; font-family: 'Courier New', monospace; margin-top: 10px;"
              ></ngx-codejar>
            </tab>
            <tab id="tabScriptExampleReportParameters" heading="Example (Report Parameters)">
              <ngx-codejar
                id="paramsSpecExampleEditor"
                [code]="exampleParamsSpecScript"
                [highlightMethod]="highlightGroovyCode"
                [highlighter]="'prism'"
                [showLineNumbers]="true"
                [readonly]="true"
                style="height: 250px; border: 1px solid #ccc; border-radius: 4px; overflow-y: auto; display: block; font-family: 'Courier New', monospace; background-color: #f8f8f8; margin-top: 10px;"
              ></ngx-codejar>
              <button id="btnCopyToClipboardParametersSpecExample" type="button" class="btn btn-default btn-block" style="margin-top: 10px;" (click)="copyToClipboardParametersSpecExample()">
                Copy Example Params Script To Clipboard
              </button>
            </tab>
            </tabset>
           
          </div>
    </div>
    
     
    <div *ngIf="xmlReporting?.documentburster.report.datasource.type === 'ds.sqlquery'">
     
      <br />
      <div class="row">
        <div class="col-xs-12">
          <label id="lblShowMoreSqlOptions" for="btnShowMoreSqlOptions" class="checkboxlabel" style="cursor: pointer;">
            <span><strong>
              <u *ngIf="!xmlReporting?.documentburster.report.datasource.showmoreoptions">Show More SQL Options</u>
              <u *ngIf="xmlReporting?.documentburster.report.datasource.showmoreoptions"><em>Show Less SQL Options</em></u>
            </strong></span>
          </label>
          <input
            type="checkbox"
            id="btnShowMoreSqlOptions"
            style="visibility: hidden;"
            [(ngModel)]="xmlReporting?.documentburster.report.datasource.showmoreoptions"
            (ngModelChange)="settingsChangedEventHandler($event)"
          />
        </div>
      </div>

      <br />

      <div *ngIf="xmlReporting?.documentburster.report.datasource.showmoreoptions">
        <div class="row">
          <div class="col-xs-2">
            {{ 'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.CODE-COLUMN' | translate }}
          </div>
          <div class="col-xs-5">
            <select
              id="sqlIdColumn"
              class="form-control"
              [(ngModel)]="sqlIdColumnSelection"
              (ngModelChange)="onSqlIdColumnSelectionChange($event)"
            >
              <option value="notused">{{ 'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.CODE-COLUMN-NOT-USED' | translate }}</option>
              <option value="firstcolumn">{{ 'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.CODE-COLUMN-FIRST-COLUMN' | translate }}</option>
              <option value="lastcolumn">{{ 'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.CODE-COLUMN-LAST-COLUMN' | translate }}</option>
              <option value="custom">{{ 'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.CODE-COLUMN-LET-ME-SPECIFY' | translate }}</option>
            </select>
          </div>
          <div class="col-xs-4" *ngIf="sqlIdColumnSelection === 'custom'">
            <input
              type="number"
              id="sqlCustomIdColumnIndex"
              class="form-control"
              min="0"
              [(ngModel)]="xmlReporting.documentburster.report.datasource.sqloptions.idcolumn"
              (ngModelChange)="settingsChangedEventHandler($event)"
              placeholder="Enter column index (0-based)"
            />
          </div>
        </div>
        
      </div>
    </div>
    
    <!-- Script File Section -->
    <div *ngIf="xmlReporting?.documentburster.report.datasource.type === 'ds.scriptfile'">
      <br />
      <div class="row">
        <div class="col-xs-12">
          <label id="lblShowMoreScriptOptions" for="btnShowMoreScriptOptions" class="checkboxlabel" style="cursor: pointer;">
            <span><strong>
              <u *ngIf="!xmlReporting?.documentburster.report.datasource.showmoreoptions">Show More Script Options</u>
              <u *ngIf="xmlReporting?.documentburster.report.datasource.showmoreoptions"><em>Show Less Script Options</em></u>
            </strong></span>
          </label>
          <input
            type="checkbox"
            id="btnShowMoreScriptOptions"
            style="visibility: hidden;"
            [(ngModel)]="xmlReporting?.documentburster.report.datasource.showmoreoptions"
            (ngModelChange)="settingsChangedEventHandler($event)"
          />
        </div>
      </div>

      <br/>

      <div *ngIf="xmlReporting?.documentburster.report.datasource.showmoreoptions">
        <div class="row">
          <div class="col-xs-2">
            {{ 'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.CODE-COLUMN' | translate }}
          </div>
          <div class="col-xs-5">
            <select
              id="scriptIdColumn"
              class="form-control"
              [(ngModel)]="scriptIdColumnSelection"
              (ngModelChange)="onScriptIdColumnSelectionChange($event)"
            >
              <option value="notused">{{ 'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.CODE-COLUMN-NOT-USED' | translate }}</option>
              <option value="firstcolumn">{{ 'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.CODE-COLUMN-FIRST-COLUMN' | translate }}</option>
              <option value="lastcolumn">{{ 'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.CODE-COLUMN-LAST-COLUMN' | translate }}</option>
              <option value="custom">{{ 'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.CODE-COLUMN-LET-ME-SPECIFY' | translate }}</option>
            </select>
          </div>
          <div class="col-xs-4" *ngIf="scriptIdColumnSelection === 'custom'">
            <input
              type="number"
              id="scriptCustomIdColumnIndex"
              class="form-control"
              min="0"
              [(ngModel)]="xmlReporting.documentburster.report.datasource.scriptoptions.idcolumn"
              (ngModelChange)="settingsChangedEventHandler($event)"
              placeholder="Enter column index (0-based)"
            />
          </div>
        </div>
        <p></p>
        <div class="row">
          <div class="col-xs-2">
            {{ 'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.FILE-EXPLORER' | translate }}
          </div>
          <div class="col-xs-5">
            <select
              id="scriptFileExplorer"
              class="form-control"
              [(ngModel)]="scriptFileExplorerSelection"
              (ngModelChange)="onScriptFileExplorerSelectionChange($event)"
            >
              <option value="notused">{{ 'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.FILE-EXPLORER-NOT-USED' | translate }}</option>
              <option value="globpattern">{{ 'AREAS.CONFIGURATION.TAB-REPORT-DATASOURCE-DATATABLES.FILE-EXPLORER-GLOB-PATTERN' | translate }}</option>
            </select>
          </div>
          <div class="col-xs-4" *ngIf="scriptFileExplorerSelection != 'notused'">
            <input
              type="text"
              id="scriptFileExplorerAllowedFiles"
              class="form-control"
              min="0"
              [(ngModel)]="xmlReporting.documentburster.report.datasource.scriptoptions.selectfileexplorer"
              (ngModelChange)="settingsChangedEventHandler($event)"
              placeholder="Enter allowed file types (eg. *.xml, *.csv, *.txt)"
            />
          </div>
        </div>
        

      </div>

    </div>
 
    <!-- XML Section -->
    <div *ngIf="xmlReporting?.documentburster.report.datasource.type === 'ds.xmlfile'">
      <div class="row">
        <div class="col-xs-2">
          Repeating Node XPath
        </div>
        <div class="col-xs-9">
          <input
            id="xmlRepeatingNodeXPath"
            class="form-control"
            [(ngModel)]="xmlReporting?.documentburster.report.datasource.xmloptions.repeatingnodexpath"
            (ngModelChange)="settingsChangedEventHandler($event)"
            required
            placeholder="e.g. /root/records/record"
          />
        </div>
      </div>

      <br />

      <div class="row">
        <div class="col-xs-12">
          <label id="lblShowMoreXmlOptions" for="btnShowMoreXmlOptions" class="checkboxlabel" style="cursor: pointer;">
            <span><strong>
              <u *ngIf="!xmlReporting?.documentburster.report.datasource.showmoreoptions">Show More XML Options</u>
              <u *ngIf="xmlReporting?.documentburster.report.datasource.showmoreoptions"><em>Show Less XML Options</em></u>
            </strong></span>
          </label>
          <input
            type="checkbox"
            id="btnShowMoreXmlOptions"
            style="visibility: hidden;"
            [(ngModel)]="xmlReporting?.documentburster.report.datasource.showmoreoptions"
            (ngModelChange)="settingsChangedEventHandler($event)"
          />
        </div>
      </div>

      <br />

      <div class="row" *ngIf="xmlReporting?.documentburster.report.datasource.showmoreoptions">
        <div class="col-xs-2">
          ID Column
        </div>
        <div class="col-xs-9">
          <div class="row">
            <div class="col-xs-6">
              <select
                id="xmlIdColumnSelect"
                class="form-control"
                [(ngModel)]="xmlIdColumnSelection"
                (ngModelChange)="onXmlIdColumnSelectionChange($event)"
              >
                <option value="notused">Not Used</option>
                <option value="custom">Custom XPath Expression...</option>
              </select>
            </div>
            <div class="col-xs-6" *ngIf="xmlIdColumnSelection === 'custom'">
              <input
                id="xmlIdColumnCustom"
                class="form-control"
                [(ngModel)]="xmlReporting.documentburster.report.datasource.xmloptions.idcolumn"
                (ngModelChange)="settingsChangedEventHandler($event)"
                placeholder=""
              />
              <small class="text-muted">Example (using attribute): <code>@id</code></small><br>
              <small class="text-muted">Example (using node): <code>id</code></small>
            </div>
          </div>
        </div>
      </div>

      <p></p>

      <div class="row" *ngIf="xmlReporting?.documentburster.report.datasource.showmoreoptions">
        <div class="col-xs-2">
          Namespace Mappings
        </div>
        <div class="col-xs-9">
          <textarea
            id="xmlNamespaceMappings"
            class="form-control"
            rows="3"
            [(ngModel)]="xmlReporting?.documentburster.report.datasource.xmloptions.namespaceMappings"
            (ngModelChange)="settingsChangedEventHandler($event)"
            placeholder="e.g. ns=http://example.com/ns"
          ></textarea>
          <small class="text-muted">Format: prefix=uri (one per line for multiple)</small>
        </div>
      </div>

      <p></p>

      <div class="row" *ngIf="xmlReporting?.documentburster.report.datasource.showmoreoptions">
        <div class="col-xs-2">
          Trim Whitespaces
        </div>
        <div class="col-xs-9">
          <input
            type="checkbox"
            id="xmlIgnoreLeadingWhitespace"
            [(ngModel)]="xmlReporting?.documentburster.report.datasource.xmloptions.ignoreleadingwhitespace"
            (ngModelChange)="settingsChangedEventHandler($event)"
          />
        </div>
      </div>
    </div>
    
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
              <u *ngIf="!xmlReporting?.documentburster.report.datasource.showmoreoptions">Show More CSV Options</u>
              <u *ngIf="xmlReporting?.documentburster.report.datasource.showmoreoptions"><em>Show Less CSV Options</em></u>
            </strong></span>
          </label>
          <input
            type="checkbox"
            id="btnShowMoreCsvOptions"
            style="visibility: hidden;"
            [(ngModel)]="xmlReporting?.documentburster.report.datasource.showmoreoptions"
            (ngModelChange)="settingsChangedEventHandler($event)"
          />
        </div>
      </div>

      <br />

      <div class="row" *ngIf="xmlReporting?.documentburster.report.datasource.showmoreoptions">
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
      
      <div class="row" *ngIf="xmlReporting?.documentburster.report.datasource.showmoreoptions">
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

      <div class="row" *ngIf="xmlReporting?.documentburster.report.datasource.showmoreoptions">
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
      <div class="row" *ngIf="xmlReporting?.documentburster.report.datasource.showmoreoptions">
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
      <div class="row" *ngIf="xmlReporting?.documentburster.report.datasource.showmoreoptions">
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
      <div class="row" *ngIf="xmlReporting?.documentburster.report.datasource.showmoreoptions">
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
              <u *ngIf="!xmlReporting?.documentburster.report.datasource.showmoreoptions">Show More Fixed Width Options</u>
              <u *ngIf="xmlReporting?.documentburster.report.datasource.showmoreoptions"><em>Show Less Fixed Width Options</em></u>
            </strong></span>
          </label>
          <input
            type="checkbox"
            id="btnShowMoreFixedWidthOptions"
            style="visibility: hidden;"
            [(ngModel)]="xmlReporting?.documentburster.report.datasource.showmoreoptions"
            (ngModelChange)="settingsChangedEventHandler($event)"
          />
        </div>
      </div>

      <br />

      <!-- Advanced Fixed Width Options -->
      <div class="row" *ngIf="xmlReporting?.documentburster.report.datasource.showmoreoptions">
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

      <div *ngIf="xmlReporting?.documentburster.report.datasource.showmoreoptions">
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
              <u *ngIf="!xmlReporting?.documentburster.report.datasource.showmoreoptions">Show More Excel Options</u>
              <u *ngIf="xmlReporting?.documentburster.report.datasource.showmoreoptions"><em>Show Less Excel Options</em></u>
            </strong></span>
          </label>
          <input
            type="checkbox"
            id="btnShowMoreExcelOptions"
            style="visibility: hidden;"
            [(ngModel)]="xmlReporting?.documentburster.report.datasource.showmoreoptions"
            (ngModelChange)="settingsChangedEventHandler($event)"
          />
        </div>
      </div>

      <br />

      <div *ngIf="xmlReporting?.documentburster.report.datasource.showmoreoptions">
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

    <p></p>
      
    <!-- Add this after all datasource type sections but before the Request Feature section -->
    <div *ngIf="xmlReporting?.documentburster.report.datasource.type === 'ds.sqlquery' || 
                xmlReporting?.documentburster.report.datasource.type === 'ds.scriptfile' ||
                xmlReporting?.documentburster.report.datasource.type === 'ds.xmlfile' ||
                xmlReporting?.documentburster.report.datasource.type === 'ds.csvfile' ||
                xmlReporting?.documentburster.report.datasource.type === 'ds.tsvfile' ||
                xmlReporting?.documentburster.report.datasource.type === 'ds.fixedwidthfile' ||
                xmlReporting?.documentburster.report.datasource.type === 'ds.excelfile'">
      
      <div class="row">
        <div class="col-xs-12">
          <label id="lblShowAdditionalTransformation" for="btnShowAdditionalTransformation" class="checkboxlabel" style="cursor: pointer;">
            <span><strong>
              <u *ngIf="!xmlReporting?.documentburster.report.datasource.showadditionaltransformation">Show Additional Data Transformation</u>
              <u *ngIf="xmlReporting?.documentburster.report.datasource.showadditionaltransformation"><em>Hide Additional Data Transformation</em></u>
            </strong></span>
          </label>
          <input
            type="checkbox"
            id="btnShowAdditionalTransformation"
            style="visibility: hidden;"
            [(ngModel)]="xmlReporting?.documentburster.report.datasource.showadditionaltransformation"
            (ngModelChange)="settingsChangedEventHandler($event)"
          />
        </div>
      </div>

      <br />
      
      <div *ngIf="xmlReporting?.documentburster.report.datasource.showadditionaltransformation">
        
        <div class="row">
          <div class="col-xs-2">
            <!-- Label above the editor -->
            <label for="transformationCodeEditor" class="control-label" style="margin-bottom: 5px; display: block;">
              Groovy Script
            </label>
          </div>
          <div class="col-xs-6">
            <button id="btnHelpWithTransformationAI" type="button" class="btn btn-default" (click)="showDbConnectionModal()">
             <strong>Hey AI, Help Me With This Groovy Script ...</strong>
            </button>
          </div>
        </div>  
      
        <div class="row">
          <div class="col-xs-12">
            <!-- Transformation Code Editor -->
            <ngx-codejar
              id="transformationCodeEditor"
              [(code)]="activeTransformScriptGroovy"
              (update)="onTransformationCodeChanged($event)"
              [highlightMethod]="highlightGroovyCode"
              [highlighter]="'prism'"
              [showLineNumbers]="true"
              style="height: 200px; border: 1px solid #ccc; border-radius: 4px; overflow-y: auto; display: block; font-family: 'Courier New', monospace; margin-top: 10px;"
            ></ngx-codejar>
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
</ng-template>
<p-dialog 
    header="Enter Report Parameters"
    [(visible)]="isModalParametersVisible"
    [modal]="true"
    [style]="{width: '50vw'}">
    <dburst-report-parameters-form
        [parameters]="reportParameters"
        (validChange)="onReportParamsValidChange($event)"
        (valueChange)="onReportParamsValuesChange($event)">
    </dburst-report-parameters-form>
    <p-footer>
        <button pButton 
            type="button" 
            label="Cancel" 
            id="btnTestQueryCancel"
            (click)="isModalParametersVisible = false"
            class="p-button-secondary"></button>
        <button pButton 
            type="button" 
            label="Test Query" 
            id="btnTestQueryRun"
            (click)="onRunQueryWithParams()"
            [disabled]="!reportParamsValid"></button>
    </p-footer>
</p-dialog>
`;
