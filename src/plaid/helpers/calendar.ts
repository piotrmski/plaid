import {DateRange} from '../model/date-range';

export class Calendar {
  static readonly months: string[] = [
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

  static readonly monthsShort: string[] = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec'
  ];

  static readonly weekdays: string[] = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday'
  ];

  static readonly weekdaysShort: string[] = [
    'Sun',
    'Mon',
    'Tue',
    'Wed',
    'Thu',
    'Fri',
    'Sat'
  ];

  /**
   * Returns array of 7-element arrays of days visible on a calendar presenting given month. The structure contains all
   * days of the month split into full weeks. First and last week may contain days from previous and next months to keep
   * the week length constant.
   * @param month First day of the month
   */
  static getDaysOfMonth(month: Date): Date[][] {
    const maxDate: number = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const days: Date[][] = [];
    for (let i = -month.getDay(); i < maxDate; i += 7) {
      days.push(
        Array
          .from<number>({ length: 7 })
          .map((_, j: number) => new Date(month.getFullYear(), month.getMonth(), i + j + 1))
      );
    }
    return days;
  }

  static copyDateRange(dateRange: DateRange): DateRange {
    return {
      start: new Date(dateRange.start),
      end: new Date(dateRange.end)
    };
  }
}
