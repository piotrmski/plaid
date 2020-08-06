import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {UserPreferencesService} from './user-preferences.service';
const {nativeTheme} = window.require('electron').remote;

@Injectable({ providedIn: 'root' })
export class SystemPreferencesService {
  private darkModeSubject = new BehaviorSubject<boolean>(nativeTheme.shouldUseDarkColors);

  constructor(private userPreferencesService: UserPreferencesService) {
    userPreferencesService.getTheme$().subscribe(theme => nativeTheme.themeSource = theme);
    nativeTheme.removeAllListeners('updated');
    nativeTheme.addListener('updated', () => this.darkModeSubject.next(nativeTheme.shouldUseDarkColors));
  }

  getDarkMode$(): Observable<boolean> {
    return this.darkModeSubject.asObservable();
  }
}
