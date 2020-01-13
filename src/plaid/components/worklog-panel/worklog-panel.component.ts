import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import {Worklog} from '../../models/worklog';
import {PlaidFacade} from '../../plaid.facade';
import {Subscription} from 'rxjs';

@Component({
  selector: 'plaid-worklog-panel',
  templateUrl: './worklog-panel.component.html',
  styleUrls: ['./worklog-panel.component.scss']
})
export class WorklogPanelComponent implements OnInit, OnDestroy {
  jiraURL: string;
  _worklog: Worklog;
  _pixelsPerMinute: number;
  undersized = false;
  subscriptions: Subscription[] = [];

  @Input()
  set worklog(worklog: Worklog) {
    this._worklog = worklog;
    if (this.pixelsPerMinute) {
      setTimeout(() => this.checkIfUndersized());
    }
  }
  get worklog(): Worklog {
    return this._worklog;
  }
  @Input()
  set pixelsPerMinute(pixelsPerMinute: number) {
    this._pixelsPerMinute = pixelsPerMinute;
    if (this.worklog) {
      setTimeout(() => this.checkIfUndersized());
    }
  }
  get pixelsPerMinute(): number {
    return this._pixelsPerMinute;
  }

  @ViewChild('panelInner', { static: true })
  panelInner: ElementRef;

  constructor(private facade: PlaidFacade) { }

  ngOnInit(): void {
    this.subscriptions.push(this.facade.getJiraURL$().subscribe(url => this.jiraURL = url));
    this.subscriptions.push(this.facade.windowResize$().subscribe(() => this.checkIfUndersized()));
  }

  ngOnDestroy(): void {
    while (this.subscriptions.length > 0) {
      this.subscriptions.pop().unsubscribe();
    }
  }

  get date(): Date {
    return new Date(this.worklog.started);
  }

  get panelWidth(): number {
    return 1 / this.worklog._columns;
  }

  get panelHeight(): number {
    return this.worklog.timeSpentSeconds / 60 * this.pixelsPerMinute;
  }

  get panelOffsetTop(): number {
    return (this.date.getHours() * 60 + this.date.getMinutes()) * this.pixelsPerMinute;
  }

  get panelOffsetLeft(): number {
    return this.worklog._column * this.panelWidth;
  }

  get panelHue(): number {
    const num = Number(this.worklog.issue.fields.parent ? this.worklog.issue.fields.parent.id : this.worklog.issue.id);
    return Math.round((num * 360 / 1.61803)) % 360;
  }

  get components(): string {
    return this.worklog.issue.fields.components ? this.worklog.issue.fields.components.map(c => c.name).join(', ') : null;
  }

  get timeRange(): string {
    const startTime = new Date(this.worklog.started);
    const endTime = new Date(startTime);
    endTime.setTime(endTime.getTime() + this.worklog.timeSpentSeconds * 1000);

    if (
      startTime.getFullYear() === endTime.getFullYear() &&
      startTime.getMonth() === endTime.getMonth() &&
      startTime.getDate() === endTime.getDate()
    ) {
      return startTime.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) + ' - ' +
        endTime.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    } else {
      return null;
    }
  }

  checkIfUndersized(): void {
    this.undersized = this.panelInner.nativeElement.scrollHeight > this.panelHeight;
  }
}
