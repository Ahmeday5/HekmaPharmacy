import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CardComponent } from '../../../../shared/ui/card/card.component';
import { SkeletonComponent } from '../../../../shared/ui/skeleton/skeleton.component';
import { OrderStatusBadgeComponent } from '../../../orders/components/order-status-badge/order-status-badge.component';
import { Order } from '../../../orders/data-access/order.models';

@Component({
  selector: 'app-recent-orders-card',
  standalone: true,
  imports: [CardComponent, DatePipe, DecimalPipe, OrderStatusBadgeComponent, RouterLink, SkeletonComponent],
  templateUrl: './recent-orders-card.component.html',
  styleUrl: './recent-orders-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecentOrdersCardComponent {
  /** null = لسه بيحمل */
  readonly orders = input.required<Order[] | null>();
  readonly error = input(false);

  protected readonly placeholders = [1, 2, 3, 4];
}
