import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { toIsoDate } from '../../../shared/utils/date.util';
import { Order } from '../../orders/data-access/order.models';
import { OrdersApi } from '../../orders/data-access/orders.api';

@Injectable({ providedIn: 'root' })
export class DashboardStatsService {
  private readonly ordersApi = inject(OrdersApi);

  /** عدد طلبات النهارده — صفحة بعنصر واحد كفاية لأن الـ API بيرجع الإجمالي */
  todayOrdersCount(): Observable<number> {
    return this.ordersApi
      .getPage({ page: 1, pageSize: 1, filters: { clientName: '', orderDate: toIsoDate() } })
      .pipe(map((result) => result.totalItems));
  }

  /** أحدث الطلبات (الـ API بيرجعها من الأحدث للأقدم) */
  recentOrders(limit: number): Observable<Order[]> {
    return this.ordersApi
      .getPage({ page: 1, pageSize: limit, filters: { clientName: '', orderDate: '' } })
      .pipe(map((result) => result.items));
  }
}
