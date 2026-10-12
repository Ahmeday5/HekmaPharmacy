import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService, ToastType } from './toast.service';

const ICONS: Record<ToastType, string> = {
  success: 'fa-circle-check',
  error: 'fa-circle-xmark',
  warning: 'fa-triangle-exclamation',
  info: 'fa-circle-info',
};

/**
 * بيتحط مرة واحدة في AppComponent.
 * الإخفاء التلقائي معتمد على animationend لشريط التقدم — فبيقف لوحده لما الماوس يقف على الـ toast.
 */
@Component({
  selector: 'app-toast-container',
  standalone: true,
  templateUrl: './toast-container.component.html',
  styleUrl: './toast-container.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastContainerComponent {
  protected readonly toastService = inject(ToastService);
  protected readonly icons = ICONS;
}
