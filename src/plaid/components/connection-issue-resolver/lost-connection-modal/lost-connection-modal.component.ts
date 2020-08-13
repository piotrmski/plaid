import {ChangeDetectionStrategy, Component, Input, Output, EventEmitter} from '@angular/core';
import Timeout = NodeJS.Timeout;

/**
 * Dumb component, presents lost connection modal and delegates actions to parent component.
 */
@Component({
  selector: 'plaid-lost-connection-modal',
  templateUrl: './lost-connection-modal.component.html',
  styleUrls: ['../connection-issue-resolver.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LostConnectionModalComponent {
  private _open: boolean;
  reconnectCountdown: Timeout;

  @Input() set open(value: boolean) {
    this._open = value;
    if (value) {
      // FIXME This doesn't trigger for subsequent reconnect attempts
      this.reconnectCountdown = setTimeout(() => {
        this.reconnect.emit();
        this.reconnectCountdown = null;
      }, 30000);
    }
  }
  get open(): boolean {
    return this._open;
  }
  @Input() fetching: boolean;
  @Output() reconnect = new EventEmitter<void>();

  cancelReconnectCountdown(): void {
    if (this.reconnectCountdown != null) {
      clearTimeout(this.reconnectCountdown);
      this.reconnectCountdown = null;
    }
  }
}
