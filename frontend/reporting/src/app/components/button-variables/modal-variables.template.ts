export const modalVariablesTemplate = `<p-dialog id="modalSelectVariable" header="{{
  'COMPONENTS.BUTTON-VARIABLES.SELECT-VARIABLE' | translate }}" [(visible)]="isModalVariablesVisible" class="modal-dialog-center"
  [baseZIndex]="1000" [modal]="true">

  <div style="max-height: 549px; overflow: auto; cursor: pointer">

    <table class="table table-condensed table-hover table-bordered">
      <thead>
        <tr>
          <th>{{
              'COMPONENTS.BUTTON-VARIABLES.NAME' | translate }}</th>
          <th>{{
              'COMPONENTS.BUTTON-VARIABLES.TYPE' | translate }}</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let variable of variables" (dblclick)="onModalOK()" (click)="onVariableClick(variable)"
          [ngClass]="{ 'info': variable.active }">
          <td id='{{variable.name}}'>{{variable.name}}</td>
          <td>{{variable.type}}</td>
        </tr>
      </tbody>
    </table>
  </div>
  <div class="checkbox">
    <label id='btnShowMoreVariables'>
      &nbsp;&nbsp;
      <input type="checkbox" [(ngModel)]="showMoreCheckBoxValue" (ngModelChange)='onShowMore()'>Show
      More
    </label>
  </div>

  <p-footer>
    <button id="btnOKConfirmation" class="btn btn-primary dburst-button-question-confirm" type="button" (click)="onModalOK()"
      [disabled]="!getSelectedVariable()">{{
      'BUTTONS.OK' | translate }}</button>

    <button id="btnClose" class="btn" type="button" (click)="onModalClose()">{{
      'BUTTONS.CANCEL' | translate }}</button>

  </p-footer>

</p-dialog>
`;
