export const tabEmailConnectionSettingsTemplate = `<ng-template
  #tabEmailConnectionSettingsTemplate
>
  <div class="well">
    <div class="row">
      <div class="col-xs-2">
        {{ 'AREAS.CONFIGURATION.TAB-EMAIL-CONNECTION-SETTINGS.CONNECTION' |
        translate }}
      </div>
      <div class="col-xs-7">
        <input
          type="checkbox"
          id="btnUseExistingEmailConnection"
          [(ngModel)]="xmlSettings?.documentburster.settings.emailserver.useconn"
          (change)="onUseExistingEmailConnectionClick($event)"
          (ngModelChange)="settingsChangedEventHandler($event)"
        />
        <label for="btnUseExistingEmailConnection" class="checkboxlabel"
          >&nbsp;{{
          'AREAS.CONFIGURATION.TAB-EMAIL-CONNECTION-SETTINGS.USE-EXISTING-CONNECTION'
          | translate }}</label
        >
        <div
          *ngIf="xmlSettings?.documentburster.settings.emailserver.useconn"
          class="btn-group pull-right"
        >
          <button
            type="button"
            id="btnSelectedEmailConnection"
            class="btn btn-sm"
            [ngClass]="xmlSettings?.documentburster.settings.emailserver.useconn ? 'btn-primary' : 'btn-default'"
          >
            {{selectedEmailConnectionFile?.connectionName}}
            <span
              id="selectedEmailConnectionDefault"
              *ngIf="selectedEmailConnectionFile?.defaultConnection"
              >(default)</span
            >
          </button>
          <button
            id="btnSelectAnotherEmailConnection"
            type="button"
            class="btn btn-sm btn-default dropdown-toggle"
            data-toggle="dropdown"
            aria-haspopup="true"
            aria-expanded="false"
          >
            <span class="caret"></span>
            <span class="sr-only">Toggle Dropdown</span>
          </button>
          <ul class="dropdown-menu">
            <li *ngFor="let connectionFile of settingsService.connectionFiles">
              <a
                id="{{connectionFile.connectionCode}}"
                href="javascript:;"
                (click)="onUsedExistingEmailConnectionChanged(connectionFile.connectionCode,connectionFile.connectionName)"
                >{{connectionFile.connectionName}}
                <span *ngIf="connectionFile.defaultConnection"
                  >(default)</span
                ></a
              >
            </li>
            <li role="separator" class="divider"></li>
            <li>
              <a
                id="manageEmailConnections"
                href="#"
                [routerLink]="[
    '/ext-connections',
    'emailSettingsMenuSelected',
    settingsService.currentConfigurationTemplatePath,
    settingsService.currentConfigurationTemplateName
  ]"
                >{{
                'AREAS.CONFIGURATION.TAB-EMAIL-CONNECTION-SETTINGS.MANAGE-EMAIL-CONNECTIONS'
                | translate }}</a
              >
            </li>
          </ul>
        </div>
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
          [(ngModel)]="xmlSettings?.documentburster.settings.emailserver.name"
          (ngModelChange)="settingsChangedEventHandler($event)"
          class="form-control"
          [disabled]="xmlSettings?.documentburster.settings.emailserver.useconn"
        />
      </div>

      <div class="col-xs-3">
        <dburst-button-variables
          id="btnFromNameVariables"
          (sendSelectedVariable)="updateFormControlWithSelectedVariable('fromName',$event)"
          [shouldBeDisabled]="xmlSettings?.documentburster.settings.emailserver.useconn"
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
          [(ngModel)]="xmlSettings?.documentburster.settings.emailserver.fromaddress"
          (ngModelChange)="settingsChangedEventHandler($event)"
          class="form-control"
          [disabled]="xmlSettings?.documentburster.settings.emailserver.useconn"
        />
      </div>

      <div class="col-xs-3">
        <dburst-button-variables
          id="btnFromEmailAddressVariables"
          (sendSelectedVariable)="updateFormControlWithSelectedVariable('fromEmailAddress',$event)"
          [shouldBeDisabled]="xmlSettings?.documentburster.settings.emailserver.useconn"
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
          [(ngModel)]="xmlSettings?.documentburster.settings.emailserver.host"
          (ngModelChange)="settingsChangedEventHandler($event)"
          class="form-control"
          [disabled]="xmlSettings?.documentburster.settings.emailserver.useconn"
        />
      </div>

      <div class="col-xs-3">
        <dburst-button-variables
          id="btnEmailServerHostVariables"
          (sendSelectedVariable)="updateFormControlWithSelectedVariable('emailServerHost',$event)"
          [shouldBeDisabled]="xmlSettings?.documentburster.settings.emailserver.useconn"
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
          [(ngModel)]="xmlSettings?.documentburster.settings.emailserver.userid"
          (ngModelChange)="settingsChangedEventHandler($event)"
          class="form-control"
          [disabled]="xmlSettings?.documentburster.settings.emailserver.useconn"
        />
      </div>

      <div class="col-xs-3">
        <dburst-button-variables
          id="btnUserNameVariables"
          (sendSelectedVariable)="updateFormControlWithSelectedVariable('userName',$event)"
          [shouldBeDisabled]="xmlSettings?.documentburster.settings.emailserver.useconn"
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
          [(ngModel)]="xmlSettings?.documentburster.settings.emailserver.userpassword"
          (ngModelChange)="settingsChangedEventHandler($event)"
          type="password"
          class="form-control"
          [disabled]="xmlSettings?.documentburster.settings.emailserver.useconn"
        />
      </div>

      <div class="col-xs-3">
        <dburst-button-variables
          id="btnSmtpPasswordVariables"
          (sendSelectedVariable)="updateFormControlWithSelectedVariable('smtpPassword',$event)"
          [shouldBeDisabled]="xmlSettings?.documentburster.settings.emailserver.useconn"
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
          [(ngModel)]="xmlSettings?.documentburster.settings.emailserver.port"
          (ngModelChange)="settingsChangedEventHandler($event)"
          class="form-control"
          [disabled]="xmlSettings?.documentburster.settings.emailserver.useconn"
        />
      </div>

      <div class="col-xs-3">
        <dburst-button-variables
          id="btnSmtpPortVariables"
          (sendSelectedVariable)="updateFormControlWithSelectedVariable('smtpPort',$event)"
          [shouldBeDisabled]="xmlSettings?.documentburster.settings.emailserver.useconn"
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
          [(ngModel)]="xmlSettings?.documentburster.settings.emailserver.usessl"
          (ngModelChange)="settingsChangedEventHandler($event)"
          [disabled]="xmlSettings?.documentburster.settings.emailserver.useconn"
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
          [(ngModel)]="xmlSettings?.documentburster.settings.emailserver.usetls"
          (ngModelChange)="settingsChangedEventHandler($event)"
          [disabled]="xmlSettings?.documentburster.settings.emailserver.useconn"
        />
        <label for="btnTLS" class="checkboxlabel"
          >&nbsp;{{
          'AREAS.CONFIGURATION.TAB-EMAIL-CONNECTION-SETTINGS.TLS-ENABLED' |
          translate }}</label
        >
      </div>
    </div>

    <p></p>
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
          *ngIf="!xmlSettings?.documentburster.settings.emailserver.useconn"
          (sendSelectedProvider)="updateSMTPFormControlsWithSelectedProviderSettings($event)"
        >
        </dburst-button-well-known-email-providers>
      </div>
    </div>
  </div>
</ng-template> `;
