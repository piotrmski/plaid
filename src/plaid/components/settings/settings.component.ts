import {ChangeDetectionStrategy, Component, ElementRef, EventEmitter, HostListener, Input, Output} from '@angular/core';
import {Calendar} from '../../helpers/calendar';

@Component({
  selector: 'plaid-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsComponent {
  dropdownOpen = false;
  readonly hours: Date[];
  readonly weekdays: string[] = Calendar.weekdays;
  private _workingHoursStartMinutes: number;
  private _workingHoursEndMinutes: number;
  private _workingDaysStart: number;
  private _workingDaysEnd: number;

  constructor(private ref: ElementRef) {
    this.hours = Array.from<Date>({ length: 96 }).map((_, i) => new Date(1970, 0, 1, Math.floor(i / 4), (i % 4) * 15));
  }

  @Input()
  get workingHoursStartMinutes(): number {
    return this._workingHoursStartMinutes;
  }
  set workingHoursStartMinutes(value: number) {
    this.workingHoursStartMinutesChange.emit(value);
    this._workingHoursStartMinutes = value;
  }
  @Output()
  workingHoursStartMinutesChange = new EventEmitter<number>();

  @Input()
  get workingHoursEndMinutes(): number {
    return this._workingHoursEndMinutes;
  }
  set workingHoursEndMinutes(value: number) {
    this.workingHoursEndMinutesChange.emit(value);
    this._workingHoursEndMinutes = value;
  }
  @Output()
  workingHoursEndMinutesChange = new EventEmitter<number>();

  @Input()
  get workingDaysStart(): number {
    return this._workingDaysStart;
  }
  set workingDaysStart(value: number) {
    this.workingDaysStartChange.emit(value);
    this._workingDaysStart = value;
  }
  @Output()
  workingDaysStartChange = new EventEmitter<number>();

  @Input()
  get workingDaysEnd(): number {
    return this._workingDaysEnd;
  }
  set workingDaysEnd(value: number) {
    this.workingDaysEndChange.emit(value);
    this._workingDaysEnd = value;
  }
  @Output()
  workingDaysEndChange = new EventEmitter<number>();

  /**
   * Closes dropdown menu, if user clicked anywhere outside it.
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!(this.ref.nativeElement as Node).contains(event.target as Node)) {
      this.dropdownOpen = false;
    }
  }
}
