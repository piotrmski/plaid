import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
const {ipcRenderer} = window.require('electron');

@Injectable({ providedIn: 'root' })
export class SystemPreferencesService {
  private darkModeSubject = new BehaviorSubject<boolean>(false);

  constructor() {
    ipcRenderer.on('shouldUseDarkColors', (_, darkMode) => this.darkModeSubject.next(darkMode));
    ipcRenderer.send('getShouldUseDarkColors');
  }

  darkMode$(): Observable<boolean> {
    return this.darkModeSubject.asObservable();
  }
}
