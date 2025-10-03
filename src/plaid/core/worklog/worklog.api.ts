import { Injectable } from '@angular/core';
import { Worklog } from '../../model/worklog';
import { HttpClient } from '@angular/common/http';
import { SearchResults } from '../../model/search-results';
import { formatDate } from '@angular/common';
import { Observable } from 'rxjs';
import { WorklogWithPagination } from '../../model/worklog-with-pagination';
import { User } from '../../model/user';
import { DateRange } from '../../model/date-range';

@Injectable({ providedIn: 'root' })
export class WorklogApi {
  private readonly searchUrl = '/rest/api/latest/search/jql';
  private readonly getWorklogsUrl = '/rest/api/latest/issue/{issueIdOrKey}/worklog';
  private readonly addWorklogUrl = '/rest/api/latest/issue/{issueIdOrKey}/worklog';
  private readonly updateWorklogUrl = '/rest/api/latest/issue/{issueIdOrKey}/worklog/{id}';
  private readonly deleteWorklogUrl = '/rest/api/latest/issue/{issueIdOrKey}/worklog/{id}';

  constructor(private http: HttpClient) { }

  /**
   * Emits search results directly as fetched from API.
   */
  getIssuesForWorklogDateRange$(
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
   * Emits a page of work logs directly as fetched from API.
   */
  getWorklogsForIssue$(issueId: string, startAt = 0): Observable<WorklogWithPagination> {
    let url = this.getWorklogsUrl.replace('{issueIdOrKey}', issueId);
    if (startAt > 0) {
      url += '?startAt=' + startAt;
    }
    return this.http.get<WorklogWithPagination>(url);
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
