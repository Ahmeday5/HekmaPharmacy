import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * زر بحالة تحميل — الـ spinner بيظهر في النص والمحتوى بيختفي من غير ما عرض الزر يتغير،
 * والزر بيتقفل تلقائي أثناء التحميل:
 *   <button appLoadingButton class="btn btn-brand-primary" [loading]="saving()">حفظ</button>
 */
@Component({
  selector: 'button[appLoadingButton]',
  standalone: true,
  template: `
    @if (loading()) {
    <span class="loading-button-spinner" aria-hidden="true">
      <span class="spinner-border spinner-border-sm"></span>
    </span>
    }
    <span class="loading-button-content"><ng-content></ng-content></span>
  `,
  host: {
    '[class.is-loading]': 'loading()',
    '[disabled]': 'loading() || disabled()',
    '[attr.aria-busy]': 'loading()',
  },
  styles: `
    :host {
      position: relative;
    }
    .loading-button-content {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: inherit;
    }
    :host(.is-loading) .loading-button-content {
      visibility: hidden;
    }
    .loading-button-spinner {
      position: absolute;
      inset: 0;
      display: grid;
      place-items: center;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingButtonComponent {
  readonly loading = input(false);
  readonly disabled = input(false);
}
