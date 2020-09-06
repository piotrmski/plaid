import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import {Worklog} from '../../../model/worklog';
import {WorklogPanelsManagerService} from './worklog-panels-manager.service';
import {Format} from '../../../helpers/format';
import {AuthFacade} from '../../../core/auth/auth.facade';

/**
 * Somewhat dumb component, present a panel representing a work log entry, or a gap prompting user to add a work log
 * entry. Makes use of its own service to manage visual aspects of all class instances at once.
 */
@Component({
  selector: 'plaid-worklog-panel',
  templateUrl: './worklog-panel.component.html',
  styleUrls: ['./worklog-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WorklogPanelComponent implements OnInit, OnDestroy {
  jiraURL: string;
  _worklog: Worklog;
  _pixelsPerMinute: number;
  undersized = false;
  tooLow = false;
  viewDestroyed = false;
  date: Date;
  panelWidth: number;
  panelHeight: number;
  maxHeight: number;
  panelOffsetTop: number;
  panelOffsetLeft: number;
  panelHue: number;
  timeRange: string;
  _darkMode: boolean;
  _deleteConfirmationOpen = false;

  @ViewChild('deleteConfirmation')
  deleteConfirmationElement: ElementRef<HTMLDivElement>;

  /**
   * Emits when user presses edit button.
   */
  @Output()
  edit = new EventEmitter<void>();

  /**
   * Emits when user presses delete button and confirms their action.
   */
  @Output()
  delete = new EventEmitter<void>();

  /**
   * Presented work log entry. Setting it will set the panel's initial size and position on the grid as well as its
   * color. Color is determined by a hash function applied to the log's issue's parent's ID (or log's issue's ID if it
   * does not have a parent). It will also schedule size and position check (see checkSizeAndPosition).
   */
  @Input()
  set worklog(worklog: Worklog) {
    this._worklog = worklog;
    this.date = new Date(this.worklog.started);
    this.panelWidth = 1 / this.worklog._columns;
    this.panelOffsetLeft = this.worklog._column * this.panelWidth;
    if (this.worklog.issue) {
      this.panelHue = Math.round((Number(this.worklog.issue.fields.parent
        ? this.worklog.issue.fields.parent.id
        : this.worklog.issue.id) * 360 / 1.61803)) % 360;
    }
    this.computeHeightAndOffset();
    this.computeTimeRange();
    this.manager.scheduleCheckSizeAndPosition();
  }
  get worklog(): Worklog {
    return this._worklog;
  }

  /**
   * In how many vertical pixels is one minute represented. Changing it will update panel's position and size, and
   * schedule size and position check (see checkSizeAndPosition).
   */
  @Input()
  set pixelsPerMinute(pixelsPerMinute: number) {
    this._pixelsPerMinute = pixelsPerMinute;
    this.computeHeightAndOffset();
    this.manager.scheduleCheckSizeAndPosition();
  }
  get pixelsPerMinute(): number {
    return this._pixelsPerMinute;
  }

  /**
   * Whether this work log was opened in the editor
   */
  @Input()
  currentlyEdited: boolean;

  /**
   * This setter is executed asynchronously by the manager and therefore needs to invoke change detector.
   */
  set darkMode(value: boolean) {
    this._darkMode = value;
    this.cdr.markForCheck();
  }
  get darkMode(): boolean {
    return this._darkMode;
  }

  @ViewChild('panelInner', { static: true })
  panelInner: ElementRef<HTMLDivElement>;

  constructor(
    private authFacade: AuthFacade,
    private cdr: ChangeDetectorRef,
    private manager: WorklogPanelsManagerService
  ) { }

  ngOnInit(): void {
    this.jiraURL = this.authFacade.getJiraURL();
    this.manager.addPanel(this);
  }

  ngOnDestroy(): void {
    this.manager.removePanel(this);
    this.viewDestroyed = true;
  }

  /**
   * Update human readable time range string.
   */
  computeTimeRange(): void {
    const startTime = new Date(this.worklog.started);
    const endTime = new Date(startTime);
    endTime.setTime(endTime.getTime() + this.worklog.timeSpentSeconds * 1000);
    const justBeforeEndTime = new Date(endTime);
    justBeforeEndTime.setTime(endTime.getTime() - 1);

    if (
      startTime.getFullYear() === justBeforeEndTime.getFullYear() &&
      startTime.getMonth() === justBeforeEndTime.getMonth() &&
      startTime.getDate() === justBeforeEndTime.getDate()
    ) {
      this.timeRange = Format.time(startTime) + ' - ' + Format.time(endTime);
    } else {
      this.timeRange = 'Since ' + Format.time(startTime) + ' for ' + Format.timePeriod(this.worklog.timeSpentSeconds);
    }
  }

  computeHeightAndOffset(): void {
    this.panelOffsetTop = (this.date.getHours() * 60 + this.date.getMinutes()) * this.pixelsPerMinute;
    this.maxHeight = 1440 * this.pixelsPerMinute - this.panelOffsetTop;
    this.panelHeight = Math.min(this.worklog.timeSpentSeconds / 60 * this.pixelsPerMinute, this.maxHeight);
  }

  /**
   * Check if the panel's content overflows and if the panel is too low to display overflowing content by stretching it
   * down. This method is executed asynchronously by the manager and therefore needs to invoke change detector.
   */
  checkSizeAndPosition(): void {
    if (!this.viewDestroyed && this.worklog.issue) {
      this.undersized = this.panelInner.nativeElement.scrollHeight > this.panelHeight;
      this.tooLow = this.panelInner.nativeElement.scrollHeight + 1 > this.maxHeight;
      this.cdr.markForCheck();
    }
  }

  editClick(): void {
    if (!this.worklog._deleting) {
      this.edit.emit();
    }
  }

  deleteClick(): void {
    if (!this.worklog._deleting) {
      this.deleteConfirmationOpen = true;
    }
  }

  deleteConfirm(): void {
    this.deleteConfirmationOpen = false;
    this.worklog._deleting = true;
    this.delete.emit();
  }

  set deleteConfirmationOpen(value: boolean) {
    this._deleteConfirmationOpen = value;
    if (value) {
      addEventListener('mousedown', this.onMousedown);
    } else {
      removeEventListener('mousedown', this.onMousedown);
    }
  }
  get deleteConfirmationOpen(): boolean {
    return this._deleteConfirmationOpen;
  }

  /**
   * Closes delete confirmation, if user clicks outside of it. Implemented to make behavior on touchscreen passable.
   */
  onMousedown: (event: MouseEvent) => void = (event: MouseEvent) => {
    if (!(this.deleteConfirmationElement.nativeElement as Node).contains(event.target as Node)) {
      this.deleteConfirmationOpen = false;
      this.cdr.detectChanges();
    }
  }
}
