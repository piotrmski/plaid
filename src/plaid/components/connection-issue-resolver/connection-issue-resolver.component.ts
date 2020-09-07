import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {AuthInfo} from '../../model/auth-info';
import {HttpErrorResponse} from '@angular/common/http';
import {User} from '../../model/user';
import {ConnectionIssueModalVisible} from './connection-issue-modal-visible';
import {AuthFacade} from '../../core/auth/auth.facade';
import {AppStateService} from '../../core/app-state.service';
import { Subject } from 'rxjs';

/**
 * Smart component, contains login, lost connection, and error modals and handles login and reconnect actions.
 */
@Component({
  selector: 'plaid-connection-issue-resolver',
  templateUrl: './connection-issue-resolver.component.html',
  styleUrls: ['./connection-issue-resolver.component.scss']
})
export class ConnectionIssueResolverComponent implements OnInit {
  modalVisible: ConnectionIssueModalVisible = ConnectionIssueModalVisible.NONE;
  authInfo: AuthInfo = { jiraUrl: null, username: null, password: null };
  error: HttpErrorResponse;
  fetching = false;
  startReconnectCountdown = new Subject<void>();

  readonly ConnectionIssueModalVisible = ConnectionIssueModalVisible;

  constructor(private authFacade: AuthFacade, private appStateService: AppStateService) {}

  ngOnInit(): void {
    // Singleton component, no need to unsubscribe
    this.authFacade.getError$().subscribe((authError: HttpErrorResponse) => this.errorUpdated(authError));
    this.authFacade.getAuthenticatedUser$().subscribe(user => this.currentUserUpdated(user));
    this.appStateService.getConnectionIssueModalVisible$().subscribe(val => {
      this.modalVisible = val;
      if (val === ConnectionIssueModalVisible.LOST_CONNECTION) {
        this.startReconnectCountdown.next();
      }
    });
    this.authFacade.getAuthInfo$().subscribe(authInfo => this.authInfo = authInfo || { jiraUrl: null, username: null, password: null });
  }

  errorUpdated(error: HttpErrorResponse): void {
    this.error = error;
    this.fetching = false;
  }

  currentUserUpdated(user: User): void {
    this.fetching = false;
    if (user) {
      this.error = null;
    }
  }

  login(): void {
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
}
