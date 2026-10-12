import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SkeletonComponent } from '../skeleton/skeleton.component';

export type StatTone = 'primary' | 'success' | 'info' | 'warning' | 'danger';

/**
 * كارت إحصائية (KPI):
 *   <app-stat-card label="طلبات اليوم" icon="fa-box" [value]="count()" tone="info" />
 * value = null → skeleton لحد ما البيانات توصل
 */
@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [SkeletonComponent],
  template: `
    <span class="stat-icon"><i class="fa-solid {{ icon() }}" aria-hidden="true"></i></span>
    <div class="stat-body">
      <span class="stat-label">{{ label() }}</span>
      @if (value() === null) {
      <app-skeleton width="4rem" height="1.6rem" variant="rect" />
      } @else {
      <strong class="stat-value">{{ value() }}</strong>
      }
      @if (hint()) {
      <span class="stat-hint">{{ hint() }}</span>
      }
    </div>
  `,
  host: { '[class]': '"tone-" + tone()' },
  styles: `
    :host {
      --tone: var(--color-primary);
      --tone-soft: var(--color-primary-soft);
      display: flex;
      align-items: center;
      gap: 0.875rem;
      padding: 1rem 1.125rem;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-sm);
      min-width: 0;
    }
    :host(.tone-success) { --tone: var(--color-success); --tone-soft: rgba(22, 163, 74, 0.12); }
    :host(.tone-info) { --tone: var(--color-info); --tone-soft: rgba(37, 99, 235, 0.12); }
    :host(.tone-warning) { --tone: var(--color-warning); --tone-soft: rgba(217, 119, 6, 0.12); }
    :host(.tone-danger) { --tone: var(--color-danger); --tone-soft: var(--color-danger-soft); }
    .stat-icon {
      display: grid;
      place-items: center;
      flex-shrink: 0;
      width: 2.875rem;
      height: 2.875rem;
      border-radius: var(--radius-md);
      background: var(--tone-soft);
      color: var(--tone);
      font-size: 1.15rem;
    }
    .stat-body {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
      min-width: 0;
    }
    .stat-label {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--color-text-muted);
    }
    .stat-value {
      font-size: 1.6rem;
      font-weight: 800;
      line-height: 1.2;
      color: var(--color-text);
      font-variant-numeric: tabular-nums;
    }
    .stat-hint {
      overflow: hidden;
      font-size: 0.75rem;
      color: var(--color-text-muted);
      white-space: nowrap;
      text-overflow: ellipsis;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatCardComponent {
  readonly label = input.required<string>();
  readonly icon = input.required<string>();
  readonly value = input.required<string | number | null>();
  readonly hint = input<string>();
  readonly tone = input<StatTone>('primary');
}
