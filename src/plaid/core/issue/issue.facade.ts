import {Injectable} from '@angular/core';
import {Observable, of, zip} from 'rxjs';
import {Issue} from '../../models/issue';
import {IssueApi} from './issue.api';
import {map} from 'rxjs/operators';
import {IssueState} from './issue.state';
import {AuthFacade} from '../auth/auth.facade';
import {UserPreferencesService} from '../user-preferences.service';
import {FavoriteKeys} from '../../models/favorite-keys';

@Injectable({ providedIn: 'root' })
export class IssueFacade {
  private favoriteKeys: FavoriteKeys;
  private favorites: Issue[];

  private static stripSpecialChars(s: string): string {
    return s.replace(/([+.,;?|*/%^$#@\[\]"'`])/g, ' ');
  }

  private static canPotentiallyBeIssueKey(maybeKey: string): boolean {
    return /^[A-Za-z][A-Za-z0-9_]*-[1-9][0-9]*$/.test(maybeKey);
  }

  private setFavoriteAttribute(issues: Issue[]): Issue[] {
    return issues.map(issue => {
      issue._favorite = this.favoriteKeys[this.authFacade.getJiraURL()].includes(issue.key);
      return issue;
    });
  }

  constructor(
    private issueApi: IssueApi,
    private issueState: IssueState,
    private authFacade: AuthFacade,
    private userPrefsService: UserPreferencesService
  ) {
    this.userPrefsService.getFavoriteKeys$().subscribe(keys => this.favoriteKeys = keys);
    this.issueState.getFavorites$().subscribe(favorites => this.favorites = favorites);
    // TODO prefetch favorites and suggestions (and update state) after every login, also reset suggestions and favorites after logout
  }

  quickSearch$(query: string): Observable<Issue[]> {
    if (query) {
      if (IssueFacade.canPotentiallyBeIssueKey(query)) {
        return zip(
          this.issueApi.getIssue$(query),
          this.issueApi.search$('text ~ "' + IssueFacade.stripSpecialChars(query) + '"')
        ).pipe(
          map(([issue, searchResults]) =>
            this.setFavoriteAttribute((issue ? [issue] : []).concat(searchResults.issues)))
        );
      } else {
        return this.issueApi.search$('text ~ "' + IssueFacade.stripSpecialChars(query) + '"').pipe(
          map(res => this.setFavoriteAttribute(res.issues))
        );
      }
    } else {
      return of([]);
    }
  }

  fetchFavoritesAndSuggestions(): void {
    this.issueApi.search$('status changed by currentUser() OR creator = currentUser() order by updatedDate desc')
      .subscribe(res => this.issueState.setSuggestions(res.issues));
  }

  getFavorites$(): Observable<Issue[]> {
    return this.issueState.getFavorites$();
  }

  getSuggestions$(): Observable<Issue[]> {
    return this.issueState.getSuggestions$().pipe(map(issues => this.setFavoriteAttribute(issues)));
  }

  addFavorite(issue: Issue): void {
    const keys: string[] = this.favoriteKeys[this.authFacade.getJiraURL()] || [];
    if (!keys.includes(issue.key)) {
      keys.push(issue.key);
      this.favoriteKeys[this.authFacade.getJiraURL()] = keys;
      this.userPrefsService.setFavoriteKeys(this.favoriteKeys);
    }
    if (!this.favorites.find(favorite => favorite.key === issue.key)) {
      this.favorites.push(issue);
      this.issueState.setFavorites(this.favorites);
    }
  }

  removeFavorite(issue: Issue): void {
    let keys: string[] = this.favoriteKeys[this.authFacade.getJiraURL()] || [];
    if (keys.includes(issue.key)) {
      keys = keys.filter(key => key !== issue.key);
      this.favoriteKeys[this.authFacade.getJiraURL()] = keys;
      this.userPrefsService.setFavoriteKeys(this.favoriteKeys);
    }
    if (this.favorites.find(favorite => favorite.key === issue.key)) {
      this.favorites = this.favorites.filter(favorite => favorite.key !== issue.key);
      this.issueState.setFavorites(this.favorites);
    }
  }
}
