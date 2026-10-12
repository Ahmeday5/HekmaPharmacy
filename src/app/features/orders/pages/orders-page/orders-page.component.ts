import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActionRunner } from '../../../../shared/data-access/action-runner.service';
import { EntityModalState } from '../../../../shared/data-access/entity-modal-state';
import { createPaginatedList } from '../../../../shared/data-access/paginated-list';
import { DataTableComponent } from '../../../../shared/ui/data-table/data-table.component';
import { TableCellDirective } from '../../../../shared/ui/data-table/table-cell.directive';
import { TableColumn } from '../../../../shared/ui/data-table/table-column.model';
import { EntityCellComponent } from '../../../../shared/ui/entity-cell/entity-cell.component';
import { ListViewComponent } from '../../../../shared/ui/list-view/list-view.component';
import { PageHeaderComponent } from '../../../../shared/ui/page-header/page-header.component';
import { SearchInputComponent } from '../../../../shared/ui/search-input/search-input.component';
import {
  SegmentedControlComponent,
  SegmentOption,
} from '../../../../shared/ui/segmented-control/segmented-control.component';
import { shiftDays, toIsoDate } from '../../../../shared/utils/date.util';
import { OrderFormModalComponent } from '../../components/order-form-modal/order-form-modal.component';
import { OrderStatusBadgeComponent } from '../../components/order-status-badge/order-status-badge.component';
import { Order, OrderFilters } from '../../data-access/order.models';
import { OrdersApi } from '../../data-access/orders.api';
import { OrdersRealtimeService } from '../../data-access/orders-realtime.service';

const DISPLAY_DATE = new Intl.DateTimeFormat('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' });

@Component({
  selector: 'app-orders-page',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    PageHeaderComponent,
    SearchInputComponent,
    SegmentedControlComponent,
    ListViewComponent,
    DataTableComponent,
    TableCellDirective,
    EntityCellComponent,
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

  /** الصفوف من الـ API، والحالة بتتحدث لحظيًا من Firestore */
  private readonly liveOrders = toSignal(this.realtime.withLiveStatus(toObservable(this.list.items)), {
    initialValue: [],
  });
  protected readonly statusById = computed(
    () => new Map(this.liveOrders().map((order) => [order.id, order.status])),
  );

  private readonly today = toIsoDate();
  private readonly yesterday = toIsoDate(shiftDays(-1));

  protected readonly datePresets: SegmentOption[] = [
    { value: '', label: 'كل التواريخ' },
    { value: this.today, label: 'اليوم' },
    { value: this.yesterday, label: 'أمس' },
  ];
  protected readonly filterLabels = { clientName: 'العميل', orderDate: 'التاريخ' };
  protected readonly filterFormatters = { orderDate: (date: string) => this.formatDateFilter(date) };

  protected readonly columns: TableColumn<Order>[] = [
    { key: 'invoice', header: 'الفاتورة', nowrap: true },
    { key: 'client', header: 'العميل', minWidth: '11rem' },
    { key: 'deliveryman', header: 'المندوب', minWidth: '11rem' },
    { key: 'amount', header: 'القيمة', nowrap: true, align: 'end' },
    { key: 'status', header: 'الحالة', nowrap: true },
    { key: 'trip', header: 'الرحلة', nowrap: true },
    { key: 'address', header: 'العنوان', minWidth: '12rem' },
    { key: 'notes', header: 'ملاحظات' },
  ];

  ngOnInit(): void {
    this.list.load();
  }

  protected setDate(date: string): void {
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

  private formatDateFilter(date: string): string {
    if (date === this.today) {
      return 'اليوم';
    }
    if (date === this.yesterday) {
      return 'أمس';
    }
    const parsed = new Date(`${date}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? date : DISPLAY_DATE.format(parsed);
  }
}
