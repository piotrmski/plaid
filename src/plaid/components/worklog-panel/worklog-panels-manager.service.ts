import {Injectable} from '@angular/core';
import {WorklogPanelComponent} from './worklog-panel.component';
import {fromEvent, Subject} from 'rxjs';
import {debounceTime} from 'rxjs/operators';
import {PlaidFacade} from '../../plaid.facade';

/**
 * Service for managing visual aspects of all panels at once - their size and position and whether dark theme is active.
 * Size and position checks are called for all panels after 250 ms after scheduleCheckSizeAndPosition was last called.
 * Additionally, window resize event causes scheduleCheckSizeAndPosition call. State of dark mode from facade is applied
 * to all panels initially and after change.
 */
@Injectable({providedIn: 'root'})
export class WorklogPanelsManagerService {
  private panels: WorklogPanelComponent[] = [];
  private scheduler = new Subject<void>();
  private darkMode: boolean;

  constructor(private facade: PlaidFacade) {
    this.scheduler.asObservable().pipe(debounceTime(250)).subscribe(() => {
      this.panels.forEach(panel => panel.checkSizeAndPosition());
    });
    fromEvent(window, 'resize').subscribe(() => this.scheduleCheckSizeAndPosition());
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
