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
import {Subject} from 'rxjs';
import {IssueFacade} from '../../core/issue/issue.facade';
import {debounceTime, mergeMap} from 'rxjs/operators';

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

  constructor(private issueFacade: IssueFacade, private cdr: ChangeDetectorRef) {
  }

  ngOnInit() {
    this.searchInputSubject.pipe(
      debounceTime(500),
      mergeMap(searchString => this.issueFacade.quickSearch$(searchString))
    ).subscribe(res => {
      this.searchResults = res;
      this.cdr.detectChanges();
    });
  }

}
