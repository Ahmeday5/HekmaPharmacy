// src/app/services/realtime.service.ts
import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  DocumentData,
  setDoc,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { InDeliveryOrders } from '../types/InDeliveryOrders.type';
import { allDeliverymen } from '../types/deliverymen.type';

@Injectable({
  providedIn: 'root', // singleton service متاح لكل المشروع
})
export class RealtimeService {
  constructor(private firestore: Firestore) {}

  /**
   * استمع لكل المندوبين (collection 'deliverymen')
   * collectionData يرجع Observable يتحدث تلقائياً عند أي تغيير في Firestore
   * { idField: 'id' } يضيف حقل id للمستندات المرسلة
   */
  getDeliverymen(): Observable<allDeliverymen[]> {
    const ref = collection(this.firestore, 'deliverymen');
    return collectionData(ref, { idField: 'id' }) as Observable<
      allDeliverymen[]
    >;
  }

  /**
   * استرجاع الدليفري مان isAvailable = true
   */
  getAvailableDeliverymen(): Observable<allDeliverymen[]> {
    const ref = collection(this.firestore, 'deliverymen');
    const q = query(
      ref,
      where('isAvaliable', '==', true), // فقط اللي true
      orderBy('createdAt', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<allDeliverymen[]>;
  }

  /**
   * استمع للطلبات (orders). هنا مثال لاستماع للطلبات pending مرتبة بوقت الإنشاء (الأحدث أولاً)
   * يمكنك تعديل query ليرجع فقط الطلبات المخصصة لسائق معين أو حالة معينة.
   */
  getPendingOrders(): Observable<InDeliveryOrders[]> {
    const ref = collection(this.firestore, 'orders');
    return collectionData(ref, { idField: 'id' }) as Observable<
      InDeliveryOrders[]
    >;
  }

  /**
   * استمع فقط للطلبات اللي status = 'InDelivery'
   */
  getInDeliveryOrders(): Observable<InDeliveryOrders[]> {
    const ref = collection(this.firestore, 'orders');
    const q = query(
      ref,
      where('status', '==', 'InDelivery'), // فقط اللي InDelivery
      orderBy('createdAt', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<
      InDeliveryOrders[]
    >;
  }

  /**
   * إضافة طلب جديد إلى Firestore
   * order object يجب أن يحتوي الحقول اللي تحتاجها: clientId, deliveryManId, amount, address, status
   */
  async addOrder(order: any) {
    const docRef = doc(this.firestore, `orders/${order.id}`); // استخدم id القادم من API
    await setDoc(docRef, {
      ...order,
      clientName: order.clientName,
      clientLocation: order.clientLocation,
      clientphoneNumber: order.clientphoneNumber,
      deliveryManName: order.deliveryManName,
      status: 'Pending',
      createdAt: serverTimestamp(),
    });
  }

  /**
   * حدث حالة المندوب (متاح/غير متاح)
   * id: document id في collection 'deliverymen'
   */
  async updateDeliverymanStatus(id: string, isAvailable: boolean) {
    const docRef = doc(this.firestore, `deliverymen/${id}`);
    await updateDoc(docRef, {
      isAvailable,
      lastSeen: serverTimestamp(),
    });
  }

  /**
   * دالة مساعدة: جلب الطلبات المخصصة لسائق محدد (مثلاً لتطبيق الدليفري)
   */
  getOrdersForDriver(
    driverId: string
  ): Observable<(DocumentData & { id?: string })[]> {
    const q = query(
      collection(this.firestore, 'orders'),
      where('assignedDriverId', '==', driverId),
      orderBy('createdAt', 'desc')
    );
    return collectionData(q, { idField: 'id' });
  }
}
