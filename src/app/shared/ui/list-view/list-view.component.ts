import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ListFilters, PaginatedList } from '../../data-access/paginated-list';
import { EMBEDDED_TABLE } from '../data-table/embedded-table.token';
import { PaginationComponent } from '../pagination/pagination.component';

export interface ActiveFilterChip {
  key: string;
  label: string;
  value: string;
}

/**
 * الغلاف الموحد لأي صفحة فيها جدول: شريط الفلاتر + تحديث + الفلاتر النشطة (chips)
 * + عدد النتايج + الجدول + الـ pagination — كله في كارت واحد ومربوط بالـ PaginatedList.
 *
 *   <app-list-view [list]="list" [filterLabels]="{ name: 'اسم العميل' }">
 *     <app-search-input listFilters ... />
 *     <app-data-table ... />
 *   </app-list-view>
 */
@Component({
  selector: 'app-list-view',
  standalone: true,
  imports: [PaginationComponent],
  templateUrl: './list-view.component.html',
  styleUrl: './list-view.component.scss',
  // الجدول جوه الكارت بيترسم من غير إطار خاص بيه
  providers: [{ provide: EMBEDDED_TABLE, useValue: true }],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListViewComponent<T, F extends ListFilters> {
  readonly list = input.required<PaginatedList<T, F>>();
  /** أسماء الفلاتر اللي تظهر في الـ chips */
  readonly filterLabels = input<Partial<Record<keyof F & string, string>>>({});
  /** تنسيق قيمة الفلتر في الـ chip (مثلًا تاريخ → "اليوم") */
  readonly filterFormatters = input<Partial<Record<keyof F & string, (value: string) => string>>>({});
  readonly itemLabel = input('نتيجة');

  protected readonly activeFilters = computed<ActiveFilterChip[]>(() => {
    const labels = this.filterLabels() as Record<string, string | undefined>;
    const formatters = this.filterFormatters() as Record<string, ((v: string) => string) | undefined>;
    return Object.entries(this.list().filters())
      .filter(([, value]) => value !== '')
      .map(([key, value]) => ({
        key,
        label: labels[key] ?? key,
        value: formatters[key]?.(value) ?? value,
      }));
  });

  protected clearFilter(key: string): void {
    this.list().updateFilters({ [key]: '' } as Partial<F>);
  }
}
