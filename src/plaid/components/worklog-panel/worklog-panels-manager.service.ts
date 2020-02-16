import {Injectable} from '@angular/core';
import {WorklogPanelComponent} from './worklog-panel.component';
import {fromEvent, Subject} from 'rxjs';
import {debounceTime} from 'rxjs/operators';

@Injectable({providedIn: 'root'})
export class WorklogPanelsManagerService {
  private panels: WorklogPanelComponent[] = [];
  private scheduler = new Subject<void>();

  constructor() {
    this.scheduler.asObservable().pipe(debounceTime(250)).subscribe(() => {
      this.panels.forEach(panel => panel.checkSizeAndPosition());
    });
    fromEvent(window, 'resize').subscribe(() => this.scheduler.next());
  }

  addPanel(panel: WorklogPanelComponent): void {
    this.panels.push(panel);
  }

  removePanel(panel: WorklogPanelComponent): void {
    const index = this.panels.indexOf(panel);
    if (index >= 0) {
      this.panels.splice(index, 1);
    }
  }

  scheduleCheckSizeAndPosition(): void {
    this.scheduler.next();
  }
}
