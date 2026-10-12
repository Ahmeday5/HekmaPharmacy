import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export interface SegmentOption<T extends string = string> {
  value: T;
  label: string;
  icon?: string;
  /** رقم صغير جنب العنوان (عدد العناصر مثلًا) */
  count?: number | null;
}

/**
 * تبويبات صغيرة بشكل segmented control:
 *   <app-segmented-control [options]="tabs" [value]="activeTab()" (valueChange)="activeTab.set($event)" />
 */
@Component({
  selector: 'app-segmented-control',
  standalone: true,
  template: `
    <div class="segmented" role="tablist" [attr.aria-label]="ariaLabel()">
      @for (option of options(); track option.value) {
      <button type="button" role="tab" class="segment" [class.active]="option.value === value()"
        [attr.aria-selected]="option.value === value()" (click)="valueChange.emit(option.value)">
        @if (option.icon) {
        <i class="fa-solid {{ option.icon }}" aria-hidden="true"></i>
        }
        <span>{{ option.label }}</span>
        @if (option.count !== undefined && option.count !== null) {
        <span class="segment-count">{{ option.count }}</span>
        }
      </button>
      }
    </div>
  `,
  styles: `
    .segmented {
      display: flex;
      gap: 0.25rem;
      padding: 0.25rem;
      border-radius: var(--radius-md);
      background: var(--color-surface-muted);
      border: 1px solid var(--color-border);
    }
    .segment {
      display: flex;
      flex: 1;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
      min-height: 2.25rem;
      padding: 0 0.75rem;
      border: 0;
      border-radius: var(--radius-sm);
      background: transparent;
      color: var(--color-text-muted);
      font-weight: 700;
      font-size: 0.875rem;
      white-space: nowrap;
      transition: background-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
    }
    .segment:hover:not(.active) {
      color: var(--color-text);
    }
    .segment.active {
      background: var(--color-surface);
      color: var(--color-primary);
      box-shadow: var(--shadow-sm);
    }
    .segment-count {
      min-width: 1.4rem;
      padding: 0 0.4rem;
      border-radius: var(--radius-pill);
      background: var(--color-primary-soft);
      color: var(--color-primary);
      font-size: 0.75rem;
      line-height: 1.4rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SegmentedControlComponent<T extends string = string> {
  readonly options = input.required<SegmentOption<T>[]>();
  readonly value = input.required<T>();
  readonly ariaLabel = input<string>();
  readonly valueChange = output<T>();
}
