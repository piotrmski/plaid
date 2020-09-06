import {
  ChangeDetectionStrategy, ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import {Issue} from '../../models/issue';
import {Observable, Subject} from 'rxjs';
import {IssueFacade} from '../../core/issue/issue.facade';
import {debounceTime, switchMap, tap} from 'rxjs/operators';

@Component({
  selector: 'plaid-issue-picker-cloud',
  templateUrl: './issue-picker-cloud.component.html',
  styleUrls: ['./issue-picker-cloud.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IssuePickerCloudComponent implements OnInit {
  private _open = false;
  searchInputSubject = new Subject<string>();
  searchResults: Issue[] = [];
  favorites: Issue[] = [];
  suggestions: Issue[] = [];
  searching = false;

  @ViewChild('searchInput', {static: true})
  searchInput: ElementRef<HTMLInputElement>;

  @Input()
  set open(open: boolean) {
    this._open = open;
    if (open) {
      setTimeout(() => this.searchInput.nativeElement.focus());
    } else {
      this.searchInput.nativeElement.value = '';
      this.searchResults = [];
    }
  }
  get open(): boolean {
    return this._open;
  }

  @Output()
  openChange = new EventEmitter<boolean>();

  @Output()
  issueChange = new EventEmitter<Issue>();

  @Input()
  updateFavoritesAndSuggestionsAndEmitSuggestion: Observable<void>;

  @Input()
  keysDisabled: boolean;

  constructor(private issueFacade: IssueFacade, private cdr: ChangeDetectorRef) {
  }

  ngOnInit() {
    this.searchInputSubject.pipe(
      debounceTime(250),
      tap(() => {
        this.searching = true;
        this.cdr.detectChanges();
      }),
      switchMap(s => this.issueFacade.quickSearch$(s))
    ).subscribe(res => {
      this.searching = false;
      if (this.searchInput.nativeElement.value) {
        this.searchResults = res;
      }
      this.cdr.detectChanges();
    });

    if (this.updateFavoritesAndSuggestionsAndEmitSuggestion != null) {
      this.updateFavoritesAndSuggestionsAndEmitSuggestion.subscribe(() => {
        this.issueFacade.fetchFavoritesAndSuggestions();
      });
    }

    this.issueFacade.getFavorites$().subscribe(favorites => {
      this.favorites = favorites;
      this.cdr.detectChanges();
    });
    this.issueFacade.getSuggestions$().subscribe(suggestions => {
      this.suggestions = suggestions;
      if (suggestions.length > 0) {
        this.issueChange.emit(suggestions[0]);
      } else {
        this.issueChange.emit(null);
      }
      this.cdr.detectChanges();
    });
  }

  inputSearch(query: string): void {
    if (query) {
      this.searchInputSubject.next(query);
    } else {
      this.searching = false;
      this.searchResults = [];
    }
  }

  issueSelected(issue: Issue): void {
    this._open = false;
    this.openChange.emit(false);
    this.issueChange.emit(issue);
    this.searchResults = [];
    this.searchInput.nativeElement.value = '';
  }

  favoriteChange(issue: Issue, favorite: boolean): void {
    if (favorite) {
      this.issueFacade.addFavorite(issue);
    } else {
      this.issueFacade.removeFavorite(issue);
    }
  }

  get suggestionsWithoutFavorites(): Issue[] {
    return this.suggestions.filter(issue => !this.favorites.find(favorite => favorite.key === issue.key));
  }

}
