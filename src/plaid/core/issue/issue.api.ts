import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, of} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {Issue} from '../../models/issue';
import {SearchResults} from '../../models/search-results';

@Injectable({ providedIn: 'root' })
export class IssueApi {
  private readonly getIssueUrl = '/rest/api/2/issue/{issueIdOrKey}';
  private readonly searchUrl = '/rest/api/2/search';

  constructor(private http: HttpClient) { }

  getIssue$(issueIdOrKey: string): Observable<Issue> {
    return this.http.get<Issue>(this.getIssueUrl.replace('{issueIdOrKey}', issueIdOrKey) +
      '?fields=components,issuetype,parent,priority,summary,status').pipe(catchError(() => of(null)));
  }

  search$(jql: string, limit: number = 15): Observable<SearchResults> {
    return this.http.post<SearchResults>(this.searchUrl, {
      jql,
      startAt: 0,
      maxResults: limit,
      fields: [
        'components',
        'issuetype',
        'parent',
        'priority',
        'summary',
        'status'
      ]});
  }
}
