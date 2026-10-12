import { inject, Injectable } from '@angular/core';
import {
  collection,
  collectionData,
  doc,
  documentId,
  Firestore,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from '@angular/fire/firestore';
import { catchError, combineLatest, map, Observable, of, startWith, switchMap } from 'rxjs';
import { InDeliveryOrder, Order } from './order.models';

const COLLECTION = 'orders';
/** أقصى عدد قيم في استعلام 'in' في Firestore */
const FIRESTORE_IN_QUERY_LIMIT = 30;

/**
 * شكل الطلب في Firestore — تطبيق المندوب بيقرا الحقول دي بالأسماء دي بالظبط
 * (بما فيها clientphoneNumber)، فأي تغيير هنا لازم يتعمل في التطبيق كمان.
 */
export interface OrderDocument {
  id: number;
  orderCode: string;
  amount: number;
  address: string;
  notes: string;
  clientId: string;
  clientName: string;
  clientLocation: string;
  clientphoneNumber: string;
  deliveryManId: string;
  deliveryManName: string;
}

interface OrderDocSnapshot {
  id: string;
  status?: unknown;
  orderCode?: string;
  clientName?: string;
  deliveryManName?: string;
  address?: string;
  amount?: number;
}

@Injectable({ providedIn: 'root' })
export class OrdersRealtimeService {
  private readonly firestore = inject(Firestore);

  /** ينشر الطلب الجديد عشان يوصل لتطبيق المندوب لحظيًا */
  publish(order: OrderDocument): Promise<void> {
    return setDoc(doc(this.firestore, COLLECTION, String(order.id)), {
      ...order,
      status: 'Pending',
      createdAt: serverTimestamp(),
    });
  }

  watchInDelivery(): Observable<InDeliveryOrder[]> {
    const q = query(
      collection(this.firestore, COLLECTION),
      where('status', '==', 'InDelivery'),
      orderBy('createdAt', 'desc'),
    );
    return (collectionData(q, { idField: 'id' }) as Observable<OrderDocSnapshot[]>).pipe(
      map((docs) =>
        docs.map((d) => ({
          id: d.id,
          orderCode: d.orderCode ?? '',
          clientName: d.clientName ?? '',
          deliverymanName: d.deliveryManName ?? '',
          address: d.address ?? '',
          amount: d.amount ?? null,
        })),
      ),
    );
  }

  /**
   * يدمج الحالة اللحظية من Firestore مع طلبات جاية من الـ API (الداتا بيز الرئيسية).
   * كل البيانات من الـ API ما عدا الحالة. لو Firestore وقع بنكمل بحالة الـ API.
   * switchMap بيلغي الاستماع القديم مع كل ليستة جديدة (صفحة/بحث).
   */
  withLiveStatus(orders$: Observable<Order[]>): Observable<Order[]> {
    return orders$.pipe(
      switchMap((orders) =>
        this.watchStatuses(orders.map((order) => order.id)).pipe(
          catchError(() => of(new Map<string, string>())),
          startWith(new Map<string, string>()),
          map((live) =>
            orders.map((order) => ({ ...order, status: live.get(String(order.id)) ?? order.status })),
          ),
        ),
      ),
    );
  }

  /**
   * حالة مجموعة طلبات live: Map من orderId → status.
   * الطلبات اللي مش موجودة في Firestore مش بترجع — الـ caller يستخدم حالتها من الـ API.
   */
  watchStatuses(orderIds: ReadonlyArray<number>): Observable<Map<string, string>> {
    const ids = [...new Set(orderIds.map(String))];
    if (ids.length === 0) {
      return of(new Map());
    }

    const ordersRef = collection(this.firestore, COLLECTION);
    const batches = chunk(ids, FIRESTORE_IN_QUERY_LIMIT).map(
      (batch) =>
        collectionData(query(ordersRef, where(documentId(), 'in', batch)), {
          idField: 'id',
        }) as Observable<OrderDocSnapshot[]>,
    );

    return combineLatest(batches).pipe(
      map((results) => {
        const statuses = new Map<string, string>();
        for (const order of results.flat()) {
          if (typeof order.status === 'string' && order.status) {
            statuses.set(order.id, order.status);
          }
        }
        return statuses;
      }),
    );
  }
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}
