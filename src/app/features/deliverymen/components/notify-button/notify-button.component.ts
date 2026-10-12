import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { LoadingButtonComponent } from '../../../../shared/ui/loading-button/loading-button.component';
import { Deliveryman } from '../../data-access/deliveryman.models';
import { DeliverymanNotifier } from '../../data-access/deliveryman-notifier.service';

/** زر الجرس لتنبيه المندوب — بيبعت فورًا ويعرض حالة الإرسال */
@Component({
  selector: 'app-notify-button',
  standalone: true,
  imports: [LoadingButtonComponent],
  template: `
    <button
      type="button"
      appLoadingButton
      class="btn-icon btn-icon-primary"
      [loading]="isSending()"
      [disabled]="!deliveryman().isAvailable"
      [title]="title()"
      [attr.aria-label]="title()"
      (click)="notifier.notifyPickupReady(deliveryman())"
    >
      <i class="fa-solid fa-bell"></i>
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotifyButtonComponent {
  readonly deliveryman = input.required<Pick<Deliveryman, 'id' | 'name' | 'isAvailable' | 'deviceToken'>>();

  protected readonly notifier = inject(DeliverymanNotifier);
  protected readonly isSending = computed(() => this.notifier.sending().has(this.deliveryman().id));
  protected readonly title = computed(() =>
    this.deliveryman().isAvailable ? `إرسال تنبيه لـ ${this.deliveryman().name}` : 'المندوب خارج الخدمة',
  );
}
