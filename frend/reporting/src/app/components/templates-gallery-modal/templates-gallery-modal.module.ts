import { NgModule } from '@angular/core';
import { TemplatesGalleryModalComponent } from './templates-gallery-modal.component';
import { ScaleIframeDirective } from '../../helpers/scale-iframe';
import { SharedModule } from '../../shared/shared.module';
import { CarouselModule } from 'primeng/carousel';

@NgModule({
  declarations: [TemplatesGalleryModalComponent, ScaleIframeDirective],
  exports: [TemplatesGalleryModalComponent],
  imports: [SharedModule, CarouselModule],
})
export class TemplatesGalleryModalModule {}
