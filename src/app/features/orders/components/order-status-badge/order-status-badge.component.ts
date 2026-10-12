import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { getOrderStatusMeta } from '../../data-access/order-status';

@Component({
  selector: 'app-order-status-badge',
  standalone: true,
  template: `<span class="badge-status {{ meta().badgeClass }}">{{ meta().label }}</span>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderStatusBadgeComponent {
  readonly status = input.required<string | null | undefined>();
  protected readonly meta = computed(() => getOrderStatusMeta(this.status()));
}
