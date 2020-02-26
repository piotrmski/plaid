import {Component, EventEmitter, OnInit} from '@angular/core';
import {PlaidFacade} from './plaid.facade';
import {Worklog} from './models/worklog';
import {DateRange} from './models/date-range';
import {User} from './models/user';
import {ConnectionIssueModalVisible} from './components/connection-issue-resolver/connection-issue-modal-visible';

/**
 * Application container.
 */
@Component({
  selector: 'plaid-root',
  templateUrl: './plaid.component.html',
  styleUrls: ['./plaid.component.scss']
})
export class PlaidComponent implements OnInit {
  pixelsPerMinute = 2;
  worklogs: Worklog[];
  loading: boolean;
  _selectedDateRange: DateRange;
  _currentUser: User;
  connectionIssueModalVisible = false;

  constructor(private facade: PlaidFacade) {}

  ngOnInit(): void {
    // Singleton component, no need to unsubscribe
    this.facade.getAuthenticatedUser$().subscribe(user => this.currentUser = user);
    this.facade.getWorklogs$().subscribe(worklogs => this.worklogs = worklogs);
    this.facade.getWorklogsFetching$().subscribe(loading => this.loading = loading);
    this.facade.getConnectionIssueModalVisible$()
      .subscribe(val => this.connectionIssueModalVisible = val !== ConnectionIssueModalVisible.NONE);
  }

  /**
   * Date range visible on the grid. After range change work log entries are fetched for given range.
   */
  set selectedDateRange(dateRange: DateRange) {
    this._selectedDateRange = dateRange;
    if (this.currentUser) {
      this.facade.fetchWorklogs(dateRange, this.currentUser);
    } else {
      this.facade.reconnect();
    }
  }
  get selectedDateRange(): DateRange {
    return this._selectedDateRange;
  }

  /**
   * Currently authenticated user. After change work log entries for current date range are updated.
   */
  set currentUser(user: User) {
    this._currentUser = user;
    if (user) {
      if (this.selectedDateRange) {
        this.facade.fetchWorklogs(this.selectedDateRange, user);
      }
    } else {
      this.worklogs = [];
    }
  }
  get currentUser(): User {
    return this._currentUser;
  }

  refresh(): void {
    if (this.currentUser) {
      this.facade.fetchWorklogs(this.selectedDateRange, this.currentUser);
    }
  }

  changeCredentials(): void {
    this.facade.showLoginModal();
  }

  forgetAccount(): void {
    this.facade.logout();
  }
}
