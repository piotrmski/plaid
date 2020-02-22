import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
const {nativeTheme} = window.require('electron').remote;

@Injectable({ providedIn: 'root' })
export class SystemPreferencesService {
  private darkModeSubject = new BehaviorSubject<boolean>(nativeTheme.shouldUseDarkColors);

  constructor() {
    nativeTheme.on('updated', () => this.darkModeSubject.next(nativeTheme.shouldUseDarkColors));
  }

  darkMode$(): Observable<boolean> {
    return this.darkModeSubject.asObservable();
  }
}
