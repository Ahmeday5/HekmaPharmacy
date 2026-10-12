import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BehaviorSubject, catchError, map, Observable, of, switchMap } from 'rxjs';
import { PageHeaderComponent } from '../../../../shared/ui/page-header/page-header.component';
import { StatCardComponent } from '../../../../shared/ui/stat-card/stat-card.component';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { LiveDeliverymenService } from '../../../deliverymen/data-access/live-deliverymen.service';
import { OrderFormModalComponent } from '../../../orders/components/order-form-modal/order-form-modal.component';
import { OrdersRealtimeService } from '../../../orders/data-access/orders-realtime.service';
import { ActivityPanelComponent } from '../../components/activity-panel/activity-panel.component';
import { LiveMapComponent } from '../../components/live-map/live-map.component';
import { DashboardStatsService } from '../../data-access/dashboard-stats.service';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [PageHeaderComponent, StatCardComponent, ActivityPanelComponent, LiveMapComponent, OrderFormModalComponent],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPageComponent {
  private readonly toast = inject(ToastService);
  private readonly statsService = inject(DashboardStatsService);
  private readonly refreshStats$ = new BehaviorSubject<void>(undefined);

  /** null = لسه بيحمل */
  protected readonly deliverymen = toSignal(
    this.withErrorToast(inject(LiveDeliverymenService).watch(), 'تعذر تحميل حالة المندوبين'),
    { initialValue: null },
  );
  protected readonly inDeliveryOrders = toSignal(
    this.withErrorToast(inject(OrdersRealtimeService).watchInDelivery(), 'تعذر تحميل الطلبات الجارية'),
    { initialValue: null },
  );
  protected readonly todayOrders = toSignal(
    this.refreshStats$.pipe(
      switchMap(() =>
        this.statsService.todayOrdersCount().pipe(
          map((count): number | string => count),
          catchError(() => of('—')),
        ),
      ),
    ),
    { initialValue: null },
  );

  protected readonly availableCount = computed(() => this.countDeliverymen(true));
  protected readonly offlineCount = computed(() => this.countDeliverymen(false));
  protected readonly totalDeliverymen = computed(() => this.deliverymen()?.length ?? 0);

  protected readonly orderModalOpen = signal(false);

  protected onOrderCreated(): void {
    this.orderModalOpen.set(false);
    this.refreshStats$.next();
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
