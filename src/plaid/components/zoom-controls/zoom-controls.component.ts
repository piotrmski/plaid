import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';

/**
 * Dumb component, presents two buttons, handles zoom change shortcuts and delegates change in pixelsPerMinute value.
 */
@Component({
  selector: 'plaid-zoom-controls',
  templateUrl: './zoom-controls.component.html'
})
export class ZoomControlsComponent implements OnInit {
  static readonly MIN_PIXELS_PER_MINUTE_EXPONENT = 0;
  static readonly MAX_PIXELS_PER_MINUTE_EXPONENT = 4;

  zoomInButtonActive = false;
  zoomOutButtonActive = false;
  _pixelsPerMinuteExponent: number;

  @Input()
  shortcutsDisabled = false;

  @Output()
  pixelsPerMinuteChange = new EventEmitter<number>();

  @Output()
  pixelsPerMinuteExponentChange = new EventEmitter<number>();

  ngOnInit(): void {
    this.emitChange();
    // Singleton component, no need to unbind events
    addEventListener('wheel', (e: WheelEvent) => { // Ctrl mouse wheel, Ctrl two finger swipe, pinch
      if (!this.shortcutsDisabled && e.ctrlKey) {
        this.pixelsPerMinuteExponent -= e.deltaY / 800;
        this.emitChange();
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

  get pixelsPerMinuteExponent(): number {
    return this._pixelsPerMinuteExponent;
  }

  // This is expected to have an initial value.
  @Input()
  set pixelsPerMinuteExponent(val: number) {
    if (val < ZoomControlsComponent.MIN_PIXELS_PER_MINUTE_EXPONENT) {
      val = ZoomControlsComponent.MIN_PIXELS_PER_MINUTE_EXPONENT;
    } else if (val > ZoomControlsComponent.MAX_PIXELS_PER_MINUTE_EXPONENT) {
      val = ZoomControlsComponent.MAX_PIXELS_PER_MINUTE_EXPONENT;
    }

    this._pixelsPerMinuteExponent = val;
  }

  zoomIn(): void {
    this.pixelsPerMinuteExponent += 0.25;
    this.emitChange();
  }

  zoomOut(): void {
    this.pixelsPerMinuteExponent -= 0.25;
    this.emitChange();
  }

  emitChange(): void {
    this.pixelsPerMinuteExponentChange.emit(this.pixelsPerMinuteExponent);
    // Emitted value has reduced binary and decimal precision not to brake layout.
    this.pixelsPerMinuteChange.emit(Math.round(Math.pow(2, this.pixelsPerMinuteExponent) * 128) / 128);
  }

  get isAbleToZoomIn(): boolean {
    return this.pixelsPerMinuteExponent < ZoomControlsComponent.MAX_PIXELS_PER_MINUTE_EXPONENT;
  }

  get isAbleToZoomOut(): boolean {
    return this.pixelsPerMinuteExponent > ZoomControlsComponent.MIN_PIXELS_PER_MINUTE_EXPONENT;
  }
}
