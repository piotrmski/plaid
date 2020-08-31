import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';
import {Calendar} from '../../helpers/calendar';

/**
 * Dumb component, responsible for presenting current date on a dropdown calendar, currently selected date and
 * delegating change in date selection.
 */
@Component({
  selector: 'plaid-date-picker-cloud',
  templateUrl: './date-picker-cloud.component.html',
  styleUrls: ['./date-picker-cloud.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DatePickerCloudComponent {
  _month: Date;
  today: Date;
  days: Date[][];
  _open = false;

  @Input()
  selectedDate: Date;

  @Output()
  selectedDateChange = new EventEmitter<Date>();

  /**
   * Open or close the calendar. Opening it will set the month to one which the selected date belongs to.
   */
  @Input()
  set open(open: boolean) {
    this._open = open;
    if (open) {
      const month = new Date(this.selectedDate);
      month.setDate(1);
      this.month = month;
      const curTime: Date = new Date();
      this.today = new Date(curTime.getFullYear(), curTime.getMonth(), curTime.getDate());
    }
  }
  get open(): boolean {
    return this._open;
  }

  @Input()
  flipped = false;

  @Input()
  selectableDaysStart: number;

  @Input()
  selectableDaysEnd: number;

  @Output()
  openChange = new EventEmitter<boolean>();

  readonly months: string[] = Calendar.monthsShort;

  readonly weekdays: string[] = Calendar.weekdaysShort;

  set month(month: Date) {
    this._month = month;
    this.days = Calendar.getDaysOfMonth(month);
  }
  get month(): Date {
    return this._month;
  }

  decrementMonth(): void {
    this.month = new Date(this.month.getFullYear(), this.month.getMonth() - 1);
  }

  incrementMonth(): void {
    this.month = new Date(this.month.getFullYear(), this.month.getMonth() + 1);
  }

  selectDate(date: Date): void {
    if (this.isDateSelectable(date)) {
      this.selectedDate = date;
      this.selectedDateChange.emit(date);
      this.open = false;
      this.openChange.emit(false);
    }
  }

  isDateSelectable(date: Date): boolean {
    return date.getDay() >= this.selectableDaysStart && date.getDay() <= this.selectableDaysEnd;
  }
}
