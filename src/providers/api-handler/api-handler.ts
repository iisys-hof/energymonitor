import { Injectable } from '@angular/core';
import { CMIData } from "../../entities/cmiData";
import { Http, Headers, RequestOptions } from "@angular/http";
import { DatabaseProvider } from '../database/database';
import { Observable } from 'rxjs/Observable';
import * as moment from "moment";
import { ToastController } from 'ionic-angular/components/toast/toast-controller';
import { HTTP } from '@ionic-native/http';


@Injectable()
export class ApiHandlerProvider {

  private basicURL: string = "https://api.ta.co.at/v1/cmis/";

  data: any;
  private cmiData: CMIData;
  dataSet: Array<CMIData>;
  private TAG: String = "APIHandler - ";
  private cookid: string;

  constructor(public http: Http, private httpNative: HTTP, public database: DatabaseProvider, private toastCtrl: ToastController) {
    this.cmiData = new CMIData();
    this.dataSet = new Array();
  }

  loadOverviewData() {

    return this.http.get("assets/testdata_full.json").toPromise().then(
      res => {
        return res.json().data;
      });
  }

  loadDataFull() {
    return this.loadOverviewData().then(x => {
      console.log("x: " + JSON.stringify(x));
      let desc;
      let val;
      let un;
      let pos;
      for (let item of x) {
        console.log(item.name);
        this.cmiData.name = item.name;
        for (let v of item.values) {
          desc = v.description;
          pos = v.value.indexOf(" ")
          val = v.value.substring(0, pos);
          un = v.value.substring(pos + 1, v.value.length);

          this.cmiData.values.push({ description: desc, value: val, unit: un });

        }
        this.dataSet.push(this.cmiData);
        this.cmiData = new CMIData();
      }

      return this.dataSet;
    });
  }

  load() {
    return this.http.get("assets/testdata_full.json").toPromise().then(
      x => {
        let res = x.json().data;
        let desc;
        let val;
        let un;
        let pos;
        for (let item of res) {
          this.cmiData.name = item.name;
          for (let v of item.values) {
            this.cmiData.values.push({
              description: v.description,
              value: v.value.substring(0, v.value.indexOf(" ")),
              unit: v.value.substring(v.value.indexOf(" ") + 1, v.value.length)
            })
          }
          this.dataSet.push(this.cmiData);
          this.cmiData = new CMIData();
        }
        return this.dataSet;
      });
  }

  getAccessTokenOld() {

    let headers = new Headers();
    let username: string;
    let pwd: string;
    return this.database.getCredentials().then(data => {
      console.log(this.TAG + "jas " + JSON.stringify(data));
      console.log(this.TAG + "token " + data.token);
      username = data.name;
      pwd = data.password;
      console.log(this.TAG + "Name+Pwd: " + username + " " + pwd);

      let base64String = btoa(username + ":" + pwd);
      console.log(base64String + " = " + atob(base64String));
      headers.append('Authorization', 'Basic ' + base64String);
      let options = new RequestOptions({ headers: headers });
      return this.http.post("https://api.ta.co.at/v1/access_token", {}, options)
        .subscribe(res => {

          this.toastCtrl.create({
            message: "Daten erfolgreich gespeichert",
            duration: 5000,
            position: "middle"
          }).present();

          console.log("STATUS: " + res.status);
          let js = JSON.parse(res.text()).data.access_token;
          let cookid = js.cookid;
          let username = js.username;
          console.log("js: " + cookid + ":" + username);
          return this.database.addAccessToken(cookid);
        },
        err => {
          console.log("POST-Error: " + JSON.stringify(err));
          this.toastCtrl.create({
            message: "Überprüfe deine eingegebenen Daten",
            position: "bottom",
            showCloseButton: true,
            closeButtonText: "OK"
          }).present();
        });
    });
  }

  getAccessToken() {

    let headers = new Headers();
    let username: string;
    let pwd: string;

    let base64String = btoa(username + ":" + pwd);
    console.log(base64String + " = " + atob(base64String));
    headers.append('Authorization', 'Basic ' + base64String);
    let options = new RequestOptions({ headers: headers });
    return this.httpNative.post("https://api.ta.co.at/v1/access_token", {}, { 'Authorization': 'Basic ' + base64String })
      .then(res => {

        this.toastCtrl.create({
          message: "Daten erfolgreich gespeichert",
          duration: 5000,
          position: "middle"
        }).present();

        console.log("STATUS: " + res.status);
        console.log("DATA: " + res.data);
        console.log("HEADERS: " + JSON.stringify(res.headers));
      },
      err => {
        console.log("POST-Error: " + JSON.stringify(err));
        this.toastCtrl.create({
          message: "Überprüfe deine eingegebenen Daten",
          position: "bottom",
          showCloseButton: true,
          closeButtonText: "OK"
        }).present();
      });
  }

  /**
     * GET-Request to obtain all data that is available for the
     * saved profile in the given timeframe.
     * Calls also methods to save this data to the database.
     *
     * @param from in the format YYYY-MM-DD hh:mm:ss
     * @param to in the format YYYY-MM-DD hh:mm:ss
     */
  async getLogging(from: string, to: string) {
    let cmiid = await this.database.getCMIId();
    let profile = await this.database.getProfile();
    console.log(this.TAG + "CMIID: " + cmiid);
    console.log(this.TAG + "PROFILE: " + profile);
    let url: string = this.basicURL + cmiid + "/profile/" + profile + "/all?from=" + from.replace(/[:]+/g, "%3A").replace(" ", "%20") + "&to=" + to.replace(/[:]+/g, "%3A").replace(" ", "%20");
    let from2: string = JSON.stringify(from);
   
    await this.httpNative.get(url, {}, {}) //this.basicURL + cmiid + "/profile/" + profile + "/all?from=" + from + "&to=" + to, {}, {}) //2018-02-14 00:00:00&to=2018-02-14 12:00:00", {})
      .then(async res => {
        let description = JSON.parse(res.data).data.description;
        let units = JSON.parse(res.data).data.units;
        let values = JSON.parse(res.data).data.val;

        await this.database.addDevices(description, units);

        await this.database.addValuesNew(values);
      },
      err => { console.log("GET-Error: " + JSON.stringify(err)) });
  }

  /**
   * GET-Request to obtain all data that is available for the
   * saved profile in the given timeframe.
   * Calls also methods to save this data to the database.
   *
   * @param from in the format YYYY-MM-DD hh:mm:ss
   * @param to in the format YYYY-MM-DD hh:mm:ss
   */
  async getLoggingOld(from: string, to: string) {
    let cmiid = await this.database.getCMIId();
    let profile = await this.database.getProfile();
    console.log(this.TAG + "CMIID: " + cmiid);
    console.log(this.TAG + "PROFILE: " + profile);
    await this.http.get(this.basicURL + cmiid + "/profile/" + profile + "/all?from=" + from + "&to=" + to, {}) //2018-02-14 00:00:00&to=2018-02-14 12:00:00", {})
      .subscribe(res => {
        let description = JSON.parse(res.text()).data.description;
        let units = JSON.parse(res.text()).data.units;
        let values = JSON.parse(res.text()).data.val;

        this.database.addDevices(description, units);

        this.database.addValuesNew(values);
      },
      err => { console.log("GET-Error: " + JSON.stringify(err)) });
  }

  loadData() {
    return this.database.getLatestLogged().then(async data => { // datetime des aktuellsten Datenbankeintrag

      let from = moment(data).add(1, "second").format("YYYY-MM-DD HH:mm:ss");
      let to = moment().format("YYYY-MM-DD HH:mm:ss");


      return await this.getLogging(from, to).then(() => { // logging vom aktuellsten DB Eintrag bis heute speichern
        return this.database.getLatestLoggedData().then(latest => { // aktuellste Eintrag aus der DB bekommen
          console.log("LL: " + JSON.stringify(latest));
          return this.database.getDevicesMap().then(async devicesMap => { // Map fuer die Zordnung der Geraete erhalten
            return await this.database.getLoggedDataFromDB(latest.logged).then(data => {  // aktuellste Daten aus der DB bekommen (vollstaendig)
              let stromPV: string;
              let overviewData: Array<CMIData>;
              let cmi = new CMIData();
              let einheit;
              overviewData = new Array();
              let tmp = new Date(Date.parse(this.database.getLatestLoggedString().toString()));
              console.log("TMP: " + JSON.stringify(this.database.getLatestLoggedString()));
              let tmp_2 = moment(this.database.getLatestLoggedString()).format("YYYY-MM-DD");
              for (let i = 0; i < data.rows.length; i++) {
                console.log("SUMDATA: " + JSON.stringify(data.rows.item(i).device_id) + "  " + JSON.stringify(tmp_2));
                this.database.getSumOfDate(data.rows.item(i).device_id, tmp_2).then(sum => {
                  console.log("SUM: " + JSON.stringify(sum));
                  einheit = devicesMap.get(data.rows.item(i).device_id)[1];
                  cmi.name = devicesMap.get(data.rows.item(i).device_id)[0];
                  cmi.id = data.rows.item(i).device_id;
                  cmi.values.push({ description: "Aktuell:&nbsp;", value: data.rows.item(i).value, unit: einheit });
                  cmi.values.push({ description: "Heute:&nbsp;", value: this.precisionRound(sum, 2), unit: einheit + "h" });
                  overviewData.push(cmi);
                  cmi = new CMIData();
                  if (i == data.rows.length - 1) {
                    let pv;
                    let evi;
                    let verbrauch;
                    for (let item of overviewData) {
                      if (item.name.indexOf("Photovoltaik") !== -1) {
                        pv = item.values[0].value;
                      } else if (item.name.indexOf("EVI") !== -1) {
                        evi = item.values[0].value;
                      } else if (item.name.indexOf("Verbrauch") !== -1) {
                        verbrauch = item.values[0].value;
                      }
                    }
                    let energie = this.precisionRound(pv - verbrauch, 2);
                    cmi.name = "Energiemonitor";
                    if (energie >= 0) {
                      cmi.values.push({ description: "Einspeis.:&nbsp;", value: energie, unit: "kW" });
                    } else {
                      cmi.values.push({ description: "Bezug:&nbsp;", value: Math.abs(energie), unit: "kW" });
                    }
                    overviewData.push(cmi);
                    cmi = new CMIData();
                  }
                });
              }

              return overviewData;
            })
          });
        });
      });
    });
  }



  precisionRound(number, precision) {
    var factor = Math.pow(10, precision);
    return Math.round(number * factor) / factor;
  }


  test() {
    this.httpNative.get("https://api.ta.co.at/v1/cmis/CMI010492/profile/TestProfile/all?from=2018-03-20 00:00:00&to=2018-03-20 10:00:00", {}, {}).then((data) => {
      console.log("DATA: " + data.data);
      console.log("DATA: " + JSON.stringify(data.data));
    })
  }

}
