import {Injectable} from '@angular/core';
import {Worklog} from '../../models/worklog';
import {HttpClient} from '@angular/common/http';
import {SearchResults} from '../../models/search-results';
import {formatDate} from '@angular/common';
import {EMPTY, Observable} from 'rxjs';
import {Issue} from '../../models/issue';
import {expand, map, mergeAll, mergeMap, scan, takeLast} from 'rxjs/operators';
import {WorklogWithPagination} from '../../models/worklog-with-pagination';
import {User} from '../../models/user';
import {DateRange} from '../../models/date-range';

@Injectable({ providedIn: 'root' })
export class WorklogApi {
  private readonly searchUrl = '/rest/api/2/search';
  private readonly getWorklogsUrl = '/rest/api/2/issue/{issueIdOrKey}/worklog';
  private readonly addWorklogUrl = '/rest/api/2/issue/{issueIdOrKey}/worklog';
  private readonly updateWorklogUrl = '/rest/api/2/issue/{issueIdOrKey}/worklog/{id}';
  private readonly deleteWorklogUrl = '/rest/api/2/issue/{issueIdOrKey}/worklog/{id}';

  constructor(private http: HttpClient) { }

  /**
   * Emits search results directly as fetched from API
   */
  private getWorklogIssuesForTimePeriodSearchResults$(
    dateRange: DateRange,
    user: User,
    startAt = 0
  ): Observable<SearchResults> {
    const url = this.searchUrl
      + '?fields=components,issuetype,parent,priority,summary,status'
      + '&startAt=' + startAt
      + '&jql=' + encodeURIComponent(
        'worklogAuthor = currentUser() && worklogDate >= "'
          + formatDate(dateRange.start, 'yyyy-MM-dd', 'en-US') + '" && worklogDate <= "'
          + formatDate(dateRange.end, 'yyyy-MM-dd', 'en-US') + '"'
      );
    return this.http.get<SearchResults>(url);
  }

  /**
   * Emits work log issues page by page
   */
  private streamWorklogIssuesForDateRange$(dateRange: DateRange, user: User): Observable<Issue[]> {
    return this.getWorklogIssuesForTimePeriodSearchResults$(dateRange, user).pipe(
      expand<SearchResults>(
        (results: SearchResults) => (results.startAt + results.issues.length) < results.total
          ? this.getWorklogIssuesForTimePeriodSearchResults$(dateRange, user, results.startAt + results.issues.length)
          : EMPTY
      ),
      map<SearchResults, Issue[]>((results: SearchResults) => results.issues)
    );
  }

  /**
   * Emits a page of work logs directly as fetched from API
   */
  private getWorklogsForIssueSearchResults$(issueId: string, startAt = 0): Observable<WorklogWithPagination> {
    let url = this.getWorklogsUrl.replace('{issueIdOrKey}', issueId);
    if (startAt > 0) {
      url += '?startAt=' + startAt;
    }
    return this.http.get<WorklogWithPagination>(url);
  }

  /**
   * Emits work logs of an issue page by page
   */
  private streamWorklogsForIssue$(issue: Issue): Observable<Worklog[]> {
    return this.getWorklogsForIssueSearchResults$(issue.id).pipe(
      expand<WorklogWithPagination>(
        (results: WorklogWithPagination) => (results.startAt + results.worklogs.length) < results.total
          ? this.getWorklogsForIssueSearchResults$(issue.id, results.startAt + results.worklogs.length)
          : EMPTY
      ),
      map<WorklogWithPagination, Worklog[]>(results => results.worklogs.map(wl => ({...wl, issue})))
    );
  }

  /**
   * Emits all fetched work logs every time any additional data is retrieved and finishes once the emitted list is
   * complete
   */
  getWorklogsForDateRangeVerbose$(dateRange: DateRange, user: User): Observable<Worklog[]> {
    return this.streamWorklogIssuesForDateRange$(dateRange, user).pipe(
      mergeAll<Issue>(),
      mergeMap<Issue, Observable<Worklog[]>>(issue => this.streamWorklogsForIssue$(issue)),
      map<Worklog[], Worklog[]>(worklogs => worklogs.filter(worklog => worklog.author.self === user.self
        && new Date(worklog.started).valueOf() >= dateRange.start.valueOf()
        && new Date(worklog.started).valueOf() < dateRange.end.valueOf() + 86400000
      )),
      scan<Worklog[], Worklog[]>((acc: Worklog[], val: Worklog[]) => acc.concat(val), [])
    );
  }

  /**
   * Emits the complete list of work logs
   */
  getWorklogsForDateRangeQuiet$(dateRange: DateRange, user: User): Observable<Worklog[]> {
    return this.getWorklogsForDateRangeVerbose$(dateRange, user).pipe(takeLast<Worklog[]>(1));
  }

  /**
   * Adds new work log entry and returns observable emitting added entry
   */
  addWorklog$(issueId: string, started: Date, timeSpentSeconds: number, comment: string): Observable<Worklog> {
    const url: string = this.addWorklogUrl.replace('{issueIdOrKey}', issueId);
    const body = {
      started: started.toISOString().replace(/Z$/, '+0000'),
      timeSpentSeconds,
      comment
    };
    return this.http.post<Worklog>(url, body);
  }

  /**
   * Updates work log entry and returns observable emitting updated entry
   */
  updateWorklog$(issueId: string, worklogId: string, started: Date, timeSpentSeconds: number, comment: string): Observable<Worklog> {
    const url: string = this.updateWorklogUrl.replace('{issueIdOrKey}', issueId).replace('{id}', worklogId);
    const body = {
      started: started.toISOString().replace(/Z$/, '+0000'),
      timeSpentSeconds,
      comment
    };
    return this.http.put<Worklog>(url, body);
  }

  /**
   * Deletes work log entry and returns observable emitting when the deletion finishes.
   */
  deleteWorklog$(issueId: string, worklogId: string): Observable<void> {
    return this.http.delete<void>(this.deleteWorklogUrl.replace('{issueIdOrKey}', issueId).replace('{id}', worklogId));
  }
}
