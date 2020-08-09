import {Injectable} from '@angular/core';
import {Observable, Subscription} from 'rxjs';
import {DateRange} from '../../models/date-range';
import {User} from '../../models/user';
import {Worklog} from '../../models/worklog';
import {WorklogState} from './worklog.state';
import {WorklogApi} from './worklog.api';
import {AuthFacade} from '../auth/auth.facade';
import {AppStateService} from '../app-state.service';
import {tap} from 'rxjs/operators';
import {Calendar} from '../../helpers/calendar';
import {UserPreferencesService} from '../user-preferences.service';
import Timeout = NodeJS.Timeout;

/**
 * Business logic facade for work logs.
 */
@Injectable({ providedIn: 'root' })
export class WorklogFacade {
  private fetchWorklogsSubscription: Subscription;
  visibleDateRange: DateRange;
  currentUser: User;
  refreshIntervalTimeoutMinutes: number;
  refreshIntervalHandle: Timeout;

  constructor(
    private worklogState: WorklogState,
    private worklogApi: WorklogApi,
    private authFacade: AuthFacade,
    private appStateService: AppStateService,
    private userPreferencesService: UserPreferencesService
  ) {
    // Fetch work logs after visible date range change
    this.appStateService.getVisibleDateRange$().subscribe(dateRange => {
      const oldVisibleDateRange: DateRange = this.visibleDateRange;
      this.visibleDateRange = Calendar.copyDateRange(dateRange);
      if (this.currentUser) {
        // Fetching worklogs is omitted when the new date range is a sub-interval of the old date range.
        if (oldVisibleDateRange.start.getTime() > dateRange.start.getTime() ||
          oldVisibleDateRange.end.getTime() < dateRange.end.getTime()) {
          this.fetchWorklogsVerbose();
        }
      } else {
        // When application launches, authentication data may be present, but the application is in a state of lack of
        // authentication, hence the attempt to reconnect. This is the initial kick to load remote data.
        this.authFacade.reconnect();
      }
    });

    // Fetch work logs after user change
    this.authFacade.getAuthenticatedUser$().subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.fetchWorklogsVerbose();
      } else {
        this.worklogState.setWorklogs([]);
      }
    });

    this.userPreferencesService.getRefreshIntervalMinutes$().subscribe(interval => {
      this.refreshIntervalTimeoutMinutes = interval;
      this.reschedulePeriodicRefreshing();
    });
  }

  /**
   * Refreshes work logs by emitting the updated list on every stage of the refreshing process and emits 'fetching'.
   */
  fetchWorklogsVerbose(): void {
    this.worklogState.setFetching(true);

    if (this.fetchWorklogsSubscription) {
      this.fetchWorklogsSubscription.unsubscribe();
    }

    this.fetchWorklogsSubscription = this.worklogApi.getWorklogsForDateRangeVerbose$(this.visibleDateRange, this.currentUser)
      .subscribe({
        next: (worklogs: Worklog[]) => this.worklogState.setWorklogs(worklogs),
        complete: () => this.worklogState.setFetching(false)
      });

    this.reschedulePeriodicRefreshing();
  }

  /**
   * Refreshes work logs by emitting the updated list only once and doesn't emit 'fetching' afterwards.
   */
  fetchWorklogsQuiet(): void {
    if (this.fetchWorklogsSubscription) {
      this.fetchWorklogsSubscription.unsubscribe();
    }

    this.fetchWorklogsSubscription = this.worklogApi.getWorklogsForDateRangeQuiet$(this.visibleDateRange, this.currentUser)
      .subscribe((worklogs: Worklog[]) => {
        this.worklogState.setWorklogs(worklogs);
        this.worklogState.setFetching(false);
      });
  }

  getWorklogsFetching$(): Observable<boolean> {
    return this.worklogState.getFetching$();
  }

  getWorklogs$(): Observable<Worklog[]> {
    return this.worklogState.getWorklogs$();
  }

  /**
   * Upon subscription updates work log entry, emits response from the server after it acknowledged the update
   */
  updateWorklog$(worklog: Worklog, started: Date, timeSpentSeconds: number, comment: string): Observable<Worklog> {
    return this.worklogApi.updateWorklog(worklog.issueId, worklog.id, started, timeSpentSeconds, comment).pipe(
      tap<Worklog>(updated => this.worklogState.updateWorklog({...worklog, ...updated}))
    );
  }

  reschedulePeriodicRefreshing(): void {
    if (this.refreshIntervalHandle != null) {
      clearInterval(this.refreshIntervalHandle);
      this.refreshIntervalHandle = null;
    }

    if (this.refreshIntervalTimeoutMinutes > 0) {
      this.refreshIntervalHandle =
        setInterval(() => this.fetchWorklogsQuiet(), this.refreshIntervalTimeoutMinutes * 60000);
    }
  }
}
