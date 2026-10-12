import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Client } from '../../clients/data-access/client.models';
import { Deliveryman } from '../../deliverymen/data-access/deliveryman.models';
import { OrderPayload } from './order.models';
import { OrdersApi } from './orders.api';
import { OrdersRealtimeService } from './orders-realtime.service';

export interface CreateOrderCommand {
  payload: OrderPayload;
  client: Client;
  deliveryman: Pick<Deliveryman, 'id' | 'name'>;
}

/**
 * إنشاء طلب = حفظه في الداتا بيز الرئيسية + نشره على Firestore للمندوب.
 */
@Injectable({ providedIn: 'root' })
export class OrdersService {
  private readonly api = inject(OrdersApi);
  private readonly realtime = inject(OrdersRealtimeService);

  async create({ payload, client, deliveryman }: CreateOrderCommand): Promise<void> {
    const id = await firstValueFrom(this.api.create(payload));

    try {
      await this.realtime.publish({
        id,
        orderCode: payload.orderCode,
        amount: payload.amount,
        address: payload.address,
        notes: payload.notes,
        // الـ ids بتتخزن نصوص زي ما تطبيق المندوب متوقع
        clientId: String(client.id),
        clientName: client.name,
        clientLocation: client.location,
        clientphoneNumber: client.phoneNumber,
        deliveryManId: String(deliveryman.id),
        deliveryManName: deliveryman.name,
      });
    } catch {
      throw new Error(
        `تم حفظ الطلب رقم ${id} لكن تعذر إرساله للمندوب لحظيًا. تحقق من الاتصال وأعد الإرسال.`,
      );
    }
  }
}
