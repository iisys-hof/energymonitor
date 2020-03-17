import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'dataPipe',
})
export class DataPipe implements PipeTransform {

  transform(value: string, ...args) {
    switch (value) {
      case "EVI":
        return "EVI_color";
      case "Photovoltaik":
        return "PV-Solar_color";
      case "Heizung":
        return "Heizung_color";
      case "Solarthermie":
        return "PV-Solarthermie_color";
      case "Pufferspeicher":
        return "Pufferspeicher_color";
      case "Verbrauch":
        return "Stromzaehler";
      case "Energiespeicher":
        return "Battery_color";
      case "Energiemonitor":
        return "Strommast";
      case "Strom":
        return "Strommast";
      case "Bezug":
        return "Strommast";
      case "Einspeisung":
        return "Strommast";
      case "Verbrauch (gesamt)":
        return "Stromzaehler";
      case "Verbrauch (sonstige)":
        return "Stromzaehler";

      case "January":
        return "Januar";
      case "February":
        return "Februar";
      case "March":
        return "März";
      case "April":
        return "April";
      case "May":
        return "Mai";
      case "June":
        return "Juni";
      case "July":
        return "Juli";
      case "August":
        return "August";
      case "September":
        return "September";
      case "October":
        return "Oktober";
      case "November":
        return "November";
      case "December":
        return "Dezember";

      //temporaer, weil Daten aus dem Logging unschoen benannt sind
      case "13: Strom PV":
        return "PV-Solar_color";
      case "14: Strom Haus":
        return "Stromzaehler";
      case "5: Strom EVI":
        return "EVI_color";
      default:
        break;
    }
  }
}
