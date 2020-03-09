import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';

/**
 * Dumb component, presents two buttons, handles zoom change shortcuts, zoom level easing, and delegates change in
 * pixelsPerMinute value.
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

  animatedPixelsPerMinuteBase: number;
  animatedPixelsPerMinuteBaseRateOfChange = 0;
  requestAnimationFrameHandle: number;

  @Input()
  shortcutsDisabled = false;

  /**
   * Pixels per minute value emitted only after animation is done or if there was no animation. Distinguished to enable
   * performance optimizations.
   */
  @Output()
  pixelsPerMinuteFinalChange = new EventEmitter<number>();

  /**
   * Pixels per minute value emitted only during easing animation. Distinguished to enable performance optimizations.
   */
  @Output()
  pixelsPerMinuteIntermediateChange = new EventEmitter<number>();

  ngOnInit(): void {
    this.pixelsPerMinuteBase = 1.25;
    // Singleton component, no need to unbind events
    addEventListener('wheel', (e: WheelEvent) => { // Ctrl mouse wheel, Ctrl two finger swipe, pinch
      if (!this.shortcutsDisabled && e.ctrlKey) {
        this.pixelsPerMinuteBase -= e.deltaY / 400;
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

  get pixelsPerMinuteBase(): number {
    return this._pixelsPerMinuteBase;
  }

  set pixelsPerMinuteBase(val: number) {
    if (val < ZoomControlsComponent.MIN_PIXELS_PER_MINUTE_BASE) {
      val = ZoomControlsComponent.MIN_PIXELS_PER_MINUTE_BASE;
    } else if (val > ZoomControlsComponent.MAX_PIXELS_PER_MINUTE_BASE) {
      val = ZoomControlsComponent.MAX_PIXELS_PER_MINUTE_BASE;
    }

    if (this._pixelsPerMinuteBase == null) { // If this setter is first called, don't animate.
      this._pixelsPerMinuteBase = val;
      this.animatedPixelsPerMinuteBase = val;
      // Emitted value has reduced binary and decimal precision not to brake layout.
      this.pixelsPerMinuteFinalChange.emit(Math.round(this._pixelsPerMinuteBase * this._pixelsPerMinuteBase * 128) / 128);
    } else if (this._pixelsPerMinuteBase !== val) { // If this is a subsequent change of pixelsPerMinuteBase
      const change = this.animatedPixelsPerMinuteBase - val;
      if (Math.abs(change) < 0.05) { // If change was minimal (less than 0.05), emit final value immediately.
        this.animatedPixelsPerMinuteBase = val;
        this.animatedPixelsPerMinuteBaseRateOfChange = 0;
        this.pixelsPerMinuteFinalChange.emit(Math.round(val * val * 128) / 128);
      } else {
        // If new animation was started during previous animation, change animation starting value to previous animation
        // final value and emit it immediately.
        if (this.animatedPixelsPerMinuteBase !== this._pixelsPerMinuteBase) {
          this.animatedPixelsPerMinuteBase = this._pixelsPerMinuteBase;
          this.pixelsPerMinuteFinalChange.emit(Math.round(this._pixelsPerMinuteBase * this._pixelsPerMinuteBase * 128) / 128);
        }
        // If change is over 0.15, animate change over 100 ms. Otherwise interpolate the animation duration linearly.
        const animationDuration: number = Math.abs(change) > 0.15 ? 100 : (Math.abs(change) * 1000 - 50);
        const animationStartTime: number = new Date().getTime();
        // Parameters A and B of 1-dimensional cubic bezier curve equation.
        const A: number = this.animatedPixelsPerMinuteBase;
        const B: number = this.animatedPixelsPerMinuteBase + this.animatedPixelsPerMinuteBaseRateOfChange * animationDuration / 3;
        if (this.requestAnimationFrameHandle != null) {
          cancelAnimationFrame(this.requestAnimationFrameHandle);
        }
        this.requestAnimationFrameHandle = requestAnimationFrame(
          () => this.animatePixelsPerMinuteBase(animationStartTime, animationDuration, A, B)
        );
      }
      this._pixelsPerMinuteBase = val;
    }
  }

  animatePixelsPerMinuteBase(
    animationStartTime: number, animationDuration: number, A: number, B: number, lastExecutionTime: number = null
  ): void {
    const now = new Date().getTime();
    if (now >= animationStartTime + animationDuration) { // If animation reached the end
      this.animatedPixelsPerMinuteBaseRateOfChange = 0;
      this.animatedPixelsPerMinuteBase = this._pixelsPerMinuteBase;
      this.requestAnimationFrameHandle = null;
      // Emitted value has reduced binary and decimal precision not to brake layout.
      this.pixelsPerMinuteFinalChange.emit(Math.round(this._pixelsPerMinuteBase * this._pixelsPerMinuteBase * 128) / 128);
    } else { // If animation is in progress
      // Animation progress, from 0 to 1.
      const x: number = (now - animationStartTime) / animationDuration;
      // Animated ppm base value calculated using 1-dimensional cubic bezier curve equation. Parameters C and D are
      // both equal to this._pixelsPerMinuteBase.
      const newAnimatedPixelsPerMinuteBase: number = A + (B - A) * 3 * x * (1 - x) * (1 - x) +
        (this._pixelsPerMinuteBase - A) * x * x * (3 - 2 * x);
      if (lastExecutionTime != null && now !== lastExecutionTime) {
        this.animatedPixelsPerMinuteBaseRateOfChange =
          (newAnimatedPixelsPerMinuteBase - this.animatedPixelsPerMinuteBase) / (now - lastExecutionTime);
      }
      this.animatedPixelsPerMinuteBase = newAnimatedPixelsPerMinuteBase;
      this.pixelsPerMinuteIntermediateChange.emit(
        Math.round(this.animatedPixelsPerMinuteBase * this.animatedPixelsPerMinuteBase * 128) / 128
      );
      this.requestAnimationFrameHandle = requestAnimationFrame(
        () => this.animatePixelsPerMinuteBase(animationStartTime, animationDuration, A, B, now)
      );
    }
  }

  zoomIn(): void {
    this.pixelsPerMinuteBase += 1 / 4;
  }

  zoomOut(): void {
    this.pixelsPerMinuteBase -= 1 / 4;
  }

  get isAbleToZoomIn(): boolean {
    return this.pixelsPerMinuteBase < ZoomControlsComponent.MAX_PIXELS_PER_MINUTE_BASE;
  }

  get isAbleToZoomOut(): boolean {
    return this.pixelsPerMinuteBase > ZoomControlsComponent.MIN_PIXELS_PER_MINUTE_BASE;
  }
}
