import {ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {Issue} from '../../models/issue';

@Component({
  selector: 'plaid-issue-picker-cloud',
  templateUrl: './issue-picker-cloud.component.html',
  styleUrls: ['./issue-picker-cloud.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IssuePickerCloudComponent {
  private _open = false;

  @ViewChild('searchInput', {static: true})
  searchInput: ElementRef<HTMLInputElement>;

  @Input()
  set open(open: boolean) {
    this._open = open;
    this.searchInput.nativeElement.focus();
  }
  get open(): boolean {
    return this._open;
  }

  @Output()
  openChange = new EventEmitter<boolean>();

  @Output()
  issueChange = new EventEmitter<Issue>();

}
