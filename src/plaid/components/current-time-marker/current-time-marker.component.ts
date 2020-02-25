import {ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit} from '@angular/core';
import {DateRange} from '../../models/date-range';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import Timeout = NodeJS.Timeout;

/**
 * Dumb component, responsible for displaying current time and marking current date on the grid.
 */
@Component({
  selector: 'plaid-current-time-marker',
  templateUrl: './current-time-marker.component.html',
  styleUrls: ['./current-time-marker.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CurrentTimeMarkerComponent implements OnInit {
  _pixelsPerMinute: number;
  _dateRange: DateRange;
  now: Date;
  today: Date;
  markerVisible: boolean;
  markerOffsetTop: number;
  markerOffsetLeft: number;
  daysVisible: number;
  timeLabel: SafeHtml;
  timeout: Timeout = null;

  /**
   * In how many vertical pixels is one minute represented. Changing will immediately update the marker.
   */
  @Input()
  set pixelsPerMinute(value: number) {
    this._pixelsPerMinute = value;
    this.updateMarker();
  }
  get pixelsPerMinute(): number {
    return this._pixelsPerMinute;
  }

  /**
   * What date range is presented. Changing will immediately update the marker.
   */
  @Input()
  set dateRange(value: DateRange) {
    this._dateRange = value;
    this.daysVisible = Math.round((this.dateRange.end.getTime() - this.dateRange.start.getTime()) / 86400000 + 1);
    this.updateMarker();
  }
  get dateRange(): DateRange {
    return this._dateRange;
  }

  constructor(private sanitizer: DomSanitizer, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    // Marker needs to be updated manually once for the first time, and it will schedule all subsequent updates.
    this.updateMarker();
  }

  updateMarker(): void {
    if (this.timeout != null) { // Prevent multiple timers
      clearTimeout(this.timeout);
    }
    const prevOffsetTop: number = this.markerOffsetTop;
    const prevOffsetLeft: number = this.markerOffsetLeft;
    const prevMinute: number = this.now ? this.now.getMinutes() : null;
    this.now = new Date();
    if (prevMinute !== this.now.getMinutes()) { // If current minute changed, update label.
      this.timeLabel = this.sanitizer.bypassSecurityTrustHtml(
        this.now.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }).replace(':', '<wbr>:')
      );
      this.today = new Date(this.now.getFullYear(), this.now.getMonth(), this.now.getDate());
    }
    // Update marker vertical position, whether current minute changed or not.
    this.markerOffsetTop = Math.round((this.now.getTime() - this.today.getTime()) / 60000 * this.pixelsPerMinute);
    if (this.dateRange) { // Update horizontal position of current date marker.
      this.markerOffsetLeft = Math.round((this.today.getTime() - this.dateRange.start.getTime()) / 86400000);
      this.markerVisible = this.markerOffsetLeft >= 0 && this.markerOffsetLeft < this.daysVisible;
    }
    // If any presented property changed (checking the label substituted for checking minute), invoke change detector
    if (
      prevMinute !== this.now.getMinutes() ||
      prevOffsetTop !== this.markerOffsetTop ||
      prevOffsetLeft !== this.markerOffsetLeft
    ) {
      this.cdr.markForCheck();
    }
    // Schedule next update
    this.timeout = setTimeout(() => this.updateMarker(), 1000);
  }
}
