import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { ActionRunner } from '../../../../shared/data-access/action-runner.service';
import { EntityModalState } from '../../../../shared/data-access/entity-modal-state';
import { createPaginatedList } from '../../../../shared/data-access/paginated-list';
import { DataTableComponent } from '../../../../shared/ui/data-table/data-table.component';
import { TableCellDirective } from '../../../../shared/ui/data-table/table-cell.directive';
import { TableColumn } from '../../../../shared/ui/data-table/table-column.model';
import { PageHeaderComponent } from '../../../../shared/ui/page-header/page-header.component';
import { PaginationComponent } from '../../../../shared/ui/pagination/pagination.component';
import { SearchInputComponent } from '../../../../shared/ui/search-input/search-input.component';
import { ClientFormModalComponent } from '../../components/client-form-modal/client-form-modal.component';
import { Client, ClientFilters } from '../../data-access/client.models';
import { ClientsApi } from '../../data-access/clients.api';

@Component({
  selector: 'app-clients-page',
  standalone: true,
  imports: [
    PageHeaderComponent,
    SearchInputComponent,
    DataTableComponent,
    TableCellDirective,
    PaginationComponent,
    ClientFormModalComponent,
  ],
  templateUrl: './clients-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientsPageComponent implements OnInit {
  private readonly api = inject(ClientsApi);
  private readonly actions = inject(ActionRunner);

  protected readonly list = createPaginatedList<Client, ClientFilters>({
    loader: (query) => this.api.getPage(query),
    initialFilters: { name: '' },
    errorMessage: 'تعذر تحميل العملاء',
    syncWithUrl: true,
  });
  protected readonly formModal = new EntityModalState<Client>();

  protected readonly columns: TableColumn<Client>[] = [
    { key: 'clientCode', header: 'كود العميل', nowrap: true },
    { key: 'name', header: 'اسم العميل' },
    { key: 'phoneNumber', header: 'رقم التليفون', nowrap: true },
    { key: 'phoneNumber02', header: 'رقم التليفون 2', nowrap: true },
    { key: 'address', header: 'العنوان' },
    { key: 'address02', header: 'العنوان 2' },
    { key: 'location', header: 'الموقع الجغرافي' },
  ];

  ngOnInit(): void {
    this.list.load();
  }

  protected onSaved(): void {
    this.formModal.close();
    this.list.refresh();
  }

  protected async remove(client: Client): Promise<void> {
    const deleted = await this.actions.confirmAndDelete(
      `العميل "${client.name}"`,
      () => this.api.delete(client.id),
      { success: 'تم حذف العميل بنجاح', error: 'تعذر حذف العميل' },
    );
    if (deleted) {
      this.list.refreshAfterRemoval();
    }
  }
}
