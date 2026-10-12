import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { ApiAssetPipe } from '../../../../shared/pipes/api-asset.pipe';
import { AvatarComponent } from '../../../../shared/ui/avatar/avatar.component';
import { SearchInputComponent } from '../../../../shared/ui/search-input/search-input.component';
import { SkeletonComponent } from '../../../../shared/ui/skeleton/skeleton.component';
import { AvailabilityBadgeComponent } from '../../../deliverymen/components/availability-badge/availability-badge.component';
import { NotifyButtonComponent } from '../../../deliverymen/components/notify-button/notify-button.component';
import { LiveDeliveryman } from '../../../deliverymen/data-access/deliveryman.models';

@Component({
  selector: 'app-deliverymen-list',
  standalone: true,
  imports: [
    ApiAssetPipe,
    AvatarComponent,
    AvailabilityBadgeComponent,
    NotifyButtonComponent,
    SearchInputComponent,
    SkeletonComponent,
  ],
  templateUrl: './deliverymen-list.component.html',
  styleUrl: './deliverymen-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeliverymenListComponent {
  /** null = لسه بيحمل */
  readonly deliverymen = input.required<LiveDeliveryman[] | null>();

  protected readonly placeholders = [1, 2, 3, 4, 5];
  protected readonly search = signal('');

  /** المتاحين الأول ثم بالاسم، مع فلترة البحث */
  protected readonly visible = computed(() => {
    const term = this.search().toLowerCase();
    return (this.deliverymen() ?? [])
      .filter((d) => !term || d.name.toLowerCase().includes(term))
      .sort((a, b) => Number(b.isAvailable) - Number(a.isAvailable) || a.name.localeCompare(b.name, 'ar'));
  });
}
