import { NgModule } from '@angular/core';
import { ButtonNativeSystemDialogModule } from '../../../components/button-native-system-dialog/button-native-system-dialog.component.module';
import { SharedModule } from '../../../shared/shared.module';

import { UpdateComponent } from './update.component';
import { WhenUpdatingComponent } from './when-updating';

@NgModule({
  imports: [SharedModule, ButtonNativeSystemDialogModule],
  declarations: [UpdateComponent, WhenUpdatingComponent],
  exports: [UpdateComponent],
})
export class UpdateModule {}
