import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {Issue} from '../../model/issue';

@Injectable({ providedIn: 'root' })
export class IssueState {
  private favorites = new BehaviorSubject<Issue[]>([]);
  private suggestions = new BehaviorSubject<Issue[]>([]);

  getFavorites$(): Observable<Issue[]> {
    return this.favorites.asObservable();
  }

  setFavorites(value: Issue[]): void {
    this.favorites.next(value);
  }

  getSuggestions$(): Observable<Issue[]> {
    return this.suggestions.asObservable();
  }

  setSuggestions(value: Issue[]): void {
    this.suggestions.next(value);
  }
}
