import { inject, Injectable } from '@angular/core';
import { isObservable, lastValueFrom } from 'rxjs';
import { getErrorMessage } from '../../core/http/http-error.util';
import { ConfirmAction, ConfirmDialogService } from '../ui/confirm-dialog/confirm-dialog.service';
import { ToastService } from '../ui/toast/toast.service';

export interface ActionMessages {
  success: string;
  error: string;
}

/** ينفذ عملية ويعرض toast بالنتيجة — بيرجع true لو نجحت */
@Injectable({ providedIn: 'root' })
export class ActionRunner {
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmDialogService);

  async run(action: ConfirmAction, messages: ActionMessages): Promise<boolean> {
    try {
      const result = action();
      await (isObservable(result) ? lastValueFrom(result, { defaultValue: undefined }) : result);
      this.toast.success(messages.success);
      return true;
    } catch (error) {
      this.toast.error(getErrorMessage(error, messages.error));
      return false;
    }
  }

  /**
   * تأكيد حذف موحد: الحذف بيتنفذ جوه الديالوج وزر "حذف" بيفضل loading لحد ما يخلص.
   * بيرجع true لو اتأكد واتحذف بنجاح.
   */
  async confirmAndDelete(entityLabel: string, action: ConfirmAction, messages: ActionMessages): Promise<boolean> {
    try {
      const deleted = await this.confirm.confirmDelete(entityLabel, action);
      if (deleted) {
        this.toast.success(messages.success);
      }
      return deleted;
    } catch (error) {
      this.toast.error(getErrorMessage(error, messages.error));
      return false;
    }
  }
}
