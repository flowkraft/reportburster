import { NgModule } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { ConnectionDetailsComponent } from './connection-details.component';
import { SharedModule } from '../../shared/shared.module';
import { PrimeModule } from '../prime/prime.module';
import { MarkdownModule } from 'ngx-markdown';
import { FileExplorerModule } from '../file-explorer/file-explorer.module';
import { TabOrderDirective } from '../../shared/tab-order.directive';

@NgModule({
  declarations: [ConnectionDetailsComponent, TabOrderDirective],
  exports: [ConnectionDetailsComponent],
  imports: [
    SharedModule,
    PrimeModule,
    FileExplorerModule,
    MarkdownModule.forRoot(),
    TranslateModule,
  ],
})
export class ConnectionDetailsModule {}
