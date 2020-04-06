import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  ViewChild,
  Output,
  OnInit
} from '@angular/core';
import {DateRange} from '../../models/date-range';
import {Worklog} from '../../models/worklog';
import {Format} from '../../helpers/format';
import {AuthFacade} from '../../core/auth/auth.facade';
import {AppStateService} from '../../core/app-state.service';
import {WorklogFacade} from '../../core/worklog/worklog.facade';

@Component({
  selector: 'plaid-worklog-editor',
  templateUrl: './worklog-editor.component.html',
  styleUrls: ['./worklog-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WorklogEditorComponent implements OnInit {
  static readonly GRID_OFFSET_TOP = 71; // top bar height + grid header height
  static readonly GRID_OFFSET_LEFT = 30; // hour labels width
  static readonly STRETCH_HANDLE_OFFSET_TOP = 4; // offset between top of a stretching handle and edge of the panel

  _pixelsPerMinute: number;
  _dateRange: DateRange;
  _worklog: Worklog;
  start: Date;
  date: Date;
  durationMinutes: number;
  panelOffsetTop: number;
  panelHeight: number;
  panelOffsetLeft: number;
  panelWidth: number;
  spaceUnderPanel: number;
  editedPanelInRange: boolean;
  panelHue: number;
  dragging = false;
  stretching = false;
  mouseEventXOffset: number;
  mouseEventYOffset: number;
  mousemoveEventListener: (e: MouseEvent) => void;
  issueString: string;
  dateString: string;
  commentString: string;
  startTimeString: string;
  endTimeString: string;
  saving = false;

  @ViewChild('panel')
  panel: ElementRef<HTMLDivElement>;

  @Output()
  cancelEdit = new EventEmitter<void>();

  @Input()
  gridElement: HTMLDivElement;

  @Input()
  set pixelsPerMinute(value: number) {
    if (this.mouseEventYOffset != null) {
      this.mouseEventYOffset *= value / this._pixelsPerMinute;
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
      this.editedPanelInRange = this.date >= range.start && this.date <= range.end;
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
      this.date = new Date(this.start);
      this.date.setHours(0, 0, 0, 0);
      this.durationMinutes = Math.round(worklog.timeSpentSeconds / 60);
      const end = new Date(this.start);
      end.setMinutes(this.start.getMinutes() + this.durationMinutes);
      this.startTimeString = Format.time(this.start);
      this.endTimeString = Format.time(end);
      this.editedPanelInRange = this.date >= this.dateRange.start && this.date <= this.dateRange.end;
      this.panelHue = Math.round((Number(this.worklog.issue.fields.parent
        ? this.worklog.issue.fields.parent.id
        : this.worklog.issue.id) * 360 / 1.61803)) % 360;
      this.issueString = worklog.issue.key + ' - ' + worklog.issue.fields.summary;
      this.dateString = Format.date(this.start);
      this.commentString = worklog.comment;
      if (this.editedPanelInRange) {
        this.computeSizeAndOffset();
      }
    }
  }
  get worklog(): Worklog {
    return this._worklog;
  }

  constructor(
    private cdr: ChangeDetectorRef,
    private authFacade: AuthFacade,
    private worklogFacade: WorklogFacade,
    private appStateService: AppStateService
  ) {
  }

  ngOnInit(): void {
    this.authFacade.getAuthenticatedUser$().subscribe(() => this.cancelEdit.emit());
  }

  computeSizeAndOffset(): void {
    this.panelOffsetTop = (this.start.getHours() * 60 + this.start.getMinutes()) * this.pixelsPerMinute;
    this.panelHeight = Math.min(
      this.durationMinutes * this.pixelsPerMinute,
      1440 * this.pixelsPerMinute - this.panelOffsetTop
    );
    this.panelWidth = 1 / (Math.round((this.dateRange.end.getTime() - this.dateRange.start.getTime()) / 86400000) + 1);
    this.panelOffsetLeft = this.panelWidth * Math.round((this.date.getTime() - this.dateRange.start.getTime()) / 86400000);
    this.spaceUnderPanel = 1440 * this.pixelsPerMinute - this.panelOffsetTop - this.panelHeight;
  }

  dragStart(event: MouseEvent): void {
    if (event.button === 0 && event.target === this.panel.nativeElement) {
      this.dragging = true;
      this.mouseEventXOffset = event.offsetX;
      this.mouseEventYOffset = event.offsetY;
      this.mousemoveEventListener = e => this.handleDragEvent(e);
      document.addEventListener('mousemove', this.mousemoveEventListener);
      document.addEventListener('mouseup', () => this.dragEnd(), {once: true});
    }
  }

  dragEnd(): void {
    this.dragging = false;
    this.cdr.detectChanges();
    if (this.mousemoveEventListener) {
      document.removeEventListener('mousemove', this.mousemoveEventListener);
    }
  }

  handleDragEvent(event: MouseEvent): void {
    // Handle dragging vertically
    const oldStartTimeMinutes: number = this.start.getHours() * 60 + this.start.getMinutes();
    let newStartTimeMinutes: number = this.getPointerTopOffsetMinutes(event, this.getSnapTo(event));
    if (oldStartTimeMinutes !== newStartTimeMinutes) {
      if (newStartTimeMinutes < 0) { // Prevent dragging above the grid
        newStartTimeMinutes = 0;
      } else if (newStartTimeMinutes + this.durationMinutes > 1440) { // Prevent dragging below the grid
        newStartTimeMinutes = 1440 - this.durationMinutes;
      }
      this.start.setHours(0, newStartTimeMinutes, 0, 0);
      const end = new Date(this.start);
      end.setMinutes(this.start.getMinutes() + this.durationMinutes);
      this.startTimeString = Format.time(this.start);
      this.endTimeString = Format.time(end);
    }

    // Handle dragging horizontally
    const pixelsPerDay: number = (this.gridElement.scrollWidth - WorklogEditorComponent.GRID_OFFSET_LEFT) * this.panelWidth;
    const oldDate: Date = new Date(this.date);
    const newDate: Date = new Date(this.dateRange.start);
    newDate.setDate(newDate.getDate() + Math.round((event.clientX + this.gridElement.scrollLeft -
      WorklogEditorComponent.GRID_OFFSET_LEFT - this.mouseEventXOffset) / pixelsPerDay));
    if (oldDate.getTime() !== newDate.getTime()) {
      if (newDate < this.dateRange.start) { // Prevent dragging to before the visible date range
        this.date = new Date(this.dateRange.start);
      } else if (newDate > this.dateRange.end) { // Prevent dragging to after the visible date range
        this.date = new Date(this.dateRange.end);
      } else {
        this.date = newDate;
      }
      this.start.setFullYear(this.date.getFullYear(), this.date.getMonth(), this.date.getDate());
      this.dateString = Format.date(this.start);
    }

    if (oldStartTimeMinutes !== newStartTimeMinutes || oldDate.getTime() !== newDate.getTime()) {
      this.computeSizeAndOffset();
      this.cdr.detectChanges();
    }
  }

  stretchTopStart(event: MouseEvent): void {
    if (event.button === 0) {
      this.stretching = true;
      this.mouseEventYOffset = event.offsetY - WorklogEditorComponent.STRETCH_HANDLE_OFFSET_TOP;
      this.mousemoveEventListener = e => this.handleStretchTopEvent(e);
      document.addEventListener('mousemove', this.mousemoveEventListener);
      document.addEventListener('mouseup', () => this.stretchEnd(), {once: true});
    }
  }

  stretchBottomStart(event: MouseEvent): void {
    if (event.button === 0) {
      this.stretching = true;
      this.mouseEventYOffset = event.offsetY - WorklogEditorComponent.STRETCH_HANDLE_OFFSET_TOP;
      this.mousemoveEventListener = e => this.handleStretchBottomEvent(e);
      document.addEventListener('mousemove', this.mousemoveEventListener);
      document.addEventListener('mouseup', () => this.stretchEnd(), {once: true});
    }
  }

  stretchEnd(): void {
    this.stretching = false;
    this.cdr.detectChanges();
    if (this.mousemoveEventListener) {
      document.removeEventListener('mousemove', this.mousemoveEventListener);
    }
  }

  handleStretchTopEvent(event: MouseEvent): void {
    const snapTo: number = this.getSnapTo(event);
    const oldStartTimeMinutes: number = this.start.getHours() * 60 + this.start.getMinutes();
    const endTimeMinutes: number = oldStartTimeMinutes + this.durationMinutes;
    let newStartTimeMinutes: number = this.getPointerTopOffsetMinutes(event, snapTo);
    if (oldStartTimeMinutes !== newStartTimeMinutes) {
      if (newStartTimeMinutes < 0) { // Prevent stretching above the upper bound of the grid
        newStartTimeMinutes = 0;
      } else if (newStartTimeMinutes >= endTimeMinutes) { // Prevent stretching below the lower bound of the work log entry
        newStartTimeMinutes = Math.floor((endTimeMinutes - 1) / snapTo) * snapTo;
      }
      this.start.setHours(0, newStartTimeMinutes, 0, 0);
      this.durationMinutes += oldStartTimeMinutes - newStartTimeMinutes;
      this.startTimeString = Format.time(this.start);

      this.computeSizeAndOffset();
      this.cdr.detectChanges();
    }
  }

  handleStretchBottomEvent(event: MouseEvent): void {
    const snapTo: number = this.getSnapTo(event);
    const startTimeMinutes: number = this.start.getHours() * 60 + this.start.getMinutes();
    const oldEndTimeMinutes: number = startTimeMinutes + this.durationMinutes;
    let newEndTimeMinutes: number = this.getPointerTopOffsetMinutes(event, snapTo);
    if (oldEndTimeMinutes !== newEndTimeMinutes) {
      if (newEndTimeMinutes <= startTimeMinutes) { // Prevent stretching above the upper bound of the work log entry
        newEndTimeMinutes = Math.ceil((startTimeMinutes + 1) / snapTo) * snapTo;
      } else if (newEndTimeMinutes > 1440) { // Prevent stretching below the grid
        newEndTimeMinutes = 1440;
      }
      this.durationMinutes = newEndTimeMinutes - startTimeMinutes;
      const end = new Date(this.start);
      end.setMinutes(this.start.getMinutes() + this.durationMinutes);
      this.endTimeString = Format.time(end);

      this.computeSizeAndOffset();
      this.cdr.detectChanges();
    }
  }

  getSnapTo(event: MouseEvent): number {
    if (event.altKey && !event.ctrlKey && !event.shiftKey) {
      return 1;
    } else if (!event.altKey && event.ctrlKey && !event.shiftKey) {
      return 60;
    } else if (!event.altKey && !event.ctrlKey && event.shiftKey) {
      return 15;
    } else {
      return 5;
    }
  }

  getPointerTopOffsetMinutes(event: MouseEvent, snapTo: number): number {
    return Math.round(
      (event.clientY + this.gridElement.scrollTop - WorklogEditorComponent.GRID_OFFSET_TOP - this.mouseEventYOffset)
      / this.pixelsPerMinute / snapTo
    ) * snapTo;
  }

  handleClickOutsideEditor(event: MouseEvent) {
    if (event.button === 0) {
      this.cancelEdit.emit();
    }
  }

  returnToEditedWorklog(): void {
    const start = new Date(this.start);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - start.getDay());
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    this.appStateService.setVisibleDateRange({start, end});
  }

  save() {
    this.saving = true;
    this.worklogFacade.updateWorklog(
      this.worklog,
      this.start,
      this.durationMinutes * 60,
      this.commentString
    ).subscribe({
      next: () => {
        this.saving = false;
        this.cancelEdit.emit();
      },
      error: () => this.saving = false
    });
  }
}
