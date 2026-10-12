import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { ActionRunner } from '../../../../shared/data-access/action-runner.service';
import { EntityModalState } from '../../../../shared/data-access/entity-modal-state';
import { createPaginatedList } from '../../../../shared/data-access/paginated-list';
import { DataTableComponent } from '../../../../shared/ui/data-table/data-table.component';
import { TableCellDirective } from '../../../../shared/ui/data-table/table-cell.directive';
import { TableColumn } from '../../../../shared/ui/data-table/table-column.model';
import { PageHeaderComponent } from '../../../../shared/ui/page-header/page-header.component';
import { EntityCellComponent } from '../../../../shared/ui/entity-cell/entity-cell.component';
import { ListViewComponent } from '../../../../shared/ui/list-view/list-view.component';
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
    ListViewComponent,
    EntityCellComponent,
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
    { key: 'client', header: 'العميل', minWidth: '14rem' },
    { key: 'phones', header: 'أرقام التواصل', nowrap: true },
    { key: 'address', header: 'العنوان', minWidth: '14rem' },
    { key: 'location', header: 'الموقع الجغرافي', nowrap: true },
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
