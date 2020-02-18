import {ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit} from '@angular/core';
import {DateRange} from '../../models/date-range';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import Timeout = NodeJS.Timeout;

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

  @Input()
  set pixelsPerMinute(value: number) {
    this._pixelsPerMinute = value;
    this.updateMarker();
  }
  get pixelsPerMinute(): number {
    return this._pixelsPerMinute;
  }

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
    this.updateMarker();
  }

  updateMarker(): void {
    if (this.timeout != null) {
      clearTimeout(this.timeout);
    }
    const prevOffsetTop: number = this.markerOffsetTop;
    const prevMinute: number = this.now ? this.now.getMinutes() : null;
    this.now = new Date();
    if (prevMinute !== this.now.getMinutes()) {
      this.timeLabel = this.sanitizer.bypassSecurityTrustHtml(
        this.now.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }).replace(':', '<wbr>:')
      );
      this.today = new Date(this.now.getFullYear(), this.now.getMonth(), this.now.getDate());
    }
    this.markerOffsetTop = Math.round((this.now.getTime() - this.today.getTime()) / 60000 * this.pixelsPerMinute);
    if (this.dateRange) {
      this.markerOffsetLeft = Math.round((this.today.getTime() - this.dateRange.start.getTime()) / 86400000);
      this.markerVisible = this.markerOffsetLeft >= 0 && this.markerOffsetLeft < this.daysVisible;
    }
    if (prevMinute !== this.now.getMinutes() || prevOffsetTop !== this.markerOffsetTop) {
      this.cdr.markForCheck();
    }
    this.timeout = setTimeout(() => this.updateMarker(), 1000);
  }
}
