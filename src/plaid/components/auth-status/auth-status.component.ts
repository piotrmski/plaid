import {Component, ElementRef, EventEmitter, HostListener, Input, Output} from '@angular/core';
import {User} from '../../models/user';
import {environment} from '../../../environments/environment';

/**
 * Dumb component, responsible for displaying status of authentication and delegating intent to log out or change
 * account. Presents these actions in a dropdown menu.
 */
@Component({
  selector: 'plaid-auth-status',
  templateUrl: './auth-status.component.html',
  styleUrls: ['./auth-status.component.scss']
})
export class AuthStatusComponent {
  readonly appVersion: string = environment.version;
  dropdownOpen = false;
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

  constructor(private ref: ElementRef) {}

  /**
   * Closes dropdown menu, if user clicked anywhere outside it.
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!(this.ref.nativeElement as Node).contains(event.target as Node)) {
      this.dropdownOpen = false;
    }
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
