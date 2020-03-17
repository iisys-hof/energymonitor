import { Injectable } from '@angular/core';
import { NativeStorage } from "@ionic-native/native-storage";

@Injectable()
export class SettingsStoreProvider {

  keyUsername: string = "username";
  keyPassword: string = "password";

  constructor(private nativeStorage: NativeStorage) {
  }

   public saveSettings() {
    
  }

  public getSettings() {

  }

  private save(username: string, password: string) {
    this.nativeStorage.setItem(this.keyUsername, username);
    this.nativeStorage.setItem(this.keyPassword, password);
  }
  
  private load() {

  }

}
