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
import { AdminFormModalComponent } from '../../components/admin-form-modal/admin-form-modal.component';
import { Admin, AdminFilters, adminRoleLabel } from '../../data-access/admin.models';
import { AdminsApi } from '../../data-access/admins.api';

@Component({
  selector: 'app-admins-page',
  standalone: true,
  imports: [
    PageHeaderComponent,
    SearchInputComponent,
    DataTableComponent,
    TableCellDirective,
    PaginationComponent,
    AdminFormModalComponent,
  ],
  templateUrl: './admins-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminsPageComponent implements OnInit {
  private readonly api = inject(AdminsApi);
  private readonly actions = inject(ActionRunner);

  protected readonly list = createPaginatedList<Admin, AdminFilters>({
    loader: (query) => this.api.getPage(query),
    initialFilters: { search: '' },
    errorMessage: 'تعذر تحميل المستخدمين',
    syncWithUrl: true,
  });
  protected readonly formModal = new EntityModalState<Admin>();

  protected readonly columns: TableColumn<Admin>[] = [
    { key: 'userName', header: 'اسم المستخدم' },
    { key: 'email', header: 'البريد الإلكتروني' },
    { key: 'role', header: 'الدور' },
  ];

  protected readonly roleLabel = adminRoleLabel;

  ngOnInit(): void {
    this.list.load();
  }

  protected onSaved(): void {
    this.formModal.close();
    this.list.refresh();
  }

  protected async remove(admin: Admin): Promise<void> {
    const deleted = await this.actions.confirmAndDelete(
      `المستخدم "${admin.email}"`,
      () => this.api.delete(admin.id),
      { success: 'تم حذف المستخدم بنجاح', error: 'تعذر حذف المستخدم' },
    );
    if (deleted) {
      this.list.refreshAfterRemoval();
    }
  }
}
