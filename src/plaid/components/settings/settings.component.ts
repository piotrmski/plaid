import {Component, ElementRef, HostListener} from '@angular/core';
import {Calendar} from '../../helpers/calendar';

@Component({
  selector: 'plaid-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent {
  dropdownOpen = false;
  readonly hours: Date[];
  readonly weekdays: string[] = Calendar.weekdays;

  constructor(private ref: ElementRef) {
    this.hours = Array.from<Date>({ length: 96 }).map((_, i) => new Date(1970, 0, 1, Math.floor(i / 4), (i % 4) * 15));
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
