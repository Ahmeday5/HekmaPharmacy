import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { ApiAssetPipe } from '../../../../shared/pipes/api-asset.pipe';
import { AvatarComponent } from '../../../../shared/ui/avatar/avatar.component';
import { CardComponent } from '../../../../shared/ui/card/card.component';
import { SearchInputComponent } from '../../../../shared/ui/search-input/search-input.component';
import {
  SegmentedControlComponent,
  SegmentOption,
} from '../../../../shared/ui/segmented-control/segmented-control.component';
import { SkeletonComponent } from '../../../../shared/ui/skeleton/skeleton.component';
import { AvailabilityBadgeComponent } from '../../../deliverymen/components/availability-badge/availability-badge.component';
import { NotifyButtonComponent } from '../../../deliverymen/components/notify-button/notify-button.component';
import { LiveDeliveryman } from '../../../deliverymen/data-access/deliveryman.models';

type AvailabilityFilter = 'all' | 'available' | 'offline';

const FILTERS: Record<AvailabilityFilter, (d: LiveDeliveryman) => boolean> = {
  all: () => true,
  available: (d) => d.isAvailable,
  offline: (d) => !d.isAvailable,
};

@Component({
  selector: 'app-deliverymen-card',
  standalone: true,
  imports: [
    ApiAssetPipe,
    AvatarComponent,
    AvailabilityBadgeComponent,
    CardComponent,
    NotifyButtonComponent,
    SearchInputComponent,
    SegmentedControlComponent,
    SkeletonComponent,
  ],
  templateUrl: './deliverymen-card.component.html',
  styleUrl: './deliverymen-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeliverymenCardComponent {
  /** null = لسه بيحمل */
  readonly deliverymen = input.required<LiveDeliveryman[] | null>();

  protected readonly placeholders = [1, 2, 3, 4];
  protected readonly search = signal('');
  protected readonly filter = signal<AvailabilityFilter>('all');

  protected readonly filterOptions = computed<SegmentOption<AvailabilityFilter>[]>(() => {
    const list = this.deliverymen();
    const count = (key: AvailabilityFilter) => (list ? list.filter(FILTERS[key]).length : null);
    return [
      { value: 'all', label: 'الكل', count: count('all') },
      { value: 'available', label: 'متاح', count: count('available') },
      { value: 'offline', label: 'خارج الخدمة', count: count('offline') },
    ];
  });

  /** المتاحين الأول ثم بالاسم، مع الفلتر والبحث */
  protected readonly visible = computed(() => {
    const term = this.search().toLowerCase();
    return (this.deliverymen() ?? [])
      .filter(FILTERS[this.filter()])
      .filter((d) => !term || d.name.toLowerCase().includes(term))
      .sort((a, b) => Number(b.isAvailable) - Number(a.isAvailable) || a.name.localeCompare(b.name, 'ar'));
  });
}
