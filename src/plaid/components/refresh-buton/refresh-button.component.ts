import {Component, EventEmitter, Input, Output} from '@angular/core';

@Component({
  selector: 'plaid-refresh-button',
  templateUrl: './refresh-button.component.html'
})
export class RefreshButtonComponent {
  @Input()
  disabled = false;
  @Output()
  refresh = new EventEmitter<void>();

  doRefresh(): void {
    if (!this.disabled) {
      this.refresh.emit();
    }
  }
}
