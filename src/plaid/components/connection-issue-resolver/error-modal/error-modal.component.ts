import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from '@angular/core';
import {HttpErrorResponse} from '@angular/common/http';
import Timeout = NodeJS.Timeout;

/**
 * Dumb component, presents error modal and delegates actions to parent component.
 */
@Component({
  selector: 'plaid-error-modal',
  templateUrl: './error-modal.component.html',
  styleUrls: ['../connection-issue-resolver.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ErrorModalComponent {
  @Input() open: boolean;
  @Input() error: HttpErrorResponse;
  @Output() errorChange = new EventEmitter<HttpErrorResponse>();
  @Output() closeModal = new EventEmitter<void>();

  get applicationErrorBody(): string {
    return JSON.stringify(this.error && this.error.error ? this.error.error : null);
  }
}
