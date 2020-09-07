import {Component, EventEmitter, Input, Output} from '@angular/core';
import {Issue} from '../../../../../model/issue';

/**
 * An item on a list of issues in the issue picker. Presents issue details and favorite button, delegates selection of
 * the item and adding/removing favorite status.
 */
@Component({
  selector: 'plaid-issue-list-item',
  templateUrl: './issue-list-item.component.html',
  styleUrls: ['./issue-list-item.component.scss']
})
export class IssueListItemComponent {

  @Input()
  issue: Issue;

  @Output()
  issueSelected = new EventEmitter<void>();

  @Output()
  favoriteChange = new EventEmitter<boolean>();

  @Input()
  keyboardNavigationEnabled: boolean;

  toggleFavorite(): void {
    this.issue._favorite = !this.issue._favorite;
    this.favoriteChange.emit(this.issue._favorite);
  }

  onKeydown(event: KeyboardEvent): void {
    if (this.keyboardNavigationEnabled && (event.key === ' ' || event.key === 'Enter')) {
      this.issueSelected.next();
    }
  }

}
