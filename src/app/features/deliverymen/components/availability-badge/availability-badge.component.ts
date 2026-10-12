import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-availability-badge',
  standalone: true,
  template: `
    <span class="badge-status" [class.badge-success]="available()" [class.badge-danger]="!available()">
      {{ available() ? 'جاهز' : 'خارج الخدمة' }}
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvailabilityBadgeComponent {
  readonly available = input.required<boolean>();
}
