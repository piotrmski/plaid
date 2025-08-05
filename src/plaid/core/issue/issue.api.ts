import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, of} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {Issue} from '../../model/issue';
import {SearchResults} from '../../model/search-results';

@Injectable({ providedIn: 'root' })
export class IssueApi {
  private readonly getIssueUrl = '/rest/api/2/issue/{issueIdOrKey}';
  private readonly searchUrl = '/rest/api/2/search';

  constructor(private http: HttpClient) { }

  getIssue$(issueIdOrKey: string): Observable<Issue | null> {
    // Also fetch original time estimate to detect missing estimations
    return this.http.get<Issue>(
      this.getIssueUrl.replace('{issueIdOrKey}', issueIdOrKey) +
      '?fields=components,issuetype,parent,priority,summary,status,timeoriginalestimate'
    ).pipe(catchError(() => of(null)));
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
      ]
    });
  }

  /**
   * Actualiza la estimación original (timetracking.originalEstimate) de un issue
   * @param issueKey clave del issue
   * @param estimateTexto texto de estimación (ej. "1h 30m")
   */
  updateOriginalEstimate$(issueKey: string, estimateTexto: string): Observable<any> {
    const url = this.getIssueUrl.replace('{issueIdOrKey}', issueKey);
    return this.http.put(url, {
      fields: {
        timetracking: {
          originalEstimate: estimateTexto
        }
      }
    });
  }
}
