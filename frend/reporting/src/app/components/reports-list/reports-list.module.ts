import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared.module';
import { EditorModule } from 'primeng/editor';

import { ReportsListComponent } from './reports-list.component';

@NgModule({
  declarations: [ReportsListComponent],
  exports: [ReportsListComponent],
  imports: [SharedModule, EditorModule],
})
export class ReportsListModule {}
