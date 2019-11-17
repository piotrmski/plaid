import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
} from '@angular/core';
import {Worklog} from '../../models/worklog';
import {DateRange} from '../../models/date-range';

@Component({
  selector: 'plaid-planner',
  templateUrl: './planner.component.html',
  styleUrls: ['./planner.component.scss']
})
export class PlannerComponent implements AfterViewInit {
  weekdays: Date[];
  _dateRange: DateRange;
  _worklogs: Worklog[];
  timeSums: string[];

  @Input()
  pixelsPerMinute;
  @Input()
  set worklogs(worklogs: Worklog[]) {
    if (worklogs) {
      this._worklogs = worklogs
        .filter(worklog =>
          new Date(worklog.started) >= this.dateRange.start &&
          new Date(worklog.started) < new Date(this.dateRange.end.getTime() + 86400000)
        );

      if (this.weekdays && this.weekdays.length > 0) {
        const timeSumsSeconds: number[] = this.weekdays.map(() => 0);

        worklogs.forEach(worklog => {
          const wlDate: Date = new Date(worklog.started);
          const wlDay: Date = new Date(wlDate.getFullYear(), wlDate.getMonth(), wlDate.getDate());
          const offset: number = Math.round((wlDay.valueOf() - this.weekdays[0].valueOf()) / 86400000);
          timeSumsSeconds[offset] += worklog.timeSpentSeconds;
        });

        this.timeSums = [];
        timeSumsSeconds.forEach(sum => {
          const hours: number = Math.floor(sum / 3600);
          sum -= hours * 3600;
          const minutes: number = Math.floor(sum / 60);
          sum -= minutes * 60;
          const seconds: number = sum;
          const timeSumStringParts: string[] = [];
          if (hours > 0) {
            timeSumStringParts.push(hours + 'h');
          }
          if (minutes > 0) {
            timeSumStringParts.push(minutes + 'm');
          }
          if (seconds > 0) {
            timeSumStringParts.push(seconds + 's');
          }
          this.timeSums.push(timeSumStringParts.join(' '));
        });
      } else {
        this._worklogs = null;
      }
    }
  }
  get worklogs(): Worklog[] {
    return this._worklogs;
  }
  @Input()
  set dateRange(range: DateRange) {
    this._dateRange = range;
    const wd: Date[] = [];
    if (range) {
      for (const date: Date = new Date(range.start); date <= range.end; date.setDate(date.getDate() + 1)) {
        wd.push(new Date(date));
      }
    }
    this.weekdays = wd;
    this.worklogs = this.worklogs || [];
  }
  get dateRange(): DateRange {
    return this._dateRange;
  }
  @Input()
  loading: boolean;

  constructor(private hostElement: ElementRef) {}

  ngAfterViewInit(): void {
    const curTime: Date = new Date();
    this.hostElement.nativeElement.scrollTop =
      (curTime.getHours() * 60 + curTime.getMinutes()) * this.pixelsPerMinute
      - this.hostElement.nativeElement.offsetHeight * .5;
    const weekdayWidth: number = this.hostElement.nativeElement.scrollWidth / 7;
    this.hostElement.nativeElement.scrollLeft = curTime.getDay() * weekdayWidth
      - (this.hostElement.nativeElement.offsetWidth - weekdayWidth) * 0.5;
  }
}
