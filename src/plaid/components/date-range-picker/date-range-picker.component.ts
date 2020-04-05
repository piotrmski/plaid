import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  Input,
  OnInit
} from '@angular/core';
import {DateRange} from '../../models/date-range';
import {DatePipe} from '@angular/common';
import {Format} from '../../helpers/format';
import {AppStateService} from '../../core/app-state.service';

/**
 * Smart component, responsible for presenting current date on a dropdown calendar, currently selected week and changing
 * selected week.
 */
@Component({
  selector: 'plaid-date-range-picker',
  templateUrl: './date-range-picker.component.html',
  styleUrls: ['./date-range-picker.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DateRangePickerComponent implements OnInit {
  selectedDateRange: DateRange;
  _month: Date;
  today: Date;
  /**
   * Array of 7-element arrays of days visible on the presented calendar. The structure contains all days of the month
   * presented on the calendar, split into full weeks. First and last week may contain days from previous and next
   * months to keep the week length constant.
   */
  days: Date[][];
  _calendarOpen = false;
  decrementWeekButtonActive = false;
  incrementWeekButtonActive = false;

  @Input()
  shortcutsDisabled = false;

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
  constructor(private ref: ElementRef, private cdr: ChangeDetectorRef, private appStateService: AppStateService) {
  }

  ngOnInit(): void {
    // Singleton component, no need to unsubscribe or unbind events
    this.appStateService.getVisibleDateRange$().subscribe(dateRange => this.selectedDateRange = dateRange);

    addEventListener('keydown', (e: KeyboardEvent) => {
      if (!this.shortcutsDisabled) {
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

  /**
   * Closes the calendar dropdown, if user clicked anywhere outside it.
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!(this.ref.nativeElement as Node).contains(event.target as Node)) {
      this.calendarOpen = false;
    }
  }

  set month(month: Date) {
    this._month = month;

    const maxDate: number = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const days: Date[][] = [];
    for (let i = -month.getDay(); i < maxDate; i += 7) {
      days.push(
        Array
          .from<number>({ length: 7 })
          .map((_, j: number) => new Date(month.getFullYear(), month.getMonth(), i + j + 1))
      );
    }
    this.days = days;
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
    this.appStateService.setVisibleDateRange({...this.selectedDateRange});
  }

  incrementWeek(): void {
    this.selectedDateRange.start.setDate(this.selectedDateRange.start.getDate() + 7);
    this.selectedDateRange.end.setDate(this.selectedDateRange.end.getDate() + 7);
    this.appStateService.setVisibleDateRange({...this.selectedDateRange});
  }

  get buttonText(): string {
    return this.selectedDateRange ? Format.dateRange(this.selectedDateRange) : '';
  }

  selectDateRange(dateRange: DateRange) {
    this.selectedDateRange = dateRange;
    this.appStateService.setVisibleDateRange(dateRange);
    this.calendarOpen = false;
  }
}
