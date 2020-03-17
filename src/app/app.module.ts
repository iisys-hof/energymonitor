import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';
import { SQLite } from '@ionic-native/sqlite';

import { MyApp } from './app.component';
import { HomePage } from '../pages/home/home';
import { OverviewPage } from '../pages/overview/overview';
import { SettingsPage } from '../pages/settings/settings';
import { SettingsStoreProvider } from '../providers/settings-store/settings-store';
import { NativeStorage } from "@ionic-native/native-storage";
import { HttpModule } from '@angular/http';
import { DataPipe } from '../pipes/data/data';
import { DataDetailsPage } from '../pages/data-details/data-details';
import { DatabaseProvider } from '../providers/database/database';
import { EnergyMonitorPage } from '../pages/energy-monitor/energy-monitor';
import { ApiHandlerProvider } from '../providers/api-handler/api-handler';
import { HTTP } from '@ionic-native/http';
import { AboutPage } from '../pages/about/about';

@NgModule({
  declarations: [
    MyApp,
    HomePage,
    OverviewPage,
    SettingsPage,
    DataDetailsPage,
    DataPipe,
    EnergyMonitorPage,
    AboutPage
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp, {
      platforms: {
        ios: {
          backButtonText: "Zurück"
        }
      }
    }),
    HttpModule
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    HomePage,
    OverviewPage,
    SettingsPage,
    DataDetailsPage,
    EnergyMonitorPage,
    AboutPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    NativeStorage,
    SettingsStoreProvider,
    DatabaseProvider,
    SQLite,
    ApiHandlerProvider,
    HTTP
  ]
})
export class AppModule {}
