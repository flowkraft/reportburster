import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

@Injectable()
export class ToastrMessagesService {
  constructor(protected toastrService: ToastrService) {}

  showSuccess(message?: string, title?: string, override?: {}) {
    this.toastrService.success(message, title, override);
  }

  showInfo(message?: string, title?: string, override?: {}) {
    this.toastrService.info(message, title, override);
  }

  showError(message?: string, title?: string, override?: {}) {
    this.toastrService.error(message, title, override);
  }

  showWarning(message?: string, title?: string, override?: {}) {
    this.toastrService.warning(message, title, override);
  }
}
