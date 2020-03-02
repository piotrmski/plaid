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
  dragging = false;
  dragStartXOffset: number;
  dragStartYOffset: number;
  dragEventListener: (e: MouseEvent) => void;
  mouseupEventListener: () => void;

  @Output()
  cancelEdit = new EventEmitter<void>();

  @Input()
  scrollableAncestor: HTMLDivElement;

  @Input()
  set pixelsPerMinute(value: number) {
    if (this.dragStartYOffset != null) {
      this.dragStartYOffset *= value / this._pixelsPerMinute;
    }
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
    this.dragging = true;
    this.dragStartXOffset = this.scrollableAncestor.scrollLeft + event.clientX;
    this.dragStartYOffset = this.scrollableAncestor.scrollTop + event.clientY;
    this.dragEventListener = e => this.handleDragEvent(e);
    document.addEventListener('mousemove', this.dragEventListener);
  }

  dragEnd(): void {
    this.dragging = false;
    this.cdr.detectChanges();
    if (this.dragEventListener) {
      document.removeEventListener('mousemove', this.dragEventListener);
    }
  }

  handleDragEvent(event: MouseEvent): void {
    // How many minutes to snap to
    let snapTo = 5;
    if (event.altKey && !event.ctrlKey && !event.shiftKey) {
      snapTo = 1;
    } else if (!event.altKey && event.ctrlKey && !event.shiftKey) {
      snapTo = 60;
    } else if (!event.altKey && !event.ctrlKey && event.shiftKey) {
      snapTo = 15;
    }

    // Handle dragging vertically
    const dragEndYOffset: number = this.scrollableAncestor.scrollTop + event.clientY;
    const minutesOffset: number = Math.round((dragEndYOffset - this.dragStartYOffset) / this.pixelsPerMinute);
    const oldStartTimeMinutes: number = this.start.getHours() * 60 + this.start.getMinutes();
    const newStartTimeMinutes: number = Math.round((oldStartTimeMinutes + minutesOffset) / snapTo) * snapTo;
    if (oldStartTimeMinutes !== newStartTimeMinutes) {
      if (newStartTimeMinutes < 0) { // Prevent dragging above the grid
        this.start.setHours(0, 0, 0, 0);
      } else if (newStartTimeMinutes + this.worklog.timeSpentSeconds / 60 > 1440) { // Prevent dragging below the grid
        this.start.setHours(0, 1440 - this.worklog.timeSpentSeconds / 60, 0, 0);
      } else {
        this.start.setHours(0, newStartTimeMinutes, 0, 0);
        this.dragStartYOffset += (newStartTimeMinutes - oldStartTimeMinutes) * this.pixelsPerMinute;
      }
    }

    // Handle dragging horizontally
    const pixelsPerDay: number = (this.scrollableAncestor.scrollWidth - 30) * this.panelWidth;
    const dragEndXOffset: number = this.scrollableAncestor.scrollLeft + event.clientX;
    const daysOffset: number = Math.round((dragEndXOffset - this.dragStartXOffset) / pixelsPerDay);
    const oldDate: Date = new Date(this.startDate);
    const newDate: Date = new Date(this.startDate);
    newDate.setDate(newDate.getDate() + daysOffset);
    if (oldDate.getTime() !== newDate.getTime()) {
      if (newDate < this.dateRange.start) { // Prevent dragging to before the visible date range
        this.start.setFullYear(this.dateRange.start.getFullYear(), this.dateRange.start.getMonth(), this.dateRange.start.getDate());
        this.startDate.setFullYear(this.dateRange.start.getFullYear(), this.dateRange.start.getMonth(), this.dateRange.start.getDate());
      } else if (newDate > this.dateRange.end) { // Prevent dragging to after the visible date range
        this.start.setFullYear(this.dateRange.end.getFullYear(), this.dateRange.end.getMonth(), this.dateRange.end.getDate());
        this.startDate.setFullYear(this.dateRange.end.getFullYear(), this.dateRange.end.getMonth(), this.dateRange.end.getDate());
      } else {
        this.start.setDate(this.start.getDate() + daysOffset);
        this.startDate.setDate(this.startDate.getDate() + daysOffset);
        this.dragStartXOffset += (newDate.getTime() - oldDate.getTime()) / 86400000 * pixelsPerDay;
      }
    }

    if (oldStartTimeMinutes !== newStartTimeMinutes || oldDate.getTime() !== newDate.getTime()) {
      this.computeSizeAndOffset();
      this.cdr.detectChanges();
    }
  }
}
