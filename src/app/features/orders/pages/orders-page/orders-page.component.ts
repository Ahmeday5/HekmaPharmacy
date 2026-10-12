import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, distinctUntilChanged, map, of, switchMap } from 'rxjs';
import { ActionRunner } from '../../../../shared/data-access/action-runner.service';
import { EntityModalState } from '../../../../shared/data-access/entity-modal-state';
import { createPaginatedList } from '../../../../shared/data-access/paginated-list';
import { DataTableComponent } from '../../../../shared/ui/data-table/data-table.component';
import { TableCellDirective } from '../../../../shared/ui/data-table/table-cell.directive';
import { TableColumn } from '../../../../shared/ui/data-table/table-column.model';
import { PageHeaderComponent } from '../../../../shared/ui/page-header/page-header.component';
import { PaginationComponent } from '../../../../shared/ui/pagination/pagination.component';
import { SearchInputComponent } from '../../../../shared/ui/search-input/search-input.component';
import { OrderFormModalComponent } from '../../components/order-form-modal/order-form-modal.component';
import { OrderStatusBadgeComponent } from '../../components/order-status-badge/order-status-badge.component';
import { Order, OrderFilters } from '../../data-access/order.models';
import { OrdersApi } from '../../data-access/orders.api';
import { OrdersRealtimeService } from '../../data-access/orders-realtime.service';

@Component({
  selector: 'app-orders-page',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    PageHeaderComponent,
    SearchInputComponent,
    DataTableComponent,
    TableCellDirective,
    PaginationComponent,
    OrderFormModalComponent,
    OrderStatusBadgeComponent,
  ],
  templateUrl: './orders-page.component.html',
  styleUrl: './orders-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersPageComponent implements OnInit {
  private readonly api = inject(OrdersApi);
  private readonly realtime = inject(OrdersRealtimeService);
  private readonly actions = inject(ActionRunner);

  protected readonly list = createPaginatedList<Order, OrderFilters>({
    loader: (query) => this.api.getPage(query),
    initialFilters: { clientName: '', orderDate: '' },
    errorMessage: 'تعذر تحميل الطلبات',
    syncWithUrl: true,
  });
  protected readonly formModal = new EntityModalState<Order>();

  /**
   * كل بيانات الطلب من الـ API ما عدا الحالة: بنسمعها live من Firestore
   * للطلبات الظاهرة في الصفحة الحالية بس. switchMap بيلغي الاستماع القديم مع كل صفحة/بحث.
   */
  private readonly liveStatuses = toSignal(
    toObservable(this.list.items).pipe(
      map((orders) => orders.map((order) => order.id)),
      distinctUntilChanged((a, b) => a.join() === b.join()),
      switchMap((ids) =>
        this.realtime.watchStatuses(ids).pipe(
          // لو Firestore وقع الجدول يفضل شغال بحالة الـ API
          catchError(() => of(new Map<string, string>())),
        ),
      ),
    ),
    { initialValue: new Map<string, string>() },
  );

  protected readonly statusById = computed(() => {
    const live = this.liveStatuses();
    return new Map(this.list.items().map((o) => [o.id, live.get(String(o.id)) ?? o.status]));
  });

  protected readonly columns: TableColumn<Order>[] = [
    { key: 'orderCode', header: 'رقم الفاتورة', nowrap: true },
    { key: 'amount', header: 'قيمة الطلب', nowrap: true },
    { key: 'clientName', header: 'العميل' },
    { key: 'deliverymanName', header: 'المندوب' },
    { key: 'status', header: 'الحالة' },
    { key: 'distance', header: 'المسافة', nowrap: true },
    { key: 'orderDate', header: 'تاريخ الطلب', nowrap: true },
    { key: 'startedAt', header: 'استلام الطلب', nowrap: true },
    { key: 'endedAt', header: 'نهاية الطلب', nowrap: true },
    { key: 'address', header: 'العنوان' },
    { key: 'location', header: 'الموقع' },
    { key: 'notes', header: 'ملاحظات' },
  ];

  ngOnInit(): void {
    this.list.load();
  }

  protected onDateChange(date: string): void {
    this.list.updateFilters({ orderDate: date });
  }

  protected onSaved(): void {
    this.formModal.close();
    this.list.refresh();
  }

  protected async remove(order: Order): Promise<void> {
    const deleted = await this.actions.confirmAndDelete(
      `الطلب رقم "${order.orderCode || order.id}"`,
      () => this.api.delete(order.id),
      { success: 'تم حذف الطلب بنجاح', error: 'تعذر حذف الطلب' },
    );
    if (deleted) {
      this.list.refreshAfterRemoval();
    }
  }
}
