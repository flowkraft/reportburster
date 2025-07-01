import { Component, OnInit } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { Subject } from 'rxjs';

@Component({
  selector: 'dburst-info-dialog',
  template: `
    <div class="modal-header">
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
    <div class="modal-body" [innerHTML]="message"></div>
    <div class="modal-footer">
      <button
        type="button"
        class="btn btn-primary dburst-button-question-confirm"
        (click)="confirm()"
        [innerHTML]="confirmLabel"
      ></button>
    </div>
  `,
})
export class InfoDialogComponent implements OnInit {
  onClose: Subject<boolean>;
  title: string;
  message: string;
  confirmLabel: string;

  constructor(protected bsModalRef: BsModalRef) {}

  ngOnInit(): void {
    this.onClose = new Subject();
  }

  confirm() {
    this.onClose?.next(true);
    this.bsModalRef.hide();
  }
}
