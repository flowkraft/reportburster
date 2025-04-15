export const askForFeatureDialogTemplate = `<div
    class="modal-header"
    style="top: 10px;"
  >
    <h4 class="modal-title pull-left" [innerHTML]="title"></h4>
    <button
      type="button"
      class="btn-close close pull-right"
      aria-label="Close"
      (click)="confirm()"
    >
      <span aria-hidden="true" class="visually-hidden">&times;</span>
    </button>
  </div>
  <div class="modal-body" *ngIf="!settingsService.isDefaultEmailConnectionConfigured()">
    <span
      [innerHTML]="'COMPONENTS.ASK-FOR-FEATURE-DIALOG.INNER-HTML.EMAIL-NOT-CONFIGURED-PROPERLY' | translate"
    ></span>
  </div>
  <div class="modal-body" *ngIf="settingsService.isDefaultEmailConnectionConfigured()">
    <div class="row">
      <div class="col-xs-2">
        {{ 'AREAS.CONFIGURATION.TAB-EMAIL-MESSAGE.TO' | translate }}
      </div>
      <div class="col-xs-10">
        <input
          id="emailToAddress"
          [ngModel]="msgTo"
          class="form-control"
          readonly
        />
      </div>
    </div>

    <p></p>
    <div class="row">
      <div class="col-xs-2">
        {{ 'AREAS.CONFIGURATION.TAB-EMAIL-MESSAGE.SUBJECT' | translate }}
      </div>
      <div class="col-xs-10">
        <input id="emailSubject" [(ngModel)]="msgSubject" class="form-control" />
      </div>
    </div>

    <p></p>

    <div class="row">
      <div class="col-xs-2">
        {{ 'AREAS.CONFIGURATION.TAB-EMAIL-MESSAGE.MESSAGE' | translate }}
      </div>
      <div class="col-xs-10">
        <textarea
          class="form-control"
          rows="20"
          id="htmlCodeEmailMessage"
          [(ngModel)]="msgMessage"
        ></textarea>
      </div>
    </div>
  </div>
  <div class="modal-footer">
    <button
      type="button"
      class="btn btn-primary dburst-button-question-confirm"
      (click)="confirm('send-message')"
      [innerHTML]="confirmLabel"
      *ngIf="settingsService.isDefaultEmailConnectionConfigured()"
    ></button>
    <button
      type="button"
      class="btn btn-primary dburst-button-question-confirm"
      (click)="confirm('configure-email-properly')"
      [innerHTML]="'COMPONENTS.ASK-FOR-FEATURE-DIALOG.INNER-HTML.CONFIGURE-EMAIL-PROPERLY' | translate"
      *ngIf="!settingsService.isDefaultEmailConnectionConfigured()"
    ></button>
    <button id="btnCloseAskForFeatureModal" class="btn btn-flat btn-default dburst-button-question-decline" type="button" (click)="confirm()">
      {{ 'BUTTONS.CANCEL' | translate }}
    </button>
  </div> `;
