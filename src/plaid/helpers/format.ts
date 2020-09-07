import {DatePipe} from '@angular/common';
import {DateRange} from '../model/date-range';

export class Format {
  static date(date: Date): string {
    return new DatePipe('en-US').transform(date, 'MMM d, y');
  }

  static dateRange(dateRange: DateRange): string {
    if (dateRange.start.valueOf() === dateRange.end.valueOf()) {
      return new DatePipe('en-US').transform(dateRange.start, 'MMM d, y');
    } else if (
      dateRange.start.getMonth() === dateRange.end.getMonth()
      && dateRange.start.getFullYear() === dateRange.end.getFullYear()
    ) {
      return new DatePipe('en-US').transform(dateRange.start, 'MMM d - ')
        + new DatePipe('en-US').transform(dateRange.end, 'd, y');
    } else if (dateRange.start.getFullYear() === dateRange.end.getFullYear()) {
      return new DatePipe('en-US').transform(dateRange.start, 'MMM d - ')
        + new DatePipe('en-US').transform(dateRange.end, 'MMM d, y');
    } else {
      return new DatePipe('en-US').transform(dateRange.start, 'MMM d, ') + '\''
        + new DatePipe('en-US').transform(dateRange.start, 'yy - ')
        + new DatePipe('en-US').transform(dateRange.end, 'MMM d, ') + '\''
        + new DatePipe('en-US').transform(dateRange.end, 'yy');
    }
  }

  static time(time: Date): string {
    return time.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  }

  static timePeriod(numSeconds: number): string {
    const hours: number = Math.floor(numSeconds / 3600);
    numSeconds -= hours * 3600;
    const minutes: number = Math.floor(numSeconds / 60);
    numSeconds -= minutes * 60;
    const seconds: number = numSeconds;
    return (hours ? hours + 'h ' : '') + (minutes ? minutes + 'm ' : '') + (seconds ? seconds + 's' : '');
  }
}
