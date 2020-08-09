import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output
} from '@angular/core';
import {DateRange} from '../../models/date-range';
import {Format} from '../../helpers/format';
import {Calendar} from '../../helpers/calendar';
import Timeout = NodeJS.Timeout;

/**
 * Dumb component, responsible for presenting current date on a dropdown calendar, currently selected week and
 * delegating change in week selection.
 */
@Component({
  selector: 'plaid-date-range-picker',
  templateUrl: './date-range-picker.component.html',
  styleUrls: ['./date-range-picker.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DateRangePickerComponent implements OnInit {
  _month: Date;
  today: Date;
  days: Date[][];
  _calendarOpen = false;
  decrementWeekButtonActive = false;
  incrementWeekButtonActive = false;
  _visibleDaysStart: number;
  _visibleDaysEnd: number;
  dateRangeEmissionTimeout: Timeout;

  /**
   * Disables F4 and F6 shortcuts for date range changing (by default these keys decrement and increment selected week)
   */
  @Input()
  shortcutsDisabled = false;

  @Input()
  selectedDateRange: DateRange;

  @Input()
  set visibleDaysStart(value: number) {
    if (this._visibleDaysStart !== undefined && this.selectedDateRange) {
      this.selectedDateRange.start.setDate(this.selectedDateRange.start.getDate() + value - this._visibleDaysStart);
    }
    const initialized: boolean = this._visibleDaysStart !== undefined && this._visibleDaysEnd !== undefined;
    this._visibleDaysStart = value;
    if (initialized) {
      this.emitDateRangeDebounce();
    }
  }
  get visibleDaysStart(): number {
    return this._visibleDaysStart;
  }

  @Input()
  set visibleDaysEnd(value: number) {
    if (this._visibleDaysEnd !== undefined && this.selectedDateRange) {
      this.selectedDateRange.end.setDate(this.selectedDateRange.end.getDate() + value - this._visibleDaysEnd);
    }
    const initialized: boolean = this._visibleDaysStart !== undefined && this._visibleDaysEnd !== undefined;
    this._visibleDaysEnd = value;
    if (initialized) {
      this.emitDateRangeDebounce();
    }
  }
  get visibleDaysEnd(): number {
    return this._visibleDaysEnd;
  }

  @Output()
  selectedDateRangeChange = new EventEmitter<DateRange>();

  readonly months: string[] = Calendar.months;

  readonly weekdays: string[] = Calendar.weekdays;

  constructor(private ref: ElementRef, private cdr: ChangeDetectorRef) {
  }

  ngOnInit(): void {
    // Singleton component, no need to unbind events
    addEventListener('keydown', (e: KeyboardEvent) => {
      if (!this.shortcutsDisabled && !e.repeat) {
        if (e.key === 'F4') {
          this.decrementWeekButtonActive = true;
          this.decrementWeek();
          setTimeout(() => {
            this.decrementWeekButtonActive = false;
            this.cdr.detectChanges();
          }, 50);
        } else if (e.key === 'F6') {
          this.incrementWeekButtonActive = true;
          this.incrementWeek();
          setTimeout(() => {
            this.incrementWeekButtonActive = false;
            this.cdr.detectChanges();
          }, 50);
        }
      }
    });
  }

  set month(month: Date) {
    this._month = month;
    this.days = Calendar.getDaysOfMonth(month);
  }
  get month(): Date {
    return this._month;
  }

  get calendarOpen(): boolean {
    return this._calendarOpen;
  }

  /**
   * Open or close the calendar. Opening it will set the month to one which the monday of the selected date range
   * belongs to, assuming only full weeks starting on sunday can be selectable.
   */
  set calendarOpen(open: boolean) {
    this._calendarOpen = open;
    if (open) {
      const month = new Date(
        this.selectedDateRange.start.getFullYear(),
        this.selectedDateRange.start.getMonth(),
        this.selectedDateRange.start.getDate() + 1
      );
      month.setDate(1);
      this.month = month;
      const curTime: Date = new Date();
      this.today = new Date(curTime.getFullYear(), curTime.getMonth(), curTime.getDate());

      const mousedownOutsideCalendarEventListener = (event: MouseEvent) => {
        if (!(this.ref.nativeElement as Node).contains(event.target as Node)) {
          this.calendarOpen = false;
          document.removeEventListener('mousedown', mousedownOutsideCalendarEventListener);

          this.cdr.detectChanges();
        }
      };

      document.addEventListener('mousedown', mousedownOutsideCalendarEventListener);
    }
  }

  decrementMonth(): void {
    this.month = new Date(this.month.getFullYear(), this.month.getMonth() - 1);
  }

  incrementMonth(): void {
    this.month = new Date(this.month.getFullYear(), this.month.getMonth() + 1);
  }

  decrementWeek(): void {
    this.selectedDateRange.start.setDate(this.selectedDateRange.start.getDate() - 7);
    this.selectedDateRange.end.setDate(this.selectedDateRange.end.getDate() - 7);
    this.emitDateRange();
  }

  incrementWeek(): void {
    this.selectedDateRange.start.setDate(this.selectedDateRange.start.getDate() + 7);
    this.selectedDateRange.end.setDate(this.selectedDateRange.end.getDate() + 7);
    this.emitDateRange();
  }

  get buttonText(): string {
    return this.selectedDateRange ? Format.dateRange(this.selectedDateRange) : '';
  }

  selectDateRange(dateRange: DateRange) {
    this.selectedDateRange = dateRange;
    this.emitDateRange();
    this.calendarOpen = false;
  }

  emitDateRange(): void {
    if (this.selectedDateRange) {
      this.selectedDateRangeChange.emit(Calendar.copyDateRange(this.selectedDateRange));
    }
  }

  emitDateRangeDebounce(): void {
    if (this.dateRangeEmissionTimeout != null) {
      clearTimeout(this.dateRangeEmissionTimeout);
    }
    this.dateRangeEmissionTimeout = setTimeout(() => {
      this.emitDateRange();
      this.dateRangeEmissionTimeout = null;
    }, 0);
  }
}
