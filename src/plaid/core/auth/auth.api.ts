import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {User} from '../../models/user';
import {HttpClient} from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class AuthApi {
  private myselfUrl = '/rest/api/2/myself';

  constructor(private http: HttpClient) { }

  getAuthenticatedUser$(): Observable<User> {
    return this.http.get<User>(this.myselfUrl);
  }
}
