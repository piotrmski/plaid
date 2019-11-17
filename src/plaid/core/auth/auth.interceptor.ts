import {Injectable} from '@angular/core';
import {HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {EMPTY, Observable} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {PlaidFacade} from '../../plaid.facade';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private facade: PlaidFacade) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const authInfo = this.facade.getAuthInfo();
    if (authInfo) {
      const newRequest: HttpRequest<any> = request.clone({
        setHeaders: {Authorization: this.facade.getAuthHeader()},
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
    this.facade.setAuthError(error);
    // Retry the request after authentication, except /rest/api/2/user and /rest/auth/1/session, because requests to these end points will
    // be retried in the process of authentication.
    return request.url.substr(0, 16) === '/rest/api/2/user' || request.url === '/rest/auth/1/session'
      ? EMPTY
      : this.facade.retryAfterAuthenticated(() => this.intercept(request, next));
  }
}
