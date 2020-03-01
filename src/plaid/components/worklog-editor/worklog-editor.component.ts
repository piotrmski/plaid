import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output
} from '@angular/core';
import {DateRange} from '../../models/date-range';
import {Worklog} from '../../models/worklog';

@Component({
  selector: 'plaid-worklog-editor',
  templateUrl: './worklog-editor.component.html',
  styleUrls: ['./worklog-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WorklogEditorComponent implements OnInit {
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
  panelHue: number;
  dragStartYOffset: number;
  dragEventListener: (e: MouseEvent) => void;
  mouseupEventListener: () => void;

  @Output()
  cancelEdit = new EventEmitter<void>();

  @Input()
  scrollableAncestor: HTMLDivElement;

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
      this.panelHue = Math.round((Number(this.worklog.issue.fields.parent
        ? this.worklog.issue.fields.parent.id
        : this.worklog.issue.id) * 360 / 1.61803)) % 360;
      if (this.editedPanelInRange) {
        this.computeSizeAndOffset();
      }
    }
  }
  get worklog(): Worklog {
    return this._worklog;
  }

  constructor(private cdr: ChangeDetectorRef) {
  }

  ngOnInit(): void {
    this.mouseupEventListener = () => this.dragEnd();
    // Singleton component, no need to unbind.
    document.addEventListener('mouseup', () => this.dragEnd());
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

  dragStart(event: MouseEvent): void {
    this.dragStartYOffset = this.scrollableAncestor.scrollTop + event.clientY;
    this.dragEventListener = e => this.handleDragEvent(e);
    document.addEventListener('mousemove', this.dragEventListener);
  }

  dragEnd(): void {
    if (this.dragEventListener) {
      document.removeEventListener('mousemove', this.dragEventListener);
    }
  }

  handleDragEvent(event: MouseEvent): void {
    // TODO:
    //  prevent dragging above and below the grid
    //  handle changing zoom while dragging
    //  keep the cursor from changing while dragging outside the bounds of the panel
    //  handle horizontal dragging (across days)
    //  handle changing dragging precision
    const dragEndYOffset: number = this.scrollableAncestor.scrollTop + event.clientY;
    const minutesOffset: number = Math.round((dragEndYOffset - this.dragStartYOffset) / this.pixelsPerMinute / 5) * 5;
    if (minutesOffset !== 0) {
      this.start.setMinutes(this.start.getMinutes() + minutesOffset);
      this.computeSizeAndOffset();
      this.dragStartYOffset += minutesOffset * this.pixelsPerMinute;
      this.cdr.detectChanges();
    }
  }
}
