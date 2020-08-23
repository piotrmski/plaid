import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, of} from 'rxjs';
import {User} from '../../models/user';
import {catchError} from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class IssueApi {
  private getIssueUrl = '/rest/api/2/issue/{issueIdOrKey}';

  constructor(private http: HttpClient) { }

  getIssue$(issueIdOrKey: string): Observable<User> {
    return this.http.get<User>(this.getIssueUrl.replace('{issueIdOrKey}', issueIdOrKey)).pipe(
      catchError(() => of(null))
    );
  }
}
