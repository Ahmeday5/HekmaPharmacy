import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, of, switchMap } from 'rxjs';
import { apiUrl } from '../../../core/config/api.config';
import { ListQuery, PagedResult, PageRequest } from '../../../shared/models/pagination.model';
import { toHttpParams } from '../../../shared/utils/http-params.util';
import { normalizePagedResult, notFoundAsEmptyPage } from '../../../shared/utils/pagination.util';
import { Order, OrderFilters, OrderPayload, UpdateOrderPayload } from './order.models';

interface OrderDto {
  id: number;
  orderCode?: string;
  amount?: number;
  address?: string;
  client?: string;
  deliveryMan?: string;
  orderStatus?: string;
  distance?: number | null;
  orderDate?: string;
  orderStartDateTime?: string | null;
  orderEndDateTime?: string | null;
  orderLocation?: string;
  notes?: string | null;
}

@Injectable({ providedIn: 'root' })
export class OrdersApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = apiUrl('Dashboard');

  getPage({ page, pageSize, filters }: ListQuery<OrderFilters>): Observable<PagedResult<Order>> {
    return this.fetchPage({ page, pageSize }, filters);
  }

  /** ينشئ الطلب ويرجع الـ id بتاعه */
  create(payload: OrderPayload): Observable<number> {
    return this.http
      .post(`${this.baseUrl}/addOrder`, payload, { responseType: 'text' })
      .pipe(
        map(extractCreatedId),
        // الـ endpoint مش دايمًا بيرجع الـ id — نجيبه من أحدث طلب
        switchMap((id) => (id ? of(id) : this.fetchLatestOrderId())),
      );
  }

  update(id: number, payload: UpdateOrderPayload): Observable<void> {
    return this.http
      .put(`${this.baseUrl}/updateOrder/${id}`, payload, { responseType: 'text' })
      .pipe(map(() => undefined));
  }

  delete(id: number): Observable<void> {
    return this.http
      .delete(`${this.baseUrl}/deleteOrder/${id}`, { responseType: 'text' })
      .pipe(map(() => undefined));
  }

  private fetchLatestOrderId(): Observable<number> {
    return this.fetchPage({ page: 1, pageSize: 1 }).pipe(
      map((result) => {
        const id = result.items[0]?.id;
        if (!id) {
          throw new Error('تم إنشاء الطلب لكن تعذر الحصول على رقمه');
        }
        return id;
      }),
    );
  }

  private fetchPage(request: PageRequest, filters?: Partial<OrderFilters>): Observable<PagedResult<Order>> {
    const params = toHttpParams({
      page: request.page,
      pageSize: request.pageSize,
      clientName: filters?.clientName,
      orderDate: filters?.orderDate,
    });
    return this.http
      .get<Partial<PagedResult<OrderDto>> | null>(`${this.baseUrl}/getAllOrders`, { params })
      .pipe(
        map((response) => normalizePagedResult(response, request, toOrder)),
        notFoundAsEmptyPage(request),
      );
  }
}

function toOrder(dto: OrderDto): Order {
  return {
    id: dto.id,
    orderCode: dto.orderCode ?? '',
    amount: dto.amount ?? 0,
    address: dto.address ?? '',
    clientName: dto.client ?? '',
    deliverymanName: dto.deliveryMan ?? '',
    status: dto.orderStatus ?? '',
    distance: dto.distance ?? null,
    orderDate: dto.orderDate ?? '',
    startedAt: dto.orderStartDateTime || null,
    endedAt: dto.orderEndDateTime || null,
    location: dto.orderLocation ?? '',
    notes: dto.notes ?? '',
  };
}

function extractCreatedId(body: string): number | null {
  try {
    const parsed = JSON.parse(body) as Record<string, any> | number;
    if (typeof parsed === 'number') {
      return parsed;
    }
    const id = parsed?.['id'] ?? parsed?.['orderId'] ?? parsed?.['data']?.['id'];
    return typeof id === 'number' ? id : null;
  } catch {
    return null;
  }
}
