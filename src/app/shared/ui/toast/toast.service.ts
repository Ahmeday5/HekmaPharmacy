import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: number;
  type: ToastType;
  title: string;
  message: string;
  durationMs: number;
}

export interface ToastOptions {
  title?: string;
  durationMs?: number;
}

const DEFAULT_TITLES: Record<ToastType, string> = {
  success: 'تمت العملية بنجاح',
  error: 'حدث خطأ',
  warning: 'تنبيه',
  info: 'معلومة',
};

const DEFAULT_DURATION_MS: Record<ToastType, number> = {
  success: 3500,
  info: 4000,
  warning: 5000,
  error: 6000,
};

const MAX_VISIBLE_TOASTS = 5;

@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 0;
  private readonly _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  success(message: string, options?: ToastOptions): void {
    this.show('success', message, options);
  }

  error(message: string, options?: ToastOptions): void {
    this.show('error', message, options);
  }

  warning(message: string, options?: ToastOptions): void {
    this.show('warning', message, options);
  }

  info(message: string, options?: ToastOptions): void {
    this.show('info', message, options);
  }

  dismiss(id: number): void {
    this._toasts.update((toasts) => toasts.filter((t) => t.id !== id));
  }

  private show(type: ToastType, message: string, options: ToastOptions = {}): void {
    const toast: Toast = {
      id: ++this.nextId,
      type,
      message,
      title: options.title ?? DEFAULT_TITLES[type],
      durationMs: options.durationMs ?? DEFAULT_DURATION_MS[type],
    };
    this._toasts.update((toasts) => [...toasts, toast].slice(-MAX_VISIBLE_TOASTS));
  }
}
