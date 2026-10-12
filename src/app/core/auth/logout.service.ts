import { inject, Injectable } from '@angular/core';
import { ConfirmDialogService } from '../../shared/ui/confirm-dialog/confirm-dialog.service';
import { AuthService } from './auth.service';

/** تسجيل الخروج بعد تأكيد — بيستخدمه السايدبار وقائمة المستخدم */
@Injectable({ providedIn: 'root' })
export class LogoutService {
  private readonly auth = inject(AuthService);
  private readonly confirm = inject(ConfirmDialogService);

  async confirmLogout(): Promise<void> {
    const confirmed = await this.confirm.ask({
      title: 'تسجيل الخروج',
      message: 'هل تريد تسجيل الخروج من لوحة التحكم؟',
      confirmText: 'تسجيل الخروج',
      variant: 'warning',
      icon: 'fa-right-from-bracket',
    });
    if (confirmed) {
      this.auth.logout();
    }
  }
}
