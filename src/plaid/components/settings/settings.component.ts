import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output
} from '@angular/core';
import {Calendar} from '../../helpers/calendar';
import {Theme} from '../../models/theme';

/**
 * Dumb component, presents settings button and dropdown, and delegates settings changes to the parent component.
 */
@Component({
  selector: 'plaid-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsComponent {
  private _dropdownOpen = false;
  readonly weekdays: string[] = Calendar.weekdays;
  @Input()  workingHoursStartMinutes: number;
  @Output() workingHoursStartMinutesChange = new EventEmitter<number>();
  @Input()  workingHoursEndMinutes: number;
  @Output() workingHoursEndMinutesChange = new EventEmitter<number>();
  @Input()  workingDaysStart: number;
  @Output() workingDaysStartChange = new EventEmitter<number>();
  @Input()  workingDaysEnd: number;
  @Output() workingDaysEndChange = new EventEmitter<number>();
  @Input()  hideWeekend: boolean;
  @Output() hideWeekendChange = new EventEmitter<boolean>();
  @Input()  refreshIntervalMinutes: number;
  @Output() refreshIntervalMinutesChange = new EventEmitter<number>();
  @Input()  theme: Theme;
  @Output() themeChange = new EventEmitter<Theme>();

  constructor(private ref: ElementRef, private cdr: ChangeDetectorRef) {
  }

  setWorkingHoursStartMinutes(value: number) {
    // Values are emitted only after initialization and only if they change
    if (value != null) {
      if (this.workingHoursStartMinutes !== value && this.workingHoursStartMinutes !== undefined) {
        this.workingHoursStartMinutesChange.emit(value);
      }
      this.workingHoursStartMinutes = value;
    }
  }

  setWorkingHoursEndMinutes(value: number) {
    if (value != null) {
      if (this.workingHoursEndMinutes !== value && this.workingHoursEndMinutes !== undefined) {
        this.workingHoursEndMinutesChange.emit(value);
      }
      this.workingHoursEndMinutes = value;
    }
  }

  setWorkingDaysStart(value: number) {
    if (this.workingDaysStart !== value && this.workingDaysStart !== undefined) {
      this.workingDaysStartChange.emit(value);
    }
    this.workingDaysStart = value;
  }

  setWorkingDaysEnd(value: number) {
    if (this.workingDaysEnd !== value && this.workingDaysEnd !== undefined) {
      this.workingDaysEndChange.emit(value);
    }
    this.workingDaysEnd = value;
  }

  setHideWeekend(value: boolean) {
    if (this.hideWeekend !== value && this.workingDaysEnd !== undefined) {
      this.hideWeekendChange.emit(value);
    }
    this.hideWeekend = value;
  }

  setRefreshIntervalMinutes(value: number) {
    if (this.refreshIntervalMinutes !== value && this.refreshIntervalMinutes !== undefined) {
      this.refreshIntervalMinutesChange.emit(value);
    }
    this.refreshIntervalMinutes = value;
  }

  setTheme(value: Theme) {
    if (this.theme !== value && this.theme !== undefined) {
      this.themeChange.emit(value);
    }
    this.theme = value;
  }

  /**
   * Closes dropdown, if user clicked anywhere outside it.
   */
  onMousedown: (event: MouseEvent) => void = (event: MouseEvent) => {
    if (!(this.ref.nativeElement as Node).contains(event.target as Node)) {
      this.dropdownOpen = false;
      this.cdr.detectChanges();
    }
  }

  onKeydown: (event: KeyboardEvent) => void = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      this.dropdownOpen = false;
      this.cdr.detectChanges();
    }
  }

  set dropdownOpen(value: boolean) {
    this._dropdownOpen = value;
    if (value) {
      addEventListener('mousedown', this.onMousedown);
      addEventListener('keydown', this.onKeydown);
    } else {
      removeEventListener('mousedown', this.onMousedown);
      removeEventListener('keydown', this.onKeydown);
    }
  }
  get dropdownOpen(): boolean {
    return this._dropdownOpen;
  }

  minutesToTimeString(minutesSinceMidnight: number): string {
    if (minutesSinceMidnight == null) {
      return null;
    }
    const hours: number = Math.floor(minutesSinceMidnight / 60);
    const minutes: number = minutesSinceMidnight % 60;
    return (hours <= 9 ? '0' : '') + hours.toString() + ':' + (minutes <= 9 ? '0' : '') + minutes.toString();
  }

  timeStringToMinutes(timeString: string): number {
    if (!timeString) {
      return null;
    }
    const split: string[] = timeString.split(':');
    if (split.length !== 2) {
      return null;
    }
    return Number(split[0]) * 60 + Number(split[1]);
  }
}
