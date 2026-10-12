import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * كارت موحد بهيدر (أيقونة + عنوان + وصف + أزرار) وجسم وفوتر اختياري:
 *   <app-card title="المندوبين" icon="fa-motorcycle">
 *     <ng-container cardActions>...</ng-container>
 *     ...body...
 *     <ng-container cardFooter>...</ng-container>
 *   </app-card>
 */
@Component({
  selector: 'app-card',
  standalone: true,
  template: `
    <header class="card-head">
      @if (icon()) {
      <span class="card-icon"><i class="fa-solid {{ icon() }}" aria-hidden="true"></i></span>
      }
      <div class="card-titles">
        <h2>{{ title() }}</h2>
        @if (subtitle()) {
        <p>{{ subtitle() }}</p>
        }
      </div>
      <div class="card-actions"><ng-content select="[cardActions]"></ng-content></div>
    </header>
    <div class="card-body" [class.flush]="flush()"><ng-content></ng-content></div>
    <footer class="card-foot"><ng-content select="[cardFooter]"></ng-content></footer>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      min-width: 0;
      min-height: 0;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);
      overflow: hidden;
    }
    .card-head {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem 1rem;
      border-bottom: 1px solid var(--color-border);
    }
    .card-icon {
      display: grid;
      place-items: center;
      flex-shrink: 0;
      width: 2.25rem;
      height: 2.25rem;
      border-radius: var(--radius-sm);
      background: var(--color-primary-soft);
      color: var(--color-primary);
    }
    .card-titles {
      flex: 1;
      min-width: 0;
    }
    h2 {
      margin: 0;
      font-size: 1rem;
      font-weight: 800;
      color: var(--color-text);
    }
    p {
      margin: 0.125rem 0 0;
      font-size: 0.8rem;
      color: var(--color-text-muted);
    }
    .card-actions {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .card-actions:empty {
      display: none;
    }
    .card-body {
      display: flex;
      flex: 1;
      flex-direction: column;
      gap: 0.75rem;
      min-height: 0;
      padding: 1rem;
    }
    .card-body.flush {
      padding: 0;
    }
    .card-foot {
      padding: 0.75rem 1rem;
      border-top: 1px solid var(--color-border);
      background: var(--color-surface-muted);
    }
    .card-foot:empty {
      display: none;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string>();
  readonly icon = input<string>();
  /** جسم من غير padding (للخريطة والجداول) */
  readonly flush = input(false);
}
