import {ChangeDetectionStrategy, Component, ElementRef, EventEmitter, HostListener, Input, Output} from '@angular/core';
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
  dropdownOpen = false;
  readonly hours: Date[];
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

  constructor(private ref: ElementRef) {
    this.hours = Array.from<Date>({ length: 96 }).map((_, i) => new Date(1970, 0, 1, Math.floor(i / 4), (i % 4) * 15));
  }

  setWorkingHoursStartMinutes(value: number) {
    // Values are emitted only after initialization and only if they change
    if (this.workingHoursStartMinutes !== value && this.workingHoursStartMinutes !== undefined) {
      this.workingHoursStartMinutesChange.emit(value);
    }
    this.workingHoursStartMinutes = value;
  }

  setWorkingHoursEndMinutes(value: number) {
    if (this.workingHoursEndMinutes !== value && this.workingHoursEndMinutes !== undefined) {
      this.workingHoursEndMinutesChange.emit(value);
    }
    this.workingHoursEndMinutes = value;
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
   * Closes dropdown menu, if user clicked anywhere outside it.
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!(this.ref.nativeElement as Node).contains(event.target as Node)) {
      this.dropdownOpen = false;
    }
  }
}
