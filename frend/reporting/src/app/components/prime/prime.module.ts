import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TreeComponent } from './tree.component';
import { PicklistComponent } from './picklist.component';

@NgModule({
  imports: [CommonModule, FormsModule, TreeComponent, PicklistComponent],
  exports: [TreeComponent, PicklistComponent],
})
export class PrimeModule {}
