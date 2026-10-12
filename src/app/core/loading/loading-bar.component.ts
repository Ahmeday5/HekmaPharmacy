import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LoadingBarService } from './loading-bar.service';

@Component({
  selector: 'app-loading-bar',
  standalone: true,
  template: `
    <div
      class="loading-bar"
      [class.is-loading]="loadingBar.state() === 'loading'"
      [class.is-done]="loadingBar.state() === 'done'"
      role="progressbar"
      aria-label="جاري التحميل"
      [attr.aria-hidden]="loadingBar.state() === 'idle'"
    >
      <span class="loading-bar-fill"></span>
    </div>
  `,
  styles: `
    .loading-bar {
      position: fixed;
      inset-inline: 0;
      top: 0;
      z-index: var(--z-loading-bar);
      height: 0.1875rem;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.3s ease 0.1s;
    }
    .loading-bar-fill {
      display: block;
      height: 100%;
      background: linear-gradient(90deg, var(--color-accent), var(--color-primary));
      box-shadow: 0 0 10px var(--color-primary);
      transform-origin: right;
      transform: scaleX(0);
    }
    .is-loading {
      opacity: 1;
      transition: none;
    }
    /* بيتقدم بسرعة في الأول ثم يبطأ — من غير ما يوصل 100% لحد ما العملية تخلص */
    .is-loading .loading-bar-fill {
      animation: trickle 8s cubic-bezier(0.1, 0.75, 0.25, 1) forwards;
    }
    .is-done .loading-bar-fill {
      transform: scaleX(1);
      transition: transform 0.2s ease;
    }
    @keyframes trickle {
      from { transform: scaleX(0); }
      to { transform: scaleX(0.92); }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingBarComponent {
  protected readonly loadingBar = inject(LoadingBarService);
}
