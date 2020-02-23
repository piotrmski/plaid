import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';

@Component({
  selector: 'plaid-zoom-controls',
  templateUrl: './zoom-controls.component.html'
})
export class ZoomControlsComponent implements OnInit {
  readonly pixelsPerMinuteValues: number[] = [1, 2, 3, 4, 6, 8, 12, 16];
  zoomLevelIndex = 1; // index of pixelsPerMinuteValues
  zoomInButtonActive = false;
  zoomOutButtonActive = false;

  @Input()
  shortcutsDisabled = false;

  @Input()
  set pixelsPerMinute(value: number) {
   const index = this.pixelsPerMinuteValues.findIndex(v => v === value);
   if (index >= 0) {
     this.zoomLevelIndex = index;
   }
  }

  @Output()
  pixelsPerMinuteChange = new EventEmitter<number>();

  ngOnInit(): void {
    // Singleton component, no need to unbind events
    addEventListener('mousewheel', (e: WheelEvent) => {
      if (!this.shortcutsDisabled && e.ctrlKey) {
        if (e.deltaY > 0) {
          this.zoomOut();
        } else if (e.deltaY < 0) {
          this.zoomIn();
        }
      }
    });
    addEventListener('keydown', (e: KeyboardEvent) => {
      if (!this.shortcutsDisabled && e.ctrlKey) {
        if (e.key === '-') {
          this.zoomOutButtonActive = true;
          this.zoomOut();
          setTimeout(() => this.zoomOutButtonActive = false, 50);
        } else if (e.key === '+' || e.key === '=') {
          this.zoomInButtonActive = true;
          this.zoomIn();
          setTimeout(() => this.zoomInButtonActive = false, 50);
        }
      }
    });
  }

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
