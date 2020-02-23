import {
  ChangeDetectionStrategy, ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import {Worklog} from '../../models/worklog';
import {PlaidFacade} from '../../plaid.facade';
import {WorklogPanelsManagerService} from './worklog-panels-manager.service';

@Component({
  selector: 'plaid-worklog-panel',
  templateUrl: './worklog-panel.component.html',
  styleUrls: ['./worklog-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WorklogPanelComponent implements OnInit, OnDestroy {
  jiraURL: string;
  _worklog: Worklog;
  _pixelsPerMinute: number;
  undersized = false;
  tooLow = false;
  viewDestroyed = false;
  date: Date;
  panelWidth: number;
  panelHeight: number;
  maxHeight: number;
  panelOffsetTop: number;
  panelOffsetLeft: number;
  panelHue: number;
  components: string;
  timeRange: string;
  _darkMode: boolean;

  @Input()
  set worklog(worklog: Worklog) {
    this._worklog = worklog;
    this.date = new Date(this.worklog.started);
    this.panelWidth = 1 / this.worklog._columns;
    this.panelOffsetLeft = this.worklog._column * this.panelWidth;
    this.panelHue = Math.round((Number(this.worklog.issue.fields.parent
      ? this.worklog.issue.fields.parent.id
      : this.worklog.issue.id) * 360 / 1.61803)) % 360;
    this.components = this.worklog.issue.fields.components
      ? this.worklog.issue.fields.components.map(c => c.name).join(', ')
      : null;
    this.computeHeightAndOffset();
    this.computeTimeRange();
    this.manager.scheduleCheckSizeAndPosition();
  }
  get worklog(): Worklog {
    return this._worklog;
  }

  @Input()
  set pixelsPerMinute(pixelsPerMinute: number) {
    this._pixelsPerMinute = pixelsPerMinute;
    this.computeHeightAndOffset();
    this.manager.scheduleCheckSizeAndPosition();
  }
  get pixelsPerMinute(): number {
    return this._pixelsPerMinute;
  }

  set darkMode(value: boolean) {
    this._darkMode = value;
    this.cdr.markForCheck();
  }
  get darkMode(): boolean {
    return this._darkMode;
  }

  @ViewChild('panelInner', { static: true })
  panelInner: ElementRef;

  constructor(private facade: PlaidFacade, private cdr: ChangeDetectorRef, private manager: WorklogPanelsManagerService) { }

  ngOnInit(): void {
    this.jiraURL = this.facade.getJiraURL();
    this.manager.addPanel(this);
  }

  ngOnDestroy(): void {
    this.manager.removePanel(this);
    this.viewDestroyed = true;
  }

  computeTimeRange(): void {
    const startTime = new Date(this.worklog.started);
    const endTime = new Date(startTime);
    endTime.setTime(endTime.getTime() + this.worklog.timeSpentSeconds * 1000);

    if (
      startTime.getFullYear() === endTime.getFullYear() &&
      startTime.getMonth() === endTime.getMonth() &&
      startTime.getDate() === endTime.getDate()
    ) {
      this.timeRange = startTime.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) + ' - ' +
        endTime.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    } else {
      let sumOfSeconds = this.worklog.timeSpentSeconds;
      const hours: number = Math.floor(sumOfSeconds / 3600);
      sumOfSeconds -= hours * 3600;
      const minutes: number = Math.floor(sumOfSeconds / 60);
      sumOfSeconds -= minutes * 60;
      const seconds: number = sumOfSeconds;
      this.timeRange = 'Since ' + startTime.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) +
        ' for ' + (hours ? hours + 'h ' : '') + (minutes ? minutes + 'm ' : '') + (seconds ? seconds + 's' : '');
    }
  }

  computeHeightAndOffset(): void {
    this.panelOffsetTop = (this.date.getHours() * 60 + this.date.getMinutes()) * this.pixelsPerMinute;
    this.maxHeight = 1440 * this.pixelsPerMinute - this.panelOffsetTop;
    this.panelHeight = Math.min(this.worklog.timeSpentSeconds / 60 * this.pixelsPerMinute, this.maxHeight);
  }

  checkSizeAndPosition(): void {
    if (!this.viewDestroyed) {
      this.undersized = this.panelInner.nativeElement.scrollHeight > this.panelHeight;
      this.tooLow = this.panelInner.nativeElement.scrollHeight + 1 > this.maxHeight;
      this.cdr.markForCheck();
    }
  }
}
