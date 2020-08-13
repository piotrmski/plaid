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
  private _open: boolean;
  closeModalCountdown: Timeout;

  @Input() set open(value: boolean) {
    this._open = value;
    // I'm unsure whether I want this modal closing automatically, I'll leave this here for now
    // if (value) {
    //   this.closeModalCountdown = setTimeout(() => {
    //     this.closeModal.emit();
    //     this.closeModalCountdown = null;
    //   }, 30000);
    // }
  }
  get open(): boolean {
    return this._open;
  }
  @Input() error: HttpErrorResponse;
  @Output() errorChange = new EventEmitter<HttpErrorResponse>();
  @Output() closeModal = new EventEmitter<void>();

  get applicationErrorBody(): string {
    return JSON.stringify(this.error && this.error.error ? this.error.error : null);
  }

  cancelCloseModalCountdown(): void {
    if (this.closeModalCountdown != null) {
      clearTimeout(this.closeModalCountdown);
      this.closeModalCountdown = null;
    }
  }
}
