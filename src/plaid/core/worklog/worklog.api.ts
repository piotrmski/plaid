import {Injectable} from '@angular/core';
import {Worklog} from '../../models/worklog';
import {HttpClient} from '@angular/common/http';
import {SearchResults} from '../../models/search-results';
import {formatDate} from '@angular/common';
import {EMPTY, Observable} from 'rxjs';
import {Issue} from '../../models/issue';
import {expand, filter, map, mergeMap, scan} from 'rxjs/operators';
import {WorklogWithPagination} from '../../models/worklog-with-pagination';
import {User} from '../../models/user';
import {DateRange} from '../../models/date-range';

@Injectable({ providedIn: 'root' })
export class WorklogApi {
  private searchUrl = '/rest/api/2/search';
  private issueWorklogUrl = '/rest/api/2/issue/{issueIdOrKey}/worklog';

  constructor(private http: HttpClient) { }

  private getStreamOfWorklogIssuesForTimePeriodSearchResults$(dateRange: DateRange, user: User, startAt = 0): Observable<SearchResults> {
    const url = this.searchUrl
      + '?fields=components,issuetype,parent,priority,summary'
      + '&startAt=' + startAt
      + '&jql=' + encodeURIComponent(
      'worklogAuthor = ' + encodeURIComponent(user.name) + ' && worklogDate >= "'
        + formatDate(dateRange.start, 'yyyy-MM-dd', 'en-US') + '" && worklogDate <= "'
        + formatDate(dateRange.end, 'yyyy-MM-dd', 'en-US') + '"'
      );
    return this.http.get<SearchResults>(url);
  }

  private getStreamOfWorklogIssuesForTimePeriod$(dateRange: DateRange, user: User): Observable<Issue> {
    return this.getStreamOfWorklogIssuesForTimePeriodSearchResults$(dateRange, user).pipe(
      expand<SearchResults>(
        (results: SearchResults) => (results.startAt + results.issues.length) < results.total
          ? this.getStreamOfWorklogIssuesForTimePeriodSearchResults$(dateRange, user, results.startAt + results.issues.length)
          : EMPTY
      ),
      mergeMap<SearchResults, Issue[]>((results: SearchResults) => results.issues)
    );
  }

  private getStreamOfWorklogsForIssue$(issue: Issue): Observable<Worklog> {
    const url = this.issueWorklogUrl.replace('{issueIdOrKey}', issue.id);
    return this.http.get<WorklogWithPagination>(url).pipe(
      mergeMap<WorklogWithPagination, Worklog[]>((results: WorklogWithPagination) => results.worklogs),
      map<Worklog, Worklog>((worklog: Worklog) => ({ ...worklog, issue }))
    );
  }

  getWorklogsForTimePeriod$(dateRange: DateRange, user: User): Observable<Worklog[]> {
    return this.getStreamOfWorklogIssuesForTimePeriod$(dateRange, user).pipe(
      mergeMap<Issue, Observable<Worklog>>((issue: Issue) => this.getStreamOfWorklogsForIssue$(issue)),
      filter<Worklog>((worklog: Worklog) => worklog.author.name === user.name
        && new Date(worklog.started).valueOf() >= dateRange.start.valueOf()
        && new Date(worklog.started).valueOf() < dateRange.end.valueOf() + 86400000
      ),
      scan<Worklog, Worklog[]>((acc: Worklog[], val: Worklog) => acc.concat([val]), [])
    );
  }
}
