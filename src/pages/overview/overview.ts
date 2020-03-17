import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { SettingsPage } from '../settings/settings';
import { Http } from "@angular/http";
import { DataDetailsPage } from "../data-details/data-details";
import { DatabaseProvider } from '../../providers/database/database';
import { EnergyMonitorPage } from '../energy-monitor/energy-monitor';
import { CMIData } from "../../entities/cmiData";
import { ApiHandlerProvider } from '../../providers/api-handler/api-handler';
import { SplashScreen } from '@ionic-native/splash-screen';

@IonicPage()
@Component({
  selector: 'page-overview',
  templateUrl: 'overview.html'
})
export class OverviewPage {

  private data: any;
  private dbReady: boolean = false;
  private latestLogged: String;
  private hasData: boolean = false;

  constructor(public navCtrl: NavController, public navParams: NavParams, private http: Http, private database: DatabaseProvider, private apiHandler: ApiHandlerProvider, splashScreen: SplashScreen) {
    this.loadView();
  }

  ngOnInit() {

  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad OverviewPage');
    
  }

  loadView() {
    console.log("asdb1 - " + this.dbReady);

    this.database.getDatabaseState().subscribe(rdy => {
      if (rdy) {
        console.log("Database seems to be ready");
        this.database.credentialsAvailable().then(x => {
          if (x === true) {
            this.dbReady = true;
            this.apiHandler.loadData().then(data => {
              this.data = data;
              console.log("LOADDATA: " + JSON.stringify(data));
              this.latestLogged = this.database.getLatestLoggedString();
              if (this.latestLogged != "") {
                this.hasData = true;
              }
            }); 
          }
          else this.navCtrl.push(SettingsPage);

        });
      }
    });
  }

  public goToSettings() {
    this.navCtrl.push(SettingsPage);
  }

  public showDetails(item: any) {
    if (JSON.parse(JSON.stringify(item)).name == "Energiemonitor") {
      this.navCtrl.push(EnergyMonitorPage, { "item": item, "data": this.data });
    } else {
      this.navCtrl.push(DataDetailsPage, { "item": item });
    }
  }

  test(b: boolean): boolean {
    return b;
  }

  hasItData() {
    return !this.hasData;
  }

  doRefresh(refresher) {
      this.navCtrl.setRoot(this.navCtrl.getActive().component);
      refresher.complete();
  }

}
