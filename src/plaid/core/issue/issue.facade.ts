import {Injectable} from '@angular/core';
import {Observable, of, zip} from 'rxjs';
import {Issue} from '../../models/issue';
import {IssueApi} from './issue.api';
import {map} from 'rxjs/operators';
import {IssueState} from './issue.state';

@Injectable({ providedIn: 'root' })
export class IssueFacade {
  private static stripOfSpecialChars(s: string): string {
    return s.replace(/([+.,;?|*/%^$#@\[\]"])/g, ' ');
  }

  private static canPotentiallyBeIssueKey(maybeKey: string): boolean {
    return /^[A-Za-z][A-Za-z0-9_]*-[1-9][0-9]*$/.test(maybeKey);
  }

  constructor(private issueApi: IssueApi, private issueState: IssueState) {
  }

  quickSearch$(query: string): Observable<Issue[]> {
    if (query) {
      if (IssueFacade.canPotentiallyBeIssueKey(query)) {
        return zip(
          this.issueApi.getIssue$(query),
          this.issueApi.search$('text ~ "' + IssueFacade.stripOfSpecialChars(query) + '"')
        ).pipe(
          map(([issue, searchResults]) => (issue ? [issue] : []).concat(searchResults.issues))
        );
      } else {
        return this.issueApi.search$('text ~ "' + IssueFacade.stripOfSpecialChars(query) + '"').pipe(
          map(res => res.issues)
        );
      }
    } else {
      return of([]);
    }
  }

  fetchFavoritesAndSuggestions(): void {
    // TODO favorites
    this.issueApi.search$('status changed by currentUser() OR creator = currentUser() order by updatedDate desc')
      .subscribe(res => this.issueState.setSuggestions(res.issues));
  }

  getFavorites$(): Observable<Issue[]> {
    return this.issueState.getFavorites$();
  }

  getSuggestions$(): Observable<Issue[]> {
    return this.issueState.getSuggestions$();
  }
}
