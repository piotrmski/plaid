import {Component, OnInit} from '@angular/core';
import {Worklog} from './models/worklog';
import {DateRange} from './models/date-range';
import {User} from './models/user';
import {ConnectionIssueModalVisible} from './components/connection-issue-resolver/connection-issue-modal-visible';
import {AuthFacade} from './core/auth/auth.facade';
import {WorklogFacade} from './core/worklog/worklog.facade';
import {AppStateService} from './core/app-state.service';

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
  worklogs: Worklog[];
  loading: boolean;
  visibleDateRange: DateRange;
  currentUser: User;
  connectionIssueModalVisible = false;

  constructor(
    private authFacade: AuthFacade,
    private worklogFacade: WorklogFacade,
    private appStateService: AppStateService
  ) {}

  ngOnInit(): void {
    // Singleton component, no need to unsubscribe
    this.authFacade.getAuthenticatedUser$().subscribe(user => this.currentUser = user);
    this.worklogFacade.getWorklogs$().subscribe(worklogs => this.worklogs = worklogs);
    this.worklogFacade.getWorklogsFetching$().subscribe(loading => this.loading = loading);
    this.appStateService.getConnectionIssueModalVisible$()
      .subscribe(val => this.connectionIssueModalVisible = val !== ConnectionIssueModalVisible.NONE);
    this.appStateService.getVisibleDateRange$().subscribe(dateRange => this.visibleDateRange = dateRange);
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
}
