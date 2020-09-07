import {Component, OnInit} from '@angular/core';
import {Worklog} from '../model/worklog';
import {DateRange} from '../model/date-range';
import {User} from '../model/user';
import {ConnectionIssueModalVisible} from './connection-issue-resolver/connection-issue-modal-visible';
import {AuthFacade} from '../core/auth/auth.facade';
import {WorklogFacade} from '../core/worklog/worklog.facade';
import {AppStateService} from '../core/app-state.service';
import {UserPreferencesService} from '../core/user-preferences.service';
import {Theme} from '../model/theme';
import {SystemPreferencesService} from '../core/system-preferences.service';

/**
 * Application container.
 */
@Component({
  selector: 'plaid-root',
  templateUrl: './plaid.component.html',
  styleUrls: ['./plaid.component.scss']
})
export class PlaidComponent implements OnInit {
  pixelsPerMinute: number;
  pixelsPerMinuteExponent = 0.75; // Only for synchronizing internal exponent value between two sets of zoom buttons
  worklogs: Worklog[];
  loading: boolean;
  visibleDateRange: DateRange;
  currentUser: User;
  connectionIssueModalVisible = false;
  workingHoursStartMinutes: number;
  workingHoursEndMinutes: number;
  workingDaysStart: number;
  workingDaysEnd: number;
  visibleDaysStart: number;
  visibleDaysEnd: number;
  hideWeekend: boolean;
  refreshIntervalMinutes: number;
  theme: Theme;

  constructor(
    private systemPreferencesService: SystemPreferencesService, // Injected service early to run its constructor
    private authFacade: AuthFacade,
    private worklogFacade: WorklogFacade,
    private appStateService: AppStateService,
    private userPreferencesService: UserPreferencesService
  ) {}

  ngOnInit(): void {
    // Singleton component, no need to unsubscribe
    this.authFacade.getAuthenticatedUser$().subscribe(user => this.currentUser = user);
    this.worklogFacade.getWorklogs$().subscribe(worklogs => this.worklogs = worklogs);
    this.worklogFacade.getWorklogsFetching$().subscribe(loading => this.loading = loading);
    this.appStateService.getConnectionIssueModalVisible$()
      .subscribe(val => this.connectionIssueModalVisible = val !== ConnectionIssueModalVisible.NONE);
    this.appStateService.getVisibleDateRange$().subscribe(dateRange => this.visibleDateRange = dateRange);
    this.userPreferencesService.getWorkingHoursStartMinutes$().subscribe(value => this.workingHoursStartMinutes = value);
    this.userPreferencesService.getWorkingHoursEndMinutes$().subscribe(value => this.workingHoursEndMinutes = value);
    this.userPreferencesService.getWorkingDaysStart$().subscribe(value => this.workingDaysStart = value);
    this.userPreferencesService.getWorkingDaysEnd$().subscribe(value => this.workingDaysEnd = value);
    this.userPreferencesService.getVisibleDaysStart$().subscribe(value => this.visibleDaysStart = value);
    this.userPreferencesService.getVisibleDaysEnd$().subscribe(value => this.visibleDaysEnd = value);
    this.userPreferencesService.getHideWeekend$().subscribe(value => this.hideWeekend = value);
    this.userPreferencesService.getRefreshIntervalMinutes$().subscribe(value => this.refreshIntervalMinutes = value);
    this.userPreferencesService.getTheme$().subscribe(value => this.theme = value);
  }

  setVisibleDateRange(dateRange: DateRange): void {
    this.appStateService.setVisibleDateRange(dateRange);
  }

  refresh(): void {
    if (this.currentUser) {
      this.worklogFacade.fetchWorklogsVerbose();
    }
  }

  changeCredentials(): void {
    this.appStateService.setConnectionIssueModalVisible(ConnectionIssueModalVisible.LOGIN);
  }

  forgetAccount(): void {
    this.authFacade.logout();
  }

  setWorkingHoursStartMinutes(value: number): void {
    this.userPreferencesService.setWorkingHoursStartMinutes(value);
  }

  setWorkingHoursEndMinutes(value: number): void {
    this.userPreferencesService.setWorkingHoursEndMinutes(value);
  }

  setWorkingDaysStart(value: number): void {
    this.userPreferencesService.setWorkingDaysStart(value);
  }

  setWorkingDaysEnd(value: number): void {
    this.userPreferencesService.setWorkingDaysEnd(value);
  }

  setHideWeekend(value: boolean): void {
    this.userPreferencesService.setHideWeekend(value);
  }

  setRefreshIntervalMinutes(value: number): void {
    this.userPreferencesService.setRefreshIntervalMinutes(value);
  }

  setTheme(value: Theme): void {
    this.userPreferencesService.setTheme(value);
  }
}
