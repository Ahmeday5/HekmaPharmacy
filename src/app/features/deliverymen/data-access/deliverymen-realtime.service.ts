import { inject, Injectable } from '@angular/core';
import {
  collection,
  collectionData,
  deleteDoc,
  doc,
  Firestore,
  setDoc,
} from '@angular/fire/firestore';
import { map, Observable } from 'rxjs';
import { LiveDeliveryman } from './deliveryman.models';

const COLLECTION = 'deliverymen';

/** شكل الـ document في Firestore (اللي بيكتبه تطبيق المندوب) */
interface DeliverymanDoc {
  id: string;
  name?: string;
  isAvaliable?: boolean;
  imageUrl?: string | null;
  deviceToken?: string | null;
  lat?: number;
  lng?: number;
}

@Injectable({ providedIn: 'root' })
export class DeliverymenRealtimeService {
  private readonly firestore = inject(Firestore);

  /** كل المندوبين live — بيتحدث تلقائي مع أي تغيير في الحالة أو الموقع */
  watchAll(): Observable<LiveDeliveryman[]> {
    const ref = collection(this.firestore, COLLECTION);
    return (collectionData(ref, { idField: 'id' }) as Observable<DeliverymanDoc[]>).pipe(
      map((docs) => docs.map(toLiveDeliveryman)),
    );
  }

  syncDeviceToken(id: number, deviceToken: string): Promise<void> {
    return setDoc(doc(this.firestore, COLLECTION, String(id)), { deviceToken }, { merge: true });
  }

  delete(id: number): Promise<void> {
    return deleteDoc(doc(this.firestore, COLLECTION, String(id)));
  }
}

function toLiveDeliveryman(d: DeliverymanDoc): LiveDeliveryman {
  return {
    id: Number(d.id),
    name: d.name ?? '',
    email: '',
    isAvailable: d.isAvaliable ?? false,
    imageUrl: d.imageUrl || null,
    deviceToken: d.deviceToken || null,
    lat: d.lat ?? null,
    lng: d.lng ?? null,
  };
}
