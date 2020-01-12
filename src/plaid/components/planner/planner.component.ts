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
  days: Date[];
  _dateRange: DateRange;
  _worklogs: Worklog[];
  worklogsSplitByDays: Worklog[][];
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
        ).sort((a, b) => new Date(a.started).getTime() - new Date(b.started).getTime());

      if (this.days && this.days.length > 0) {
        this.worklogsSplitByDays = this.days.map(weekday => {
          const columnsLastLogsEndsDates: Date[] = [];
          return this.worklogs.filter(worklog =>
            new Date(worklog.started) >= weekday &&
            new Date(worklog.started) < new Date(weekday.getTime() + 86400000)
          ).map(worklog => {
            let column = 0;
            while ((columnsLastLogsEndsDates[column] || new Date(0)) > new Date(worklog.started)) {
              ++column;
            }
            columnsLastLogsEndsDates[column] = new Date(new Date(worklog.started).getTime() + worklog.timeSpentSeconds * 1000);
            return {...worklog, _column: column};
          });
        });

        this.timeSums = this.worklogsSplitByDays
          .map(logs => logs
            .map(worklog => worklog.timeSpentSeconds)
            .reduce((a, b) => a + b, 0)
          ).map(sumOfSeconds => {
          const hours: number = Math.floor(sumOfSeconds / 3600);
          sumOfSeconds -= hours * 3600;
          const minutes: number = Math.floor(sumOfSeconds / 60);
          sumOfSeconds -= minutes * 60;
          const seconds: number = sumOfSeconds;
          return (hours ? hours + 'h ' : '') + (minutes ? minutes + 'm ' : '') + (seconds ? seconds + 's' : '');
        });
      } else {
        this._worklogs = [];
        this.worklogsSplitByDays = [];
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
    this.days = wd;
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
