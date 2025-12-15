import { Component, OnInit } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { Subject } from 'rxjs';

@Component({
  selector: 'dburst-confirm-dialog',
  template: `
    <div id="confirmDialog" class="modal-dialog-center">
      <div class="modal-header">
        <h4 class="modal-title pull-left" [innerHTML]="title"></h4>
        <button
          type="button"
          class="btn-close close pull-right"
          aria-label="Close"
          (click)="decline()"
        >
          <span aria-hidden="true" class="visually-hidden">&times;</span>
        </button>
      </div>
      <div class="modal-body" [innerHTML]="message"></div>
      <div *ngIf="confirmationText" style="margin-top:10px;">
        <label style="font-size: 0.9em; color: #777;">Type <strong>{{confirmationText}}</strong> to confirm</label>
        <input type="text" [(ngModel)]="confirmInput" class="form-control input-sm" style="margin-top:6px;" />
      </div>
      <div class="modal-footer">
        <button
          type="button"
          class="btn btn-primary dburst-button-question-confirm"
          (click)="confirm()"
          [innerHTML]="confirmLabel"
          [disabled]="confirmationText && confirmInput !== confirmationText"
        ></button>
        <button
          type="button"
          class="btn btn-secondary dburst-button-question-decline"
          (click)="decline()"
          [innerHTML]="declineLabel"
        ></button>
      </div>
    </div>
  `,
})
export class ConfirmDialogComponent implements OnInit {
  onClose: Subject<boolean>;
  title: string;
  message: string;
  confirmLabel: string;
  declineLabel: string;
  confirmAction: Function;
  confirmationText: string; // optional: when set, user must type this text to enable confirm
  confirmInput: string;

  constructor(protected bsModalRef: BsModalRef) {}

  ngOnInit(): void {
    this.onClose = new Subject();
    this.confirmInput = '';
  }

  confirm() {
    // If confirmationText is provided, check equality before allowing confirm
    if (this.confirmationText && this.confirmInput !== this.confirmationText) {
      return; // do nothing
    }
    this.bsModalRef.hide();
    this.onClose?.next(true);
    return this.confirmAction();
  }

  decline() {
    this.bsModalRef.hide();
    this.onClose?.next(false);
  }
}
