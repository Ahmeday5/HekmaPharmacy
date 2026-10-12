import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
} from '@angular/core';

/** صورة شخص مع fallback للحروف الأولى لو الصورة مش موجودة أو فشلت في التحميل */
@Component({
  selector: 'app-avatar',
  standalone: true,
  template: `
    @if (showImage()) {
    <img [src]="imageUrl()" [alt]="name()" [style.width.rem]="sizeRem()" [style.height.rem]="sizeRem()"
      loading="lazy" (error)="failedUrl.set(imageUrl())" />
    } @else {
    <span class="initials" [style.width.rem]="sizeRem()" [style.height.rem]="sizeRem()"
      [style.font-size.rem]="sizeRem() * 0.4" [attr.aria-label]="name()">{{ initials() }}</span>
    }
  `,
  styles: `
    :host {
      display: inline-flex;
    }
    img,
    .initials {
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid var(--color-surface);
      box-shadow: var(--shadow-sm);
    }
    .initials {
      display: grid;
      place-items: center;
      background: var(--color-primary-soft);
      color: var(--color-primary);
      font-weight: 800;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvatarComponent {
  readonly imageUrl = input<string | null>(null);
  readonly name = input('');
  /** المقاس بالبكسل على أساس 16px — بيتحول لـ rem عشان يتظبط مع مقياس الواجهة */
  readonly size = input(44);
  protected readonly sizeRem = computed(() => this.size() / 16);

  /** بنحفظ الرابط اللي فشل بس — لو الصورة اتغيرت بتتجرب تاني تلقائي */
  protected readonly failedUrl = signal<string | null>(null);
  protected readonly showImage = computed(
    () => !!this.imageUrl() && this.imageUrl() !== this.failedUrl(),
  );

  protected readonly initials = computed(() =>
    this.name()
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join(''),
  );
}
