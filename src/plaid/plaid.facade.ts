import {Injectable} from '@angular/core';
import {WorklogApi} from './core/worklog/worklog.api';
import {WorklogState} from './core/worklog/worklog.state';
import {BehaviorSubject, Observable, Subscription} from 'rxjs';
import {Worklog} from './models/worklog';
import {AuthApi} from './core/auth/auth.api';
import {AuthState} from './core/auth/auth.state';
import {AuthInfo} from './models/auth-info';
import {HttpErrorResponse} from '@angular/common/http';
import {DateRange} from './models/date-range';
import {User} from './models/user';
import {SystemPreferencesService} from './core/system-preferences/system-preferences.service';
import {ConnectionIssueModalVisible} from './components/connection-issue-resolver/connection-issue-modal-visible';
import {skip} from 'rxjs/operators';

@Injectable({providedIn: 'root'})
export class PlaidFacade {
  private fetchWorklogsSubscription: Subscription;
  private connectionIssueModalVisible: BehaviorSubject<ConnectionIssueModalVisible> =
    new BehaviorSubject<ConnectionIssueModalVisible>(ConnectionIssueModalVisible.NONE);

  constructor(
    private worklogApi: WorklogApi,
    private worklogState: WorklogState,
    private authApi: AuthApi,
    private authState: AuthState,
    private systemPreferencesService: SystemPreferencesService
  ) {
    // Handle connection issues
    this.authState.getAuthError$().pipe(skip(1)).subscribe(error => {
      if (!this.authState.getAuthenticatedUser() || error && [401, 403].includes(error.status)) { // Authentication error
        this.authState.setAuthenticatedUser(null);
        this.connectionIssueModalVisible.next(ConnectionIssueModalVisible.LOGIN);
      } else if (error && error.status === 0) { // Network connection issue
        this.connectionIssueModalVisible.next(ConnectionIssueModalVisible.LOST_CONNECTION);
      } else if (error) { // Unknown error
        this.connectionIssueModalVisible.next(ConnectionIssueModalVisible.ERROR);
      }
    });
  }

  getWorklogsFetching$(): Observable<boolean> {
    return this.worklogState.getFetching$();
  }

  fetchWorklogs(dateRange: DateRange, user: User) {
    this.worklogState.setFetching(true);

    if (this.fetchWorklogsSubscription) {
      this.fetchWorklogsSubscription.unsubscribe();
    }

    this.fetchWorklogsSubscription = this.worklogApi.getWorklogsForTimePeriod$(dateRange, user)
      .subscribe({
        next: (worklogs: Worklog[]) => this.worklogState.setWorklogs(worklogs),
        complete: () => this.worklogState.setFetching(false)
      });
  }

  getWorklogs$(): Observable<Worklog[]> {
    return this.worklogState.getWorklogs$();
  }

  getAuthInfo$(): Observable<AuthInfo> {
    return this.authState.getAuthInfo$();
  }

  getJiraURL(): string {
    return this.authState.getJiraURL();
  }

  getAuthError$(): Observable<HttpErrorResponse> {
    return this.authState.getAuthError$();
  }

  /**
   * Get the user who's currently authenticated. This value can be relied upon to determine whether the user is logged
   * in.
   */
  getAuthenticatedUser$(): Observable<User> {
    return this.authState.getAuthenticatedUser$();
  }

  /**
   * Save credentials and try to authenticate by fetching the user.
   */
  login(authInfo: AuthInfo): void {
    this.authState.setAuthenticatedUser(null);
    this.authState.setAuthInfo(authInfo);
    this.fetchAuthenticatedUser();
  }

  /**
   * Attempt to fetch current user and if successful then retry requests which failed due to connection loss.
   */
  reconnect(): void {
    this.fetchAuthenticatedUser();
  }

  /**
   * Forget saved credentials and the user fetched in the authentication process.
   */
  logout(): void {
    this.authState.setAuthenticatedUser(null);
    this.authState.setAuthInfo(null);
  }

  /**
   * Shows login modal without losing authentication
   */
  showLoginModal(): void {
    this.connectionIssueModalVisible.next(ConnectionIssueModalVisible.LOGIN);
  }

  closeConnectionIssueModal(): void {
    this.connectionIssueModalVisible.next(ConnectionIssueModalVisible.NONE);
  }

  getConnectionIssueModalVisible$(): Observable<ConnectionIssueModalVisible> {
    return this.connectionIssueModalVisible.asObservable();
  }

  getDarkMode$(): Observable<boolean> {
    return this.systemPreferencesService.darkMode$();
  }

  private fetchAuthenticatedUser(): void {
    this.authApi.getAuthenticatedUser$().subscribe(user => {
      this.authState.setAuthenticatedUser(user);
      if (user) {
        this.connectionIssueModalVisible.next(ConnectionIssueModalVisible.NONE);
      }
    });
  }
}
