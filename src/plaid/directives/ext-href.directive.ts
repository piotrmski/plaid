import {Directive, ElementRef, HostListener, Input} from '@angular/core';
import {ElectronService} from 'ngx-electron';

@Directive({
  selector: '[plaidExtHref]'
})
export class ExtHrefDirective {
  private _plaidExtHref: string;

  @Input()
  set plaidExtHref(value: string) {
    this._plaidExtHref = value;
    this.el.nativeElement.style.cursor = value != null ? 'pointer' : undefined;
  }

  constructor(private el: ElementRef, private electron: ElectronService) {
  }

  @HostListener('click')
  onClick(): void {
    if (this._plaidExtHref != null) {
      this.electron.shell.openExternal(this._plaidExtHref);
    }
  }

}
