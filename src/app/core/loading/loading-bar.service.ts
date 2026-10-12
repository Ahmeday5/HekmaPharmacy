import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
} from '@angular/router';
import { defer, finalize, MonoTypeOperatorFunction, Observable } from 'rxjs';

export type LoadingBarState = 'idle' | 'loading' | 'done';

/** لو العملية خلصت قبل المدة دي الشريط مش بيظهر خالص (يمنع الوميض) */
const SHOW_DELAY_MS = 150;
const HIDE_AFTER_DONE_MS = 400;

/**
 * شريط التحميل العلوي (زي GitHub / YouTube).
 * بيعد العمليات الجارية (تنقل بين الصفحات + طلبات HTTP) ويظهر طول ما فيه عملية شغالة.
 */
@Injectable({ providedIn: 'root' })
export class LoadingBarService {
  private pending = 0;
  private showTimer: ReturnType<typeof setTimeout> | null = null;
  private hideTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly _state = signal<LoadingBarState>('idle');
  readonly state = this._state.asReadonly();

  constructor() {
    inject(Router)
      .events.pipe(takeUntilDestroyed(inject(DestroyRef)))
      .subscribe((event) => {
        if (event instanceof NavigationStart) {
          this.start();
        } else if (
          event instanceof NavigationEnd ||
          event instanceof NavigationCancel ||
          event instanceof NavigationError
        ) {
          this.stop();
        }
      });
  }

  start(): void {
    this.pending++;
    if (this.pending > 1) {
      return;
    }
    this.clearTimers();
    if (this._state() === 'idle') {
      this.showTimer = setTimeout(() => this._state.set('loading'), SHOW_DELAY_MS);
    } else {
      this._state.set('loading');
    }
  }

  stop(): void {
    this.pending = Math.max(0, this.pending - 1);
    if (this.pending > 0) {
      return;
    }
    this.clearTimers();
    if (this._state() === 'loading') {
      this._state.set('done');
      this.hideTimer = setTimeout(() => this._state.set('idle'), HIDE_AFTER_DONE_MS);
    } else {
      this._state.set('idle');
    }
  }

  /** يربط أي Observable بالشريط: بيبدأ مع الـ subscribe ويقف لما يخلص أو يتلغي */
  track<T>(): MonoTypeOperatorFunction<T> {
    return (source: Observable<T>) =>
      defer(() => {
        this.start();
        return source.pipe(finalize(() => this.stop()));
      });
  }

  private clearTimers(): void {
    if (this.showTimer) {
      clearTimeout(this.showTimer);
      this.showTimer = null;
    }
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
  }
}
