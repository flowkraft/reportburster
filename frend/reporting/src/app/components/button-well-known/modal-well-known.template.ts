export const modalWellKnownTemplate = `<p-dialog id="modalWellKnownEmailProviders" header="{{
  'COMPONENTS.BUTTON-WELL-KNOWN.WELL-KNOWN-PROVIDERS' | translate }}" [(visible)]="isModalWellKnownVisible"
  [baseZIndex]="1000" [modal]="true">

  <div style="max-height: 450px; width: 375px; overflow: auto; cursor: pointer">
    <table class="table table-condensed table-hover table-bordered">
      <tbody>
        <tr *ngFor="let provider of providers" (dblclick)="onModalOK()" (click)="onProviderClick(provider)"
          [ngClass]="{ 'info': provider.active }">
          <td id='{{provider.name}}'>{{provider.name}}
            <span *ngIf="provider.active">
              <br>{{provider.settings | json}}</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="checkbox">
    <label id='btnShowMoreProviders'>
      &nbsp;&nbsp;
      <input type="checkbox" [(ngModel)]="showMoreCheckBoxValue" (ngModelChange)='onShowMore()'>Show
      More
    </label>
  </div>


  <p-footer>

    <button id="btnOKConfirmation" class="btn btn-primary" type="button" (click)="onModalOK()"
      [disabled]="!getSelectedProvider()">{{
      'COMPONENTS.BUTTON-WELL-KNOWN.LOAD-SMTP-SETTINGS' | translate }}</button>

    <button id="btnClose" class="btn btn-flat btn-default" type="button" (click)="onModalClose()">{{
      'BUTTONS.CANCEL' | translate }}</button>

  </p-footer>

</p-dialog>
`;