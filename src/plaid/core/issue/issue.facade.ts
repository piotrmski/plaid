import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {Issue} from '../../models/issue';
import {IssueApi} from './issue.api';
import {map} from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class IssueFacade {
  constructor(private issueApi: IssueApi) {
  }

  quickSearch$(query: string): Observable<Issue[]> {
    return this.issueApi.getIssue$(query).pipe(map(i => i ? [i] : []));
  }
}
