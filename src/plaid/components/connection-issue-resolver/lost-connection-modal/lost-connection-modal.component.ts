import {ChangeDetectionStrategy, Component, Input, Output, EventEmitter, OnInit} from '@angular/core';
import Timeout = NodeJS.Timeout;
import { Observable } from 'rxjs';

/**
 * Dumb component, presents lost connection modal and delegates actions to parent component.
 */
@Component({
  selector: 'plaid-lost-connection-modal',
  templateUrl: './lost-connection-modal.component.html',
  styleUrls: ['../connection-issue-resolver.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LostConnectionModalComponent implements OnInit {
  reconnectCountdown: Timeout;

  @Input() open: boolean;
  @Input() fetching: boolean;
  @Output() reconnect = new EventEmitter<void>();
  // This property needs to be set on init and may not change throughout the component's lifecycle.
  @Input() startReconnectCountdown: Observable<void>;

  ngOnInit(): void {
    this.startReconnectCountdown.subscribe(() => {
      this.cancelReconnectCountdown();
      setTimeout(() => { // There needs to be a minimal time gap for the CSS progress animation to reset properly.
        this.reconnectCountdown = setTimeout(() => {
          this.reconnectCountdown = null;
          this.reconnect.emit();
        }, 30000);
      });
    });
  }

  cancelReconnectCountdown(): void {
    if (this.reconnectCountdown != null) {
      clearTimeout(this.reconnectCountdown);
      this.reconnectCountdown = null;
    }
  }
}
