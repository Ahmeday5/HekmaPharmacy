import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  input,
  output,
  TemplateRef,
} from '@angular/core';
import { SkeletonComponent } from '../skeleton/skeleton.component';
import { TableCellContext, TableCellDirective } from './table-cell.directive';
import { TableColumn } from './table-column.model';

/**
 * الجدول الوحيد في المشروع.
 *
 *   <app-data-table [columns]="columns" [rows]="list.items()" [loading]="list.loading()"
 *     [rowOffset]="list.rowOffset()" (edit)="openEdit($event)" (remove)="delete($event)">
 *     <ng-template appTableCell="status" let-row>...</ng-template>
 *   </app-data-table>
 */
@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [NgTemplateOutlet, SkeletonComponent],
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataTableComponent<T extends object> {
  readonly columns = input.required<TableColumn<T>[]>();
  readonly rows = input.required<T[]>();
  readonly loading = input(false);
  /** عدد صفوف الـ skeleton في أول تحميل (يفضل = حجم الصفحة) */
  readonly skeletonRowCount = input(5);
  readonly errorMessage = input<string | null>(null);
  readonly emptyMessage = input('لا توجد بيانات للعرض');
  /** رقم أول صف في الصفحة الحالية (للترقيم المتصل بين الصفحات) */
  readonly rowOffset = input(0);
  readonly showIndex = input(true);
  readonly editable = input(false);
  readonly deletable = input(false);
  readonly trackBy = input<(row: T) => unknown>((row) => (row as { id?: unknown }).id ?? row);

  readonly edit = output<T>();
  readonly remove = output<T>();

  private readonly cellTemplates = contentChildren(TableCellDirective);

  protected readonly skeletonRows = computed(() =>
    Array.from({ length: Math.min(this.skeletonRowCount(), 10) }, (_, i) => i),
  );
  /** تحديث بيانات موجودة — بنسيب الصفوف ظاهرة مع شريط تقدم بدل ما نمسحها */
  protected readonly isRefreshing = computed(() => this.loading() && this.rows().length > 0);
  protected readonly hasActions = computed(() => this.editable() || this.deletable());
  protected readonly columnCount = computed(
    () => this.columns().length + (this.showIndex() ? 1 : 0) + (this.hasActions() ? 1 : 0),
  );
  protected readonly skeletonCells = computed(() =>
    Array.from({ length: this.columnCount() }, (_, i) => i),
  );
  protected readonly templatesByColumn = computed(
    () =>
      new Map<string, TemplateRef<TableCellContext<T>>>(
        this.cellTemplates().map((cell) => [cell.column(), cell.templateRef]),
      ),
  );

  protected cellValue(row: T, column: TableColumn<T>): string | number {
    const value = column.value
      ? column.value(row)
      : (row as Record<string, unknown>)[column.key];
    return value === null || value === undefined || value === '' ? '—' : (value as string | number);
  }
}
