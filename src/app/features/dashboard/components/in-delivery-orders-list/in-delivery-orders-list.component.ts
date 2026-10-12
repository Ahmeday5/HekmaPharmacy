import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SkeletonComponent } from '../../../../shared/ui/skeleton/skeleton.component';
import { InDeliveryOrder } from '../../../orders/data-access/order.models';

@Component({
  selector: 'app-in-delivery-orders-list',
  standalone: true,
  imports: [DecimalPipe, SkeletonComponent],
  templateUrl: './in-delivery-orders-list.component.html',
  styleUrl: './in-delivery-orders-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InDeliveryOrdersListComponent {
  /** null = لسه بيحمل */
  readonly orders = input.required<InDeliveryOrder[] | null>();

  protected readonly placeholders = [1, 2, 3];
}
