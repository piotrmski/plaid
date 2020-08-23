import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  ViewChild,
  Output,
  OnInit,
  ViewContainerRef
} from '@angular/core';
import {DateRange} from '../../models/date-range';
import {Worklog} from '../../models/worklog';
import {Format} from '../../helpers/format';
import {AuthFacade} from '../../core/auth/auth.facade';
import {AppStateService} from '../../core/app-state.service';
import {WorklogFacade} from '../../core/worklog/worklog.facade';
import {DatePickerCloudComponent} from '../date-picker-cloud/date-picker-cloud.component';
import {Issue} from '../../models/issue';
import {IssuePickerCloudComponent} from '../issue-picker-cloud/issue-picker-cloud.component';

/**
 * Smart component, presenting edited worklog, handling all its interactions and updating worklog on the server
 */
@Component({
  selector: 'plaid-worklog-editor',
  templateUrl: './worklog-editor.component.html',
  styleUrls: ['./worklog-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WorklogEditorComponent implements OnInit {
  static readonly GRID_OFFSET_TOP = 62; // top bar height + grid header height
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
  panelSaturation: number;
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
  calendarOpen = false;
  calendarOffsetTop = 0;
  flipCalendar = false;
  issuePickerOpen = false;
  issuePickerOffsetTop = 0;
  _visibleDaysStart: number;
  _visibleDaysEnd: number;

  @ViewChild('panel')
  panel: ElementRef<HTMLDivElement>;

  @ViewChild('wrapper')
  wrapper: ElementRef<HTMLDivElement>;

  @ViewChild('calendarToggle')
  calendarToggle: ElementRef<HTMLAnchorElement>;

  @ViewChild(DatePickerCloudComponent, {read: ViewContainerRef})
  calendarCloud: ViewContainerRef;

  @ViewChild('issuePickerToggle')
  issuePickerToggle: ElementRef<HTMLAnchorElement>;

  @ViewChild(IssuePickerCloudComponent, {read: ViewContainerRef})
  issuePickerCloud: ViewContainerRef;

  @Output()
  cancelEdit = new EventEmitter<void>();

  @Input()
  gridElement: HTMLDivElement;

  /**
   * In how many vertical pixels is one minute represented
   */
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

  /**
   * Visible date range
   */
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

  /**
   * Currently edited worklog
   */
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
      this.panelHue = this.worklog.issue ? Math.round((Number(this.worklog.issue.fields.parent
        ? this.worklog.issue.fields.parent.id
        : this.worklog.issue.id) * 360 / 1.61803)) % 360 : 0;
      this.panelSaturation = this.worklog.issue ? 50 : 0;
      this.issueString = worklog.issue ? worklog.issue.key + ' - ' + worklog.issue.fields.summary : ''; // TODO is that needed?
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

  /**
   * Beginning of the range for week days displayed on the calendar. Editing work logs on days outside working week is
   * prohibited.
   */
  @Input()
  set visibleDaysStart(value: number) {
    this._visibleDaysStart = value;
    if (this.date && !this.isDateVisible(this.date)) {
      this.cancelEdit.emit();
    }
  }
  get visibleDaysStart(): number {
    return this._visibleDaysStart;
  }

  /**
   * End of the range for week days displayed on the calendar. Editing work logs on days outside working week is
   * prohibited.
   */
  @Input()
  set visibleDaysEnd(value: number) {
    this._visibleDaysEnd = value;
    if (this.date && !this.isDateVisible(this.date)) {
      this.cancelEdit.emit();
    }
  }
  get visibleDaysEnd(): number {
    return this._visibleDaysEnd;
  }

  constructor(
    private cdr: ChangeDetectorRef,
    private authFacade: AuthFacade,
    private worklogFacade: WorklogFacade,
    private appStateService: AppStateService
  ) {
  }

  /**
   * When user changes authentication data, the editor should close.
   */
  ngOnInit(): void {
    // Singleton component, no need to unsubscribe
    this.authFacade.getAuthenticatedUser$().subscribe(() => this.cancelEdit.emit());
  }

  /**
   * Puts the edited panel in the correct offset, gives it correct size and does layout checks according to edited
   * worklog's start time, end time, date, currently visible date range and pixels per minute.
   */
  computeSizeAndOffset(): void {
    this.panelOffsetTop = (this.start.getHours() * 60 + this.start.getMinutes()) * this.pixelsPerMinute;
    this.panelHeight = Math.min(
      this.durationMinutes * this.pixelsPerMinute,
      1440 * this.pixelsPerMinute - this.panelOffsetTop
    );
    this.panelWidth = 1 / (Math.round((this.dateRange.end.getTime() - this.dateRange.start.getTime()) / 86400000) + 1);
    this.panelOffsetLeft = this.panelWidth * Math.round((this.date.getTime() - this.dateRange.start.getTime()) / 86400000);
    this.spaceUnderPanel = 1440 * this.pixelsPerMinute - this.panelOffsetTop - this.panelHeight;
    this.calendarOffsetTop = this.calendarToggle.nativeElement.offsetTop + 31 - this.panel.nativeElement.scrollTop;
    this.flipCalendar = this.panelOffsetTop + this.calendarOffsetTop + 240 > 1440 * this.pixelsPerMinute;
    this.issuePickerOffsetTop = Math.min(
      this.issuePickerToggle.nativeElement.offsetTop - this.panel.nativeElement.scrollTop + 1,
      1440 * this.pixelsPerMinute - this.panelOffsetTop - 300
    );
  }

  /**
   * Initiates panel dragging, adds event listeners for mouse movement and button release
   */
  dragStart(event: MouseEvent): void {
    if (!this.saving && event.button === 0 && event.target === this.panel.nativeElement) {
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

  /**
   * Handles mouse movement during panel dragging calculating change in start time and date
   */
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

  /**
   * Initiates top stretch handle dragging, adds event listeners for mouse movement and button release
   */
  stretchTopStart(event: MouseEvent): void {
    if (!this.saving && event.button === 0) {
      this.stretching = true;
      this.mouseEventYOffset = event.offsetY - WorklogEditorComponent.STRETCH_HANDLE_OFFSET_TOP;
      this.mousemoveEventListener = e => this.handleStretchTopEvent(e);
      document.addEventListener('mousemove', this.mousemoveEventListener);
      document.addEventListener('mouseup', () => this.stretchEnd(), {once: true});
    }
  }

  /**
   * Initiates bottom stretch handle dragging, adds event listeners for mouse movement and button release
   */
  stretchBottomStart(event: MouseEvent): void {
    if (!this.saving && event.button === 0) {
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

  /**
   * Handles mouse movement during top stretch handle dragging calculating change in start time and work duration
   */
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

  /**
   * Handles mouse movement during top stretch handle dragging calculating change in work duration
   */
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

  /**
   * Returns what interval of minutes should dragging events snap to according to what modifier keys on keyboard are
   * pressed.
   */
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

  /**
   * Returns number of minutes from start of the day according to what the mouse points at, rounded to snapTo interval
   */
  getPointerTopOffsetMinutes(event: MouseEvent, snapTo: number): number {
    return Math.round(
      (event.clientY + this.gridElement.scrollTop - WorklogEditorComponent.GRID_OFFSET_TOP - this.mouseEventYOffset)
      / this.pixelsPerMinute / snapTo
    ) * snapTo;
  }

  /**
   * Closes the editor if user clicked outside the panel with left mouse button
   */
  handleClickOutsideEditor(event: MouseEvent): void {
    if (event.button === 0 && event.target === this.wrapper.nativeElement && !this.calendarOpen && !this.issuePickerOpen) {
      this.cancelEdit.emit();
    }
  }

  /**
   * Handles date selection in the calendar cloud, changing worklog date and changing visible date range to include it
   */
  selectDate(date: Date): void {
    this.date = date;
    this.start.setFullYear(this.date.getFullYear(), this.date.getMonth(), this.date.getDate());
    this.dateString = Format.date(this.start);
    this.editedPanelInRange = this.date >= this.dateRange.start && this.date <= this.dateRange.end;
    this.returnToEditedWorklog();
    this.computeSizeAndOffset();
  }

  /**
   * Changes visible date range to include worklog date
   */
  returnToEditedWorklog(): void {
    const start = new Date(this.date);
    start.setDate(start.getDate() - start.getDay() + this.visibleDaysStart);
    const end = new Date(start);
    end.setDate(end.getDate() + this.visibleDaysEnd - this.visibleDaysStart);
    if (start.getTime() !== this.dateRange.start.getTime() || end.getTime() !== this.dateRange.end.getTime()) {
      this.appStateService.setVisibleDateRange({start, end});
    }
  }

  /**
   * Opens or closes calendar cloud and sets event listener to close the calendar if user clicked outside it
   */
  toggleCalendar(): void {
    if (!this.saving && !this.calendarOpen) {
      this.calendarOpen = true;
      this.computeSizeAndOffset();

      const mousedownOutsideCalendarEventListener = (event: MouseEvent) => {
        if (!(this.calendarCloud.element.nativeElement as Node).contains(event.target as Node)
          && event.target !== this.calendarToggle.nativeElement) {
          this.calendarOpen = false;
          document.removeEventListener('mousedown', mousedownOutsideCalendarEventListener);

          this.cdr.detectChanges();
        }
      };

      document.addEventListener('mousedown', mousedownOutsideCalendarEventListener);
    } else {
      this.calendarOpen = false;
    }
  }

  /**
   * Opens or closes issue picker cloud and sets event listener to close the calendar if user clicked outside it
   */
  toggleIssuePicker(): void {
    if (!this.saving && !this.issuePickerOpen && !this.worklog.id) {
      this.issuePickerOpen = true;
      this.computeSizeAndOffset();

      const mousedownOutsideIssuePickerEventListener = (event: MouseEvent) => {
        if (!(this.issuePickerCloud.element.nativeElement as Node).contains(event.target as Node)
          && event.target !== this.issuePickerToggle.nativeElement) {
          this.issuePickerOpen = false;
          document.removeEventListener('mousedown', mousedownOutsideIssuePickerEventListener);

          this.cdr.detectChanges();
        }
      };

      document.addEventListener('mousedown', mousedownOutsideIssuePickerEventListener);
    } else {
      this.issuePickerOpen = false;
    }
  }

  /**
   * Updates worklog on the server and closes the editor if update was successful
   */
  save(): void {
    this.saving = true;
    this.worklogFacade.updateWorklog$(
      this.worklog,
      this.start,
      this.durationMinutes * 60,
      this.commentString
    ).subscribe({
      next: () => {
        this.saving = false;
        this.cancelEdit.emit();
      },
      error: () => {
        this.saving = false;
        this.cdr.detectChanges();
      }
    });
  }

  isDateVisible(date: Date): boolean {
    return date.getDay() >= this.visibleDaysStart && date.getDay() <= this.visibleDaysEnd;
  }

  selectIssue(issue: Issue): void {

  }
}
