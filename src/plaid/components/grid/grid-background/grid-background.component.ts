import {ChangeDetectionStrategy, Component, Input} from '@angular/core';

/**
 * Dumb component, presents background to the grid.
 */
@Component({
  selector: 'plaid-grid-background',
  templateUrl: './grid-background.component.html',
  styleUrls: ['./grid-background.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GridBackgroundComponent {
  readonly hoursLabels: string[] = Array.from<string>({ length: 24 }).map((_, i) =>
    new Date(1970, 0, 1, i).toLocaleTimeString(undefined, { hour: 'numeric' })
  );
  readonly minutesGrid: void[] = Array.from<void>({ length: 144 }).map(() => null);
  weekdays: void[];

  @Input()
  pixelsPerMinute;
  @Input()
  set numberOfWeekdays(num: number) {
    this.weekdays = Array.from<void>({ length: num }).map(() => null);
  }
}
