import {Injectable} from '@angular/core';
import {Observable, of, zip} from 'rxjs';
import {Issue} from '../../models/issue';
import {IssueApi} from './issue.api';
import {map, switchMap, tap} from 'rxjs/operators';
import {IssueState} from './issue.state';
import {AuthFacade} from '../auth/auth.facade';
import {UserPreferencesService} from '../user-preferences.service';
import {FavoriteKeys} from '../../models/favorite-keys';

@Injectable({ providedIn: 'root' })
export class IssueFacade {
  private favoriteKeys: FavoriteKeys;
  private favorites: Issue[];
  private suggestions: Issue[];

  private static stripSpecialChars(s: string): string {
    return s.replace(/([+.,;?|*/%^$#@\[\]"'`])/g, ' ').trim();
  }

  private static canPotentiallyBeIssueKey(maybeKey: string): boolean {
    return /^[A-Za-z][A-Za-z0-9_]*-[1-9][0-9]*$/.test(maybeKey);
  }

  private setFavoriteAttribute(issues: Issue[]): Issue[] {
    return issues.map(issue => {
      const keys: string[] = this.favoriteKeys[this.authFacade.getJiraURL()] || [];
      issue._favorite = keys.includes(issue.key);
      return issue;
    });
  }

  private getSuggestionsFromApi$(): Observable<Issue[]> {
    return this.issueApi
      .search$('status changed by currentUser() OR creator = currentUser() order by updatedDate desc').pipe(
        map(res => res.issues)
      );
  }

  private getFavoritesFromApi$(): Observable<Issue[]> {
    const keys: string[] = this.favoriteKeys[this.authFacade.getJiraURL()] || [];
    const removedKeysIndexes: number[] = [];
    return zip(...keys.map(key => this.issueApi.getIssue$(key))).pipe(
      map(issues => this.setFavoriteAttribute(issues.filter((issue: Issue, index: number) => {
        if (issue) {
          return true;
        } else {
          removedKeysIndexes.push(index);
          return false;
        }
      }))),
      tap(() => {
        this.favoriteKeys[this.authFacade.getJiraURL()] =
          keys.filter((key: string, index: number) => !removedKeysIndexes.includes(index));
        this.userPrefsService.setFavoriteKeys(this.favoriteKeys);
      })
    );
  }

  constructor(
    private issueApi: IssueApi,
    private issueState: IssueState,
    private authFacade: AuthFacade,
    private userPrefsService: UserPreferencesService
  ) {
    this.userPrefsService.getFavoriteKeys$().subscribe(keys => this.favoriteKeys = keys);
    this.issueState.getFavorites$().subscribe(favorites => this.favorites = favorites);
    this.issueState.getSuggestions$().subscribe(suggestions => this.suggestions = suggestions);
    // Prefetch favorites and suggestions after login and reset suggestions and favorites after logout
    this.authFacade.getAuthenticatedUser$().pipe(switchMap(user => user ? this.getSuggestionsFromApi$() : of([])))
      .subscribe(suggestions => this.issueState.setSuggestions(suggestions));
    this.authFacade.getAuthenticatedUser$().pipe(switchMap(user => user ? this.getFavoritesFromApi$() : of([])))
      .subscribe(favorites => this.issueState.setFavorites(favorites));
  }

  quickSearch$(query: string): Observable<Issue[]> {
    if (IssueFacade.stripSpecialChars(query)) {
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
    // Suggestions should be fetched first
    this.getSuggestionsFromApi$().subscribe(suggestions => {
      this.issueState.setSuggestions(suggestions);
      this.getFavoritesFromApi$().subscribe(favorites => this.issueState.setFavorites(favorites));
    });
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
      this.issueState.setSuggestions(this.setFavoriteAttribute(this.suggestions));
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
