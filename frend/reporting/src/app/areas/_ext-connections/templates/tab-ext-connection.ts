export const tabExternalConnectionsTemplate = `<ng-template #tabExternalConnectionsTemplate>
  <div class="well">
    <div class="row">
      <div
        class="col-xs-10"
        style="cursor: pointer; height: 500px; overflow: auto"
      >
        <table id="extConnectionsTable"
          class="table table-responsive table-hover table-bordered"
          cellspacing="0"
        >
          <thead>
            <tr>
              <th>
                {{ 'AREAS.EXTERNAL-CONNECTIONS.TAB-EXT-CONNECTIONS.NAME' |
                translate }}
              </th>
              <th>
                {{ 'AREAS.EXTERNAL-CONNECTIONS.TAB-EXT-CONNECTIONS.TYPE'
                | translate }}
              </th>
              <th>
                {{ 'AREAS.EXTERNAL-CONNECTIONS.TAB-EXT-CONNECTIONS.USED-BY'
                | translate }}
              </th>
              <th>
                Actions&nbsp;&nbsp;
              </th>
        
              </tr>
          </thead>
          <tbody>
          <tr
          id="{{connectionFile.fileName}}"
          *ngFor="let connectionFile of settingsService.connectionFiles"
          (click)="onItemClick(connectionFile)"
          [ngClass]="{ 'info': connectionFile.activeClicked}"
        >
          <td>
            {{connectionFile.connectionName}}
          </td>
          <td>
            {{connectionFile.connectionType}}
          </td>
          
        <td>
        {{connectionFile.usedBy}}
         </td>
         
          <td>
 
          <div class="btn-group dropup"> 
              
            <button type="button" id="btnDefault_{{connectionFile.fileName}}" *ngIf="connectionFile.defaultConnection" class="btn btn-xs btn-primary dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">&nbsp;&nbsp;Default&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="caret"></span></button>
            <button type="button" id="btnActions_{{connectionFile.fileName}}" *ngIf="!connectionFile.defaultConnection" class="btn btn-xs btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">&nbsp;&nbsp;Actions&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="caret"></span></button>
              
            <ul class="dropdown-menu dropdown-menu-right">
                  <li id="btnSendTestEmail_{{connectionFile.fileName}}" (click)="doTestSMTPConnection()">Send Test Email</li>
                  <li id="btnSeparator_{{connectionFile.fileName}}" role="separator" class="divider" *ngIf="!connectionFile.defaultConnection"></li>
                  <li id="btnToggleDefault_{{connectionFile.fileName}}" *ngIf="!connectionFile.defaultConnection" (click)="toggleDefault()">Make <strong>Default</strong></li>
            </ul>
                
          </div>
              
        
        </td>
        
          </tr>

          
          </tbody>
        </table>
      </div>

      <div class="col-xs-2">
        <button
          id="btnNew"
          type="button"
          class="btn btn-flat btn-default col-xs-12"
          (click)="showCrudModal('create')"
          style="margin-bottom: 5px"
        >
          <i class="fa fa-plus"></i> {{ 'BUTTONS.NEW' | translate }}
        </button>
        <p></p>
        <button
          id="btnEdit"
          type="button"
          class="btn btn-flat btn-default col-xs-12"
          (click)="showCrudModal('update')"
          [ngClass]="{ 'disabled': !getSelectedConnection()}"
          style="margin-bottom: 5px"

        >
          <i class="fa fa-pencil-square-o"></i> {{ 'BUTTONS.EDIT' | translate }}
        </button>
        
        <button
          id="btnDuplicate"
          type="button"
          class="btn btn-flat btn-default col-xs-12"
          (click)="showCrudModal('create', true)"
          [ngClass]="{ 'disabled': !getSelectedConnection()}"
          style="margin-bottom: 5px"

        >
          <i class="fa fa-clone"></i> {{ 'BUTTONS.DUPLICATE' | translate }}
        </button>
        
        <button
          id="btnDelete"
          type="button"
          class="btn btn-flat btn-default col-xs-12"
          (click)="onDeleteSelectedConnection()"
          [ngClass]="{ 'disabled': !getSelectedConnection() || getSelectedConnection().defaultConnection || (getSelectedConnection().usedBy && getSelectedConnection().usedBy !== '--not used--')}"
          style="margin-bottom: 100px"
          >
          <i class="fa fa-minus"></i> {{ 'BUTTONS.DELETE' | translate }}
        </button>

        <p>
        
        <button
          id="btnGoBack"
          type="button"
          class="btn btn-flat btn-primary col-xs-12"
          (click)="goBack()"
          *ngIf="goBackLocation"
        >
        {{ 'AREAS.EXTERNAL-CONNECTIONS.TAB-EXT-CONNECTIONS.GO-BACK' |
          translate }} <br> 
          {{this.configurationFileName}} <i class="fa fa-long-arrow-right"></i><br>
        {{ 'AREAS.CONFIGURATION.LEFT-MENU.EMAIL' | translate }} <i class="fa fa-long-arrow-right"></i><br>
          {{ 'AREAS.EXTERNAL-CONNECTIONS.TAB-EXT-CONNECTIONS.CONNECTION' |
          translate }}<br>{{ 'AREAS.EXTERNAL-CONNECTIONS.TAB-EXT-CONNECTIONS.SETTINGS' |
          translate }}<br> 
        </button>

        <p>
   
        <dburst-button-clear-logs></dburst-button-clear-logs>
        
      </div>
    </div>
  </div>
</ng-template>
`;
