import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {AuthInfo} from '../../model/auth-info';
import {HttpErrorResponse} from '@angular/common/http';
import {User} from '../../model/user';
import {AuthState} from './auth.state';
import {ConnectionIssueModalVisible} from '../../components/connection-issue-resolver/connection-issue-modal-visible';
import {AuthApi} from './auth.api';
import {skip} from 'rxjs/operators';
import {AppStateService} from '../app-state.service';

/**
 * Business logic facade for authentication.
 */
@Injectable({ providedIn: 'root' })
export class AuthFacade {
  constructor(private authState: AuthState, private authApi: AuthApi, private appStateService: AppStateService) {
    // Handle connection issues
    this.authState.getError$().pipe(skip(1)).subscribe(error => {
      if (!this.authState.getAuthenticatedUser() || error && [401, 403].includes(error.status)) { // Authentication error
        this.authState.setAuthenticatedUser(null);
        this.appStateService.setConnectionIssueModalVisible(ConnectionIssueModalVisible.LOGIN);
      } else if (error && error.status === 0) { // Network connection issue
        this.appStateService.setConnectionIssueModalVisible(ConnectionIssueModalVisible.LOST_CONNECTION);
      } else if (error) { // Unknown error
        this.appStateService.setConnectionIssueModalVisible(ConnectionIssueModalVisible.ERROR);
      }
    });
  }

  getAuthInfo$(): Observable<AuthInfo> {
    return this.authState.getAuthInfo$();
  }

  getJiraURL(): string {
    return this.authState.getJiraURL();
  }

  getError$(): Observable<HttpErrorResponse> {
    return this.authState.getError$();
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

  private fetchAuthenticatedUser(): void {
    this.authApi.getAuthenticatedUser$().subscribe(user => {
      this.authState.setAuthenticatedUser(user);
      if (user) {
        this.appStateService.setConnectionIssueModalVisible(ConnectionIssueModalVisible.NONE);
      }
    });
  }
}
