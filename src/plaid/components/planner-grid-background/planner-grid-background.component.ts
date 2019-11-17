import {ChangeDetectionStrategy, Component, Input} from '@angular/core';

@Component({
  selector: 'plaid-planner-grid-background',
  templateUrl: './planner-grid-background.component.html',
  styleUrls: ['./planner-grid-background.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlannerGridBackgroundComponent {
  readonly hoursLabels: string[] = Array.from<string>({ length: 24 }).map((_, i) =>
    new Date(1970, 0, 1, i).toLocaleTimeString(undefined, { hour: 'numeric' })
  );
  readonly hoursGrid: void[][] = Array.from<void[]>({ length: 24 }).map(() => Array.from<void>({ length: 12 }).map(() => null));
  weekdays: void[];

  @Input()
  pixelsPerMinute;
  @Input()
  set numberOfWeekdays(num: number) {
    this.weekdays = Array.from<void>({ length: num }).map(() => null);
  }
}
