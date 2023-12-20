import { NgModule } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { ButtonNativeSystemDialogComponent } from './button-native-system-dialog.component';

@NgModule({
  declarations: [ButtonNativeSystemDialogComponent],
  exports: [ButtonNativeSystemDialogComponent],
  imports: [TranslateModule],
})
export class ButtonNativeSystemDialogModule {}
