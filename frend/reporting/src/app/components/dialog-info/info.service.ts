import { Injectable } from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { InfoDialogComponent } from './info-dialog.component';
@Injectable()
export class InfoService {
  modalRef?: BsModalRef;
  constructor(protected modalService: BsModalService) {}

  showInformation(options: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.modalRef = this.modalService.show(InfoDialogComponent);
      this.modalRef.content.title = options.title
        ? options.title
        : 'Information';
      this.modalRef.content.message = options.message;
      this.modalRef.content.confirmLabel = options.confirmLabel
        ? options.confirmLabel
        : 'OK';

      this.modalRef.content.onClose.subscribe((result: boolean) => {
        resolve(result);
      });
    });
  }
}
