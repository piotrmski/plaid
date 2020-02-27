import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from '@angular/core';
import {DateRange} from '../../models/date-range';
import {Worklog} from '../../models/worklog';

@Component({
  selector: 'plaid-worklog-editor',
  templateUrl: './worklog-editor.component.html',
  styleUrls: ['./worklog-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WorklogEditorComponent {
  _worklog: Worklog;

  @Input()
  pixelsPerMinute: number;
  @Input()
  dateRange: DateRange;
  @Output()
  cancelEdit = new EventEmitter<void>();

  @Input()
  set worklog(value: Worklog) {
    this._worklog = value;
  }
  get worklog(): Worklog {
    return this._worklog;
  }
}
