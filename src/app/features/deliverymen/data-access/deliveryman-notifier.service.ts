import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { PushNotificationsApi } from '../../../core/notifications/push-notifications.api';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { Deliveryman } from './deliveryman.models';

const PICKUP_READY_NOTIFICATION = {
  title: 'طلبية جاهزة!',
  body: 'اذهب لاستلام الطلبية من الصيدلية على الفور',
};

/**
 * تنبيه المندوب إن فيه طلبية جاهزة — بيتبعت فورًا من غير تأكيد،
 * والنتيجة بتظهر في toast. بيمنع الإرسال المكرر لنفس المندوب أثناء الإرسال.
 */
@Injectable({ providedIn: 'root' })
export class DeliverymanNotifier {
  private readonly pushApi = inject(PushNotificationsApi);
  private readonly toast = inject(ToastService);

  private readonly _sending = signal<ReadonlySet<number>>(new Set());
  readonly sending = this._sending.asReadonly();

  async notifyPickupReady(deliveryman: Pick<Deliveryman, 'id' | 'name' | 'deviceToken'>): Promise<void> {
    if (this._sending().has(deliveryman.id)) {
      return;
    }
    if (!deliveryman.deviceToken) {
      this.toast.warning(
        `المندوب "${deliveryman.name}" غير متصل بالتطبيق حاليًا.\nيمكن إرسال التنبيه بعد فتحه للتطبيق على هاتفه.`,
        { title: 'المندوب غير متصل' },
      );
      return;
    }

    this.setSending(deliveryman.id, true);
    try {
      await firstValueFrom(
        this.pushApi.send({ deviceToken: deliveryman.deviceToken, ...PICKUP_READY_NOTIFICATION }),
      );
      this.toast.success(`تم إرسال التنبيه للمندوب "${deliveryman.name}"`, { title: 'تم الإرسال' });
    } catch {
      this.toast.error(
        `تعذر إرسال التنبيه إلى "${deliveryman.name}".\nقد يكون الهاتف مغلقًا أو غير متصل بالإنترنت، حاول مرة أخرى بعد قليل.`,
        { title: 'فشل الإرسال' },
      );
    } finally {
      this.setSending(deliveryman.id, false);
    }
  }

  private setSending(id: number, sending: boolean): void {
    this._sending.update((current) => {
      const next = new Set(current);
      if (sending) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }
}
