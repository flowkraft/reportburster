export const modalTemplatesGalleryTemplate = `<dburst-templates-gallery-modal
  [galleryTags]="templatesGalleryTags"
  [hidden]="!istemplatesGalleryModalVisible"
  (useTemplate)="onGalleryTemplateUsed($event)"
  #templatesGalleryModal>
</dburst-templates-gallery-modal>`;