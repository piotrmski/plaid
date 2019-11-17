import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {HttpErrorResponse} from '@angular/common/http';
import {AuthInfo} from '../../models/auth-info';
import {User} from '../../models/user';

@Injectable({ providedIn: 'root' })
export class AuthState {
  private readonly AUTH_INFO = 'AUTH_INFO';
  private readonly AUTH_HEADER = 'AUTH_HEADER';

  private jiraURL = new BehaviorSubject<string>(
    localStorage.getItem(this.AUTH_INFO) ? JSON.parse(localStorage.getItem(this.AUTH_INFO)).jiraUrl : null
  );
  private authError = new BehaviorSubject<HttpErrorResponse>(null);
  private authenticatedUser = new BehaviorSubject<User>(null);

  static getAuthHeaderKey(authInfo: AuthInfo): string {
    return 'Basic ' + btoa(authInfo.username + ':' + authInfo.password);
  }

  setAuthInfo(authInfo: AuthInfo): void {
    if (authInfo) {
      const header: string = AuthState.getAuthHeaderKey(authInfo);
      localStorage.setItem(this.AUTH_INFO, JSON.stringify(authInfo));
      localStorage.setItem(this.AUTH_HEADER, header);
      this.jiraURL.next(authInfo.jiraUrl);
    } else {
      localStorage.removeItem(this.AUTH_INFO);
      localStorage.removeItem(this.AUTH_HEADER);
      this.jiraURL.next(null);
    }
  }

  getAuthInfo(): AuthInfo {
    const infoJson: string = localStorage.getItem(this.AUTH_INFO);
    return infoJson ? JSON.parse(infoJson) : null;
  }

  getAuthHeader(): string {
    return localStorage.getItem(this.AUTH_HEADER);
  }

  setAuthError(authorized: HttpErrorResponse): void {
    this.authError.next(authorized);
  }

  getAuthError$(): Observable<HttpErrorResponse> {
    return this.authError.asObservable();
  }

  getJiraURL$(): Observable<string> {
    return this.jiraURL.asObservable();
  }

  getAuthenticatedUser$(): Observable<User> {
    return this.authenticatedUser.asObservable();
  }

  setAuthenticatedUser(user: User): void {
    this.authenticatedUser.next(user);
  }
}
