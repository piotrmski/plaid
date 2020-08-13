import {ChangeDetectionStrategy, Component, Input, Output, EventEmitter} from '@angular/core';

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
  @Input() open: boolean;
  @Input() fetching: boolean;
  @Output() reconnect = new EventEmitter<void>();

}
