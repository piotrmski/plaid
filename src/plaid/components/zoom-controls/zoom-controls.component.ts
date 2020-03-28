import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';

/**
 * Dumb component, presents two buttons, handles zoom change shortcuts and delegates change in pixelsPerMinute value.
 */
@Component({
  selector: 'plaid-zoom-controls',
  templateUrl: './zoom-controls.component.html'
})
export class ZoomControlsComponent implements OnInit {
  static readonly MIN_PIXELS_PER_MINUTE_BASE = 1;
  static readonly MAX_PIXELS_PER_MINUTE_BASE = 4;

  zoomInButtonActive = false;
  zoomOutButtonActive = false;
  _pixelsPerMinuteBase: number;

  @Input()
  shortcutsDisabled = false;

  @Output()
  pixelsPerMinuteChange = new EventEmitter<number>();

  ngOnInit(): void {
    this.pixelsPerMinuteBase = 1.25;
    // Singleton component, no need to unbind events
    addEventListener('wheel', (e: WheelEvent) => { // Ctrl mouse wheel, Ctrl two finger swipe, pinch
      if (!this.shortcutsDisabled && e.ctrlKey) {
        this.pixelsPerMinuteBase -= e.deltaY / 800;
        e.preventDefault();
      }
    }, {passive: false});
    addEventListener('keydown', (e: KeyboardEvent) => {
      if (!this.shortcutsDisabled && e.ctrlKey) {
        if (e.key === '-' || e.key === '_') { // Ctrl -, Ctrl _
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

  get pixelsPerMinuteBase(): number {
    return this._pixelsPerMinuteBase;
  }

  set pixelsPerMinuteBase(val: number) {
    if (val < ZoomControlsComponent.MIN_PIXELS_PER_MINUTE_BASE) {
      val = ZoomControlsComponent.MIN_PIXELS_PER_MINUTE_BASE;
    } else if (val > ZoomControlsComponent.MAX_PIXELS_PER_MINUTE_BASE) {
      val = ZoomControlsComponent.MAX_PIXELS_PER_MINUTE_BASE;
    }

    this._pixelsPerMinuteBase = val;
    // Emitted value has reduced binary and decimal precision not to brake layout.
    this.pixelsPerMinuteChange.emit(Math.round(val * val * 128) / 128);
  }

  zoomIn(): void {
    this.pixelsPerMinuteBase += 0.25;
  }

  zoomOut(): void {
    this.pixelsPerMinuteBase -= 0.25;
  }

  get isAbleToZoomIn(): boolean {
    return this.pixelsPerMinuteBase < ZoomControlsComponent.MAX_PIXELS_PER_MINUTE_BASE;
  }

  get isAbleToZoomOut(): boolean {
    return this.pixelsPerMinuteBase > ZoomControlsComponent.MIN_PIXELS_PER_MINUTE_BASE;
  }
}
