import { computed, DestroyRef, inject, signal, WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, ParamMap, Params, Router } from '@angular/router';
import { catchError, map, Observable, of, skip, Subject, switchMap, tap } from 'rxjs';
import { getErrorMessage } from '../../core/http/http-error.util';
import { ListQuery, PagedResult } from '../models/pagination.model';

export const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

/** الفلاتر كلها نصوص عشان تتخزن في الـ URL من غير تحويل */
export type ListFilters = Record<string, string>;

export interface PaginatedListConfig<T, F extends ListFilters> {
  loader: (query: ListQuery<F>) => Observable<PagedResult<T>>;
  initialFilters: F;
  pageSize?: number;
  errorMessage?: string;
  /** يحفظ الصفحة والفلاتر في الـ query string (تفضل بعد الريفريش، وزر الرجوع يشتغل) */
  syncWithUrl?: boolean;
}

interface ListState<F> {
  page: number;
  pageSize: number;
  filters: F;
}

type LoadOutcome<T, F> =
  | { ok: true; query: ListQuery<F>; result: PagedResult<T> }
  | { ok: false; query: ListQuery<F>; error: unknown };

/**
 * State موحد لأي جدول فيه pagination + بحث + فلترة.
 * - أي تغيير في الفلاتر بيرجع لأول صفحة.
 * - الطلب القديم بيتلغي لو اتعمل طلب جديد قبل ما يخلص (switchMap).
 * - لو الصفحة الحالية بقت فاضية (بعد حذف آخر عنصر فيها) بيرجع للصفحة اللي قبلها.
 * - مع syncWithUrl: الـ URL هو مصدر الحقيقة — ?page=2&pageSize=20&name=ahmed
 *
 * لازم يتعمل جوه injection context: `readonly list = createPaginatedList({...})`
 */
export class PaginatedList<T, F extends ListFilters> {
  private readonly requests$ = new Subject<ListQuery<F>>();
  private readonly defaultPageSize: number;

  readonly items = signal<T[]>([]);
  /** أي تحميل (أول مرة أو تحديث) */
  readonly loading = signal(false);
  /** لسه ما اتحملش أي بيانات — نعرض skeleton بدل الجدول */
  readonly initialized = signal(false);
  readonly error = signal<string | null>(null);
  readonly page = signal(1);
  readonly pageSize: WritableSignal<number>;
  readonly totalItems = signal(0);
  readonly totalPages = signal(0);
  readonly filters: WritableSignal<F>;

  readonly rowOffset = computed(() => (this.page() - 1) * this.pageSize());
  readonly hasFilters = computed(() => Object.values(this.filters()).some((v) => v !== ''));

  constructor(
    private readonly config: PaginatedListConfig<T, F>,
    destroyRef: DestroyRef,
    private readonly router: Router | null,
    private readonly route: ActivatedRoute | null,
  ) {
    this.defaultPageSize = config.pageSize ?? DEFAULT_PAGE_SIZE;
    this.pageSize = signal(this.defaultPageSize);
    this.filters = signal(config.initialFilters);

    if (config.syncWithUrl && route) {
      this.applyState(this.readUrl(route.snapshot.queryParamMap));
      // زر الرجوع/التقدم في المتصفح أو تعديل الـ URL يدويًا
      route.queryParamMap.pipe(skip(1), takeUntilDestroyed(destroyRef)).subscribe((params) => {
        const next = this.readUrl(params);
        if (!this.isCurrentState(next)) {
          this.applyState(next);
          this.request();
        }
      });
    }

    this.requests$
      .pipe(
        tap(() => {
          this.loading.set(true);
          this.error.set(null);
        }),
        switchMap((query) =>
          config.loader(query).pipe(
            map((result): LoadOutcome<T, F> => ({ ok: true, query, result })),
            catchError((error) => of<LoadOutcome<T, F>>({ ok: false, query, error })),
          ),
        ),
        takeUntilDestroyed(destroyRef),
      )
      .subscribe((outcome) => this.applyOutcome(outcome));
  }

  load(): void {
    this.commit({ replaceUrl: true });
  }

  refresh(): void {
    this.request();
  }

  /**
   * التحديث بعد حذف عناصر: لو الصفحة الحالية هتفضى نرجع للصفحة اللي قبلها
   * بدل ما نطلب صفحة مش موجودة.
   */
  refreshAfterRemoval(removedCount = 1): void {
    if (this.page() > 1 && this.items().length <= removedCount) {
      this.page.update((page) => page - 1);
      this.commit({ replaceUrl: true });
    } else {
      this.request();
    }
  }

  setPage(page: number): void {
    if (page === this.page() || page < 1) {
      return;
    }
    this.page.set(page);
    this.commit({ replaceUrl: false });
  }

  setPageSize(pageSize: number): void {
    this.pageSize.set(pageSize);
    this.page.set(1);
    this.commit({ replaceUrl: false });
  }

  updateFilters(changes: Partial<F>): void {
    this.filters.update((current) => ({ ...current, ...changes }));
    this.page.set(1);
    this.commit({ replaceUrl: true });
  }

  resetFilters(): void {
    this.filters.set(this.config.initialFilters);
    this.page.set(1);
    this.commit({ replaceUrl: true });
  }

  /** يكتب الحالة في الـ URL (لو مفعّل) ثم يطلب البيانات */
  private commit({ replaceUrl }: { replaceUrl: boolean }): void {
    if (this.config.syncWithUrl && this.router && this.route) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: this.toQueryParams(),
        queryParamsHandling: 'merge',
        replaceUrl,
      });
    }
    this.request();
  }

  private request(): void {
    this.requests$.next({ page: this.page(), pageSize: this.pageSize(), filters: this.filters() });
  }

  private applyOutcome(outcome: LoadOutcome<T, F>): void {
    if (!outcome.ok) {
      this.items.set([]);
      this.totalItems.set(0);
      this.totalPages.set(0);
      this.error.set(getErrorMessage(outcome.error, this.config.errorMessage ?? 'تعذر تحميل البيانات'));
      this.finishLoading();
      return;
    }

    const { result, query } = outcome;

    // صفحة فاضية بعد الأولى (حذف، أو رابط قديم لصفحة مبقتش موجودة) → آخر صفحة فيها بيانات
    if (result.items.length === 0 && query.page > 1) {
      const lastPage = result.totalPages > 0 ? Math.min(result.totalPages, query.page - 1) : query.page - 1;
      this.page.set(Math.max(lastPage, 1));
      this.commit({ replaceUrl: true });
      return;
    }

    this.items.set(result.items);
    this.totalItems.set(result.totalItems);
    this.totalPages.set(result.totalPages);
    this.finishLoading();
  }

  private finishLoading(): void {
    this.loading.set(false);
    this.initialized.set(true);
  }

  private applyState(state: ListState<F>): void {
    this.page.set(state.page);
    this.pageSize.set(state.pageSize);
    this.filters.set(state.filters);
  }

  private isCurrentState(state: ListState<F>): boolean {
    return (
      state.page === this.page() &&
      state.pageSize === this.pageSize() &&
      Object.keys(this.config.initialFilters).every((key) => state.filters[key] === this.filters()[key])
    );
  }

  private readUrl(params: ParamMap): ListState<F> {
    const filters = { ...this.config.initialFilters };
    for (const key of Object.keys(filters) as (keyof F & string)[]) {
      filters[key] = (params.get(key) ?? this.config.initialFilters[key]) as F[keyof F & string];
    }
    return {
      page: parsePositiveInt(params.get('page')) ?? 1,
      pageSize: Math.min(parsePositiveInt(params.get('pageSize')) ?? this.defaultPageSize, MAX_PAGE_SIZE),
      filters,
    };
  }

  /** القيم الافتراضية بتتشال من الـ URL (null) عشان الروابط تفضل نظيفة */
  private toQueryParams(): Params {
    const params: Params = {
      page: this.page() === 1 ? null : this.page(),
      pageSize: this.pageSize() === this.defaultPageSize ? null : this.pageSize(),
    };
    for (const [key, value] of Object.entries(this.filters())) {
      params[key] = value === this.config.initialFilters[key] ? null : value;
    }
    return params;
  }
}

function parsePositiveInt(value: string | null): number | null {
  const number = Number(value);
  return value !== null && Number.isInteger(number) && number > 0 ? number : null;
}

export function createPaginatedList<T, F extends ListFilters>(
  config: PaginatedListConfig<T, F>,
): PaginatedList<T, F> {
  const withUrl = config.syncWithUrl ?? false;
  return new PaginatedList(
    config,
    inject(DestroyRef),
    withUrl ? inject(Router) : null,
    withUrl ? inject(ActivatedRoute) : null,
  );
}
