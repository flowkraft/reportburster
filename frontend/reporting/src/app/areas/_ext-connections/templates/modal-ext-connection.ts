export const modalExtConnectionsTemplate = `<p-dialog
  id="modalExtConnection"
  [header]="modalConnectionInfo.modalTitle"
  [(visible)]="isModalExtConnectionVisible"
  [modal]="true"
  width="700"
  [style]="{ top: '3vw', left: '4vw' }"
  [autoZIndex]="false"
>
  <div *ngIf="modalConnectionInfo.connectionType =='email-connection'" style="margin: 5px;">
    <div class="row">
      <div class="col-xs-2">
        {{ 'AREAS.CONFIGURATION.TAB-EMAIL-CONNECTION-SETTINGS.CONNECTION-NAME' |
        translate }}
      </div>
      <div class="col-xs-10">
        <input
          id="connectionName"
          [(ngModel)]="modalConnectionInfo.email.documentburster.connection.name"
          (ngModelChange)="updateModelAndForm()"
          class="form-control"
          autofocus
          required
        />
      </div>
    </div>
    <p></p>

    <div class="row">
      <div class="col-xs-2">
        {{ 'AREAS.CONFIGURATION.TAB-EMAIL-CONNECTION-SETTINGS.FROM-NAME' |
        translate }}
      </div>
      <div class="col-xs-7">
        <input
          id="fromName"
          [(ngModel)]="modalConnectionInfo.email.documentburster.connection.emailserver.name"
          class="form-control"
        />
      </div>

      <div class="col-xs-3">
        <dburst-button-variables
          id="btnFromNameVariables"
          (sendSelectedVariable)="updateFormControlWithSelectedVariable('fromName',$event)"
        >
        </dburst-button-variables>
      </div>
    </div>
    <p></p>
    <div class="row">
      <div class="col-xs-2">
        {{ 'AREAS.CONFIGURATION.TAB-EMAIL-CONNECTION-SETTINGS.FROM-ADDRESS' |
        translate }}
      </div>
      <div class="col-xs-7">
        <input
          id="fromEmailAddress"
          [(ngModel)]="modalConnectionInfo.email.documentburster.connection.emailserver.fromaddress"
          class="form-control"
        />
      </div>

      <div class="col-xs-3">
        <dburst-button-variables
          id="btnFromEmailAddressVariables"
          (sendSelectedVariable)="updateFormControlWithSelectedVariable('fromEmailAddress',$event)"
        >
        </dburst-button-variables>
      </div>
    </div>
    <p></p>
    <div class="row">
      <div class="col-xs-2">
        {{ 'AREAS.CONFIGURATION.TAB-EMAIL-CONNECTION-SETTINGS.HOST' | translate
        }}
      </div>
      <div class="col-xs-7">
        <input
          id="emailServerHost"
          [(ngModel)]="modalConnectionInfo.email.documentburster.connection.emailserver.host"
          class="form-control"
        />
      </div>

      <div class="col-xs-3">
        <dburst-button-variables
          id="btnEmailServerHostVariables"
          (sendSelectedVariable)="updateFormControlWithSelectedVariable('emailServerHost',$event)"
        >
        </dburst-button-variables>
      </div>
    </div>
    <p></p>
    <div class="row">
      <div class="col-xs-2">
        {{ 'AREAS.CONFIGURATION.TAB-EMAIL-CONNECTION-SETTINGS.USER-NAME' |
        translate }}
      </div>
      <div class="col-xs-7">
        <input
          id="userName"
          [(ngModel)]="modalConnectionInfo.email.documentburster.connection.emailserver.userid"
          class="form-control"
        />
      </div>

      <div class="col-xs-3">
        <dburst-button-variables
          id="btnUserNameVariables"
          (sendSelectedVariable)="updateFormControlWithSelectedVariable('userName',$event)"
        >
        </dburst-button-variables>
      </div>
    </div>
    <p></p>
    <div class="row">
      <div class="col-xs-2">
        {{ 'AREAS.CONFIGURATION.TAB-EMAIL-CONNECTION-SETTINGS.PASSWORD' |
        translate }}
      </div>
      <div class="col-xs-7">
        <input
          id="smtpPassword"
          [(ngModel)]="modalConnectionInfo.email.documentburster.connection.emailserver.userpassword"
          type="password"
          class="form-control"
        />
      </div>

      <div class="col-xs-3">
        <dburst-button-variables
          id="btnSmtpPasswordVariables"
          (sendSelectedVariable)="updateFormControlWithSelectedVariable('smtpPassword',$event)"
        >
        </dburst-button-variables>
      </div>
    </div>
    <p></p>
    <div class="row">
      <div class="col-xs-2">
        {{ 'AREAS.CONFIGURATION.TAB-EMAIL-CONNECTION-SETTINGS.PORT' | translate
        }}
      </div>
      <div class="col-xs-7">
        <input
          id="smtpPort"
          [(ngModel)]="modalConnectionInfo.email.documentburster.connection.emailserver.port"
          class="form-control"
        />
      </div>

      <div class="col-xs-3">
        <dburst-button-variables
          id="btnSmtpPortVariables"
          (sendSelectedVariable)="updateFormControlWithSelectedVariable('smtpPort',$event)"
        >
        </dburst-button-variables>
      </div>
    </div>
    <div class="row">
      <div class="col-xs-2"></div>

      <div class="col-xs-3">
        <input
          type="checkbox"
          id="btnSSL"
          [(ngModel)]="modalConnectionInfo.email.documentburster.connection.emailserver.usessl"
        />
        <label for="btnSSL" class="checkboxlabel"
          >&nbsp;{{
          'AREAS.CONFIGURATION.TAB-EMAIL-CONNECTION-SETTINGS.SSL-ENABLED' |
          translate }}</label
        >
      </div>

      <div class="col-xs-3">
        <input
          type="checkbox"
          id="btnTLS"
          [(ngModel)]="modalConnectionInfo.email.documentburster.connection.emailserver.usetls"
        />
        <label for="btnTLS" class="checkboxlabel"
          >&nbsp;{{
          'AREAS.CONFIGURATION.TAB-EMAIL-CONNECTION-SETTINGS.TLS-ENABLED' |
          translate }}</label
        >
      </div>
    </div>
    <div class="row">
      <div class="col-xs-2">
        {{ 'AREAS.CONFIGURATION.TAB-EMAIL-CONNECTION-SETTINGS.TEST-CONNECTION' |
        translate }}
      </div>

      <div class="col-xs-7">
        <button
          id="btnSendTestEmail"
          type="button"
          class="btn btn-primary btn-block"
          (click)="doTestSMTPConnection()"
        >
          <i class="fa fa-paper-plane"></i>&nbsp;&nbsp;{{
          'AREAS.CONFIGURATION.TAB-EMAIL-CONNECTION-SETTINGS.SEND-TEST-EMAIL' |
          translate }}
        </button>
      </div>

      <div class="col-xs-3">
        <dburst-button-clear-logs></dburst-button-clear-logs>
      </div>
    </div>
    <p></p>
    <div class="row ">
      <div class="col-xs-2 ">
        <a href="https://products.office.com/en-us/exchange " target="_blank ">
          <i
            class="ms-Icon ms-Icon--ExchangeLogo"
            style="font-size:30px;color:orange "
          ></i>
          <br />Microsoft Exchange
        </a>
      </div>

      <div class="col-xs-7 ">
        <span
          [innerHTML]="
    'AREAS.CONFIGURATION.TAB-EMAIL-CONNECTION-SETTINGS.INNER-HTML.DB-ALL-CLOUD-PROVIDERS' | translate"
        ></span>
        <br />
        <div class="col-xs-4 ">
          <a href="https://www.office.com" target="_blank ">
            <i
              class="ms-Icon ms-Icon--OfficeLogo"
              style="font-size:24px;
      color:red "
            ></i>
            <p style="margin-top:2px ">Office 365</p>
          </a>
        </div>
        <div class="col-xs-4 ">
          <a href="https://gsuite.google.com " target="_blank ">
            <i
              class="fa fa-google "
              style="font-size:32px; color:gray
      "
            ></i>
            <p style="margin-top:3px ">Google Apps</p>
          </a>
        </div>
        <div class="col-xs-4 ">
          <a href="https://aws.amazon.com/ses/ " target="_blank ">
            <i
              class="fa fa-amazon "
              style="font-size:32px; color:gold
      "
            ></i>
            <p style="margin-top:2px ">Amazon AWS</p>
          </a>
        </div>
        <dburst-button-well-known-email-providers
          (sendSelectedProvider)="updateSMTPFormControlsWithSelectedProviderSettings($event)"
        >
        </dburst-button-well-known-email-providers>
      </div>
    </div>
  </div>

  <div *ngIf="modalConnectionInfo.connectionType =='database-connection'" style="margin: 5px;">
  
    <div class="row">
      
        <div class="col-xs-2">
          {{ 'AREAS.CONFIGURATION.DATABASE-CONNECTION-SETTINGS.DATABASE-VENDOR' | translate }}
        </div>
      
        <div class="col-xs-10">
          <select id="dbVendor" [(ngModel)]="modalConnectionInfo.database.documentburster.connection.vendor" class="form-control">
            <option value="SQLite">SQLite</option>
            <option value="MySQL">MySQL</option>
            <option value="MariaDB">MariaDB</option>
            <option value="PostgreSQL">PostgreSQL</option>
            <option value="MSSQL">MS SQL</option>
            <option value="Oracle">Oracle</option>
          </select>
        </div>

    </div>       

    <p></p>
        
    <div class="row">
    <div class="col-xs-2">
      {{ 'AREAS.CONFIGURATION.DATABASE-CONNECTION-SETTINGS.CONNECTION-NAME' |
      translate }}
    </div>
    <div class="col-xs-10">
      <input
        id="dbConnectionName"
        [(ngModel)]="modalConnectionInfo.database.documentburster.connection.name"
        (ngModelChange)="updateModelAndForm()"
        class="form-control"
        autofocus
        required
      />
    </div>
  </div>
  <p></p>

  <div class="row">
    <div class="col-xs-2">
      {{ 'AREAS.CONFIGURATION.DATABASE-CONNECTION-SETTINGS.HOST' |
      translate }}
    </div>
    <div class="col-xs-10">
      <input
        id="dbHost"
        [(ngModel)]="modalConnectionInfo.database.documentburster.connection.host"
        class="form-control"
      />
    </div>
  </div>
  <p></p>

  <div class="row">
    <div class="col-xs-2">
      {{ 'AREAS.CONFIGURATION.DATABASE-CONNECTION-SETTINGS.DATABASE' |
      translate }}
    </div>
    <div class="col-xs-10">
      <input
        id="dbName"
        [(ngModel)]="modalConnectionInfo.database.documentburster.connection.dbname"
        class="form-control"
      />
    </div>
  </div>
  <p></p>

  <div class="row">
    <div class="col-xs-2">
      {{ 'AREAS.CONFIGURATION.DATABASE-CONNECTION-SETTINGS.USER-NAME' |
      translate }}
    </div>
    <div class="col-xs-10">
      <input
        id="dbUserName"
        [(ngModel)]="modalConnectionInfo.database.documentburster.connection.userid"
        class="form-control"
      />
    </div>
  </div>

  <p-footer>
    <span>
      <span
        id="alreadyExistsWarning"
        style="font-size: 9px"
        class="label label-warning"
        *ngIf="modalConnectionInfo.connectionFilePathExists"
        >{{
        'AREAS.CONFIGURATION-TEMPLATES.MODAL-CONF-TEMPLATE.FILE-ALREADY-EXISTS'
        | translate }}</span
      >
      &nbsp;
    </span>

    <button
      id="btnOKConfirmationConnectionModal"
      class="btn btn-primary"
      type="button"
      (click)="onModalOK()"
      [disabled]="!modalConnectionInfo.email.documentburster.connection.name || modalConnectionInfo.connectionFilePathExists"
    >
      {{ 'BUTTONS.SAVE' | translate }}
    </button>

    <button
      id="btnCloseConnectionModal"
      class="btn btn-flat btn-default dburst-button-question-decline"
      type="button"
      (click)="onModalClose()"
    >
      {{ 'BUTTONS.CANCEL' | translate }}
    </button>
  </p-footer>
</p-dialog> `;
