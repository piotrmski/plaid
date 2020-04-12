import {Injectable} from '@angular/core';
import {HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {EMPTY, Observable, throwError} from 'rxjs';
import {catchError, filter, mergeMap, skip, take} from 'rxjs/operators';
import {AuthState} from './auth.state';
import {User} from '../../models/user';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authState: AuthState) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const authInfo = this.authState.getAuthInfo();
    if (authInfo) {
      const newRequest: HttpRequest<any> = request.clone({
        setHeaders: {Authorization: this.authState.getAuthHeader()},
        url: authInfo.jiraUrl + request.url
      });
      return next.handle(newRequest).pipe(
        catchError((error: HttpErrorResponse) => this.handleError(request, next, error))
      );
    } else {
      return this.handleError(request, next, null);
    }
  }

  private handleError(request: HttpRequest<any>, next: HttpHandler, error: HttpErrorResponse): Observable<HttpEvent<any>> {
    this.authState.setError(error);

    if (!error || [0, 401, 403].includes(error.status)) { // If the error is related to lack of connection or authorization:
      // Retry the request after authentication, except /rest/api/2/user and /rest/auth/1/session, because requests to
      // these end points will be retried in the process of authentication.
      return request.url.substr(0, 16) === '/rest/api/2/user' || request.url === '/rest/auth/1/session'
        ? EMPTY
        : this.retryAfterAuthenticated(() => this.intercept(request, next));
    } else { // Otherwise let the error propagate
      return throwError(error);
    }
  }

  private retryAfterAuthenticated(event$fn: () => Observable<HttpEvent<any>>): Observable<HttpEvent<any>> {
    return this.authState.getAuthenticatedUser$().pipe(
      skip<User>(1),
      filter<User>((user: User) => user != null),
      take<User>(1),
      mergeMap<User, Observable<HttpEvent<any>>>(() => event$fn())
    );
  }
}
