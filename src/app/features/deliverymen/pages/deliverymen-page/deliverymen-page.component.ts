import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { ActionRunner } from '../../../../shared/data-access/action-runner.service';
import { EntityModalState } from '../../../../shared/data-access/entity-modal-state';
import { createPaginatedList } from '../../../../shared/data-access/paginated-list';
import { ApiAssetPipe } from '../../../../shared/pipes/api-asset.pipe';
import { DataTableComponent } from '../../../../shared/ui/data-table/data-table.component';
import { TableCellDirective } from '../../../../shared/ui/data-table/table-cell.directive';
import { TableColumn } from '../../../../shared/ui/data-table/table-column.model';
import { ModalComponent } from '../../../../shared/ui/modal/modal.component';
import { PageHeaderComponent } from '../../../../shared/ui/page-header/page-header.component';
import { EntityCellComponent } from '../../../../shared/ui/entity-cell/entity-cell.component';
import { ListViewComponent } from '../../../../shared/ui/list-view/list-view.component';
import { SearchInputComponent } from '../../../../shared/ui/search-input/search-input.component';
import { StatCardComponent } from '../../../../shared/ui/stat-card/stat-card.component';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { AvailabilityBadgeComponent } from '../../components/availability-badge/availability-badge.component';
import { DeliverymanFormModalComponent } from '../../components/deliveryman-form-modal/deliveryman-form-modal.component';
import { NotifyButtonComponent } from '../../components/notify-button/notify-button.component';
import { Deliveryman, DeliverymanFilters } from '../../data-access/deliveryman.models';
import { DeliverymenApi } from '../../data-access/deliverymen.api';
import { DeliverymenRealtimeService } from '../../data-access/deliverymen-realtime.service';

@Component({
  selector: 'app-deliverymen-page',
  standalone: true,
  imports: [
    ApiAssetPipe,
    AvailabilityBadgeComponent,
    DataTableComponent,
    DeliverymanFormModalComponent,
    EntityCellComponent,
    ListViewComponent,
    ModalComponent,
    NotifyButtonComponent,
    PageHeaderComponent,
    SearchInputComponent,
    StatCardComponent,
    TableCellDirective,
  ],
  templateUrl: './deliverymen-page.component.html',
  styleUrl: './deliverymen-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeliverymenPageComponent implements OnInit {
  private readonly api = inject(DeliverymenApi);
  private readonly realtime = inject(DeliverymenRealtimeService);
  private readonly actions = inject(ActionRunner);
  private readonly toast = inject(ToastService);

  protected readonly list = createPaginatedList<Deliveryman, DeliverymanFilters>({
    loader: (query) => this.api.getPage(query),
    initialFilters: { name: '', email: '' },
    errorMessage: 'تعذر تحميل المندوبين',
    syncWithUrl: true,
  });
  protected readonly formModal = new EntityModalState<Deliveryman>();
  protected readonly imagePreview = signal<Deliveryman | null>(null);

  /** الحالة والموقع لحظيًا من Firestore — null لحد ما يوصل أول تحديث */
  private readonly live = toSignal(this.realtime.watchAll().pipe(catchError(() => of(null))), {
    initialValue: null,
  });

  /** بيانات الجدول من الـ API، والإتاحة بتتحدث لحظيًا من Firestore */
  protected readonly rows = computed(() => {
    const availability = new Map((this.live() ?? []).map((d) => [d.id, d.isAvailable]));
    return this.list.items().map((d) => ({ ...d, isAvailable: availability.get(d.id) ?? d.isAvailable }));
  });

  protected readonly stats = computed(() => {
    const live = this.live();
    if (!live) {
      return { total: null, available: null, offline: null, tracked: null, availableRate: null };
    }
    const available = live.filter((d) => d.isAvailable).length;
    return {
      total: live.length,
      available,
      offline: live.length - available,
      tracked: live.filter((d) => d.lat !== null && d.lng !== null).length,
      availableRate: live.length ? Math.round((available / live.length) * 100) : 0,
    };
  });

  protected readonly columns: TableColumn<Deliveryman>[] = [
    { key: 'deliveryman', header: 'المندوب', minWidth: '16rem' },
    { key: 'code', header: 'الكود', nowrap: true },
    { key: 'status', header: 'الحالة', nowrap: true },
    { key: 'notify', header: 'تنبيه', align: 'center' },
  ];

  ngOnInit(): void {
    this.list.load();
  }

  protected onSaved(): void {
    this.formModal.close();
    this.list.refresh();
  }

  protected async remove(deliveryman: Deliveryman): Promise<void> {
    const deleted = await this.actions.confirmAndDelete(
      `المندوب "${deliveryman.name}"`,
      () => this.api.delete(deliveryman.id),
      { success: 'تم حذف المندوب بنجاح', error: 'تعذر حذف المندوب' },
    );
    if (!deleted) {
      return;
    }
    this.list.refreshAfterRemoval();
    // الحذف من Firestore عشان يختفي من الداشبورد والخريطة
    this.realtime.delete(deliveryman.id).catch(() =>
      this.toast.warning('تم حذف المندوب من النظام، لكن تعذر حذفه من البيانات اللحظية. سيختفي بعد التحديث.'),
    );
  }
}
