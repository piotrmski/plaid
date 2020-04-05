import {Injectable} from '@angular/core';
import {Observable, Subscription} from 'rxjs';
import {DateRange} from '../../models/date-range';
import {User} from '../../models/user';
import {Worklog} from '../../models/worklog';
import {WorklogState} from './worklog.state';
import {WorklogApi} from './worklog.api';
import {AuthFacade} from '../auth/auth.facade';
import {AppStateService} from '../app-state.service';

/**
 * Business logic facade for work logs.
 */
@Injectable({ providedIn: 'root' })
export class WorklogFacade {
  private fetchWorklogsSubscription: Subscription;
  visibleDateRange: DateRange;
  currentUser: User;

  constructor(
    private worklogState: WorklogState,
    private worklogApi: WorklogApi,
    private authFacade: AuthFacade,
    private appStateService: AppStateService
  ) {
    // Fetch work logs after visible date range change
    this.appStateService.getVisibleDateRange$().subscribe(dateRange => {
      this.visibleDateRange = dateRange;
      if (this.currentUser) {
        this.fetchWorklogsVerbose();
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
  }

  /**
   * Refresh work logs by emitting the updated list on every stage of the refreshing process and emit 'fetching'.
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
  }

  /**
   * Refresh work logs by emitting the updated list only once after don't emit 'fetching'
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
}
