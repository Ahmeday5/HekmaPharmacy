import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BehaviorSubject, catchError, map, Observable, of, startWith, switchMap } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';
import { PageHeaderComponent } from '../../../../shared/ui/page-header/page-header.component';
import { StatCardComponent } from '../../../../shared/ui/stat-card/stat-card.component';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { LiveDeliverymenService } from '../../../deliverymen/data-access/live-deliverymen.service';
import { OrderFormModalComponent } from '../../../orders/components/order-form-modal/order-form-modal.component';
import { Order } from '../../../orders/data-access/order.models';
import { OrdersRealtimeService } from '../../../orders/data-access/orders-realtime.service';
import { DeliverymenCardComponent } from '../../components/deliverymen-card/deliverymen-card.component';
import { InDeliveryOrdersCardComponent } from '../../components/in-delivery-orders-card/in-delivery-orders-card.component';
import { LiveMapComponent } from '../../components/live-map/live-map.component';
import { RecentOrdersCardComponent } from '../../components/recent-orders-card/recent-orders-card.component';
import { DashboardStatsService } from '../../data-access/dashboard-stats.service';

const RECENT_ORDERS_LIMIT = 6;

interface RecentOrdersState {
  orders: Order[] | null;
  error: boolean;
}

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    PageHeaderComponent,
    StatCardComponent,
    LiveMapComponent,
    DeliverymenCardComponent,
    InDeliveryOrdersCardComponent,
    RecentOrdersCardComponent,
    OrderFormModalComponent,
  ],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPageComponent {
  private readonly toast = inject(ToastService);
  private readonly statsService = inject(DashboardStatsService);
  private readonly ordersRealtime = inject(OrdersRealtimeService);
  /** بيتنده بعد إنشاء طلب عشان الإحصائيات وأحدث الطلبات تتحدث */
  private readonly refresh$ = new BehaviorSubject<void>(undefined);

  protected readonly greeting = buildGreeting(inject(AuthService).currentUser()?.name);

  /** null = لسه بيحمل */
  protected readonly deliverymen = toSignal(
    this.withErrorToast(inject(LiveDeliverymenService).watch(), 'تعذر تحميل حالة المندوبين'),
    { initialValue: null },
  );
  protected readonly inDeliveryOrders = toSignal(
    this.withErrorToast(this.ordersRealtime.watchInDelivery(), 'تعذر تحميل الطلبات الجارية'),
    { initialValue: null },
  );
  protected readonly todayOrders = toSignal(
    this.refresh$.pipe(
      switchMap(() =>
        this.statsService.todayOrdersCount().pipe(
          map((count): number | string => count),
          catchError(() => of('—')),
          startWith(null),
        ),
      ),
    ),
    { initialValue: null },
  );
  protected readonly recentOrders = toSignal(
    this.refresh$.pipe(
      switchMap(() =>
        this.ordersRealtime.withLiveStatus(this.statsService.recentOrders(RECENT_ORDERS_LIMIT)).pipe(
          map((orders): RecentOrdersState => ({ orders, error: false })),
          catchError(() => of<RecentOrdersState>({ orders: [], error: true })),
          startWith<RecentOrdersState>({ orders: null, error: false }),
        ),
      ),
    ),
    { initialValue: { orders: null, error: false } },
  );

  protected readonly totalDeliverymen = computed(() => this.deliverymen()?.length ?? null);
  protected readonly availableCount = computed(() => this.countDeliverymen(true));
  protected readonly offlineCount = computed(() => this.countDeliverymen(false));
  protected readonly availabilityRate = computed(() => {
    const total = this.totalDeliverymen();
    const available = this.availableCount();
    return total && available !== null ? Math.round((available / total) * 100) : null;
  });

  protected readonly orderModalOpen = signal(false);

  protected onOrderCreated(): void {
    this.orderModalOpen.set(false);
    this.refresh$.next();
  }

  private countDeliverymen(available: boolean): number | null {
    return this.deliverymen()?.filter((d) => d.isAvailable === available).length ?? null;
  }

  private withErrorToast<T>(source$: Observable<T[]>, message: string): Observable<T[]> {
    return source$.pipe(
      catchError(() => {
        this.toast.error(message);
        return of([]);
      }),
    );
  }
}

function buildGreeting(name: string | undefined): string {
  const hour = new Date().getHours();
  const salutation = hour < 12 ? 'صباح الخير' : 'مساء الخير';
  return name ? `${salutation}، ${name}` : salutation;
}
