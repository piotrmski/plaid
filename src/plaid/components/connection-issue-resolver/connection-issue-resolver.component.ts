import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {PlaidFacade} from '../../plaid.facade';
import {AuthInfo} from '../../models/auth-info';
import {HttpErrorResponse} from '@angular/common/http';
import {skip} from 'rxjs/operators';
import {User} from '../../models/user';

// TODO move some logic to facade
@Component({
  selector: 'plaid-connection-issue-resolver',
  templateUrl: './connection-issue-resolver.component.html',
  styleUrls: ['./connection-issue-resolver.component.scss']
})
export class ConnectionIssueResolverComponent implements OnInit {
  loginModalVisible = false;
  lostConnectionModalVisible = false;
  errorModalVisible = false;
  authInfo: AuthInfo = { jiraUrl: null, username: null, password: null };
  _error: HttpErrorResponse;
  fetching = false;
  _currentUser: User = null;
  httpNoticeVisible = false;

  @Input()
  changeCredentials: EventEmitter<void>;

  @Output()
  modalVisible = new EventEmitter<boolean>();

  constructor(private facade: PlaidFacade) {}

  ngOnInit(): void {
    // Singleton component, no need to unsubscribe
    this.facade.getAuthError$().pipe(skip(1)).subscribe((authError: HttpErrorResponse) => this.error = authError);
    this.facade.getAuthenticatedUser$().pipe(skip(1)).subscribe(user => this.currentUser = user);
    this.changeCredentials.subscribe(() => {
      this.loginModalVisible = true;
      this._error = null;
      this.fetching = false;
      this.authInfo = this.facade.getAuthInfo() ? this.facade.getAuthInfo() : { jiraUrl: null, username: null, password: null };
      this.modalVisible.emit(true);
    });
  }

  set error(error: HttpErrorResponse) {
    this._error = error;
    this.fetching = false;
    if (!this.currentUser || error && [401, 403].indexOf(error.status) !== -1) { // Authentication error
      this.facade.discardAuthenticatedUser();
      this.loginModalVisible = true;
      this.authInfo = this.facade.getAuthInfo() ? this.facade.getAuthInfo() : { jiraUrl: null, username: null, password: null };
      this.modalVisible.emit(true);
    } else if (error && error.status === 0) { // Network connection issue
      this.lostConnectionModalVisible = true;
      this.modalVisible.emit(true);
    } else if (error) { // Unknown error
      this.errorModalVisible = true;
      this.modalVisible.emit(true);
    }
  }
  get error(): HttpErrorResponse {
    return this._error;
  }

  set currentUser(user: User) {
    this._currentUser = user;
    if (user) {
      this.loginModalVisible = false;
      this.lostConnectionModalVisible = false;
      this.errorModalVisible = false;
      this.modalVisible.emit(false);
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

  submit(): void {
    this.onUrlChange();
    this.facade.setAuthInfo(this.authInfo);
    this.facade.discardAuthenticatedUser();
    this.facade.fetchAuthenticatedUser();
    this.fetching = true;
  }

  resubmit(): void {
    this.facade.fetchAuthenticatedUser();
    this.fetching = true;
  }
}
