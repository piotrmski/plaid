import {
  AfterViewInit,
  ChangeDetectionStrategy, ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
} from '@angular/core';
import {Worklog} from '../../models/worklog';
import {DateRange} from '../../models/date-range';
import {PlaidFacade} from "../../plaid.facade";

@Component({
  selector: 'plaid-planner',
  templateUrl: './planner.component.html',
  styleUrls: ['./planner.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlannerComponent implements AfterViewInit {
  days: Date[];
  _dateRange: DateRange;
  _worklogs: Worklog[];
  worklogsSplitByDays: Worklog[][];
  timeSums: string[];
  _pixelsPerMinute: number;
  forcedHeight: number = null;

  @Input()
  set pixelsPerMinute(ppm: number) {
    const change = ppm / this._pixelsPerMinute;
    const newScrollTop = change * this.hostElement.nativeElement.scrollTop
      + (change - 1) * this.hostElement.nativeElement.clientHeight * 0.5;
    if (newScrollTop + this.hostElement.nativeElement.clientHeight > this.hostElement.nativeElement.scrollHeight) {
      this.forcedHeight = newScrollTop + this.hostElement.nativeElement.clientHeight;
      setTimeout(() => {
        this.hostElement.nativeElement.scrollTop = newScrollTop;
        this.forcedHeight = null;
        this._pixelsPerMinute = ppm;
        this.cdr.detectChanges();
      });
    } else {
      this.hostElement.nativeElement.scrollTop = newScrollTop;
      this._pixelsPerMinute = ppm;
    }
  }
  get pixelsPerMinute(): number {
    return this._pixelsPerMinute;
  }

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
          let lastLogEndDate: Date = new Date(0); // (last in terms of ending time)
          const sectionsSizes: number[] = []; // Sizes of unbroken series of overlapping work logs (here called sections)
          const sectionsMaxColumns: number[] = []; // Greatest column number which had to be used in each section
          return this.worklogs.filter(worklog =>
            new Date(worklog.started) >= weekday &&
            new Date(worklog.started) < new Date(weekday.getTime() + 86400000)
          ).map(worklog => {
            let column = 0;
            while ((columnsLastLogsEndsDates[column] || new Date(0)) > new Date(worklog.started)) { // Find first column where work log fits
              ++column;
            }
            columnsLastLogsEndsDates[column] = new Date(new Date(worklog.started).getTime() + worklog.timeSpentSeconds * 1000);
            if (new Date(worklog.started) < lastLogEndDate) { // If this and last work logs overlap
              ++sectionsSizes[sectionsSizes.length - 1];
              if (sectionsMaxColumns[sectionsMaxColumns.length - 1] < column) {
                sectionsMaxColumns[sectionsMaxColumns.length - 1] = column;
              }
            } else { // If this and last work logs no not overlap
              sectionsSizes.push(1);
              sectionsMaxColumns.push(column);
            }
            if (lastLogEndDate < columnsLastLogsEndsDates[column]) {
              lastLogEndDate = columnsLastLogsEndsDates[column];
            }
            return {...worklog, _column: column};
          }).map(worklog => {
            if (sectionsSizes[0] === 0) {
              sectionsSizes.shift();
              sectionsMaxColumns.shift();
            }
            --sectionsSizes[0];
            return {...worklog, _columns: sectionsMaxColumns[0] + 1};
          });
        });

        this.timeSums = this.worklogsSplitByDays
          .map(logs => logs.map(worklog => worklog.timeSpentSeconds).reduce((a, b) => a + b, 0)) // Add up all worklog.timeSpentSeconds
          .map(sumOfSeconds => { // Translate it to human readable format
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

  constructor(private hostElement: ElementRef, private cdr: ChangeDetectorRef) {}

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
