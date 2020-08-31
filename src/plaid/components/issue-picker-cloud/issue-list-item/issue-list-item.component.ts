import {Component, EventEmitter, Input, Output} from '@angular/core';
import {Issue} from '../../../models/issue';

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

  toggleFavorite(): void {
    this.issue._favorite = !this.issue._favorite;
    this.favoriteChange.emit(this.issue._favorite);
  }

}
