import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';

/**
 * Dumb component, presents two buttons, handles zoom change shortcuts, and delegates change in pixelsPerMinute value.
 */
@Component({
  selector: 'plaid-zoom-controls',
  templateUrl: './zoom-controls.component.html'
})
export class ZoomControlsComponent implements OnInit {
  static readonly PIXELS_PER_MINUTE_VALUES: number[] = [1, 2, 3, 4, 6, 8, 12, 16];
  static readonly MIN_PIXELS_PER_MINUTE = 1;
  static readonly MAX_PIXELS_PER_MINUTE = 16;

  pixelsPerMinute = 2;
  zoomInButtonActive = false;
  zoomOutButtonActive = false;
  lastScrollAbsDeltaY: number;

  @Input()
  shortcutsDisabled = false;

  @Output()
  pixelsPerMinuteChange = new EventEmitter<number>();

  ngOnInit(): void {
    // Singleton component, no need to unbind events
    addEventListener('wheel', (e: WheelEvent) => { // Ctrl mouse wheel
      if (!this.shortcutsDisabled && e.ctrlKey) {
        if (this.lastScrollAbsDeltaY == null) {
          this.lastScrollAbsDeltaY = Math.abs(e.deltaY);
        }
        if (Math.abs(e.deltaY) < 10 || this.lastScrollAbsDeltaY !== Math.abs(e.deltaY)) {
          // High precision zooming as determined by rapidly changing or very low delta
          this.pixelsPerMinute = Math.min(
            ZoomControlsComponent.MAX_PIXELS_PER_MINUTE,
            Math.max(
              this.pixelsPerMinute - e.deltaY * this.pixelsPerMinute / 100,
              ZoomControlsComponent.MIN_PIXELS_PER_MINUTE
            )
          );
          this.pixelsPerMinuteChange.emit(this.pixelsPerMinute);
        } else {
          // Regular mouse wheel zooming
          if (e.deltaY > 0) {
            this.zoomOut();
          } else if (e.deltaY < 0) {
            this.zoomIn();
          }
        }
        this.lastScrollAbsDeltaY = Math.abs(e.deltaY);
        e.preventDefault();
      }
    }, {passive: false});
    addEventListener('keydown', (e: KeyboardEvent) => {
      if (!this.shortcutsDisabled && e.ctrlKey) {
        if (e.key === '-') { // Ctrl -
          this.zoomOutButtonActive = true;
          this.zoomOut();
          setTimeout(() => this.zoomOutButtonActive = false, 50);
        } else if (e.key === '+' || e.key === '=') { // Ctrl +, Ctrl =
          this.zoomInButtonActive = true;
          this.zoomIn();
          setTimeout(() => this.zoomInButtonActive = false, 50);
        }
      }
    });
  }

  zoomIn(): void {
    if (this.isAbleToZoomIn) {
      this.pixelsPerMinute = ZoomControlsComponent.PIXELS_PER_MINUTE_VALUES.filter(val => val > this.pixelsPerMinute)[0];
      this.pixelsPerMinuteChange.emit(this.pixelsPerMinute);
    }
  }

  zoomOut(): void {
    if (this.isAbleToZoomOut) {
      const ppmsSmallerThanCurrent = ZoomControlsComponent.PIXELS_PER_MINUTE_VALUES.filter(val => val < this.pixelsPerMinute);
      this.pixelsPerMinute = ppmsSmallerThanCurrent[ppmsSmallerThanCurrent.length - 1];
      this.pixelsPerMinuteChange.emit(this.pixelsPerMinute);
    }
  }

  get isAbleToZoomIn(): boolean {
    return this.pixelsPerMinute < ZoomControlsComponent.MAX_PIXELS_PER_MINUTE;
  }

  get isAbleToZoomOut(): boolean {
    return this.pixelsPerMinute > ZoomControlsComponent.MIN_PIXELS_PER_MINUTE;
  }
}
