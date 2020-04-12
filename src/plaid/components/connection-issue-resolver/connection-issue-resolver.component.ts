import {Component, OnInit} from '@angular/core';
import {AuthInfo} from '../../models/auth-info';
import {HttpErrorResponse} from '@angular/common/http';
import {User} from '../../models/user';
import {ConnectionIssueModalVisible} from './connection-issue-modal-visible';
import {AuthFacade} from '../../core/auth/auth.facade';
import {AppStateService} from '../../core/app-state.service';

/**
 * Smart component, presents login, lost connection, and error modals and handles login and reconnect actions.
 */
@Component({
  selector: 'plaid-connection-issue-resolver',
  templateUrl: './connection-issue-resolver.component.html',
  styleUrls: ['./connection-issue-resolver.component.scss']
})
export class ConnectionIssueResolverComponent implements OnInit {
  modalVisible: ConnectionIssueModalVisible = ConnectionIssueModalVisible.NONE;
  authInfo: AuthInfo = { jiraUrl: null, username: null, password: null };
  _error: HttpErrorResponse;
  fetching = false;
  _currentUser: User = null;
  httpNoticeVisible = false;

  readonly ConnectionIssueModalVisible = ConnectionIssueModalVisible;

  constructor(private authFacade: AuthFacade, private appStateService: AppStateService) {}

  ngOnInit(): void {
    // Singleton component, no need to unsubscribe
    this.authFacade.getError$().subscribe((authError: HttpErrorResponse) => this.error = authError);
    this.authFacade.getAuthenticatedUser$().subscribe(user => this.currentUser = user);
    this.appStateService.getConnectionIssueModalVisible$().subscribe(val => this.modalVisible = val);
    this.authFacade.getAuthInfo$().subscribe(authInfo => this.authInfo = authInfo || { jiraUrl: null, username: null, password: null });
  }

  set error(error: HttpErrorResponse) {
    this._error = error;
    this.fetching = false;
  }
  get error(): HttpErrorResponse {
    return this._error;
  }

  set currentUser(user: User) {
    this._currentUser = user;
    this.fetching = false;
    if (user) {
      this._error = null;
    }
  }
  get currentUser(): User {
    return this._currentUser;
  }

  onUrlChange(): void {
    if (this.authInfo.jiraUrl && this.authInfo.jiraUrl.length > 0) {
      // Remove trailing slash
      if (this.authInfo.jiraUrl[this.authInfo.jiraUrl.length - 1] === '/') {
        this.authInfo.jiraUrl = this.authInfo.jiraUrl.substr(0, this.authInfo.jiraUrl.length - 1);
      }
      // Add protocol if missing
      if (this.authInfo.jiraUrl.substr(0, 7) !== 'http://' && this.authInfo.jiraUrl.substr(0, 8) !== 'https://') {
        this.authInfo.jiraUrl = 'https://' + this.authInfo.jiraUrl;
      }
      // Display http notice if applicable
      this.httpNoticeVisible = this.authInfo.jiraUrl.substr(0, 7) === 'http://';
    }
  }

  login(): void {
    this.onUrlChange();
    this.authFacade.login(this.authInfo);
    this.fetching = true;
  }

  reconnect(): void {
    this.authFacade.reconnect();
    this.fetching = true;
  }

  closeModal(): void {
    this.appStateService.setConnectionIssueModalVisible(ConnectionIssueModalVisible.NONE);
  }

  get applicationErrorBody(): string {
    return JSON.stringify(this.error && this.error.error ? this.error.error : null);
  }
}
