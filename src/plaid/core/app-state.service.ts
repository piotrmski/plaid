import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {ConnectionIssueModalVisible} from '../components/connection-issue-resolver/connection-issue-modal-visible';
import {DateRange} from '../model/date-range';
import {UserPreferencesService} from './user-preferences.service';

@Injectable({ providedIn: 'root' })
export class AppStateService {
  private connectionIssueModalVisible: BehaviorSubject<ConnectionIssueModalVisible> =
    new BehaviorSubject<ConnectionIssueModalVisible>(ConnectionIssueModalVisible.NONE);
  private visibleDateRange: BehaviorSubject<DateRange> =
    new BehaviorSubject<DateRange>(this.getInitialVisibleDateRange());

  constructor(private userPrefsService: UserPreferencesService) {
  }

  private getInitialVisibleDateRange(): DateRange {
    const curTime: Date = new Date();
    const weekStart: Date = new Date(
      curTime.getFullYear(),
      curTime.getMonth(),
      curTime.getDate() - curTime.getDay() + this.userPrefsService.getVisibleDaysStart()
    );
    const weekEnd: Date = new Date(
      weekStart.getFullYear(),
      weekStart.getMonth(),
      weekStart.getDate() + this.userPrefsService.getVisibleDaysEnd() - this.userPrefsService.getVisibleDaysStart()
    );
    return { start: weekStart, end: weekEnd };
  }

  setConnectionIssueModalVisible(visible: ConnectionIssueModalVisible): void {
    this.connectionIssueModalVisible.next(visible);
  }

  getConnectionIssueModalVisible$(): Observable<ConnectionIssueModalVisible> {
    return this.connectionIssueModalVisible.asObservable();
  }

  setVisibleDateRange(range: DateRange): void {
    this.visibleDateRange.next(range);
  }

  getVisibleDateRange$(): Observable<DateRange> {
    return this.visibleDateRange.asObservable();
  }
}
