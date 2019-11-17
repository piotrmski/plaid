import {Component, ElementRef, EventEmitter, HostListener, Input, Output} from '@angular/core';
import {User} from '../../models/user';
import {environment} from '../../../environments/environment';

@Component({
  selector: 'plaid-auth-status',
  templateUrl: './auth-status.component.html',
  styleUrls: ['./auth-status.component.scss']
})
export class AuthStatusComponent {
  readonly appVersion: string = environment.version;
  dropdownOpen = false;
  @Input()
  user: User;
  @Output()
  changeCredentials = new EventEmitter<null>();
  @Output()
  forgetAccount = new EventEmitter<null>();

  constructor(private ref: ElementRef) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!(this.ref.nativeElement as Node).contains(event.target as Node)) {
      this.dropdownOpen = false;
    }
  }

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
