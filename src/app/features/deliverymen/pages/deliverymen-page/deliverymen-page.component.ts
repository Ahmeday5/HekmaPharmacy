import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActionRunner } from '../../../../shared/data-access/action-runner.service';
import { EntityModalState } from '../../../../shared/data-access/entity-modal-state';
import { createPaginatedList } from '../../../../shared/data-access/paginated-list';
import { ApiAssetPipe } from '../../../../shared/pipes/api-asset.pipe';
import { AvatarComponent } from '../../../../shared/ui/avatar/avatar.component';
import { DataTableComponent } from '../../../../shared/ui/data-table/data-table.component';
import { TableCellDirective } from '../../../../shared/ui/data-table/table-cell.directive';
import { TableColumn } from '../../../../shared/ui/data-table/table-column.model';
import { ModalComponent } from '../../../../shared/ui/modal/modal.component';
import { PageHeaderComponent } from '../../../../shared/ui/page-header/page-header.component';
import { PaginationComponent } from '../../../../shared/ui/pagination/pagination.component';
import { SearchInputComponent } from '../../../../shared/ui/search-input/search-input.component';
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
    AvatarComponent,
    AvailabilityBadgeComponent,
    DataTableComponent,
    DeliverymanFormModalComponent,
    ModalComponent,
    NotifyButtonComponent,
    PageHeaderComponent,
    PaginationComponent,
    SearchInputComponent,
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

  protected readonly columns: TableColumn<Deliveryman>[] = [
    { key: 'image', header: 'الصورة' },
    { key: 'id', header: 'كود المندوب', nowrap: true },
    { key: 'name', header: 'اسم المندوب' },
    { key: 'email', header: 'البريد الإلكتروني' },
    { key: 'status', header: 'الحالة' },
    { key: 'notify', header: 'تنبيه' },
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
