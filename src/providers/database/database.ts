import { Injectable } from '@angular/core';
import { SQLite, SQLiteObject, SQLiteDatabaseConfig } from "@ionic-native/sqlite";
import { BehaviorSubject } from "rxjs/Rx";
import { Platform } from 'ionic-angular/platform/platform';
import * as moment from "moment";
import { take } from 'rxjs/operators/take';
import { ToastController } from 'ionic-angular/components/toast/toast-controller';


@Injectable()
export class DatabaseProvider {

  private TAG: String = "DatabaseProvider - ";

  public database: SQLiteObject;
  private databaseReady: BehaviorSubject<boolean>;

  private latestLogged: string;
  private bHasLoggedData: Boolean;

  private logsPerHours: number = 12;
  private hours = ["00", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"
    , "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23"];


  constructor(private sqlite: SQLite, private platform: Platform, private toastCtrl: ToastController) {
    // console.log('Hello DatabaseProvider');
    this.bHasLoggedData = false;
    this.initialize();
  }

  initialize() {
    this.databaseReady = new BehaviorSubject(false);
    this.platform.ready().then(() => {
      this.sqlite.create({
        name: 'data.db',
        location: 'default'
      })
        .then((db: SQLiteObject) => {
          this.database = db;

          this.database.executeSql('CREATE TABLE IF NOT EXISTS credentials(id INTEGER PRIMARY KEY, name VARCHAR(18), password TEXT, cmiid TEXT, token TEXT, profile TEXT)', {})
            .then(() => console.log(this.TAG + "table credentials initialized"))
            .catch(e => console.log(this.TAG + "Error: credentials initialization - " + e));

          this.database.executeSql('CREATE TABLE IF NOT EXISTS devices(id TEXT PRIMARY KEY, name TEXT, unit TEXT, displayname TEXT)', {})
            .then(() => console.log(this.TAG + "table devices initialized"))
            .catch(e => console.log(this.TAG + "Error: devices initialization - " + e));

          this.database.executeSql('CREATE TABLE IF NOT EXISTS measurements(id INTEGER PRIMARY KEY, logged DATETIME, value DECIMAL(5,2), device_id TEXT, FOREIGN KEY(device_id) REFERENCES devices(id))', {})
            .then(() => console.log(this.TAG + "table measurements initialized"))
            .catch(e => console.log(this.TAG + "Error: measurements initialization - " + e));

          this.getLatestLogged();

          this.databaseReady.next(true);
        })
    });
  }

  getDatabaseState() {
    return this.databaseReady.asObservable();
  }

  addCredentials(user: string, password: string, cmiid: string, profile: string) {
    let data = [0, user, password, cmiid, profile]; //[0, user, password];
    console.log(this.TAG + "addCredentials: " + data.toString());
    
    return this.database.executeSql('REPLACE INTO credentials (id, name, password, cmiid, profile) VALUES(?, ?, ?, ?, ?)', data).then(() => { //'REPLACE INTO credentials (id, name, password) VALUES (0, "?", "?")', {data}).then(() => {
      console.log(this.TAG + "Credentials added");
    }, err => {
      console.log(this.TAG + "Error: Credentials not added - " + JSON.stringify(err));
    });
  }

  getCredentials() {
    return this.database.executeSql('SELECT * FROM credentials', []).then((data) => {
      return data.rows.item(0);
    }, err => {
      console.log(this.TAG + JSON.stringify(err));
      return [];
    })
  }

  addAccessToken(token: string) {
    let data = [token, 0];
    return this.database.executeSql('UPDATE credentials SET token=? WHERE id = ?', data).then(() => {
      console.log(this.TAG + "Token added");
      return true;
    }, err => {
      console.log(this.TAG + "Error: Token not added - " + JSON.stringify(err));
    });
  }

  getAccessToken() {
    console.log(moment().format("mm:ss"));
    this.database.executeSql('SELECT * FROM credentials', []).then((data) => {
      console.log(this.TAG + JSON.stringify(data.rows.item(0)));
    }, err => {
      console.log(this.TAG + err);
    })
  }


  addDescriptions(description: any) {
    let name: string;
    for (var item in description) {
      name = description[item].substring(description[item].indexOf(" ") + 1);
      console.log("name: " + name);
      this.database.executeSql('INSERT INTO devices(id, name) VALUES(?, ?)', [item, name]).then(() => {
        console.log(this.TAG + "Descriptions added");
      }, err => {
        console.log(this.TAG + "Error: Descriptions not added - " + JSON.stringify(err));
      });
    }
  }

  addValues(values: any) {
    let dateTime: string;
    let queryBatch: Array<string> = [];
    let query: string;
    for (var i = 0; Object.keys(values).length; i++) { 
      dateTime = values[i]["zeit"];
      for (var e in values[i]) {
        if (e !== "zeit") {
          query = "INSERT INTO measurements(logged, value, device_id) VALUES('" + dateTime + "', " + values[i][e] + ", '" + e + "')";
          queryBatch.push(query);
        }
      }
    }
    this.database.sqlBatch(queryBatch).then(result => {
      console.log("#### " + JSON.stringify(result));
    }, err => {
      console.log(this.TAG + "Error: Adding values failed - " + JSON.stringify(err));
    });

    console.log(this.TAG + "adding values finished");
  }

  async addValuesNew(values: any) {
    let toast = this.toastCtrl.create({
      message: "Daten werden aus dem Webportal abgerufen...",
      position: "bottom"
    });
    toast.present();
    let dateTime: string;
    console.log("LENGTH: " + Object.keys(values).length);
    for (var i = 0; i < Object.keys(values).length; i++) { //i < 2 ; i++) {
      dateTime = values[i]["zeit"];
      console.log("I: " + i);
      for (var e in values[i]) {
        if (e !== "zeit") {
          await this.database.executeSql('INSERT INTO measurements(logged, value, device_id) VALUES(?, ?, ?)', [dateTime, values[i][e], e]).then(result => {
          }, err => {
            console.log(this.TAG + 'Create Table Error! ####### - ' + JSON.stringify(err));
          });
        }
      }
    }
    console.log(this.TAG + "adding values finished");
    toast.dismiss();
  }



  async addDevices(description: any, units: any) {
    for (var device in description) { // device = "a1"; description[device] = "Strom PV"
      console.log(this.TAG + JSON.stringify(device));
      await this.database.executeSql('REPLACE INTO devices(id, name, displayname) VALUES(?, ?, (SELECT displayname FROM devices WHERE id = ?))', [device, description[device], device]).then(() => {
      }, err => {
        console.log(this.TAG + "Error: device not added - " + JSON.stringify(err));
      });

    }
    for (var device in units) { // device = "a1"; units[device].unity = "kW"
      console.log("asdf: " + units[device].unity + " " + device);
      await this.database.executeSql('UPDATE devices SET unit = ? WHERE id = ?', [units[device].unity, device]).then((x) => {
        console.log(JSON.stringify(x));
      }, err => {
        console.log(this.TAG + "Error: unit not added to device - " + JSON.stringify(err));
      });
    }
  }

  getCMIId() {
    return this.database.executeSql('SELECT cmiid FROM credentials', []).then((data) => {
      console.log("miid: " + data.rows.item(0).cmiid);
      return data.rows.item(0).cmiid;
    })
  }

  getProfile() {
    return this.database.executeSql('SELECT profile FROM credentials', []).then((data) => {
      return data.rows.item(0).profile;
    })
  }

  dropTable() {
    console.log(this.TAG + "drop tables started");
    this.database.executeSql('DROP TABLE IF EXISTS credentials', {}).then(() => {
      console.log(this.TAG + "credentials table dropped");
    }, err => {
      console.log(this.TAG + "credentials not dropped - " + JSON.stringify(err));
    });

    this.database.executeSql('DROP TABLE IF EXISTS measurements', {}).then(() => {
      console.log(this.TAG + "measurements table dropped");
    }, err => {
      console.log(this.TAG + "measurements not dropped - " + JSON.stringify(err));
    });
    this.database.executeSql('DROP TABLE IF EXISTS devices', {}).then(() => {
      console.log(this.TAG + "devices table dropped");
    }, err => {
      console.log(this.TAG + "devices not dropped - " + JSON.stringify(err));
    });
  }

  credentialsAvailable() {
    return this.database.executeSql('SELECT * from credentials', []).then((data) => {
      if (data.rows.length === 1) return true;
      else return false;
    }, err => {
      console.log(this.TAG + "Error: can't check for available credentials - " + JSON.stringify(err));
    })
  }

  loggedDataAvailable() {
    return this.database.executeSql('SELECT * from measurements', []).then(data => {
      if (data.rows.length >= 1) return true;
      else return false;
    }, err => {
      console.log(this.TAG + "Error: can't check for available data - " + JSON.stringify(err));
    });
  }

  /**
    * Returns the date and time of the latest log in the database.
    */
  getLatestLogged() {
    return this.database.executeSql('SELECT * FROM measurements ORDER BY datetime(logged) DESC Limit 1', []).then(data => {
      console.log("LOGGED: " + data.rows.length);
      if (data.rows.length == 1) {
        this.latestLogged = data.rows.item(0).logged;
        console.log(this.TAG + "Latest Logged" + this.latestLogged);
        this.bHasLoggedData = true;
        return moment(this.latestLogged).format("YYYY-MM-DD HH:mm:ss");
      } else {
        return moment().startOf("isoWeek").format("YYYY-MM-DD HH:mm:ss");
      }

    }, err => {
      console.log(this.TAG + "Error: can't get latest log - " + JSON.stringify(err));
    });
  }

  getLatestLoggedString() {
    return this.latestLogged;
  }

  /**
   * Returns the value of the latest log in the database.
   */
  getLatestLoggedData() {
    return this.database.executeSql('SELECT * FROM measurements ORDER BY datetime(logged) DESC Limit 1', []).then(data => {
      return data.rows.item(0);
    }, err => {
      console.log(this.TAG + "Error: can't get latest log data - " + JSON.stringify(err));
    });
  }

  /**
   * Returns all records with the given date.
   * @param date
   */
  getLoggedDataFromDB(date: string) {
    return this.database.executeSql('SELECT * FROM measurements WHERE logged = ?', [date]).then(data => {
      return data;
    }, err => {
      console.log(this.TAG + "Error: can't get logged data from database - " + JSON.stringify(err));
    })
  }

  getSumOfDate(device: string, date: string) {
    return this.database.executeSql('SELECT sum(value) AS summe FROM measurements WHERE device_id = ? AND logged LIKE ?', [device, date + '%']).then(data => {
      return (data.rows.item(0).summe / this.logsPerHours);
    }, err => {
      console.log(this.TAG + "Error: can't get sum of device " + device + " on " + date + " - " + JSON.stringify(err));
    });
  }

  /**
   * Returns all devices in database as a map.
   * Map: key, [name, unit]
   */
  getDevicesMap() {
    return this.database.executeSql("SELECT * FROM devices", []).then(data => {
      let map = new Map();
      for (let i = 0; i < data.rows.length; i++) {
        console.log("asdfMap: " + JSON.stringify(data.rows.item(i)));
        map.set(data.rows.item(i).id, [data.rows.item(i).displayname, data.rows.item(i).unit]);
      }
      return map;
    })
  }

  getDevices() {
    return this.database.executeSql('SELECT name from devices', []).then(data => {
      return data;
    }, err => {
      console.log(this.TAG + "Error: can't get devices " + JSON.stringify(err));
    })
  }

  hasLoggedData() {
    return this.bHasLoggedData;
  }

  /**
   *
   * @param day in the format YYYY-MM-DD
   * @param device
   */
  async getDataOfDay(day: string, device: string) {
    let hourData: Array<any> = [];
    let start: string;
    let end: string;
    for (let hour of this.hours) {
      start = day + " " + hour + ":00:00";
      end = day + " " + hour + ":59:59";
      await this.database.executeSql("SELECT sum(value) as summe FROM measurements WHERE device_id = ? AND logged BETWEEN ? AND ?", [device, start, end]).then(data => {
        hourData.push(this.precisionRound((data.rows.item(0).summe / this.logsPerHours), 2));
      })
    }
    return hourData;
  }

  async getDataOfDay2(day: string, device: string) {
    let hourData: Array<any> = [];
    let labelData: Array<any> = [];
    await this.database.executeSql("SELECT * FROM measurements WHERE device_id = ? AND logged BETWEEN ? AND ? ORDER BY logged ASC", [device, day + " 00:00:00", day + " 23:59:59"]).then(data => {
      for (var i = 0; i < data.rows.length; i++) {
        labelData.push(moment(data.rows.item(i).logged).format("HH:mm"));
        hourData.push(data.rows.item(i).value);
      }
    });
    return [labelData, hourData];
  }

  async getDataOfWeek(day: string, device: string) {
    let dayData: Array<any> = [];
    let startDayWeek: string = moment(day).startOf("isoWeek").format("YYYY-MM-DD");
    let endDayWeek: string = moment(day).endOf("isoWeek").format("YYYY-MM-DD");
    let dayValue: number = 0;
    let tmp: any;
    await this.database.executeSql("SELECT * FROM measurements WHERE device_id = ? AND logged BETWEEN ? AND ? ORDER BY logged ASC", [device, startDayWeek, endDayWeek + " 23:59:59"]).then(data => {
      let date = startDayWeek; //moment(data.rows.item(0).logged).format("YYYY-MM-DD");
      for (var i = 0; i < data.rows.length; i++) {
        if (moment(moment(data.rows.item(i).logged).format("YYYY-MM-DD")).isSame(date)) {
          dayValue = dayValue + data.rows.item(i).value;
        } else {
          tmp = this.precisionRound(dayValue / this.logsPerHours, 2);
          dayData.push(tmp);
          dayValue = data.rows.item(i).value;
          date = moment(data.rows.item(i).logged).format("YYYY-MM-DD");
        }
      }
      dayData.push(this.precisionRound(dayValue / this.logsPerHours, 2));
    });
    while (dayData.length < 7) {
      dayData.push(0);
    }
    return dayData;
  }

  async getDataOfMonth(day: string, device: string) {
    let monthData: Array<any> = [];
    let startDayMonth: string = moment(day).startOf("month").format("YYYY-MM-DD");
    let endDayMonth: string = moment(day).endOf("month").format("YYYY-MM-DD");
    let dayValue: number = 0;

    await this.database.executeSql("SELECT * FROM measurements WHERE device_id = ? AND logged BETWEEN ? AND ? ORDER BY logged ASC", [device, startDayMonth, endDayMonth + " 23:59:59"]).then(data => {
      let date = startDayMonth;
      let dayDifference = moment(moment(data.rows.item(0).logged).format("YYYY-MM-DD")).diff(date, "days");
      for (var z = 1; z < dayDifference; z++) {
        monthData.push(0);
      }
      for (var i = 0; i < data.rows.length; i++) {
        if (moment(moment(data.rows.item(i).logged).format("YYYY-MM-DD")).isSame(date)) {
          dayValue = dayValue + data.rows.item(i).value;
        } else {
          monthData.push(this.precisionRound(dayValue / this.logsPerHours, 2));
          dayValue = data.rows.item(i).value;
          date = moment(data.rows.item(i).logged).format("YYYY-MM-DD");
        }
      }
      monthData.push(this.precisionRound(dayValue / this.logsPerHours, 2));
    });
    while (monthData.length < Number(moment(endDayMonth).format("DD"))) {
      monthData.push(0);
    }
    console.log("MONTH: " + monthData);
    return monthData;
  }

  async getDataOfYear(day: string, device: string) {
    let yearData: Array<any> = [];
    let startDayYear: string = moment(day).startOf("year").format("YYYY-MM-DD");
    let endDayYear: string = moment(day).endOf("year").format("YYYY-MM-DD");
    let monthValue: number = 0;

    await this.database.executeSql("SELECT * FROM measurements WHERE device_id = ? AND logged BETWEEN ? AND ? ORDER BY logged ASC", [device, startDayYear, endDayYear + " 23:59:59"]).then(data => {
      let month = moment(startDayYear).format("YYYY-MM");
      let monthDifference = moment(moment(data.rows.item(0).logged).format("YYYY-MM-DD")).diff(month, "months");
      for (var z = 1; z < monthDifference; z++) {
        yearData.push(0);
      }
      for (var i = 0; i < data.rows.length; i++) {
        if (moment(moment(data.rows.item(i).logged).format("YYYY-MM")).isSame(month)) {
          monthValue = monthValue + data.rows.item(i).value;
        } else {
          yearData.push(this.precisionRound(monthValue / this.logsPerHours, 2));
          monthValue = data.rows.item(i).value;
          month = moment(data.rows.item(i).logged).format("YYYY-MM");
        }
      }
      yearData.push(this.precisionRound(monthValue / this.logsPerHours, 2));
    });
    console.log("YEAR: " + yearData);
    return yearData;
  }

  addMapping(displayName: string, webportalName: string) {
    this.database.executeSql('UPDATE devices SET displayname = ? WHERE name = ?', [displayName, webportalName]).then(() => {
    }, err => {
      console.log(this.TAG + "Error: can't add data to device map - " + JSON.stringify(err));
    });
    this.database.executeSql('SELECT * from devices', []).then(data => {
      for (let i = 0; i < data.rows.length; i++) {
        console.log("dvmap: " + JSON.stringify(data.rows.item(i)));
      }
    });
  }

  precisionRound(number, precision) {
    var factor = Math.pow(10, precision);
    return Math.round(number * factor) / factor;
  }

  test() {
    this.database.executeSql('SELECT * from devices', []).then((x) => {
      for (var i = 0; i < x.rows.length; i++) {
        console.log(JSON.stringify(x.rows.item(i)));
      }
    }, err => {
      console.log(this.TAG + "Error: unit not added to device - " + JSON.stringify(err));
    });
  }

}