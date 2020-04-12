import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input
} from '@angular/core';
import {Worklog} from '../../models/worklog';
import {DateRange} from '../../models/date-range';
import {Format} from '../../helpers/format';

/**
 * Dumb container for the entire grid including header, background, footer, time marker, and work log entries.
 */
@Component({
  selector: 'plaid-grid',
  templateUrl: './grid.component.html',
  styleUrls: ['./grid.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GridComponent implements AfterViewInit {
  days: Date[];
  _dateRange: DateRange;
  _worklogs: Worklog[];
  worklogsSplitByDays: Worklog[][];
  timeSums: string[];
  _pixelsPerMinute: number;
  gridHeight = 0;
  timeout: number;
  editedWorklog: Worklog;

  /**
   * Whether an overlay with a spinner should be visible
   */
  @Input()
  loading: boolean;

  /**
   * In how many vertical pixels is one minute represented. The component will try its best to keep the center of the
   * visible area of the grid on the same hour.
   */
  @Input()
  set pixelsPerMinute(ppm: number) {
    // For smoothness of interaction, the scrollable area height and scrollTop should change in the same event loop
    // cycle. If current scrollable area height is high enough to immediately apply new scrollTop, this is trivial.
    // Otherwise the scrollable content needs to first be stretched high enough, and in the next event loop cycle new
    // scrollTop and new pixelsPerMinute value can be applied. Visually this manifests only on the scroll bar, which
    // isn't in the center of attention.
    if (this.timeout != null) {
      clearTimeout(this.timeout);
    }
    const change = ppm / this._pixelsPerMinute;
    const newScrollTop = change * this.hostElement.nativeElement.scrollTop
      + (change - 1) * this.hostElement.nativeElement.clientHeight * 0.5;
    const oldGridHeight = this.gridHeight;
    this.gridHeight = 1440 * ppm + 60;
    if (newScrollTop + this.hostElement.nativeElement.clientHeight > oldGridHeight) {
      this.timeout = setTimeout(() => {
        this.hostElement.nativeElement.scrollTop = newScrollTop;
        this._pixelsPerMinute = ppm;
        this.cdr.detectChanges();
        this.timeout = null;
      });
    } else {
      this.hostElement.nativeElement.scrollTop = newScrollTop;
      this._pixelsPerMinute = ppm;
    }
  }
  get pixelsPerMinute(): number {
    return this._pixelsPerMinute;
  }

  /**
   * Work log entries displayed on the grid. Entries outside dateRange are discarded. Entries in sections of overlapping
   * logs are displayed side by side in columns.
   */
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
          .map(sumOfSeconds => Format.timePeriod(sumOfSeconds)); // Translate it to human readable format
      } else {
        this._worklogs = [];
        this.worklogsSplitByDays = [];
      }
    }
  }
  get worklogs(): Worklog[] {
    return this._worklogs;
  }

  /**
   * Range of displayed days. Setting the date range also invokes the worklogs setter to remove logs outside the range.
   */
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

  constructor(public hostElement: ElementRef<HTMLElement>, private cdr: ChangeDetectorRef) {}

  /**
   * Scroll vertically into current time and horizontally into current day.
   */
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
