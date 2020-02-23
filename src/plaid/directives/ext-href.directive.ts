import {Directive, ElementRef, HostListener, Input} from '@angular/core';
import {ElectronService} from 'ngx-electron';

@Directive({
  selector: '[plaidExtHref]'
})
export class ExtHrefDirective {

  @Input()
  plaidExtHref: string;

  constructor(private el: ElementRef, private electron: ElectronService) {
    this.el.nativeElement.style.cursor = 'pointer';
  }

  @HostListener('click')
  onClick(): void {
    this.electron.shell.openExternal(this.plaidExtHref);
  }

}
