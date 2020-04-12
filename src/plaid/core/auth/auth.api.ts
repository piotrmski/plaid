import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {User} from '../../models/user';
import {HttpClient} from '@angular/common/http';
import {mergeMap} from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthApi {
  private sessionUrl = '/rest/auth/1/session';

  constructor(private http: HttpClient) { }

  getAuthenticatedUser$(): Observable<User> {
    return this.http.get<User>(this.sessionUrl).pipe(
      mergeMap<User, Observable<User>>(
        sessionUser => this.http.get<User>(sessionUser.self)
      )
    );
  }
}
