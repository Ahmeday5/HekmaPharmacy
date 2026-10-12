import { computed, signal } from '@angular/core';

/**
 * حالة مودال إضافة/تعديل في أي صفحة:
 *   readonly form = new EntityModalState<Client>();
 *   form.openCreate() / form.openEdit(client) / form.close()
 *
 *   @if (form.isOpen()) { <app-client-form-modal [entity]="form.entity()" ... /> }
 */
export class EntityModalState<T> {
  private readonly state = signal<{ entity: T | null } | null>(null);

  readonly isOpen = computed(() => this.state() !== null);
  readonly entity = computed(() => this.state()?.entity ?? null);

  openCreate(): void {
    this.state.set({ entity: null });
  }

  openEdit(entity: T): void {
    this.state.set({ entity });
  }

  close(): void {
    this.state.set(null);
  }
}
