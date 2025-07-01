export const modalHtmlPreviewTemplate = `<p-dialog header="{{
  'COMPONENTS.BUTTON-HTML-PREVIEW.HTML-EMAIL-PREVIEW' | translate }}" [(visible)]="isModalHtmlPreviewVisible"
  [baseZIndex]="1000" [modal]="true">

  <div style="width:700px;height:575px; overflow-y: auto; overflow-x: auto; ">
    <iframe id="previewIframe" srcdoc="{{ htmlCode }}" frameborder="0"></iframe>
  </div>

  <p-footer>

    <button id="btnClose" class="btn btn-primary" type="button" (click)="isModalHtmlPreviewVisible = false">{{
      'BUTTONS.CLOSE' | translate }}</button>

  </p-footer>

</p-dialog>
`;
