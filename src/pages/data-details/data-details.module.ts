import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { DataDetailsPage } from './data-details';

@NgModule({
  declarations: [
    DataDetailsPage,
  ],
  imports: [
    IonicPageModule.forChild(DataDetailsPage),
  ]
})
export class DataDetailsPageModule {}
