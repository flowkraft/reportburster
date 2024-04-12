export const modalAttachmentTemplate = `<p-dialog id="modalSelectAttachment"
  header="{{ 'AREAS.CONFIGURATION.MODAL-ATTACHMENT.SELECT-ATTACHMENT' | translate }}"
  [(visible)]="isModalAttachmentVisible"
  [modal]="true"
>
  <div class="modal-body" id="modal-body" style="height: 250px">
    <div class="row">
      <div class="col-xs-1">
        {{ 'AREAS.CONFIGURATION.MODAL-ATTACHMENT.PATH' | translate }}
      </div>

      <div class="col-xs-7">
        <input
          id="attachmentPath"
          class="form-control"
          [(ngModel)]="modalAttachmentInfo.attachmentFilePath"
          size="52"
        />
      </div>

      <div class="col-xs-2">
        <dburst-button-variables
          id="btnAttachmentPathVariables"
          (sendSelectedVariable)="updateFormControlWithSelectedVariable('attachmentPath',$event)"
        >
        </dburst-button-variables>
      </div>

      <div class="col-xs-2">
        <!--
        <dburst-button-native-system-dialog
          dialogType="file"
          (pathsSelected)="onSelectAttachmentFilePath($event)"
        >
        </dburst-button-native-system-dialog>
        -->
      </div>
    </div>
  </div>
  <p-footer>
    <button
      id="btnOKConfirmation"
      class="btn btn-primary dburst-button-question-confirm-attachment"
      type="button"
      (click)="onOKAttachmentModal()"
      [disabled]="!modalAttachmentInfo.attachmentFilePath"
    >
      {{ 'BUTTONS.OK' | translate }}
    </button>
    <button
      class="btn btn-flat btn-default"
      type="button"
      (click)="onCancelAttachmentModal()"
    >
      {{ 'BUTTONS.CANCEL' | translate }}
    </button>
  </p-footer>
</p-dialog>
`;
