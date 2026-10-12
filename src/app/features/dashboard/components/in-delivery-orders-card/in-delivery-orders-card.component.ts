import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CardComponent } from '../../../../shared/ui/card/card.component';
import { SkeletonComponent } from '../../../../shared/ui/skeleton/skeleton.component';
import { InDeliveryOrder } from '../../../orders/data-access/order.models';

@Component({
  selector: 'app-in-delivery-orders-card',
  standalone: true,
  imports: [CardComponent, DecimalPipe, SkeletonComponent],
  templateUrl: './in-delivery-orders-card.component.html',
  styleUrl: './in-delivery-orders-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InDeliveryOrdersCardComponent {
  /** null = لسه بيحمل */
  readonly orders = input.required<InDeliveryOrder[] | null>();

  protected readonly placeholders = [1, 2, 3];
}
