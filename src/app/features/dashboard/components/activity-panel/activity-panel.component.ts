import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import {
  SegmentedControlComponent,
  SegmentOption,
} from '../../../../shared/ui/segmented-control/segmented-control.component';
import { LiveDeliveryman } from '../../../deliverymen/data-access/deliveryman.models';
import { InDeliveryOrder } from '../../../orders/data-access/order.models';
import { DeliverymenListComponent } from '../deliverymen-list/deliverymen-list.component';
import { InDeliveryOrdersListComponent } from '../in-delivery-orders-list/in-delivery-orders-list.component';

type ActivityTab = 'deliverymen' | 'orders';

/** لوحة النشاط اللحظي جنب الخريطة: المندوبين والطلبات الجارية في تبويبات */
@Component({
  selector: 'app-activity-panel',
  standalone: true,
  imports: [SegmentedControlComponent, DeliverymenListComponent, InDeliveryOrdersListComponent],
  template: `
    <app-segmented-control ariaLabel="النشاط اللحظي" [options]="tabs()" [value]="activeTab()"
      (valueChange)="activeTab.set($event)" />

    @if (activeTab() === 'deliverymen') {
    <app-deliverymen-list [deliverymen]="deliverymen()" />
    } @else {
    <app-in-delivery-orders-list [orders]="orders()" />
    }
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 0.875rem;
      min-height: 0;
      padding: 0.875rem;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);
    }
    app-deliverymen-list,
    app-in-delivery-orders-list {
      flex: 1;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityPanelComponent {
  readonly deliverymen = input.required<LiveDeliveryman[] | null>();
  readonly orders = input.required<InDeliveryOrder[] | null>();

  protected readonly activeTab = signal<ActivityTab>('deliverymen');
  protected readonly tabs = computed<SegmentOption<ActivityTab>[]>(() => [
    { value: 'deliverymen', label: 'المندوبين', icon: 'fa-motorcycle', count: this.deliverymen()?.length },
    { value: 'orders', label: 'قيد التوصيل', icon: 'fa-truck-fast', count: this.orders()?.length },
  ]);
}
