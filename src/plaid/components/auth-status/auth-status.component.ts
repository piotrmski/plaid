import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output
} from '@angular/core';
import {User} from '../../models/user';
import {environment} from '../../../environments/environment';

/**
 * Dumb component, responsible for displaying status of authentication and delegating intent to log out or change
 * account. Presents these actions in a dropdown menu.
 */
@Component({
  selector: 'plaid-auth-status',
  templateUrl: './auth-status.component.html',
  styleUrls: ['./auth-status.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuthStatusComponent {
  readonly appVersion: string = environment.version;
  private _dropdownOpen = false;
  /**
   * Currently authenticated user
   */
  @Input()
  user: User;
  /**
   * Action to show login screen without losing authentication
   */
  @Output()
  changeCredentials = new EventEmitter<null>();
  /**
   * Log out action
   */
  @Output()
  forgetAccount = new EventEmitter<null>();

  constructor(private ref: ElementRef, private cdr: ChangeDetectorRef) {}

  /**
   * Closes dropdown menu, if user clicked anywhere outside it.
   */
  onMousedown: (event: MouseEvent) => void = (event: MouseEvent) => {
    if (!(this.ref.nativeElement as Node).contains(event.target as Node)) {
      this.dropdownOpen = false;
      this.cdr.detectChanges();
    }
  }

  /**
   * Closes dropdown menu, if user presses Escape.
   */
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

  /**
   * Displayed avatar is chosen from user object's avatarUrls map. Preferably 24x24, but if unavailable, last item is
   * chosen, under assumption, that they are ordered from smallest to largest.
   */
  get currentUserAvatarUrl(): string {
    if (!this.user || !this.user.avatarUrls || Object.keys(this.user.avatarUrls).length === 0) {
      return null;
    } else if (this.user.avatarUrls.hasOwnProperty('24x24')) {
      return this.user.avatarUrls['24x24'];
    } else {
      const sizes: string[] = Object.keys(this.user.avatarUrls);
      return this.user.avatarUrls[sizes[sizes.length - 1]];
    }
  }

}
