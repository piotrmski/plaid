import {Injectable} from '@angular/core';
import {WorklogPanelComponent} from './worklog-panel.component';
import {fromEvent, Subject} from 'rxjs';
import {debounceTime} from 'rxjs/operators';
import {PlaidFacade} from '../../plaid.facade';

@Injectable({providedIn: 'root'})
export class WorklogPanelsManagerService {
  private panels: WorklogPanelComponent[] = [];
  private scheduler = new Subject<void>();
  private darkMode: boolean;

  constructor(private facade: PlaidFacade) {
    this.scheduler.asObservable().pipe(debounceTime(250)).subscribe(() => {
      this.panels.forEach(panel => panel.checkSizeAndPosition());
    });
    fromEvent(window, 'resize').subscribe(() => this.scheduler.next());
    facade.getDarkMode$().subscribe(darkMode => {
      this.darkMode = darkMode;
      this.panels.forEach(panel => panel.darkMode = this.darkMode);
    });
  }

  addPanel(panel: WorklogPanelComponent): void {
    this.panels.push(panel);
    panel.darkMode = this.darkMode;
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
