import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { BreakpointService } from '../../../core/layout/breakpoint.service';
import { buildPaginationRange } from './pagination-range';

@Component({
  selector: 'app-pagination',
  standalone: true,
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginationComponent {
  readonly page = input.required<number>();
  readonly totalPages = input.required<number>();
  readonly totalItems = input.required<number>();
  readonly pageSize = input.required<number>();
  readonly pageSizeOptions = input<number[]>([10, 20, 50, 100]);
  readonly siblingCount = input(1);
  readonly boundaryCount = input(1);
  readonly disabled = input(false);
  /** false = جوه كارت تاني (app-list-view) من غير إطار خاص بيه */
  readonly framed = input(true);

  readonly pageChange = output<number>();
  readonly pageSizeChange = output<number>();

  private readonly isMobile = inject(BreakpointService).isMobile;

  protected readonly items = computed(() =>
    buildPaginationRange(
      this.page(),
      this.totalPages(),
      this.isMobile() ? 0 : this.siblingCount(),
      this.boundaryCount(),
    ),
  );
  protected readonly rangeStart = computed(() =>
    this.totalItems() === 0 ? 0 : (this.page() - 1) * this.pageSize() + 1,
  );
  protected readonly rangeEnd = computed(() =>
    Math.min(this.page() * this.pageSize(), this.totalItems()),
  );
  protected readonly isFirst = computed(() => this.page() <= 1);
  protected readonly isLast = computed(() => this.page() >= this.totalPages());

  protected goTo(page: number): void {
    const target = Math.min(Math.max(page, 1), this.totalPages());
    if (!this.disabled() && target !== this.page()) {
      this.pageChange.emit(target);
    }
  }

  protected jumpTo(input: HTMLInputElement): void {
    const page = Number(input.value);
    if (Number.isInteger(page) && page >= 1) {
      this.goTo(page);
    }
    input.value = '';
  }

  protected changePageSize(value: string): void {
    this.pageSizeChange.emit(Number(value));
  }
}
