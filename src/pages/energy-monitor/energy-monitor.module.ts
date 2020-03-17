import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { EnergyMonitorPage } from './energy-monitor';

@NgModule({
  declarations: [
    EnergyMonitorPage,
  ],
  imports: [
    IonicPageModule.forChild(EnergyMonitorPage),
  ],
})
export class EnergyMonitorPageModule {}
