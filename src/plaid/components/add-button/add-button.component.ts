import { Component, OnInit, Input } from '@angular/core';
import { GridComponent } from '../grid/grid.component';

@Component({
  selector: 'plaid-add-button',
  templateUrl: './add-button.component.html'
})
export class AddButtonComponent {
  @Input()
  disabled = false;

  @Input()
  gridComponent: GridComponent;

  click(): void {
    if (!this.disabled) {
      this.gridComponent.addWorklogInTheMiddleOfView();
    }
  }

}
