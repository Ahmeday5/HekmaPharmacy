import { Injectable, signal } from '@angular/core';
import { isObservable, lastValueFrom, Observable } from 'rxjs';

export type ConfirmVariant = 'danger' | 'primary' | 'warning';

export type ConfirmAction = () => Observable<unknown> | Promise<unknown>;

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
  icon?: string;
  /**
   * عملية بتتنفذ جوه الديالوج بعد التأكيد: زر التأكيد بيفضل loading والديالوج مقفول
   * لحد ما تخلص. لو فشلت الـ Promise بترجع reject بالخطأ.
   */
  action?: ConfirmAction;
}

interface ActiveConfirm extends Required<Omit<ConfirmOptions, 'action'>> {
  action?: ConfirmAction;
  resolve: (confirmed: boolean) => void;
  reject: (error: unknown) => void;
}

const VARIANT_ICONS: Record<ConfirmVariant, string> = {
  danger: 'fa-trash-can',
  warning: 'fa-triangle-exclamation',
  primary: 'fa-circle-question',
};

/**
 * بديل confirm() بتاع المتصفح:
 *   if (await this.confirm.ask({ title: 'حذف', message: '...', variant: 'danger' })) { ... }
 */
@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  private readonly _active = signal<ActiveConfirm | null>(null);
  private readonly _busy = signal(false);
  readonly active = this._active.asReadonly();
  readonly busy = this._busy.asReadonly();

  ask(options: ConfirmOptions): Promise<boolean> {
    // لو فيه تأكيد مفتوح بالفعل (ومش شغال) نعتبره اتلغى
    if (!this._busy()) {
      this._active()?.resolve(false);
    }

    const variant = options.variant ?? 'primary';
    return new Promise<boolean>((resolve, reject) => {
      this._active.set({
        confirmText: 'تأكيد',
        cancelText: 'إلغاء',
        icon: VARIANT_ICONS[variant],
        ...options,
        variant,
        resolve,
        reject,
      });
    });
  }

  /** تأكيد الحذف بنفس الشكل في كل المشروع */
  confirmDelete(entityLabel: string, action?: ConfirmAction): Promise<boolean> {
    return this.ask({
      title: 'تأكيد الحذف',
      message: `هل أنت متأكد من حذف ${entityLabel}؟ لا يمكن التراجع عن هذا الإجراء.`,
      confirmText: 'حذف',
      variant: 'danger',
      action,
    });
  }

  async confirm(): Promise<void> {
    const active = this._active();
    if (!active || this._busy()) {
      return;
    }
    if (!active.action) {
      this.finish(() => active.resolve(true));
      return;
    }

    this._busy.set(true);
    try {
      const result = active.action();
      await (isObservable(result) ? lastValueFrom(result, { defaultValue: undefined }) : result);
      this.finish(() => active.resolve(true));
    } catch (error) {
      this.finish(() => active.reject(error));
    }
  }

  cancel(): void {
    const active = this._active();
    if (active && !this._busy()) {
      this.finish(() => active.resolve(false));
    }
  }

  private finish(settle: () => void): void {
    this._busy.set(false);
    this._active.set(null);
    settle();
  }
}
