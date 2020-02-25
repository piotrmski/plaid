import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  OnInit,
  Output
} from '@angular/core';
import {DateRange} from '../../models/date-range';
import {DatePipe} from '@angular/common';

/**
 * Dumb component, responsible for presenting current date on a dropdown calendar, currently selected week and
 * delegating week selection change.
 */
@Component({
  selector: 'plaid-date-range-picker',
  templateUrl: './date-range-picker.component.html',
  styleUrls: ['./date-range-picker.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DateRangePickerComponent implements OnInit {
  @Output()
  selectedDateRange = new EventEmitter<DateRange>();
  _selectedDateRange: DateRange;
  month: Date;
  today: Date;
  _calendarOpen = false;

  readonly months: string[] = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ];

  readonly weekdays: string[] = [
    'Sun',
    'Mon',
    'Tue',
    'Wed',
    'Thu',
    'Fri',
    'Sat'
  ];

  /**
   * Initialize by selecting current week.
   */
  constructor(private ref: ElementRef) {
    const curTime: Date = new Date();
    this.month = new Date(curTime.getFullYear(), curTime.getMonth());
    this.today = new Date(curTime.getFullYear(), curTime.getMonth(), curTime.getDate());
    const weekStart: Date = new Date(curTime.getFullYear(), curTime.getMonth(), curTime.getDate() - curTime.getDay());
    const weekEnd: Date = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6);
    this._selectedDateRange = { start: weekStart, end: weekEnd };
  }

  ngOnInit(): void {
    this.selectedDateRange.emit(this._selectedDateRange);
  }

  /**
   * Closes the calendar dropdown, if user clicked anywhere outside it.
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!(this.ref.nativeElement as Node).contains(event.target as Node)) {
      this.calendarOpen = false;
    }
  }

  /**
   * Array of 7-element arrays of days visible on the presented calendar. The structure contains all days of the month
   * presented on the calendar, split into full weeks. First and last week may contain days from previous and next
   * months to keep the week length constant.
   */
  get days(): Date[][] {
    const maxDate: number = new Date(this.month.getFullYear(), this.month.getMonth() + 1, 0).getDate();
    const days: Date[][] = [];
    for (let i = -this.month.getDay(); i < maxDate; i += 7) {
      days.push(
        Array
          .from<number>({ length: 7 })
          .map((_, j: number) => new Date(this.month.getFullYear(), this.month.getMonth(), i + j + 1))
      );
    }
    return days;
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
      this.month = new Date(
        this._selectedDateRange.start.getFullYear(),
        this._selectedDateRange.start.getMonth(),
        this._selectedDateRange.start.getDate() + 1
      );
      this.month.setDate(0);
      const curTime: Date = new Date();
      this.today = new Date(curTime.getFullYear(), curTime.getMonth(), curTime.getDate());
    }
  }

  decrementMonth(): void {
    this.month = new Date(this.month.getFullYear(), this.month.getMonth() - 1);
  }

  incrementMonth(): void {
    this.month = new Date(this.month.getFullYear(), this.month.getMonth() + 1);
  }

  decrementWeek(): void {
    this._selectedDateRange.start.setDate(this._selectedDateRange.start.getDate() - 7);
    this._selectedDateRange.end.setDate(this._selectedDateRange.end.getDate() - 7);
    this.selectedDateRange.emit({...this._selectedDateRange});
  }

  incrementWeek(): void {
    this._selectedDateRange.start.setDate(this._selectedDateRange.start.getDate() + 7);
    this._selectedDateRange.end.setDate(this._selectedDateRange.end.getDate() + 7);
    this.selectedDateRange.emit({...this._selectedDateRange});
  }

  get buttonText(): string {
    if (this._selectedDateRange) {
      if (this._selectedDateRange.start.valueOf() === this._selectedDateRange.end.valueOf()) {
        return new DatePipe('en-US').transform(this._selectedDateRange.start, 'MMM d, y');
      } else if (
        this._selectedDateRange.start.getMonth() === this._selectedDateRange.end.getMonth()
        && this._selectedDateRange.start.getFullYear() === this._selectedDateRange.end.getFullYear()
      ) {
        return new DatePipe('en-US').transform(this._selectedDateRange.start, 'MMM d - ')
        + new DatePipe('en-US').transform(this._selectedDateRange.end, 'd, y');
      } else if (this._selectedDateRange.start.getFullYear() === this._selectedDateRange.end.getFullYear()) {
        return new DatePipe('en-US').transform(this._selectedDateRange.start, 'MMM d - ')
          + new DatePipe('en-US').transform(this._selectedDateRange.end, 'MMM d, y');
      } else {
        return new DatePipe('en-US').transform(this._selectedDateRange.start, 'MMM d, ') + '\''
          + new DatePipe('en-US').transform(this._selectedDateRange.start, 'yy - ')
          + new DatePipe('en-US').transform(this._selectedDateRange.end, 'MMM d, ') + '\''
          + new DatePipe('en-US').transform(this._selectedDateRange.end, 'yy');
      }
    } else {
      return '';
    }
  }

  selectDateRange(dateRange: DateRange) {
    this._selectedDateRange = dateRange;
    this.selectedDateRange.emit(dateRange);
    this.calendarOpen = false;
  }

}
