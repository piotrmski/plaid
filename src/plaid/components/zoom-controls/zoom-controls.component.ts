import {Component, EventEmitter, Input, Output} from '@angular/core';

@Component({
  selector: 'plaid-zoom-controls',
  templateUrl: './zoom-controls.component.html'
})
export class ZoomControlsComponent {
  readonly pixelsPerMinuteValues: number[] = [1, 2, 3, 4, 6, 8, 12, 16];
  zoomLevelIndex = 1; // index of pixelsPerMinuteValues

  @Input()
  shortcutDisabled = false;

  @Input()
  set pixelsPerMinute(value: number) {
   const index = this.pixelsPerMinuteValues.findIndex(v => v === value);
   if (index >= 0) {
     this.zoomLevelIndex = index;
   }
  }

  @Output()
  pixelsPerMinuteChange = new EventEmitter<number>();

  zoomIn(): void {
    if (this.isAbleToZoomIn) {
      ++this.zoomLevelIndex;
      this.pixelsPerMinuteChange.emit(this.pixelsPerMinuteValues[this.zoomLevelIndex]);
    }
  }

  zoomOut(): void {
    if (this.isAbleToZoomOut) {
      --this.zoomLevelIndex;
      this.pixelsPerMinuteChange.emit(this.pixelsPerMinuteValues[this.zoomLevelIndex]);
    }
  }

  get isAbleToZoomIn(): boolean {
    return this.zoomLevelIndex < this.pixelsPerMinuteValues.length - 1;
  }

  get isAbleToZoomOut(): boolean {
    return this.zoomLevelIndex > 0;
  }
}
