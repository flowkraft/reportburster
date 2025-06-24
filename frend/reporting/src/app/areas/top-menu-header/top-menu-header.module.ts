import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared.module';
import { TopMenuHeaderComponent } from './top-menu-header.component';
import { BrandComponent } from '../../components/brand/brand.component';
import { SkinsComponent } from '../../components/skins/skins.component';

@NgModule({
  declarations: [TopMenuHeaderComponent, BrandComponent, SkinsComponent],
  exports: [TopMenuHeaderComponent],
  imports: [SharedModule],
})
export class TopMenuHeaderModule {}
