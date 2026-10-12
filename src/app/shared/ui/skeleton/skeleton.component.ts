import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type SkeletonVariant = 'text' | 'circle' | 'rect';

/**
 * Skeleton loading — شكل رمادي متحرك (shimmer) مكان المحتوى لحد ما يتحمل:
 *   <app-skeleton variant="circle" width="40px" height="40px" />
 *   <app-skeleton width="60%" />
 */
@Component({
  selector: 'app-skeleton',
  standalone: true,
  template: '',
  host: {
    'aria-hidden': 'true',
    '[class]': '"skeleton skeleton-" + variant()',
    '[style.width]': 'width()',
    '[style.height]': 'height()',
  },
  styles: `
    :host {
      display: block;
      background: linear-gradient(
        90deg,
        var(--color-skeleton) 25%,
        var(--color-skeleton-highlight) 37%,
        var(--color-skeleton) 63%
      );
      background-size: 400% 100%;
      animation: shimmer 1.4s ease infinite;
    }
    :host(.skeleton-text) {
      height: 0.875rem;
      border-radius: 6px;
    }
    :host(.skeleton-circle) {
      flex-shrink: 0;
      border-radius: 50%;
    }
    :host(.skeleton-rect) {
      border-radius: var(--radius-sm);
    }
    @keyframes shimmer {
      from { background-position: 100% 50%; }
      to { background-position: 0 50%; }
    }
    @media (prefers-reduced-motion: reduce) {
      :host {
        animation: none;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkeletonComponent {
  readonly variant = input<SkeletonVariant>('text');
  readonly width = input('100%');
  readonly height = input<string | null>(null);
}
