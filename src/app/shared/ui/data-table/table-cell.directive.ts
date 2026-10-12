import { Directive, inject, input, TemplateRef } from '@angular/core';

export interface TableCellContext<T> {
  $implicit: T;
  index: number;
}

/**
 * Template مخصص لخلية في app-data-table:
 *   <ng-template appTableCell="status" let-order>...</ng-template>
 */
@Directive({
  selector: 'ng-template[appTableCell]',
  standalone: true,
})
export class TableCellDirective<T = any> {
  readonly column = input.required<string>({ alias: 'appTableCell' });
  readonly templateRef = inject<TemplateRef<TableCellContext<T>>>(TemplateRef);

  static ngTemplateContextGuard<T>(
    _dir: TableCellDirective<T>,
    ctx: unknown,
  ): ctx is TableCellContext<T> {
    return true;
  }
}
