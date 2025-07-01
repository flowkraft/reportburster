import { html } from 'code-tag';
export const modalConfigurationTemplateTemplate = /*html*/ `<p-dialog
  [header]="modalConfigurationTemplateInfo.modalTitle"
  [(visible)]="isModalConfigurationTemplateVisible"
  [modal]="true"
  width="800px"
  height="200px"
  class="modal-dialog-center"
>
  <div style="margin: 35px;">
    <div class="row">
      <div class="col-xs-2">
        {{ 'AREAS.CONFIGURATION-TEMPLATES.MODAL-CONF-TEMPLATE.NAME' | translate
        }}
      </div>

      <div class="col-xs-10">
        <input
          type="text"
          class="form-control"
          id="templateName"
          [(ngModel)]="modalConfigurationTemplateInfo.fileInfo.templateName"
          (ngModelChange)="updateModelAndForm()"
          placeholder="e.g. Payslips, Invoices, Statements, etc."
          autofocus
          required
        />
      </div>
    </div>

    <p></p>

    <div class="row">
      <div class="col-xs-2">
        {{ 'AREAS.CONFIGURATION-TEMPLATES.MODAL-CONF-TEMPLATE.CAPABILITIES' |
        translate }}
      </div>

      <div class="col-xs-10">
        <input
          type="checkbox"
          id="btnCapReportDistribution"
          [(ngModel)]="modalConfigurationTemplateInfo.fileInfo.capReportDistribution"
        />
        <label
          for="btnCapReportDistribution" class="checkboxlabel">
          &nbsp;{{'AREAS.CONFIGURATION-TEMPLATES.MODAL-CONF-TEMPLATE.CAP-REPORT-DISTRIBUTION'
          | translate}}
        </label>
        &nbsp;&nbsp;
        <input
          type="checkbox"
          id="btnCapReportGenerationMailMerge"
          *ngIf ="modalConfigurationTemplateInfo.fileInfo.type == 'config-reports'"
          [(ngModel)]="modalConfigurationTemplateInfo.fileInfo.capReportGenerationMailMerge"
        />
        <label *ngIf ="modalConfigurationTemplateInfo.fileInfo.type == 'config-reports'" for="btnCapReportGenerationMailMerge" class="checkboxlabel">
          &nbsp;{{'AREAS.CONFIGURATION-TEMPLATES.MODAL-CONF-TEMPLATE.CAP-REPORT-GENERATION'
          | translate}}
        </label>
      </div>
    </div>

    <p></p>

    <div class="row">
      <div class="col-xs-2">
        {{ 'AREAS.CONFIGURATION-TEMPLATES.MODAL-CONF-TEMPLATE.NOTES' | translate
        }}
      </div>

      <div class="col-xs-10">
        <p-editor
          [style]="{'height':'200px', 'width':'500px'}"
          id="notes"
          [(ngModel)]="modalConfigurationTemplateInfo.fileInfo.notes"
        >
          <ng-template pTemplate="header">
            <span class="ql-formats">
              <button type="button" class="ql-bold" aria-label="Bold"></button>
              <button
                type="button"
                class="ql-italic"
                aria-label="Italic"
              ></button>
              <button
                type="button"
                class="ql-underline"
                aria-label="Underline"
              ></button>
            </span>
            <span class="ql-formats">
              <button
                class="ql-list"
                value="ordered"
                aria-label="Ordered List"
                type="button"
              ></button>
              <button
                class="ql-list"
                value="bullet"
                aria-label="Unordered List"
                type="button"
              ></button>
            </span>
          </ng-template>
        </p-editor>
      </div>
    </div>
    <p></p>
    <div class="row">
      <div class="col-xs-2">
        {{ 'AREAS.CONFIGURATION-TEMPLATES.MODAL-CONF-TEMPLATE.VISIBILITY' |
        translate }}
      </div>

      <div class="col-xs-10">
        <select
          id="visibility"
          [(ngModel)]="modalConfigurationTemplateInfo.fileInfo.visibility"
        >
          <option value="hidden">
            {{
            'AREAS.CONFIGURATION-TEMPLATES.MODAL-CONF-TEMPLATE.VISIBILITY-HIDDEN'
            | translate }}
          </option>
          <option value="visible">
            {{
            'AREAS.CONFIGURATION-TEMPLATES.MODAL-CONF-TEMPLATE.VISIBILITY-VISIBLE'
            | translate }}
          </option>
        </select>
      </div>
    </div>

    <p></p>

    <div
      class="row"
      *ngIf="!this.modalConfigurationTemplateInfo.fileInfo
  .capReportGenerationMailMerge"
    >
      <div class="col-xs-2">
        {{ 'AREAS.CONFIGURATION-TEMPLATES.MODAL-CONF-TEMPLATE.HOW-TO-USE' |
        translate }}
      </div>

      <div class="col-xs-10">
        <input
          type="text"
          id="templateHowTo"
          class="form-control"
          *ngIf="!modalConfigurationTemplateInfo.fileInfo.isFallback"
          [ngModel]="modalConfigurationTemplateInfo.templateHowTo"
          readonly
        />
        <em
          id="templateHowToSnipped"
          style="font-size: 9px"
          *ngIf="!modalConfigurationTemplateInfo.fileInfo.isFallback"
        >
          <strong
            >{{
            'AREAS.CONFIGURATION-TEMPLATES.MODAL-CONF-TEMPLATE.ABOVE-SNIPPED' |
            translate }}</strong
          >
        </em>
        <span
          id="fallbackTemplateSpan"
          style="font-size: 9px"
          *ngIf="modalConfigurationTemplateInfo.fileInfo.isFallback"
          [innerHTML]="'AREAS.CONFIGURATION-TEMPLATES.TAB-CONF-TEMPLATES.INNER-HTML.DEFAULT-CONFIGURATION' | translate"
        >
        </span>
      </div>
    </div>
  </div>

  <p-footer>
    <span>
      <span
        id="alreadyExistsWarning"
        style="font-size: 9px"
        class="label label-warning"
        *ngIf="modalConfigurationTemplateInfo.templateFilePathExists == 'file'"
        >{{
        'AREAS.CONFIGURATION-TEMPLATES.MODAL-CONF-TEMPLATE.FILE-ALREADY-EXISTS'
        | translate }}</span
      >&nbsp;
    </span>
    <button
      id="btnOKConfirmation"
      class="btn btn-primary dburst-button-question-confirm"
      type="button"
      (click)="onModalOK()"
      [disabled]="
        !modalConfigurationTemplateInfo.fileInfo.templateName ||
        (modalConfigurationTemplateInfo.crudMode == 'create' &&
        (modalConfigurationTemplateInfo.templateFilePathExists == 'file'))
      "
    >
      {{ 'BUTTONS.OK' | translate }}
    </button>

    <button
      id="btnClose"
      class="btn btn-flat btn-default dburst-button-question-decline"
      type="button"
      (click)="onModalClose()"
    >
      {{ 'BUTTONS.CANCEL' | translate }}
    </button>
  </p-footer>
</p-dialog> `;
