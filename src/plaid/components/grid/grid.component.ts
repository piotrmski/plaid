import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnInit
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
export class GridComponent implements OnInit, AfterViewInit {
  static readonly GRID_HEADER_AND_FOOTER_COMBINED_HEIGHT = 50;

  days: Date[];
  _dateRange: DateRange;
  _worklogs: Worklog[];
  worklogsSplitByDays: Worklog[][];
  addHintsSplitByDays: Worklog[][];
  timeSums: string[];
  _pixelsPerMinute: number;
  gridHeight = 0;
  timeout: number;
  editedWorklog: Worklog;
  _workingDaysStart: number;
  _workingDaysEnd: number;
  _hideWeekend: boolean;
  visibleDaysStart: number;
  visibleDaysEnd: number;
  _workingHoursStartMinutes: number;
  _workingHoursEndMinutes: number;

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
    this.gridHeight = 1440 * ppm + GridComponent.GRID_HEADER_AND_FOOTER_COMBINED_HEIGHT;
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
          // Worklogs need to be sorted by starting time for the next step.
        ).sort((a, b) => new Date(a.started).getTime() - new Date(b.started).getTime());

      if (this.days && this.days.length > 0) {
        this.days.forEach((weekday: Date, weekdayIndex: number) => {
          this.worklogsSplitByDays[weekdayIndex].length = 0;
          // Here the magic of putting overlapping worklogs side by side happens. To explain what happens here, let's
          // use this highly pathological example. Say I have 5 worklogs to lay out:
          // - A: 9 AM - 10 AM
          // - B: 10 AM - 1 PM
          // - C: 10 AM - 12 AM
          // - D: 11 AM - 1 PM
          // - E: 12 AM - 2 PM
          // And my goal is to lay them out like this:
          // 9 AM     +--------------------------------------+      ^
          //          | A                                    |      | first section - 1 column wide
          //          | column: 0, columns: 1                |      |
          // 10 AM    +------------+------------+------------+      v
          //          | B          | C          |                   ^
          //          | column: 0  | column: 1  |                   |
          // 11 AM    | columns: 3 | columns: 3 +------------+      |
          //          |            |            | D          |      |
          //          |            |            | column: 2  |      |
          // 12 AM    |            +------------+ columns: 3 |      | second section - 3 columns wide
          //          |            | E          |            |      |
          //          |            | column: 1  |            |      |
          // 1 PM     +------------+ columns: 3 +------------+      |
          //                       |            |                   |
          //                       |            |                   |
          // 2 PM                  +------------+                   V
          // If the user was to lay out their worklogs with no overlaps, each worklog would be its own section.
          const columnsLastLogsEndsDates: Date[] = [];
          let lastLogEndDate: Date = new Date(0); // Greatest ending time of previously processed work logs
          const sectionsSizes: number[] = []; // Sizes of unbroken series of overlapping worklogs (here called sections)
          // In the aforementioned example we see can distinguish two sections, one with 1 worklog and the other one
          // with 4, so we will expect sectionsSizes = [1, 4].
          const sectionsMaxColumns: number[] = []; // Greatest column number which had to be used in each section
          // In the example the first section is 1 column wide, and the other is 3 columns wide, therefore
          // sectionsMaxColumns = [1, 3].
          this.worklogs.filter(worklog =>
            new Date(worklog.started) >= weekday &&
            new Date(worklog.started) < new Date(weekday.getTime() + 86400000)
          ).forEach(worklog => {
            // First step is to find the first column in which a given worklog will fit (the loop will iterate over the
            // columns in which the worklog doesn't fit).
            // After processing A: column = 0, columnsLastLogsEndsDates = [10 AM]
            // After processing B: column = 0, columnsLastLogsEndsDates = [1 PM]
            // After processing C: column = 1, columnsLastLogsEndsDates = [1 PM, 12 AM]
            // After processing D: column = 2, columnsLastLogsEndsDates = [1 PM, 12 AM, 1 PM]
            // After processing E: column = 1, columnsLastLogsEndsDates = [1 PM, 2 PM, 1 PM]
            let column = 0;
            while ((columnsLastLogsEndsDates[column] || new Date(0)) > new Date(worklog.started)) {
              ++column;
            }
            columnsLastLogsEndsDates[column] = new Date(new Date(worklog.started).getTime() + worklog.timeSpentSeconds * 1000);
            // Second step is to figure out how many sections are there and how wide the sections are.
            // After processing A: lastLogEndDate = 10 AM, sectionsSizes = [1], sectionsMaxColumns = [1]
            // After processing B: lastLogEndDate = 1 PM,  sectionsSizes = [1, 1], sectionsMaxColumns = [1, 1]
            // After processing C: lastLogEndDate = 1 PM,  sectionsSizes = [1, 2], sectionsMaxColumns = [1, 2]
            // After processing D: lastLogEndDate = 1 PM,  sectionsSizes = [1, 3], sectionsMaxColumns = [1, 3]
            // After processing E: lastLogEndDate = 2 PM,  sectionsSizes = [1, 4], sectionsMaxColumns = [1, 3]
            if (new Date(worklog.started) < lastLogEndDate) {
              // If this worklog overlaps with any of the previous - incrementing size and max columns of last section
              ++sectionsSizes[sectionsSizes.length - 1];
              if (sectionsMaxColumns[sectionsMaxColumns.length - 1] < column) {
                sectionsMaxColumns[sectionsMaxColumns.length - 1] = column;
              }
            } else {
              // If this and last work logs do not overlap - new section
              sectionsSizes.push(1);
              sectionsMaxColumns.push(column);
            }
            if (lastLogEndDate < columnsLastLogsEndsDates[column]) {
              lastLogEndDate = columnsLastLogsEndsDates[column];
            }
            // Going forwards through each worklog gave us the information which column each worklog belongs in, but at
            // no point were we certain, that a section won't get wider.
            this.worklogsSplitByDays[weekdayIndex].push({...worklog, _column: column});
          });
          this.worklogsSplitByDays[weekdayIndex].forEach(worklog => {
            // After going through every worklog once we know for certain what the sections are. The third step is then
            // to apply this knowledge, so that the worklogs can be displayed with appropriate width and position.
            // Because we have widths of every section and the number of worklogs in each one, the knowledge is applied
            // to the worklogs by assigning the width of the first section to worklog._columns, decrementing the number
            // of worklogs in the first section, and if the section becomes empty, removing the first element of
            // sectionsSizes and sectionsMaxColumns so that we have a new 'first section'.
            if (sectionsSizes[0] === 0) {
              sectionsSizes.shift();
              sectionsMaxColumns.shift();
            }
            --sectionsSizes[0];
            worklog._columns = sectionsMaxColumns[0] + 1;
          });
        });

        this.timeSums = this.worklogsSplitByDays
          .map(logs => logs.map(worklog => worklog.timeSpentSeconds).reduce((a, b) => a + b, 0)) // Add up all worklog.timeSpentSeconds
          .map(sumOfSeconds => Format.timePeriod(sumOfSeconds)); // Translate it to human readable format
      } else {
        this._worklogs = [];
        this.worklogsSplitByDays = [];
      }
      this.updateAddHints();
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
    this.days = [];
    this.worklogsSplitByDays = [];
    this.addHintsSplitByDays = [];
    if (range) {
      for (const date: Date = new Date(range.start); date <= range.end; date.setDate(date.getDate() + 1)) {
        this.days.push(new Date(date));
        this.worklogsSplitByDays.push([]);
        this.addHintsSplitByDays.push([]);
      }
    }
    this.worklogs = this.worklogs || [];
  }
  get dateRange(): DateRange {
    return this._dateRange;
  }

  @Input()
  set workingHoursStartMinutes(value: number) {
    this._workingHoursStartMinutes = value;
    this.updateAddHints();
  }
  get workingHoursStartMinutes(): number {
    return this._workingHoursStartMinutes;
  }

  @Input()
  set workingHoursEndMinutes(value: number) {
    this._workingHoursEndMinutes = value;
    this.updateAddHints();
  }
  get workingHoursEndMinutes(): number {
    return this._workingHoursEndMinutes;
  }

  @Input()
  set workingDaysStart(value: number) {
    this._workingDaysStart = value;
    this.updateVisibleDays();
  }
  get workingDaysStart(): number {
    return this._workingDaysStart;
  }

  @Input()
  set workingDaysEnd(value: number) {
    this._workingDaysEnd = value;
    this.updateVisibleDays();
  }
  get workingDaysEnd(): number {
    return this._workingDaysEnd;
  }

  @Input()
  set hideWeekend(value: boolean) {
    this._hideWeekend = value;
    this.updateVisibleDays();
  }
  get hideWeekend(): boolean {
    return this._hideWeekend;
  }

  constructor(public hostElement: ElementRef<HTMLElement>, private cdr: ChangeDetectorRef) {}

  // Update add hints every minute to keep up with current time marker
  ngOnInit(): void {
    // Singleton component, no need to clear interval
    setInterval(() => this.updateAddHints(), 60000);
  }

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

  updateVisibleDays(): void {
    this.visibleDaysStart = this.hideWeekend ? this.workingDaysStart : 0;
    this.visibleDaysEnd = this.hideWeekend ? this.workingDaysEnd : 6;
    this.updateAddHints();
  }

  worklogPanelTrackByFn(index: number, item: Worklog): string {
    return JSON.stringify(item);
  }

  updateAddHints(): void {
    if (this.days && this.workingHoursStartMinutes != null && this.workingHoursEndMinutes != null) {
      // Assumption is made that this.worklogsSplitByDays is what it's supposed to be (worklogs there are sorted by
      // starting time in ascending order).
      this.days.filter(d => d < new Date() && d.getDay() >= this.workingDaysStart && d.getDay() <= this.workingDaysEnd)
        .forEach((day: Date, dayIndex: number) => {
        this.addHintsSplitByDays[dayIndex].length = 0;
        let gapStart: Date = new Date(day);
        let gapEnd: Date;
        this.worklogsSplitByDays[dayIndex].forEach(worklog => {
          gapEnd = new Date(worklog.started);
          this.addAddHint(gapStart, gapEnd, day, dayIndex);
          gapStart = new Date(gapEnd.getTime() + worklog.timeSpentSeconds * 1000);
        });
        gapEnd = new Date(day);
        gapEnd.setHours(0, this.workingHoursEndMinutes);
        this.addAddHint(gapStart, gapEnd, day, dayIndex);
      });
    }
  }

  addAddHint(gapStart: Date, gapEnd: Date, day: Date, dayIndex: number): void {
    const oneday = 86400000; // ms
    if (day.getTime() - gapStart.getTime() < oneday && day.getTime() - gapEnd.getTime() < oneday) {
      if (gapStart.getHours() * 60 + gapStart.getMinutes() < this.workingHoursStartMinutes) {
        gapStart = new Date(gapStart);
        gapStart.setHours(Math.floor(this.workingHoursStartMinutes / 60), this.workingHoursStartMinutes % 60);
      }
      if (gapEnd.getHours() * 60 + gapEnd.getMinutes() > this.workingHoursEndMinutes) {
        gapEnd = new Date(gapEnd);
        gapEnd.setHours(Math.floor(this.workingHoursEndMinutes / 60), this.workingHoursEndMinutes % 60);
      }
      const fivemin = 300000; // ms
      const now = new Date(Math.round(new Date().getTime() / fivemin) * fivemin);
      if (gapEnd > now) {
        gapEnd = new Date(gapEnd);
        gapEnd.setHours(now.getHours(), now.getMinutes());
      }
      if (gapEnd > gapStart) {
        const timeSpentSeconds = (gapEnd.getTime() - gapStart.getTime()) / 1000;
        this.addHintsSplitByDays[dayIndex].push({
          started: gapStart.getTime(),
          timeSpentSeconds,
          _columns: 1,
          _column: 0
        });
      }
    }
  }
}
