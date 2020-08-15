import {
  ChangeDetectionStrategy,
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  ViewChild,
  ElementRef
} from '@angular/core';
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
  @ViewChild('reconnectButton', {static: true}) reconnectButton: ElementRef<HTMLButtonElement>;

  @Input() open: boolean;
  @Input() fetching: boolean;
  @Output() reconnect = new EventEmitter<void>();
  // This property needs to be set on init and may not change throughout the component's lifecycle.
  @Input() startReconnectCountdown: Observable<void>;

  ngOnInit(): void {
    this.startReconnectCountdown.subscribe(() => {
      if (this.reconnectCountdown == null) {
        this.setProgressOnButtonVisible(true);
        this.reconnectCountdown = setTimeout(() => {
          this.setProgressOnButtonVisible(false);
          this.reconnectCountdown = null;
          this.reconnect.emit();
        }, 30000);
      }
    });
  }

  cancelReconnectCountdown(): void {
    if (this.reconnectCountdown != null) {
      clearTimeout(this.reconnectCountdown);
      this.setProgressOnButtonVisible(false);
      this.reconnectCountdown = null;
    }
  }

  setProgressOnButtonVisible(value: boolean): void {
    // Manually manipulating element's class list because toggling the class via component template is wonky
    this.reconnectButton.nativeElement.classList.remove('progress-30s');
    if (value) {
      setTimeout(() => {
        this.reconnectButton.nativeElement.classList.add('progress-30s');
      });
    }
  }
}
