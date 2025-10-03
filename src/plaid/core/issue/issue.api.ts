import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Issue } from '../../model/issue';
import { SearchResults } from '../../model/search-results';

@Injectable({ providedIn: 'root' })
export class IssueApi {
  private readonly getIssueUrl = '/rest/api/latest/issue/{issueIdOrKey}';
  private readonly searchUrl = '/rest/api/latest/search/jql';

  constructor(private http: HttpClient) { }

  getIssue$(issueIdOrKey: string): Observable<Issue> {
    return this.http.get<Issue>(this.getIssueUrl.replace('{issueIdOrKey}', issueIdOrKey) +
      '?fields=components,issuetype,parent,priority,summary,status').pipe(catchError(() => of(null)));
  }

  search$(jql: string, limit: number = 15): Observable<SearchResults> {
    const url = this.searchUrl
      + '?jql=' + encodeURIComponent(jql)
      + '&startAt=0'
      + '&maxResults=' + limit
      + '&fields=components,issuetype,parent,priority,summary,status';
    return this.http.get<SearchResults>(url);
  }
}
