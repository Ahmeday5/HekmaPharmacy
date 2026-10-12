import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  input,
  signal,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { LiveDeliveryman } from '../../../deliverymen/data-access/deliveryman.models';

const PHARMACY_MAP_EMBED_URL =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4152.639702883511!2d31.171253287028506!3d29.99999565608912!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x145846765e2334ff%3A0x29022126e13689c5!2sAl%20Haram%2C%20Giza%20Governorate!5e1!3m2!1sen!2seg!4v1771413716457!5m2!1sen!2seg';

/**
 * خريطة التتبع.
 *
 * نقطة الربط مع التتبع الحقيقي: الكومبوننت بيستقبل بالفعل المندوبين live من Firestore
 * (بالـ lat/lng)، فلما نضيف خريطة تفاعلية (Google Maps JS / Mapbox) بنستبدل الـ iframe
 * بالـ markers هنا بس — من غير ما الداشبورد يتغير.
 */
@Component({
  selector: 'app-live-map',
  standalone: true,
  templateUrl: './live-map.component.html',
  styleUrl: './live-map.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LiveMapComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** null = لسه بيحمل */
  readonly deliverymen = input.required<LiveDeliveryman[] | null>();

  protected readonly mapUrl = inject(DomSanitizer).bypassSecurityTrustResourceUrl(PHARMACY_MAP_EMBED_URL);
  protected readonly fullscreen = signal(false);
  protected readonly availableCount = computed(
    () => this.deliverymen()?.filter((d) => d.isAvailable).length ?? null,
  );
  protected readonly trackedCount = computed(
    () => this.deliverymen()?.filter((d) => d.lat !== null && d.lng !== null).length ?? null,
  );

  @HostListener('document:fullscreenchange')
  protected onFullscreenChange(): void {
    this.fullscreen.set(document.fullscreenElement === this.host.nativeElement);
  }

  protected toggleFullscreen(): void {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      this.host.nativeElement.requestFullscreen?.();
    }
  }
}
