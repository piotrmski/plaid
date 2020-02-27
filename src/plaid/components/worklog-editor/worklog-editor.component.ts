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
  _pixelsPerMinute: number;
  _dateRange: DateRange;
  _worklog: Worklog;
  start: Date;
  startDate: Date;
  durationSeconds: number;
  panelOffsetTop: number;
  panelHeight: number;
  panelOffsetLeft: number;
  panelWidth: number;
  editedPanelInRange: boolean;

  @Output()
  cancelEdit = new EventEmitter<void>();

  @Input()
  set pixelsPerMinute(value: number) {
    this._pixelsPerMinute = value;
    if (this.worklog && this.editedPanelInRange) {
      this.computeSizeAndOffset();
    }
  }
  get pixelsPerMinute(): number {
    return this._pixelsPerMinute;
  }

  @Input()
  set dateRange(range: DateRange) {
    this._dateRange = range;
    if (this.worklog) {
      this.editedPanelInRange = this.startDate >= range.start && this.startDate <= range.end;
      if (this.editedPanelInRange) {
        this.computeSizeAndOffset();
      }
    }
  }
  get dateRange(): DateRange {
    return this._dateRange;
  }

  @Input()
  set worklog(worklog: Worklog) {
    this._worklog = worklog;
    if (worklog) {
      this.start = new Date(worklog.started);
      this.start.setSeconds(0, 0);
      this.startDate = new Date(this.start);
      this.startDate.setHours(0, 0, 0, 0);
      this.durationSeconds = worklog.timeSpentSeconds;
      this.editedPanelInRange = this.startDate >= this.dateRange.start && this.startDate <= this.dateRange.end;
      if (this.editedPanelInRange) {
        this.computeSizeAndOffset();
      }
    }
  }
  get worklog(): Worklog {
    return this._worklog;
  }

  computeSizeAndOffset(): void {
    this.panelOffsetTop = (this.start.getHours() * 60 + this.start.getMinutes()) * this.pixelsPerMinute;
    this.panelHeight = Math.min(
      this.durationSeconds / 60 * this.pixelsPerMinute,
      1440 * this.pixelsPerMinute - this.panelOffsetTop
    );
    this.panelWidth = 1 / (Math.round((this.dateRange.end.getTime() - this.dateRange.start.getTime()) / 86400000) + 1);
    this.panelOffsetLeft = this.panelWidth * Math.round((this.startDate.getTime() - this.dateRange.start.getTime()) / 86400000);
  }
}
