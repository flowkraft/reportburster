import { NgModule } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { ButtonNativeFsDialogComponent } from './button-native-fs-dialog.component';

@NgModule({
  declarations: [ButtonNativeFsDialogComponent],
  exports: [ButtonNativeFsDialogComponent],
  imports: [TranslateModule],
})
export class ButtonNativeSystemDialogModule {}
