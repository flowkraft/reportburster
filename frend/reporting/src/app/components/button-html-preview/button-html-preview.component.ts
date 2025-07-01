import { Component, Input } from '@angular/core';
import { modalHtmlPreviewTemplate } from './modal-html-preview.template';

@Component({
  selector: 'dburst-button-html-preview',
  template: `
    <button
      type="button"
      id="btnHtmlEmailPreview"
      class="btn"
      (click)="onClick()"
      style="margin-top: 100px; margin-bottom: 50px; width: 100%;"
    >
      <i class="fa fa-eye"></i> Preview
    </button>
    ${modalHtmlPreviewTemplate}
  `,
})
export class ButtonHtmlPreviewComponent {
  @Input() htmlCode: string;

  protected isModalHtmlPreviewVisible = false;

  constructor() {}

  onClick() {
    this.isModalHtmlPreviewVisible = true;
  }

  onCloseModal() {
    this.isModalHtmlPreviewVisible = false;
  }
}
