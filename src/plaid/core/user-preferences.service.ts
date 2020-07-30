import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UserPreferencesService {
  private readonly WORKING_HOURS_START_MINUTES = 'WORKING_HOURS_START_MINUTES';
  private readonly WORKING_HOURS_END_MINUTES = 'WORKING_HOURS_END_MINUTES';
  private readonly WORKING_DAYS_START = 'WORKING_DAYS_START';
  private readonly WORKING_DAYS_END = 'WORKING_DAYS_END';

  private workingHoursStartMinutes: BehaviorSubject<number> =
    new BehaviorSubject<number>(Number(localStorage.getItem('WORKING_HOURS_START_MINUTES') || 540));
  private workingHoursEndMinutes: BehaviorSubject<number> =
    new BehaviorSubject<number>(Number(localStorage.getItem('WORKING_HOURS_END_MINUTES') || 1020));
  private workingDaysStart: BehaviorSubject<number> =
    new BehaviorSubject<number>(Number(localStorage.getItem('WORKING_DAYS_START') || 1));
  private workingDaysEnd: BehaviorSubject<number> =
    new BehaviorSubject<number>(Number(localStorage.getItem('WORKING_DAYS_END') || 5));

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
    localStorage.setItem(this.WORKING_DAYS_START, value.toString());
  }

  getWorkingDaysStart$(): Observable<number> {
    return this.workingDaysStart.asObservable();
  }

  setWorkingDaysEnd(value: number): void {
    this.workingDaysEnd.next(value);
    localStorage.setItem(this.WORKING_DAYS_END, value.toString());
  }

  getWorkingDaysEnd$(): Observable<number> {
    return this.workingDaysEnd.asObservable();
  }
}
