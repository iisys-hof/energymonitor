import { Component, ViewChild } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { DatabaseProvider } from '../../providers/database/database';
import { ApiHandlerProvider } from '../../providers/api-handler/api-handler';
import { DateTime } from 'ionic-angular/components/datetime/datetime';

import * as moment from "moment";
import { ToastController } from 'ionic-angular/components/toast/toast-controller';

import { HTTP } from "@ionic-native/http";
import { AboutPage } from '../about/about';


@IonicPage()
@Component({
  selector: 'page-settings',
  templateUrl: 'settings.html',
})
export class SettingsPage {

  private TAG: string = "Settings - ";

  nm: string;
  pwd: string;
  cmiid: string;
  profile: string;
  userMod = {};
  aass: any;
  private devices = ["EVI", "Photovoltaik", "Heizung", "Solarthermie", "Pufferspeicher", "Verbrauch", "Energiespeicher"];
  testbl: boolean = false;
  item;

  // devices = ["Strom", "Photovoltaik", "EVI"];
  dbData = []; //= [{name: "13: Strom Haus", id: "a1", map: this.devices}, {name: "15: Strom EVI", id: "a2", map: this.devices}];

  // @ViewChild('username') username;
  // @ViewChild('password') password;

  constructor(public navCtrl: NavController, public navParams: NavParams,
    private apiHandler: ApiHandlerProvider, private database: DatabaseProvider, private toastCtrl: ToastController) {
    this.database.getDatabaseState().subscribe(rdy => {
      if (rdy) {
        console.log(this.TAG + "Database seems to be ready");
        this.loadUserData();
      }
    })
    console.log(this.TAG + "constructor");
  }

  loadUserData() {
    this.database.getCredentials().then(data => {

      this.nm = data.name;
      this.pwd = data.password;
      this.cmiid = data.cmiid;
      this.profile = data.profile;

      this.database.getDevices().then(data => {
        for (let i = 0; i < data.rows.length; i++) {
          console.log("as123: " + data.rows.item(i).name);
          this.dbData.push({name: data.rows.item(i).name, id: data.rows.item(i).name,  map: this.devices});
        }
      })
    });
  }

  dropTable() {
    this.database.dropTable();
  }

  ionViewDidLoad() {

  }

  saveCredentials() {
    console.log(this.TAG + "saveCredentials() called");
    console.log(this.TAG + "saveCred: " + this.userMod['name'] + " " + this.userMod['password']);
    this.database.addCredentials(this.userMod['name'], this.userMod['password'], this.userMod['cmiid'], this.userMod['profile'])
      .then(() => {
        this.loadUserData();
      }).then(() => {
        this.apiHandler.getAccessToken().then(() => {
          this.apiHandler.loadData();
        });
      });
  }

  public goToAbout() {
    this.navCtrl.push(AboutPage);
  }

  onChange(displayName, webportalName) {
    console.log("Selected: " + JSON.stringify(displayName) + " - " + JSON.stringify(webportalName));
    this.database.addMapping(displayName, webportalName);
  }

  accessToken() {
    this.apiHandler.getAccessToken();
  }

  getLatestLog() {
    this.database.getLatestLoggedData().then(data => {
      console.log("setting-LATESTLOG: " + JSON.stringify(data));

    });
  }

  addToken() {
    this.database.addAccessToken("abcdefgh");
  }

  getToken() {
    this.database.getAccessToken();
  }

  test() {
    this.database.test();
  }



}
