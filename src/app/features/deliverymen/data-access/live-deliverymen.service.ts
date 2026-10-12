import { inject, Injectable } from '@angular/core';
import { catchError, combineLatest, map, Observable, of, shareReplay, tap } from 'rxjs';
import { DeliverymenApi } from './deliverymen.api';
import { DeliverymenRealtimeService } from './deliverymen-realtime.service';
import { LiveDeliveryman } from './deliveryman.models';

/**
 * المندوبين live للداشبورد:
 * الحالة والموقع من Firestore، والـ deviceToken الأحدث من الـ backend
 * (التطبيق بيسجله في الـ backend)، وبنزامنه لـ Firestore لو مختلف.
 */
@Injectable({ providedIn: 'root' })
export class LiveDeliverymenService {
  private readonly api = inject(DeliverymenApi);
  private readonly realtime = inject(DeliverymenRealtimeService);

  watch(): Observable<LiveDeliveryman[]> {
    const backendTokens$ = this.api.getAll().pipe(
      map((list) => new Map(list.map((d) => [d.id, d.deviceToken]))),
      // لو الـ backend مش متاح نكمل ببيانات Firestore بس
      catchError(() => of(new Map<number, string | null>())),
      shareReplay({ bufferSize: 1, refCount: true }),
    );

    return combineLatest([this.realtime.watchAll(), backendTokens$]).pipe(
      tap(([live, tokens]) => this.syncStaleTokens(live, tokens)),
      map(([live, tokens]) =>
        live.map((d) => ({ ...d, deviceToken: tokens.get(d.id) || d.deviceToken })),
      ),
    );
  }

  private syncStaleTokens(live: LiveDeliveryman[], tokens: Map<number, string | null>): void {
    for (const deliveryman of live) {
      const token = tokens.get(deliveryman.id);
      if (token && token !== deliveryman.deviceToken) {
        this.realtime.syncDeviceToken(deliveryman.id, token).catch(() => undefined);
      }
    }
  }
}
