import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {User} from '../../model/user';
import {HttpClient} from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class AuthApi {
  private myselfUrl = '/rest/api/latest/myself';

  constructor(private http: HttpClient) { }

  getAuthenticatedUser$(): Observable<User> {
    return this.http.get<User>(this.myselfUrl);
  }
}
