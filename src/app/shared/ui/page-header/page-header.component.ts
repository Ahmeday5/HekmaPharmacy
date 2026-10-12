import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * عنوان الصفحة + مكان للأزرار:
 *   <app-page-header title="إدارة العملاء" icon="fa-users">
 *     <button class="btn btn-brand-primary">إضافة</button>
 *   </app-page-header>
 */
@Component({
  selector: 'app-page-header',
  standalone: true,
  template: `
    <header class="page-header">
      <div class="page-header-title">
        @if (icon()) {
        <span class="page-header-icon"><i class="fa-solid {{ icon() }}" aria-hidden="true"></i></span>
        }
        <div>
          <h1>{{ title() }}</h1>
          @if (subtitle()) {
          <p>{{ subtitle() }}</p>
          }
        </div>
      </div>
      <div class="page-header-actions">
        <ng-content></ng-content>
      </div>
    </header>
  `,
  styles: `
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .page-header-title {
      display: flex;
      align-items: center;
      gap: 0.875rem;
    }
    .page-header-icon {
      display: grid;
      place-items: center;
      width: 3.25rem;
      height: 3.25rem;
      border-radius: var(--radius-md);
      background: var(--color-primary);
      color: var(--color-on-primary);
      font-size: 1.35rem;
      box-shadow: var(--shadow-sm);
    }
    h1 {
      margin: 0;
      font-size: 1.6rem;
      font-weight: 800;
      color: var(--color-primary);
    }
    p {
      margin: 2px 0 0;
      color: var(--color-text-muted);
      font-size: 0.9rem;
    }
    .page-header-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.625rem;
    }
    @media (max-width: 575.98px) {
      h1 {
        font-size: 1.3rem;
      }
      .page-header-actions {
        width: 100%;
      }
      .page-header-actions ::ng-deep .btn {
        flex: 1;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageHeaderComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string>();
  readonly icon = input<string>();
}
