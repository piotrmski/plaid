import {Injectable} from '@angular/core';
import {WorklogApi} from './core/worklog/worklog.api';
import {WorklogState} from './core/worklog/worklog.state';
import {fromEvent, Observable, Subject, Subscription} from 'rxjs';
import {Worklog} from './models/worklog';
import {AuthApi} from './core/auth/auth.api';
import {AuthState} from './core/auth/auth.state';
import {AuthInfo} from './models/auth-info';
import {HttpErrorResponse, HttpEvent} from '@angular/common/http';
import {DateRange} from './models/date-range';
import {User} from './models/user';
import {debounceTime, filter, mergeMap, skip, take} from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class PlaidFacade {
  private fetchWorklogsSubscription: Subscription;
  private windowResize = new Subject<void>();

  constructor(
    private worklogApi: WorklogApi,
    private worklogState: WorklogState,
    private authApi: AuthApi,
    private authState: AuthState
  ) {
    fromEvent(window, 'resize').pipe(debounceTime(100)).subscribe(() => this.windowResize.next());
  }

  windowResize$(): Observable<void> {
    return this.windowResize.asObservable();
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

  setAuthInfo(authInfo: AuthInfo) {
    this.authState.setAuthInfo(authInfo);
  }

  getAuthInfo(): AuthInfo {
    return this.authState.getAuthInfo();
  }

  getJiraURL$(): Observable<string> {
    return this.authState.getJiraURL$();
  }

  setAuthError(error: HttpErrorResponse): void {
    this.authState.setAuthError(error);
  }

  getAuthError$(): Observable<HttpErrorResponse> {
    return this.authState.getAuthError$();
  }

  retryAfterAuthenticated(event$fn: () => Observable<HttpEvent<any>>): Observable<HttpEvent<any>> {
    return this.authState.getAuthenticatedUser$().pipe(
      skip<User>(1),
      filter<User>((user: User) => user != null),
      take<User>(1),
      mergeMap<User, Observable<HttpEvent<any>>>(() => event$fn())
    );
  }

  getAuthHeader(): string {
    return this.authState.getAuthHeader();
  }

  fetchAuthenticatedUser(): void {
    this.authApi.getAuthenticatedUser$().subscribe(user => {
      this.authState.setAuthenticatedUser(user);
    });
  }

  discardAuthenticatedUser(): void {
    this.authState.setAuthenticatedUser(null);
  }

  getAuthenticatedUser$(): Observable<User> {
    return this.authState.getAuthenticatedUser$();
  }
}
