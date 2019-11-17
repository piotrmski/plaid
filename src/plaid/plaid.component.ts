import {Component, EventEmitter, OnInit} from '@angular/core';
import {PlaidFacade} from './plaid.facade';
import {Worklog} from './models/worklog';
import {DateRange} from './models/date-range';
import {User} from './models/user';

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
  changeCredentials = new EventEmitter<void>();

  constructor(private facade: PlaidFacade) {}

  ngOnInit(): void {
    // Singleton component, no need to unsubscribe
    this.facade.getAuthenticatedUser$().subscribe(user => this.currentUser = user);
    this.facade.getWorklogs$().subscribe(worklogs => this.worklogs = worklogs);
    this.facade.getWorklogsFetching$().subscribe(loading => this.loading = loading);
  }

  set selectedDateRange(dateRange: DateRange) {
    this._selectedDateRange = dateRange;
    if (this.currentUser) {
      this.facade.fetchWorklogs(dateRange, this.currentUser);
    } else {
      this.facade.fetchAuthenticatedUser();
    }
  }
  get selectedDateRange(): DateRange {
    return this._selectedDateRange;
  }

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

  forgetAccount(): void {
    this.facade.setAuthInfo(null);
    this.facade.discardAuthenticatedUser();
  }
}
