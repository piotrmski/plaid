import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {Theme} from '../models/theme';

@Injectable({ providedIn: 'root' })
export class UserPreferencesService {
  private readonly WORKING_HOURS_START_MINUTES = 'WORKING_HOURS_START_MINUTES';
  private readonly WORKING_HOURS_END_MINUTES = 'WORKING_HOURS_END_MINUTES';
  private readonly WORKING_DAYS_START = 'WORKING_DAYS_START';
  private readonly WORKING_DAYS_END = 'WORKING_DAYS_END';
  private readonly HIDE_WEEKEND = 'HIDE_WEEKEND';
  private readonly REFRESH_INTERVAL = 'REFRESH_INTERVAL';
  private readonly THEME = 'THEME';

  private workingHoursStartMinutes: BehaviorSubject<number> =
    new BehaviorSubject<number>(Number(localStorage.getItem(this.WORKING_HOURS_START_MINUTES) || 540));
  private workingHoursEndMinutes: BehaviorSubject<number> =
    new BehaviorSubject<number>(Number(localStorage.getItem(this.WORKING_HOURS_END_MINUTES) || 1020));
  private workingDaysStart: BehaviorSubject<number> =
    new BehaviorSubject<number>(Number(localStorage.getItem(this.WORKING_DAYS_START) || 1));
  private workingDaysEnd: BehaviorSubject<number> =
    new BehaviorSubject<number>(Number(localStorage.getItem(this.WORKING_DAYS_END) || 5));
  private hideWeekend: BehaviorSubject<boolean> =
    new BehaviorSubject<boolean>(localStorage.getItem(this.HIDE_WEEKEND) === '1');
  private visibleDaysStart: BehaviorSubject<number> = new BehaviorSubject<number>(
    localStorage.getItem(this.HIDE_WEEKEND) === '1' ? Number(localStorage.getItem(this.WORKING_DAYS_START) || 1) : 0
  );
  private visibleDaysEnd: BehaviorSubject<number> = new BehaviorSubject<number>(
    localStorage.getItem(this.HIDE_WEEKEND) === '1' ? Number(localStorage.getItem(this.WORKING_DAYS_END) || 5) : 6
  );
  private refreshIntervalMinutes: BehaviorSubject<number> =
    new BehaviorSubject<number>(Number(localStorage.getItem(this.REFRESH_INTERVAL) || 0));
  private theme: BehaviorSubject<Theme> =
    new BehaviorSubject<Theme>((localStorage.getItem(this.THEME) || 'system') as Theme);

  setWorkingHoursStartMinutes(value: number): void {
    this.workingHoursStartMinutes.next(value);
    localStorage.setItem(this.WORKING_HOURS_START_MINUTES, value.toString());
  }

  getWorkingHoursStartMinutes$(): Observable<number> {
    return this.workingHoursStartMinutes.asObservable();
  }

  setWorkingHoursEndMinutes(value: number): void {
    this.workingHoursEndMinutes.next(value);
    localStorage.setItem(this.WORKING_HOURS_END_MINUTES, value.toString());
  }

  getWorkingHoursEndMinutes$(): Observable<number> {
    return this.workingHoursEndMinutes.asObservable();
  }

  setWorkingDaysStart(value: number): void {
    this.workingDaysStart.next(value);
    if (this.hideWeekend.getValue()) {
      this.visibleDaysStart.next(value);
    }
    localStorage.setItem(this.WORKING_DAYS_START, value.toString());
  }

  getWorkingDaysStart$(): Observable<number> {
    return this.workingDaysStart.asObservable();
  }

  getVisibleDaysStart(): number {
    return this.visibleDaysStart.getValue();
  }

  getVisibleDaysStart$(): Observable<number> {
    return this.visibleDaysStart.asObservable();
  }

  setWorkingDaysEnd(value: number): void {
    this.workingDaysEnd.next(value);
    if (this.hideWeekend.getValue()) {
      this.visibleDaysEnd.next(value);
    }
    localStorage.setItem(this.WORKING_DAYS_END, value.toString());
  }

  getWorkingDaysEnd$(): Observable<number> {
    return this.workingDaysEnd.asObservable();
  }

  getVisibleDaysEnd(): number {
    return this.visibleDaysEnd.getValue();
  }

  getVisibleDaysEnd$(): Observable<number> {
    return this.visibleDaysEnd.asObservable();
  }

  setHideWeekend(value: boolean): void {
    this.hideWeekend.next(value);
    if (this.workingDaysStart.getValue() !== 0) {
      this.visibleDaysStart.next(value ? this.workingDaysStart.getValue() : 0);
    }
    if (this.workingDaysEnd.getValue() !== 6) {
      this.visibleDaysEnd.next(value ? this.workingDaysEnd.getValue() : 6);
    }
    localStorage.setItem(this.HIDE_WEEKEND, value ? '1' : '0');
  }

  getHideWeekend$(): Observable<boolean> {
    return this.hideWeekend.asObservable();
  }

  getRefreshIntervalMinutes$(): Observable<number> {
    return this.refreshIntervalMinutes.asObservable();
  }

  setRefreshIntervalMinutes(value: number): void {
    this.refreshIntervalMinutes.next(value);
    localStorage.setItem(this.REFRESH_INTERVAL, value.toString());
  }

  getTheme$(): Observable<Theme> {
    return this.theme.asObservable();
  }

  setTheme(value: Theme): void {
    this.theme.next(value);
    localStorage.setItem(this.THEME, value);
  }
}
