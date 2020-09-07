import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {HttpErrorResponse} from '@angular/common/http';
import {AuthInfo} from '../../model/auth-info';
import {User} from '../../model/user';

@Injectable({ providedIn: 'root' })
export class AuthState {
  private readonly AUTH_INFO = 'AUTH_INFO';
  private readonly AUTH_HEADER = 'AUTH_HEADER';

  private jiraURL: string = localStorage.getItem(this.AUTH_INFO)
    ? JSON.parse(localStorage.getItem(this.AUTH_INFO)).jiraUrl
    : null;
  private error = new BehaviorSubject<HttpErrorResponse>(null);
  private authenticatedUser = new BehaviorSubject<User>(null);
  private authInfo = new BehaviorSubject<AuthInfo>(this.getAuthInfo());

  static getAuthHeaderKey(authInfo: AuthInfo): string {
    return 'Basic ' + btoa(authInfo.username + ':' + authInfo.password);
  }

  setAuthInfo(authInfo: AuthInfo): void {
    if (authInfo) {
      const header: string = AuthState.getAuthHeaderKey(authInfo);
      localStorage.setItem(this.AUTH_INFO, JSON.stringify(authInfo));
      localStorage.setItem(this.AUTH_HEADER, header);
      this.jiraURL = authInfo.jiraUrl;
    } else {
      localStorage.removeItem(this.AUTH_INFO);
      localStorage.removeItem(this.AUTH_HEADER);
      this.jiraURL = null;
    }
    this.authInfo.next(this.getAuthInfo());
  }

  getAuthInfo(): AuthInfo {
    const infoJson: string = localStorage.getItem(this.AUTH_INFO);
    return infoJson ? JSON.parse(infoJson) : null;
  }

  getAuthInfo$(): Observable<AuthInfo> {
    return this.authInfo.asObservable();
  }

  getAuthHeader(): string {
    return localStorage.getItem(this.AUTH_HEADER);
  }

  setError(authorized: HttpErrorResponse): void {
    this.error.next(authorized);
  }

  getError$(): Observable<HttpErrorResponse> {
    return this.error.asObservable();
  }

  getJiraURL(): string {
    return this.jiraURL;
  }

  getAuthenticatedUser$(): Observable<User> {
    return this.authenticatedUser.asObservable();
  }

  getAuthenticatedUser(): User {
    return this.authenticatedUser.value;
  }

  setAuthenticatedUser(user: User): void {
    this.authenticatedUser.next(user);
  }
}
